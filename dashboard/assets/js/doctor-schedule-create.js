flatpickr(".flatpickr-time", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true
});

document.getElementById('createScheduleForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formMessage = document.getElementById('formMessage');
    formMessage.innerHTML = '';

    // Lấy dữ liệu từ form
    const data = {
        doctorId: parseInt(document.getElementById('doctorIdInput').value),
        shiftDate: document.getElementById('shiftDate').value,
        shiftType: document.getElementById('shiftType').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        notes: document.getElementById('notes').value,
    };

    // Gọi API tạo mới ca trực
    fetch('https://localhost:7097/api/DoctorSchedule/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            formMessage.innerHTML = `<div class="alert alert-success">${result.message || 'Đăng ký ca trực thành công!'}</div>`;
            setTimeout(() => window.location.href = 'doctor-schedule.html', 1200);
        } else {
            formMessage.innerHTML = `<div class="alert alert-danger">${result.message || 'Đăng ký thất bại!'}</div>`;
        }
    })
    .catch(() => {
        formMessage.innerHTML = `<div class="alert alert-danger">Lỗi hệ thống, vui lòng thử lại sau!</div>`;
    });
});