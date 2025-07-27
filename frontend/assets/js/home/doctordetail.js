document.addEventListener('DOMContentLoaded', async () => {
    // Lấy id bác sĩ từ URL
    const params = new URLSearchParams(window.location.search);
    const doctorId = params.get('id');

    if (!doctorId) {
        console.error('Không tìm thấy bác sĩ.');
        return;
    }

    try {
        // Gọi API để lấy thông tin bác sĩ
        const response = await fetch(`https://localhost:7097/api/Doctors/FindById/${doctorId}`);
        if (!response.ok) {
            throw new Error("Không thể tải thông tin bác sĩ");
        }

        const doctor = await response.json();

        // Cập nhật thông tin bác sĩ vào HTML
        document.getElementById('doctor-name').textContent = doctor.name;
        document.getElementById('doctor-phone').textContent = doctor.phone;
        document.getElementById('doctor-dob').textContent = new Date(doctor.dob).toLocaleDateString('vi-VN');
        document.getElementById('doctor-exp').textContent = doctor.yearOfExperience + " năm kinh nghiệm";
        const statusText = doctor.status === "Available" ? "Đang làm việc" : "Không hoạt động";
        document.getElementById('doctor-status').textContent = statusText;

        // Cập nhật ảnh bác sĩ
        document.getElementById('doctor-image').src = doctor.imageURL;

    } catch (error) {
        console.error("Lỗi khi tải thông tin bác sĩ:", error);
        alert("Không thể tải thông tin bác sĩ.");
    }
});
