const API_BASE_URL = 'https://localhost:7097';

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
    document.getElementById('loading').style.display = 'none';
    const doctorId = getDoctorId();
    if (!doctorId) {
        showNotification('Không tìm thấy thông tin bác sĩ!', 'danger');
        return;
    }
    await loadShifts(doctorId);

    document.getElementById('shiftRequestForm').onsubmit = async function (e) {
        e.preventDefault();
        const shiftId = document.getElementById('shiftSelect').value;
        const requestType = document.getElementById('requestType').value;
        const reason = document.getElementById('reason').value.trim();

        if (!shiftId || !requestType || !reason) {
            showNotification('Vui lòng nhập đầy đủ thông tin!', 'danger');
            return;
        }

        const payload = {
            doctorId: doctorId,
            shiftId: parseInt(shiftId),
            requestType: requestType,
            reason: reason
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/ShiftRequest/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showNotification('Gửi yêu cầu thành công!', 'success');
                document.getElementById('shiftRequestForm').reset();
            } else {
                const err = await res.json();
                showNotification('Lỗi: ' + (err.message || 'Không gửi được yêu cầu'), 'danger');
            }
        } catch (error) {
            showNotification('Lỗi kết nối server!', 'danger');
        }
    };
});

async function loadShifts(doctorId) {
    try {
        const payload = { doctorId: doctorId };
        const res = await fetch(`${API_BASE_URL}/api/DoctorShiftFiller/list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const shifts = await res.json();
            const select = document.getElementById('shiftSelect');
            select.innerHTML = '<option value="">-- Chọn ca trực --</option>'; // reset options
            shifts.forEach(shift => {
                const option = document.createElement('option');
                option.value = shift.id;
                option.textContent = `${shift.shiftType} - ${new Date(shift.shiftDate).toLocaleDateString()}`;
                select.appendChild(option);
            });
        } else {
            showNotification('Không thể tải danh sách ca trực!', 'danger');
        }
    } catch {
        showNotification('Lỗi kết nối server!', 'danger');
    }
}

function showNotification(msg, type) {
    const div = document.getElementById('notification');
    div.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}