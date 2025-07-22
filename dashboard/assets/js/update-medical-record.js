const API_BASE_URL = 'https://localhost:7097';

let currentRecordId = null;

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    let rawId = urlParams.get('medicalRecordId');
    if (rawId && rawId.includes(':')) {
        rawId = rawId.split(':')[0];
    }
    currentRecordId = rawId;

    if (!currentRecordId || isNaN(currentRecordId)) {
        showNotification('Thiếu hoặc sai ID hồ sơ bệnh án', 'danger');
        setTimeout(() => window.history.back(), 2000);
        return;
    }

    loadMedicalRecordDetail();

    document.getElementById('updateMedicalRecordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateMedicalRecord();
    });
});

async function loadMedicalRecordDetail() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/medical-record/view/${RecordId}`);
        if (!response.ok) throw new Error('Không tìm thấy hồ sơ bệnh án');
        const data = await response.json();

        document.getElementById('diseaseName').value = data.diseaseName || '';
        document.getElementById('diagnosis').value = data.diagnosis || '';
        document.getElementById('appointmentId').value = data.appointmentId || '';
        document.getElementById('prescriptionId').value = data.prescriptionId || '';
        document.getElementById('testResults').value = data.testResults || '';
        document.getElementById('notes').value = data.notes || '';
    } catch (err) {
        showNotification(err.message, 'danger');
    }
}

async function updateMedicalRecord() {
    // Tạo payload đúng với MedicalRecordUpdateRequest
    const payload = {
        diseaseName: document.getElementById('diseaseName').value,
        diagnosis: document.getElementById('diagnosis').value,
        appointmentId: document.getElementById('appointmentId').value,
        prescriptionId: document.getElementById('prescriptionId').value,
        testResults: document.getElementById('testResults').value,
        notes: document.getElementById('notes').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/medical-record/update/${RecordId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Cập nhật thất bại');
        }

        showNotification('Cập nhật hồ sơ bệnh án thành công!', 'success');
        setTimeout(() => {
           window.location.href = `./update-medical-record.html?RecordId=${RecordId}`;
        }, 1500);
    } catch (err) {
        showNotification(err.message, 'danger');
    }
}

function showNotification(message, type) {
    const area = document.getElementById('notificationArea');
    area.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show mt-3" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    setTimeout(() => { area.innerHTML = ''; }, 4000);
}