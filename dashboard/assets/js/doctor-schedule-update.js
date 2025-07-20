// Khởi tạo flatpickr cho input giờ (24h)
flatpickr(".flatpickr-time", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true
});

// Lấy id từ URL
const urlParams = new URLSearchParams(window.location.search);
const scheduleId = urlParams.get('id');

// Load dữ liệu lịch trực để fill vào form
fetch(`https://localhost:7097/api/DoctorShiftFiller/detail?id=${scheduleId}`)
    .then(res => res.json())
    .then(data => {
        // Fill dữ liệu vào form
        document.getElementById('shiftDate').value = data.shiftDate?.substring(0,10) || '';
        document.getElementById('shiftType').value = data.shiftType || '';
        document.getElementById('startTime').value = data.startTime || '';
        document.getElementById('endTime').value = data.endTime || '';
        document.getElementById('notes').value = data.notes || '';
    });

// Xử lý submit cập nhật
document.getElementById('updateScheduleForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formMessage = document.getElementById('formMessage');
    formMessage.innerHTML = '';

    const data = {
        id: parseInt(scheduleId),
        shiftDate: document.getElementById('shiftDate').value,
        shiftType: document.getElementById('shiftType').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        notes: document.getElementById('notes').value
    };

    fetch('https://localhost:7097/api/DoctorSchedule/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            formMessage.innerHTML = `<div class="alert alert-success">${result.message || 'Cập nhật thành công!'}</div>`;
            setTimeout(() => window.location.href = 'doctor-schedule.html', 1200);
        } else {
            formMessage.innerHTML = `<div class="alert alert-danger">${result.message || 'Cập nhật thất bại!'}</div>`;
        }
    })
    .catch(() => {
        formMessage.innerHTML = `<div class="alert alert-danger">Lỗi hệ thống, vui lòng thử lại sau!</div>`;
    });
});