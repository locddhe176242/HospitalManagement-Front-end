const PAGE_SIZE = 10;
let currentPage = 1;
let currentData = [];

function loadSchedules(filter = {}) {
    const filterName = filter.filterName || '';
    const filterDate = filter.filterDate || '';
    const filterType = filter.filterType || '';

    fetch('https://localhost:7097/api/DoctorShiftFiller/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    })
    .then(res => res.json())
    .then(data => {
        let filteredData = data;
        // Lọc theo tên bác sĩ
        if (filterName) {
            filteredData = filteredData.filter(item =>
                (item.doctorName || '').toLowerCase().includes(filterName)
            );
        }
        // Lọc theo ngày làm việc
        if (filterDate) {
            filteredData = filteredData.filter(item => {
                const itemDate = new Date(item.shiftDate);
                const filterDateObj = new Date(filterDate);
                return (
                    itemDate.getDate() === filterDateObj.getDate() &&
                    itemDate.getMonth() === filterDateObj.getMonth() &&
                    itemDate.getFullYear() === filterDateObj.getFullYear()
                );
            });
        }
        // Lọc theo loại ca
        if (filterType) {
            filteredData = filteredData.filter(item => item.shiftType === filterType);
        }

        currentData = filteredData;
        currentPage = 1;
        renderPage();
    })
    .catch(() => {
        const tbody = document.getElementById('scheduleList');
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger">Lỗi tải dữ liệu!</td></tr>`;
        document.getElementById('pagination').innerHTML = '';
    });
}

function renderPage() {
    const tbody = document.getElementById('scheduleList');
    tbody.innerHTML = '';
    if (!Array.isArray(currentData) || currentData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">Không có ca trực nào</td></tr>`;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    const total = currentData.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, total);

    for (let i = startIdx; i < endIdx; i++) {
        const item = currentData[i];
        tbody.innerHTML += `
            <tr>
                <td class="text-center">${i + 1}</td>
                <td class="text-center">${item.doctorId}</td>
                <td class="text-center">${item.doctorName || ''}</td>
                <td class="text-center">${item.shiftDate ? formatDate(item.shiftDate) : ''}</td>
                <td class="text-center">${item.shiftType || ''}</td>
                <td class="text-center">${item.startTime || ''}</td>
                <td class="text-center">${item.endTime || ''}</td>
                <td class="text-center">${item.notes || ''}</td>
                <td class="text-center">${item.createBy || ''}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-warning me-1" onclick="updateSchedule(${item.id})">Update</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteSchedule(${item.id})">Delete</button>
                </td>
            </tr>
        `;
    }
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    let html = '';
    html += `<li class="page-item${currentPage === 1 ? ' disabled' : ''}">
                <a class="page-link" href="#" onclick="gotoPage(${currentPage - 1});return false;">&laquo;</a>
            </li>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item${currentPage === i ? ' active' : ''}">
                    <a class="page-link" href="#" onclick="gotoPage(${i});return false;">${i}</a>
                </li>`;
    }
    html += `<li class="page-item${currentPage === totalPages ? ' disabled' : ''}">
                <a class="page-link" href="#" onclick="gotoPage(${currentPage + 1});return false;">&raquo;</a>
            </li>`;
    pagination.innerHTML = html;
}

window.gotoPage = function(page) {
    const totalPages = Math.ceil(currentData.length / PAGE_SIZE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderPage();
};

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('addScheduleBtn').addEventListener('click', function () {
        window.location.href = 'doctor-schedule-create.html';
    });
    document.getElementById('shiftRequestAdminBtn').addEventListener('click', function () {
        window.location.href = '../ShiftSchedule/shift-request-admin.html';
    });

    const filterForm = document.getElementById('filterForm');
    filterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const filterName = document.getElementById('filterName').value.trim().toLowerCase();
        const filterDate = document.getElementById('filterDate').value;
        const filterType = document.getElementById('filterType').value;
        loadSchedules({ filterName, filterDate, filterType });
    });

    loadSchedules({});
});

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
}

function updateSchedule(id) {
    window.location.href = `doctor-schedule-update.html?id=${id}`;
}
function deleteSchedule(id) {
    if (!confirm('Bạn có chắc muốn xóa ca trực này?')) return;

    fetch('https://localhost:7097/api/DoctorSchedule/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id }) // truyền id vào body theo backend
    })
    .then(res => {
        if (res.ok) {
            alert('Xóa ca trực thành công!');
            loadSchedules({});
        } else {
            res.json().then(data => {
                alert('Xóa thất bại: ' + (data?.message || 'Lỗi không xác định'));
            });
        }
    })
    .catch(() => alert('Lỗi kết nối khi xóa!'));
}