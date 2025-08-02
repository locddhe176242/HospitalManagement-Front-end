const PAGE_SIZE = 10;
let currentPage = 1;
let currentData = [];

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

function renderTablePage(tableBody, pagination) {
    tableBody.innerHTML = '';
    if (!currentData || currentData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Không có lịch làm việc nào.</td></tr>';
        renderPagination(pagination, 1, 1);
        return;
    }
    const total = currentData.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, total);

    for (let i = startIdx; i < endIdx; i++) {
        const item = currentData[i];
        tableBody.innerHTML += `
            <tr>
                <td>${formatDate(item.shiftDate)}</td>
                <td>${item.shiftType || ''}</td>
                <td>${item.startTime || ''}</td>
                <td>${item.endTime || ''}</td>
                <td>${item.notes || ''}</td>
                <td>${item.createBy || ''}</td>
            </tr>
        `;
    }
    renderPagination(pagination, currentPage, totalPages);
}

function renderPagination(pagination, page, totalPages) {
    let html = '';
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    html += `<li class="page-item${page === 1 ? ' disabled' : ''}">
                <a class="page-link" href="#" data-page="${page - 1}">&laquo;</a>
            </li>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item${page === i ? ' active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>`;
    }
    html += `<li class="page-item${page === totalPages ? ' disabled' : ''}">
                <a class="page-link" href="#" data-page="${page + 1}">&raquo;</a>
            </li>`;
    pagination.innerHTML = html;
}

function gotoPage(page, tableBody, pagination) {
    const totalPages = Math.ceil(currentData.length / PAGE_SIZE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTablePage(tableBody, pagination);
}

function loadSchedules(tableBody, scheduleMessage, pagination, filter = {}) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Đang tải...</td></tr>';
    scheduleMessage.innerHTML = '';

    const doctorId = localStorage.getItem('doctorId');
    if (!doctorId) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.</td></tr>';
        return;
    }

    const payload = {
        doctorId: parseInt(doctorId),
        shiftDate: filter.filterDate || null,
        shiftType: filter.filterType || null
    };

    fetch('https://localhost:7097/api/DoctorShiftFiller/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        let filteredData = data;
        if (filter.filterDate) {
            filteredData = data.filter(item => {
                const itemDate = new Date(item.shiftDate);
                const filterDate = new Date(filter.filterDate);
                return (
                    itemDate.getDate() === filterDate.getDate() &&
                    itemDate.getMonth() === filterDate.getMonth() &&
                    itemDate.getFullYear() === filterDate.getFullYear()
                );
            });
        }
        if (filter.filterType && filter.filterType !== "") {
            filteredData = filteredData.filter(item => item.shiftType === filter.filterType);
        }

        currentData = Array.isArray(filteredData) ? filteredData : [];
        currentPage = 1;
        renderTablePage(tableBody, pagination);
    })
    .catch(() => {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Lỗi tải dữ liệu!</td></tr>';
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('loading').style.display = 'none';
    const tableBody = document.getElementById('scheduleTableBody');
    const filterForm = document.getElementById('filterForm');
    const scheduleMessage = document.getElementById('scheduleMessage');
    const pagination = document.getElementById('pagination');

    // Loader hide
    document.body.classList.add('loaded');
    const loader = document.getElementById('loading');
    if (loader) loader.classList.add('loader-hidden');

    loadSchedules(tableBody, scheduleMessage, pagination);

    filterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const filterDate = document.getElementById('filterDate').value;
        const filterType = document.getElementById('filterType').value;
        loadSchedules(tableBody, scheduleMessage, pagination, { filterDate, filterType });
    });

    pagination.addEventListener('click', function (e) {
        if (e.target.tagName === 'A' && e.target.dataset.page) {
            e.preventDefault();
            gotoPage(Number(e.target.dataset.page), tableBody, pagination);
        }
    });
});