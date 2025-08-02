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

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
}
document.addEventListener('DOMContentLoaded', async function() {
    const doctorId = getDoctorId();
    if (!doctorId) {
        window.location.href = './auth/sign-in-doctor.html';
        return;
    }
    await updateDoctorUI();

});
window.logout = logout;