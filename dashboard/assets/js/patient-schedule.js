const API_BASE_URL = 'https://localhost:7097';

// ====== UTILS ======
function getDoctorId() {
    const doctorId = localStorage.getItem('doctorId');
    if (doctorId) return doctorId;

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
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateDoctorTitle();
    loadTodaySchedule();
});

// ====== EVENT LISTENERS ======
function setupEventListeners() {
    document.getElementById('filterForm').onsubmit = async function(e) {
        e.preventDefault();
        await searchSchedule();
    };
    document.querySelector('[onclick="loadTodaySchedule()"]').addEventListener('click', loadTodaySchedule);
    document.querySelector('[onclick="loadThisWeekSchedule()"]').addEventListener('click', loadThisWeekSchedule);
    document.querySelector('[onclick="clearFilters()"]').addEventListener('click', clearFilters);
}

// ====== DOCTOR INFO ======
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
function loadTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fromDateFilter').value = today;
    document.getElementById('toDateFilter').value = today;
    searchSchedule();
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
    document.getElementById('scheduleTableBody').innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <i class="fas fa-search fa-2x text-muted mb-2"></i>
                <p class="text-muted">Sử dụng bộ lọc để tìm kiếm lịch khám</p>
            </td>
        </tr>
    `;
    document.getElementById('resultCount').textContent = 'Chọn bác sĩ để xem lịch khám';
    document.getElementById('totalAppointments').textContent = '0';
}

// ====== SEARCH & RENDER ======
async function searchSchedule() {
    const doctorId = getDoctorId();
    if (!doctorId) {
        alert('Không tìm thấy thông tin bác sĩ!');
        return;
    }
    const fromDateElem = document.getElementById('fromDateFilter');
    const toDateElem = document.getElementById('toDateFilter');
    const patientNameElem = document.getElementById('patientNameFilter');
    const fromDate = fromDateElem ? fromDateElem.value : "";
    const toDate = toDateElem ? toDateElem.value : "";
    const patientName = patientNameElem ? patientNameElem.value : "";

    const filterData = {
        doctorId: parseInt(doctorId),
        patientName: patientName,
        fromDate: fromDate ? new Date(fromDate).toISOString() : null,
        toDate: toDate ? new Date(toDate).toISOString() : null
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/PatientFilter/doctor-schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filterData)
        });
        if (!response.ok) throw new Error('Không lấy được lịch khám');
        const data = await response.json();
        renderScheduleTable(data);
        document.getElementById('resultCount').innerText = `Tìm thấy ${data.length} lịch khám`;
        document.getElementById('totalAppointments').innerText = data.length;
    } catch (err) {
        alert('Lỗi khi tìm kiếm lịch khám: ' + err.message);
    }
}

function renderScheduleTable(data) {
    const tbody = document.getElementById('scheduleTableBody');
    tbody.innerHTML = "";
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">
            <i class="fas fa-search fa-2x text-muted mb-2"></i>
            <p class="text-muted">Không có lịch khám nào phù hợp</p>
        </td></tr>`;
        return;
    }
    data.forEach((item, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td>${item.patientId}</td>
                <td>${item.patientName}</td>
                <td>${item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString() : ""}</td>
                <td>${item.startTime}</td>
                <td>
                    <button class="btn btn-info btn-sm"
                        onclick="showPatientDetail('${item.patientId}', '${item.patientName}', '${item.appointmentId || ''}')">
                        Xem báo cáo
                    </button>
                </td>
            </tr>
        `;
    });
}

function showPatientDetail(patientId, patientName = '', appointmentId = '') {
    const params = new URLSearchParams({
        patientId: patientId,
        patientName: patientName,
        appointmentId: appointmentId
    });
    window.location.href = `./patient-medical-records.html?${params.toString()}`;
}