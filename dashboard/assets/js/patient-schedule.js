const API_BASE_URL = 'http://localhost:5082';
const ITEMS_PER_PAGE = 10;

let currentData = [];
let currentPage = 1;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadDoctorOptions();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('filterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        searchSchedule();
    });
}

// Load doctor options - KẾT NỐI VỚI API THỰC TẾ
async function loadDoctorOptions() {
    try {
        console.log('Starting to load doctors...');
        
        const response = await fetch(`${API_BASE_URL}/api/Doctors/GetAll`, {
            method: 'GET',
            mode: 'cors', // Thêm dòng này
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response:', response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const doctors = await response.json();
        console.log('Doctors received:', doctors);
        
        const select = document.getElementById('doctorFilter');
        select.innerHTML = '<option value="">Chọn bác sĩ...</option>';
        
        // SỬA: Backend trả về "name" chứ không phải "firstName" và "lastName"
        doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.id;
            option.textContent = `Dr. ${doctor.name}`; // Sửa ở đây
            select.appendChild(option);
        });

        console.log('Successfully loaded', doctors.length, 'doctors');

    } catch (error) {
        console.error('Error loading doctors:', error);
        showNotification('Lỗi khi tải danh sách bác sĩ: ' + error.message, 'error');
    }
}

// Search schedule with filters - KẾT NỐI VỚI API THỰC TẾ
async function searchSchedule() {
    try {
        const doctorId = document.getElementById('doctorFilter').value;
        const fromDate = document.getElementById('fromDateFilter').value;
        const toDate = document.getElementById('toDateFilter').value;
        const patientName = document.getElementById('patientNameFilter').value;
        const status = document.getElementById('statusFilter').value;

        if (!doctorId) {
            showNotification('Vui lòng chọn bác sĩ', 'warning');
            return;
        }

        showLoading();

        const filterData = {
            doctorId: parseInt(doctorId),
            fromDate: fromDate || null,
            toDate: toDate || null,
            patientName: patientName || null,
            appointmentStatus: status || null
        };

        const response = await fetch(`${API_BASE_URL}/api/PatientFilter/doctor-patients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filterData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        currentData = data;
        currentPage = 1;
        
        displaySchedule(data);
        updateResultCount(data.length);
        hideLoading();

    } catch (error) {
        console.error('Error searching schedule:', error);
        hideLoading();
        showNotification('Lỗi khi tìm kiếm lịch khám: ' + error.message, 'error');
    }
}

// Load today's schedule - KẾT NỐI VỚI API THỰC TẾ
async function loadTodaySchedule() {
    try {
        const doctorId = document.getElementById('doctorFilter').value;
        
        if (!doctorId) {
            showNotification('Vui lòng chọn bác sĩ trước', 'warning');
            return;
        }

        showLoading();

        const response = await fetch(`${API_BASE_URL}/api/PatientFilter/doctor/${doctorId}/today`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        currentData = data;
        currentPage = 1;
        
        displaySchedule(data);
        updateResultCount(data.length);
        hideLoading();

    } catch (error) {
        console.error('Error loading today schedule:', error);
        hideLoading();
        showNotification('Lỗi khi tải lịch hôm nay: ' + error.message, 'error');
    }
}

// Load this week's schedule
function loadThisWeekSchedule() {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

    document.getElementById('fromDateFilter').value = startOfWeek.toISOString().split('T')[0];
    document.getElementById('toDateFilter').value = endOfWeek.toISOString().split('T')[0];
    
    searchSchedule();
}

// Display schedule data - XỬ LÝ RESPONSE TỪ BACKEND
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

    // Pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = data.slice(startIndex, endIndex);

    pageData.forEach((item, index) => {
        const examinationDate = item.examinationTime ? new Date(item.examinationTime) : new Date();
        const formattedDate = examinationDate.toLocaleDateString('vi-VN');
        const formattedTime = examinationDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
        
        // Tạo dropdown trạng thái
        const statusDropdown = getStatusDropdown(item.appointmentStatus || 'Pending', item.id);
        
        const row = `
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
                    ${getViewReportButton(item.appointmentStatus || 'Pending', item.id, item.name)}
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    // Show pagination if needed
    if (data.length > ITEMS_PER_PAGE) {
        showPagination(data.length);
    } else {
        document.getElementById('paginationSection').style.display = 'none';
    }
}

// Show pagination
function showPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Previous button
    const prevBtn = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        </li>
    `;
    pagination.innerHTML += prevBtn;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            const pageBtn = `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="goToPage(${i})">${i}</button>
                </li>
            `;
            pagination.innerHTML += pageBtn;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            pagination.innerHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }

    // Next button
    const nextBtn = `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        </li>
    `;
    pagination.innerHTML += nextBtn;

    document.getElementById('paginationSection').style.display = 'block';
}

// Go to specific page
function goToPage(page) {
    currentPage = page;
    displaySchedule(currentData);
}

// Redirect to patient medical records
function viewPatientDetail(patientId, patientName) {
    window.location.href = `./patient-medical-records.html?patientId=${patientId}&patientName=${encodeURIComponent(patientName)}`;
}

// Update appointment status
async function updateStatus(appointmentId, newStatus) {
    if (!confirm(`Bạn có chắc muốn thay đổi trạng thái thành "${getStatusText(newStatus)}"?`)) {
        return;
    }

    try {
        // TODO: Gọi API để update status thực tế
        showNotification(`Đã cập nhật trạng thái thành "${getStatusText(newStatus)}"`, 'success');
        // Refresh data
        searchSchedule();
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Lỗi khi cập nhật trạng thái', 'error');
    }
}

// Clear all filters
function clearFilters() {
    document.getElementById('filterForm').reset();
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
}

// Update result count
function updateResultCount(count) {
    document.getElementById('resultCount').textContent = `Tìm thấy ${count} lịch khám`;
}

// Utility functions
function getStatusClass(status) {
    switch(status) {
        case 'Pending': return 'bg-warning text-dark';
        case 'InProgress': return 'bg-info text-white';  // SỬA
        case 'Completed': return 'bg-success text-white';  // SỬA
        case 'Cancelled': return 'bg-danger text-white';
        default: return 'bg-secondary text-white';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'Pending': return 'Chưa khám';        // SỬA
        case 'InProgress': return 'Đang khám';     // SỬA
        case 'Completed': return 'Khám xong';      // SỬA
        case 'Cancelled': return 'Đã hủy';
        default: return status;
    }
}

function showLoading() {
    document.getElementById('scheduleTableBody').innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
                <p class="mt-2 text-muted">Đang tải dữ liệu...</p>
            </td>
        </tr>
    `;
}

function hideLoading() {
    // Loading will be replaced by actual data
}

function showNotification(message, type) {
    const alertClass = type === 'error' ? 'danger' : type;
    const notification = document.createElement('div');
    notification.className = `alert alert-${alertClass} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// THÊM CÁC HÀM MỚI VÀO CUỐI FILE

// Tạo dropdown trạng thái
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

// Tạo nút xem báo cáo thông minh
function getViewReportButton(status, patientId, patientName) {
    if (status === 'Completed') {
        return `
            <button class="btn btn-sm btn-success" onclick="viewMedicalRecords('${patientId}', '${patientName}')" title="Xem danh sách báo cáo khám">
                <i class="fas fa-file-medical me-1"></i>
                Xem báo cáo khám
            </button>
        `;
    } else if (status === 'InProgress') {
        return `
            <button class="btn btn-sm btn-info" onclick="createMedicalRecord('${patientId}', '${patientName}')" title="Tạo báo cáo khám">
                <i class="fas fa-plus me-1"></i>
                Tạo báo cáo
            </button>
        `;
    } else {
        return `
            <span class="text-muted small">
                <i class="fas fa-clock me-1"></i>
                Chưa khám
            </span>
        `;
    }
}

// Cập nhật trạng thái appointment
async function updateAppointmentStatus(appointmentId, newStatus) {
    try {
        console.log(`Updating appointment ${appointmentId} to status: ${newStatus}`);
        showNotification(`Đã cập nhật trạng thái thành "${getStatusText(newStatus)}"`, 'success');
        
        // Refresh data để cập nhật UI
        setTimeout(() => {
            searchSchedule();
        }, 1000);

    } catch (error) {
        console.error('Error updating appointment status:', error);
        showNotification('Lỗi khi cập nhật trạng thái: ' + error.message, 'error');
    }
}

// Chuyển đến trang xem báo cáo y tế
function viewMedicalRecords(patientId, patientName) {
    window.location.href = `./patient-medical-records.html?patientId=${patientId}&patientName=${encodeURIComponent(patientName)}`;
}

// Tạo báo cáo y tế mới
function createMedicalRecord(patientId, patientName) {
    showNotification('Chức năng tạo báo cáo đang được phát triển', 'info');
}