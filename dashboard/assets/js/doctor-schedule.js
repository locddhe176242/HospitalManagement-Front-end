document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('addScheduleBtn').addEventListener('click', function () {
        window.location.href = 'doctor-schedule-create.html';
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

// danh sách ca trực cho bác sĩ
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

        const tbody = document.getElementById('scheduleList');
        tbody.innerHTML = '';
        if (!Array.isArray(filteredData) || filteredData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">Không có ca trực nào</td></tr>`;
            return;
        }
        filteredData.forEach((item, idx) => {
            tbody.innerHTML += `
                <tr>
                    <td class="text-center">${idx + 1}</td>
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
        });
    })
    .catch(() => {
        const tbody = document.getElementById('scheduleList');
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger">Lỗi tải dữ liệu!</td></tr>`;
    });
}

// Hàm định dạng ngày (yyyy-MM-dd -> dd/MM/yyyy)
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
}

function updateSchedule(id) {
    window.location.href = `doctor-schedule-update.html?id=${id}`;
}
function deleteSchedule(id) {
    if (confirm('Bạn có chắc muốn xóa ca trực này?')) {
        alert('Chức năng xóa chưa được triển khai!');
    }
}