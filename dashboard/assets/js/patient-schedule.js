const API_BASE_URL = 'https://localhost:7097';
const ITEMS_PER_PAGE = 10;
let currentData = [];
let currentPage = 1;

// ====== UTILS ======
function getAuthToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
}
function getDoctorId() {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return null;
    try {
        const user = JSON.parse(userInfo);
        return user.doctorId || user.userId || null;
    } catch {
        return null;
    }
}

// ====== MAIN INIT ======
document.addEventListener('DOMContentLoaded', async function() {
    setupEventListeners();
    updateDoctorTitle();
    await preloadDoctorId();
    await loadTodaySchedule();
});

// ====== EVENT LISTENERS ======
function setupEventListeners() {
    document.getElementById('filterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        searchSchedule();
    });
    document.querySelector('[onclick="loadTodaySchedule()"]').addEventListener('click', loadTodaySchedule);
    document.querySelector('[onclick="loadThisWeekSchedule()"]').addEventListener('click', loadThisWeekSchedule);
    document.querySelector('[onclick="clearFilters()"]').addEventListener('click', clearFilters);
}

// ====== DOCTOR INFO ======
async function preloadDoctorId() {
    let doctorId = getDoctorId();
    if (doctorId) return doctorId;
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return null;
    let user;
    try { user = JSON.parse(userInfo); } catch { return null; }
    const userId = user.userId || user.id;
    if (!userId) return null;
    try {
        const res = await fetch(`${API_BASE_URL}/api/Doctors/FindByUserId/${userId}`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
        if (!res.ok) return null;
        const doctor = await res.json();
        if (doctor && doctor.id) {
            user.doctorId = doctor.id;
            localStorage.setItem('userInfo', JSON.stringify(user));
            localStorage.setItem('doctorId', doctor.id);
            return doctor.id;
        }
    } catch { }
    return null;
}

function updateDoctorTitle() {
    const userInfo = localStorage.getItem('userInfo');
    const titleElement = document.getElementById('doctorPageTitle');
    const totalElement = document.getElementById('totalAppointments');
    if (!titleElement) return;
    if (userInfo) {
        const user = JSON.parse(userInfo);
        titleElement.textContent = `Bác sĩ ${user.fullName || user.name || 'Chưa đăng nhập'}`;
        if (totalElement) totalElement.textContent = '0';
    } else {
        titleElement.textContent = 'Bác sĩ Chưa đăng nhập';
    }
}

// ====== SCHEDULE LOAD & DISPLAY ======
async function loadTodaySchedule() {
    document.getElementById('fromDateFilter').value = new Date().toISOString().split('T')[0];
    document.getElementById('toDateFilter').value = new Date().toISOString().split('T')[0];
    await searchSchedule();
}

function loadThisWeekSchedule() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diff));
    const endOfWeek = new Date(today.setDate(diff + 6));
    document.getElementById('fromDateFilter').value = startOfWeek.toISOString().split('T')[0];
    document.getElementById('toDateFilter').value = endOfWeek.toISOString().split('T')[0];
    searchSchedule();
}

function clearFilters() {
    document.getElementById('filterForm').reset();
    currentData = [];
    currentPage = 1;
    document.getElementById('scheduleTableBody').innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <i class="fas fa-search fa-2x text-muted mb-2"></i>
                <p class="text-muted">Sử dụng bộ lọc để tìm kiếm lịch khám</p>
            </td>
        </tr>
    `;
    document.getElementById('resultCount').textContent = 'Chọn bác sĩ để xem lịch khám';
    document.getElementById('paginationSection').style.display = 'none';
    setTimeout(loadTodaySchedule, 100);
}

// ====== SEARCH & RENDER ======
async function searchSchedule() {
    const doctorId = getDoctorId();
    if (!doctorId) {
        showNotification('Không tìm thấy thông tin bác sĩ', 'error');
        return;
    }
    const authToken = getAuthToken();
    const fromDate = document.getElementById('fromDateFilter').value || null;
    const toDate = document.getElementById('toDateFilter').value || null;
    const patientName = document.getElementById('patientNameFilter').value || "";
    const status = document.getElementById('statusFilter').value || "";
    showLoading();
    const filterData = {
        doctorId: parseInt(doctorId),
        fromDate,
        toDate,
        patientName,
        status,
        pageNumber: 1,
        pageSize: 100
    };
    try {
        const response = await fetch(`${API_BASE_URL}/api/PatientFilter/GetPatientSchedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            },
            body: JSON.stringify(filterData)
        });
        if (!response.ok) throw new Error('Không lấy được lịch khám');
        const data = await response.json();
        currentData = data;
        currentPage = 1;
        displaySchedule(data);
        updateResultCount(data.length);
        hideLoading();
    } catch (error) {
        hideLoading();
        showNotification('Lỗi khi tìm kiếm lịch khám: ' + error.message, 'error');
    }
}

