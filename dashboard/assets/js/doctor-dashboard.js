const API_BASE_URL = 'https://localhost:7097';
let currentDoctorInfo = null;

// ====== AUTH & DOCTOR ID UTILS ======
function getAuthToken() {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
}

function getDoctorId() {
    return localStorage.getItem('doctorId');
}

function getCurrentUser() {
    try {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) return null;
        return JSON.parse(userInfo);
    } catch {
        return null;
    }
}

// ====== DOCTOR INFO ======
async function getDoctorInfo() {
    const doctorId = getDoctorId();
    const token = getAuthToken();
    if (!doctorId || !token) {
        window.location.href = './auth/sign-in-doctor.html';
        return null;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/Doctors/FindById/${doctorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Không lấy được thông tin bác sĩ');
        const doctorData = await response.json();
        currentDoctorInfo = doctorData;
        return doctorData;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function updateDoctorUI() {
    showDoctorInfoLoading();
    const doctorInfo = await getDoctorInfo();
    const rightTextElement = document.querySelector('.right-text');
    if (rightTextElement) {
        rightTextElement.textContent = doctorInfo?.fullName || 'Bác sĩ';
    }
    document.title = `Doctor Dashboard - ${doctorInfo?.fullName || ''} - KiviCare`;
    const avatarImg = document.querySelector('#navbarDropdown img');
    if (avatarImg && doctorInfo?.avatar) avatarImg.src = doctorInfo.avatar;
    const headTitle = document.querySelector('.head-title');
    if (headTitle) headTitle.textContent = `Doctor Dashboard - ${doctorInfo?.fullName || ''}`;
}
async function updateDoctorUI() {
    showDoctorInfoLoading();
    const doctorInfo = await getDoctorInfo();
    const rightTextElement = document.querySelector('.right-text');
    if (rightTextElement) {
        rightTextElement.textContent = doctorInfo?.fullName || 'Bác sĩ';
    }
    document.title = `Doctor Dashboard - ${doctorInfo?.fullName || ''} - KiviCare`;
    const avatarImg = document.querySelector('#navbarDropdown img');
    if (avatarImg && doctorInfo?.avatar) avatarImg.src = doctorInfo.avatar;
    const headTitle = document.querySelector('.head-title');
    if (headTitle) headTitle.textContent = `Doctor Dashboard - ${doctorInfo?.fullName || ''}`;
    document.body.classList.add('loaded');
    const loader = document.getElementById('loading');
    if (loader) loader.classList.add('loader-hidden');
}

// ====== LOADING & LOGOUT ======
function showDoctorInfoLoading() {
    const rightTextElement = document.querySelector('.right-text');
    if (rightTextElement) {
        rightTextElement.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang tải...';
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('doctorId');
    sessionStorage.clear();
    window.location.href = './auth/sign-in-doctor.html';
}

// ====== DASHBOARD DATA (SAMPLE) ======
const sampleAppointments = {
    today: [
        { time: "08:00", patient: "Nguyễn Thị Lan", reason: "Khám tổng quát", status: "confirmed", date: "today" },
        { time: "09:30", patient: "Trần Văn Minh", reason: "Tái khám", status: "confirmed", date: "today" },
        { time: "10:00", patient: "Lê Thị Hoa", reason: "Khám da liễu", status: "pending", date: "today" },
        { time: "14:00", patient: "Hoàng Thị Mai", reason: "Khám phụ khoa", status: "confirmed", date: "today" }
    ],
    upcoming: [
        { time: "08:30", patient: "Phạm Văn Đức", reason: "Khám tim mạch", status: "confirmed", date: "2024-12-26" },
        { time: "09:00", patient: "Vũ Văn Nam", reason: "Khám thần kinh", status: "confirmed", date: "2024-12-26" },
        { time: "10:15", patient: "Nguyễn Thị Bình", reason: "Khám mắt", status: "pending", date: "2024-12-27" },
        { time: "11:00", patient: "Trần Văn Tùng", reason: "Khám răng", status: "confirmed", date: "2024-12-27" },
        { time: "14:30", patient: "Lê Thị Nga", reason: "Khám tai mũi họng", status: "pending", date: "2024-12-28" }
    ]
};

const sampleRecentPatients = [
    { name: "Nguyễn Thị Lan", time: "08:00", reason: "Khám tổng quát", status: "completed" },
    { name: "Trần Văn Minh", time: "09:30", reason: "Tái khám", status: "completed" },
    { name: "Lê Thị Hoa", time: "10:00", reason: "Khám da liễu", status: "in-progress" },
    { name: "Phạm Văn Đức", time: "11:15", reason: "Khám tim mạch", status: "waiting" },
    { name: "Hoàng Thị Mai", time: "14:00", reason: "Khám phụ khoa", status: "completed" }
];

const sampleSchedule = [
    { title: "Khám bệnh", time: "08:00 - 12:00", type: "consultation" },
    { title: "Họp khoa", time: "14:00 - 15:00", type: "meeting" },
    { title: "Khám bệnh", time: "15:00 - 17:00", type: "consultation" },
    { title: "Nghiên cứu", time: "19:00 - 20:00", type: "research" }
];

// ====== DASHBOARD RENDER ======
function loadAppointments(filter = 'upcoming') {
    const appointmentList = document.getElementById('appointmentList');
    if (!appointmentList) return;
    let filteredAppointments;
    switch(filter) {
        case 'today': filteredAppointments = sampleAppointments.today; break;
        case 'upcoming': filteredAppointments = sampleAppointments.upcoming; break;
        case 'tomorrow': filteredAppointments = sampleAppointments.upcoming.filter(apt => apt.date === '2024-12-26'); break;
        case 'week': filteredAppointments = sampleAppointments.upcoming; break;
        default: filteredAppointments = sampleAppointments.upcoming;
    }
    appointmentList.innerHTML = '';
    if (filteredAppointments.length === 0) {
        appointmentList.innerHTML = '<p class="text-center text-muted">Không có lịch hẹn nào</p>';
        return;
    }
    filteredAppointments.forEach(appointment => {
        const statusClass = appointment.status === 'confirmed' ? 'text-success' : 'text-warning';
        const statusText = appointment.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận';
        const dateText = appointment.date === 'today' ? 'Hôm nay' : appointment.date;
        appointmentList.innerHTML += `
            <div class="d-flex align-items-center mb-4 bg-primary-subtle px-3 py-3 px-lg-4 rounded">
                <div class="text-center me-3">
                    <h6 class="mb-0 text-primary f-none">${appointment.time}</h6>
                    <small class="text-muted">${dateText}</small>
                </div>
                <div class="border-start ps-3 ms-3 flex-grow-1">
                    <h5 class="mb-1">${appointment.patient}</h5>
                    <h6 class="mb-1">Lý do: <span class="text-body fw-normal">${appointment.reason}</span></h6>
                    <small class="${statusClass}">${statusText}</small>
                </div>
                <div>
                    <button class="dropdown btn border-0 p-0" onclick="viewAppointmentDetails('${appointment.patient}')" aria-label="Xem chi tiết">
                        <svg width="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.5 5L15.5 12L8.5 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });
    const countText = filter === 'today' ? `${filteredAppointments.length} lịch hẹn hôm nay` :
                     filter === 'upcoming' ? `${filteredAppointments.length} lịch hẹn sắp tới` :
                     `${filteredAppointments.length} lịch hẹn`;
    const countElement = document.getElementById('appointmentCountText');
    if (countElement) countElement.textContent = countText;
}

function loadRecentPatients() {
    const tableBody = document.getElementById('recentPatientsTable');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    sampleRecentPatients.forEach((patient, index) => {
        const statusClass = patient.status === 'completed' ? 'bg-success-subtle text-success' : 
                          patient.status === 'in-progress' ? 'bg-warning-subtle text-warning' : 
                          'bg-info-subtle text-info';
        const statusText = patient.status === 'completed' ? 'Hoàn thành' : 
                          patient.status === 'in-progress' ? 'Đang khám' : 
                          'Chờ khám';
        tableBody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <img src="./assets/images/table/${10 + index}.png" class="img-fluid flex-shrink-0 icon-40 object-fit-cover" alt="patient">
                        <h5 class="mb-0">${patient.name}</h5>
                    </div>
                </td>
                <td>${patient.time}</td>
                <td>${patient.reason}</td>
                <td>
                    <span class="badge ${statusClass} fw-500 px-3 py-2">${statusText}</span>
                </td>
            </tr>
        `;
    });
}

async function loadSchedule() {
    const scheduleList = document.getElementById('scheduleList');
    if (!scheduleList) return;
    scheduleList.innerHTML = '<div class="text-center text-muted">Đang tải...</div>';

    const doctorId = getDoctorId();
    if (!doctorId) {
        scheduleList.innerHTML = '<div class="text-danger text-center">Không tìm thấy thông tin bác sĩ.</div>';
        return;
    }

    // Gọi API lấy lịch làm việc thực
    const payload = {
        doctorId: parseInt(doctorId),
        shiftDate: null,
        shiftType: null
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/DoctorShiftFiller/list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        , body: JSON.stringify(payload) });
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            scheduleList.innerHTML = '<div class="text-center text-muted">Không có lịch làm việc nào.</div>';
            return;
        }
        scheduleList.innerHTML = '';
        data.slice(0, 5).forEach(item => { // Hiển thị tối đa 5 lịch gần nhất
            scheduleList.innerHTML += `
                <div class="d-flex align-items-center mb-3 p-3 bg-light-subtle rounded">
                    <div class="me-3">
                        <span class="fs-5 text-primary"><i class="fas fa-calendar-alt"></i></span>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${formatDate(item.shiftDate)} - ${item.shiftType || ''}</h6>
                        <small class="text-muted">${item.startTime || ''} - ${item.endTime || ''}</small>
                        <div class="text-muted">${item.notes || ''}</div>
                    </div>
                </div>
            `;
        });
    } catch {
        scheduleList.innerHTML = '<div class="text-center text-danger">Lỗi tải dữ liệu!</div>';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
}

function filterAppointments(filter) {
    loadAppointments(filter);
}

function viewAppointmentDetails(patientName) {
    alert(`Xem chi tiết lịch hẹn của ${patientName}`);
}

// ====== MAIN INITIALIZATION ======
document.addEventListener('DOMContentLoaded', async function() {
    const doctorId = getDoctorId();
    if (!doctorId) {
        window.location.href = './auth/sign-in-doctor.html';
        return;
    }
    await updateDoctorUI();
    loadAppointments('upcoming');
    loadRecentPatients();
    loadSchedule();
    updateTodayStats();
    startAutoRefresh();
});

function updateTodayStats() {
    const todayCountElement = document.getElementById('todayCount');
    if (todayCountElement) todayCountElement.textContent = sampleAppointments.today.length;
}

function startAutoRefresh() {
    setInterval(function() {
        loadAppointments();
        loadRecentPatients();
        updateTodayStats();
    }, 300000);
}

window.filterAppointments = filterAppointments;
window.viewAppointmentDetails = viewAppointmentDetails;
window.logout = logout;