const API_BASE_URL = 'https://localhost:7097';

const PAGE_SIZE = 10;
let currentPage = 1;
let currentRequests = [];

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

document.addEventListener('DOMContentLoaded', async function () {
    const doctorId = getDoctorId();
    if (!doctorId) {
        showNotification('Không tìm thấy thông tin bác sĩ!', 'danger');
        return;
    }
    await loadRequests(doctorId);
});

async function loadRequests(doctorId) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/ShiftRequest/doctor/${doctorId}`);
        if (res.ok) {
            const requests = await res.json();
            currentRequests = requests || [];
            currentPage = 1;
            renderRequestsPage();
        } else {
            showNotification('Không thể tải danh sách yêu cầu!', 'danger');
        }
    } catch {
        showNotification('Lỗi kết nối server!', 'danger');
    }
}

function renderRequestsPage() {
    const tbody = document.getElementById('requestListBody');
    tbody.innerHTML = '';
    if (!currentRequests || currentRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không có yêu cầu nào.</td></tr>';
        renderPagination(1, 1);
        return;
    }
    const total = currentRequests.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, total);

    for (let i = startIdx; i < endIdx; i++) {
        const req = currentRequests[i];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${req.shiftInfo || req.shiftName || req.shiftId}</td>
            <td>${req.requestType === 'Change' ? 'Đổi ca' : 'Nghỉ ca'}</td>
            <td>${req.reason}</td>
            <td>${renderStatus(req.status)}</td>
            <td>${new Date(req.createdAt || req.createdDate).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    }
    renderPagination(currentPage, totalPages);
}

function renderPagination(page, totalPages) {
    let html = '';
    if (totalPages <= 1) {
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    html += `<li class="page-item${page === 1 ? ' disabled' : ''}">
                <a class="page-link" href="#" onclick="gotoPage(${page - 1});return false;">&laquo;</a>
            </li>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item${page === i ? ' active' : ''}">
                    <a class="page-link" href="#" onclick="gotoPage(${i});return false;">${i}</a>
                </li>`;
    }
    html += `<li class="page-item${page === totalPages ? ' disabled' : ''}">
                <a class="page-link" href="#" onclick="gotoPage(${page + 1});return false;">&raquo;</a>
            </li>`;
    document.getElementById('pagination').innerHTML = html;
}

window.gotoPage = function(page) {
    const totalPages = Math.ceil(currentRequests.length / PAGE_SIZE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderRequestsPage();
};

function renderStatus(status) {
    switch (status) {
        case 'Pending': return '<span class="badge bg-warning text-dark">Chờ duyệt</span>';
        case 'Approved': return '<span class="badge bg-success">Đã duyệt</span>';
        case 'Rejected': return '<span class="badge bg-danger">Từ chối</span>';
        default: return status;
    }
}

function showNotification(msg, type) {
    const div = document.getElementById('notification');
    div.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}