function displaySchedule(data) {
    const tbody = document.getElementById('scheduleTableBody');
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Không tìm thấy lịch khám nào</p>
                </td>
            </tr>
        `;
        document.getElementById('paginationSection').style.display = 'none';
        return;
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = data.slice(startIndex, endIndex);
    pageData.forEach((item, index) => {
        const examinationDate = item.examinationTime ? new Date(item.examinationTime) : new Date();
        const formattedDate = examinationDate.toLocaleDateString('vi-VN');
        const formattedTime = examinationDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
        const statusValue = mapBackendStatus(item.appointmentStatus);
        const statusDropdown = getStatusDropdown(statusValue, item.id);
        tbody.innerHTML += `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td>${item.id || 'N/A'}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar avatar-sm me-2">
                            <span class="avatar-title bg-primary rounded-circle">
                                ${(item.name || 'N').charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <strong>${item.name || 'N/A'}</strong>
                    </div>
                </td>
                <td>${examinationDate.toLocaleString('vi-VN')}</td>
                <td>${formattedDate}</td>
                <td>${formattedTime}</td>
                <td>${statusDropdown}</td>
                <td>
                    ${getViewReportButton(statusValue, item.id, item.name)}
                </td>
            </tr>
        `;
    });
    if (data.length > ITEMS_PER_PAGE) {
        showPagination(data.length);
    } else {
        document.getElementById('paginationSection').style.display = 'none';
    }
}

function mapBackendStatus(backendStatus) {
    switch(backendStatus) {
        case 'Completed': return 'Completed';
        case 'Confirmed': return 'InProgress';
        case 'Pending': return 'Pending';
        case 'Cancelled': return 'Cancelled';
        default: return 'Pending';
    }
}

function updateResultCount(count) {
    const resultElement = document.getElementById('resultCount');
    if (resultElement) resultElement.textContent = `Tìm thấy ${count} lịch khám`;
    const totalElement = document.getElementById('totalAppointments');
    if (totalElement) totalElement.textContent = count;
}

// ====== PAGINATION ======
function showPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        </li>
    `;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            pagination.innerHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="goToPage(${i})">${i}</button>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            pagination.innerHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        </li>
    `;
    document.getElementById('paginationSection').style.display = 'block';
}

function goToPage(page) {
    currentPage = page;
    displaySchedule(currentData);
}

// ====== STATUS & REPORT BUTTONS ======
function getStatusDropdown(currentStatus, appointmentId) {
    const statusOptions = [
        { value: 'Pending', text: 'Chưa khám', class: 'text-warning' },
        { value: 'InProgress', text: 'Đang khám', class: 'text-info' },
        { value: 'Completed', text: 'Khám xong', class: 'text-success' }
    ];
    let dropdown = `<select class="form-select form-select-sm" onchange="updateAppointmentStatus(${appointmentId}, this.value)" style="min-width: 120px;">`;
    statusOptions.forEach(option => {
        const selected = currentStatus === option.value ? 'selected' : '';
        dropdown += `<option value="${option.value}" class="${option.class}" ${selected}>${option.text}</option>`;
    });
    dropdown += '</select>';
    return dropdown;
}

function getViewReportButton(status, patientId, patientName, appointmentId) {
    return `
        <button class="btn btn-sm btn-success" onclick="viewMedicalRecords('${patientId}', '${patientName}', '${appointmentId}')">
            <i class="fas fa-file-medical me-1"></i>
            Xem báo cáo khám
        </button>
    `;
}

// ====== STATUS UPDATE & REPORT ======
function showLoading() {
    const tbody = document.getElementById('scheduleTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <p class="text-muted mt-2">Đang tải dữ liệu...</p>
                </td>
            </tr>
        `;
    }
}
function hideLoading() { }
function showNotification(message, type = 'info') {
    alert(message);
}

function updateAppointmentStatus(appointmentId, newStatus) {
    showNotification(`Đã cập nhật trạng thái thành "${getStatusText(newStatus)}"`, 'success');
    searchSchedule();
}

function getStatusText(status) {
    switch(status) {
        case 'Pending': return 'Chưa khám';
        case 'InProgress': return 'Đang khám';
        case 'Completed': return 'Khám xong';
        case 'Cancelled': return 'Đã hủy';
        default: return status;
    }
}

function viewMedicalRecords(patientId, patientName) {
    window.location.href = `./patient-medical-records.html?patientId=${patientId}&patientName=${encodeURIComponent(patientName)}`;
}
function createMedicalRecord(patientId, patientName) {
    showNotification('Chức năng tạo báo cáo đang được phát triển', 'info');
}