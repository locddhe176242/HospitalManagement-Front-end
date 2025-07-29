const API_BASE_URL = 'https://localhost:7097';
const PAGE_SIZE = 10;
let currentPage = 1;
let allRequests = [];

document.addEventListener('DOMContentLoaded', async function () {
    await loadAllRequests();
});

async function loadAllRequests() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/ShiftRequest/all`);
        if (res.ok) {
            const requests = await res.json();
            allRequests = requests || [];
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
    const tbody = document.getElementById('adminRequestListBody');
    tbody.innerHTML = '';
    if (!allRequests || allRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Không có yêu cầu nào.</td></tr>';
        renderPagination(1, 1);
        return;
    }
    const total = allRequests.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, total);

    for (let i = startIdx; i < endIdx; i++) {
        const req = allRequests[i];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${req.doctorName || req.doctorId}</td>
            <td>${req.shiftInfo || req.shiftName || req.shiftId}</td>
            <td>${req.requestType === 'Change' ? 'Đổi ca' : 'Nghỉ ca'}</td>
            <td>${req.reason}</td>
            <td>${renderStatus(req.status)}</td>
            <td>${new Date(req.createdAt || req.createdDate).toLocaleString()}</td>
            <td>
                ${req.status === 'Pending' ? `
                    <button class="btn btn-success btn-sm me-1" onclick="approveRequest(${req.id}, true)">Duyệt</button>
                    <button class="btn btn-danger btn-sm" onclick="approveRequest(${req.id}, false)">Từ chối</button>
                ` : ''}
            </td>
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
    const totalPages = Math.ceil(allRequests.length / PAGE_SIZE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderRequestsPage();
};

window.approveRequest = async function(requestId, isApprove) {
    try {
        let url, options;
        if (isApprove) {
            url = `${API_BASE_URL}/api/ShiftRequest/${requestId}/approve`;
            options = {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            };
        } else {
            url = `${API_BASE_URL}/api/ShiftRequest/${requestId}/reject`;
            options = {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify("Từ chối bởi quản lý") // hoặc lấy lý do từ input nếu muốn
            };
        }
        const res = await fetch(url, options);
        if (res.ok) {
            showNotification(isApprove ? 'Đã duyệt yêu cầu!' : 'Đã từ chối yêu cầu!', 'success');
            await loadAllRequests();
        } else {
            showNotification('Không thể cập nhật trạng thái!', 'danger');
        }
    } catch {
        showNotification('Lỗi kết nối server!', 'danger');
    }
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