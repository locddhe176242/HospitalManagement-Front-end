// Hiển thị thông tin bác sĩ
const doctorId = document.getElementById('doctorIdInput').value;
const doctorName = localStorage.getItem('doctorName') || '';
document.getElementById('doctorId').textContent = `ID: ${doctorId}`;
document.getElementById('doctorName').textContent = `Tên bác sĩ: ${doctorName}`;

// Khởi tạo flatpickr cho input giờ (24h, không AM/PM)
flatpickr(".flatpickr-time", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true
});

// Xử lý submit form đăng ký ca trực
document.getElementById('createScheduleForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formMessage = document.getElementById('formMessage');
    formMessage.innerHTML = '';

    const createBy = localStorage.getItem('username') || ''; // hoặc lấy từ input nếu có

    // Lấy dữ liệu từ form
    const data = {
        doctorId: parseInt(document.getElementById('doctorIdInput').value),
        shiftDate: document.getElementById('shiftDate').value,
        shiftType: document.getElementById('shiftType').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        notes: document.getElementById('notes').value,
        createBy: document.getElementById('createBy').value,
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