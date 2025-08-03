document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('loading').style.display = 'none';
    const tableBody = document.getElementById('doctorPatientTableBody');
    const message = document.getElementById('doctorPatientMessage');

    // Lấy doctorId từ localStorage/sessionStorage hoặc query string
    let doctorId = sessionStorage.getItem('doctorId') || localStorage.getItem('doctorId');
    if (!doctorId) {
        // Nếu chưa có, báo lỗi
        message.textContent = "Không tìm thấy thông tin bác sĩ.";
        return;
    }

    fetch(`https://localhost:7097/api/doctor/${doctorId}/patients`)
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Không có bệnh nhân nào đã khám.</td></tr>';
                return;
            }
            tableBody.innerHTML = data.map((item, idx) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${item.doctorName || ''}</td>
                    <td>${item.patientName || ''}</td>
                    <td>${item.dob ? new Date(item.dob).toLocaleDateString() : ''}</td>
                    <td>${item.phone || ''}</td>
                    <td>${item.address || ''}</td>
                    <td>${item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString() : ''}</td>
                    <td>${item.startTime ? item.startTime : ''}</td>
                    <td>${item.status || ''}</td>
                </tr>
            `).join('');
        })
        .catch(() => {
            message.textContent = "Lỗi tải dữ liệu bệnh nhân!";
        });
});