const API_BASE_URL = 'https://localhost:7097';
let currentRecordId = null;
let currentPatientId = null;
let currentPatientName = '';
let currentDoctorId = localStorage.getItem('doctorId');
let diseases = [];

// Khởi tạo trang
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== MEDICAL RECORD UPDATE PAGE ===');
    console.log('API_BASE_URL:', API_BASE_URL);
    const urlParams = new URLSearchParams(window.location.search);
    currentRecordId = urlParams.get('recordId');
    currentPatientName = urlParams.get('patientName') || 'Bệnh nhân';

    if (!currentRecordId) {
        showNotification('Thiếu thông tin hồ sơ bệnh án', 'error');
        setTimeout(() => window.history.back(), 2000);
        return;
    }

    // Set hidden fields
    document.getElementById('recordId').value = currentRecordId;
    document.getElementById('doctorId').value = currentDoctorId;
    document.getElementById('saveDraftBtn').onclick = function() {
        const modal = new bootstrap.Modal(document.getElementById('confirmCancelModal'));
        modal.show();
    };
     document.getElementById('confirmCancelBtn').onclick = function() {
        window.history.back();
    };
    document.getElementById('submitBtn').onclick = function() {
        updateMedicalRecord();
    };

    try {
        await loadMedicalRecordDetail();
        if (currentPatientId) {
            await loadPatientInfo();
        }
        await loadDiseases();
    } catch (error) {
        console.error('Lỗi khởi tạo trang:', error);
        showNotification('Lỗi khởi tạo trang: ' + error.message, 'error');
    }
    setupFormValidation();
    setupCharCounters();
});

// Lấy thông tin bệnh nhân
async function loadPatientInfo() {
    try {
        document.getElementById('patientInfo').innerHTML = `
            <div class="col-md-6">
                <div class="d-flex align-items-center">
                    <div class="avatar avatar-lg me-3">
                        <span class="avatar-title bg-primary rounded-circle fs-4">
                            ${currentPatientName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h6 class="mb-1">${currentPatientName}</h6>
                        <p class="text-muted mb-0">Mã BN: ${currentPatientId}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <small class="text-muted">Đang tải thông tin chi tiết...</small>
            </div>
        `;

        const response = await fetch(`${API_BASE_URL}/api/Patient/findId/${currentPatientId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            const patientData = await response.json();
            displayPatientInfo(patientData);
        } else {
            throw new Error('Không thể tải thông tin bệnh nhân');
        }
    } catch (error) {
        console.error('Lỗi khi tải thông tin bệnh nhân:', error);
        showNotification('Lỗi khi tải thông tin bệnh nhân: ' + error.message, 'error');
    }
}

function displayPatientInfo(patientData) {
    document.getElementById('patientInfo').innerHTML = `
        <div class="col-md-6">
            <div class="d-flex align-items-center">
                <div class="avatar avatar-lg me-3">
                    <span class="avatar-title bg-primary rounded-circle fs-4">
                        ${(patientData.name || currentPatientName).charAt(0).toUpperCase()}
                    </span>
                </div>
                <div>
                    <h6 class="mb-1">${patientData.name || currentPatientName}</h6>
                    <p class="text-muted mb-0">Mã BN: ${patientData.id || currentPatientId}</p>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="row">
                <div class="col-12">
                    <small class="text-muted">Giới tính:</small>
                    <span class="ms-2">${patientData.gender || 'N/A'}</span>
                </div>
                <div class="col-12">
                    <small class="text-muted">Ngày sinh:</small>
                    <span class="ms-2">${patientData.dob ? new Date(patientData.dob).toLocaleDateString('vi-VN') : 'N/A'}</span>
                </div>
            </div>
        </div>
    `;
}

// Lấy chi tiết hồ sơ bệnh án
async function loadMedicalRecordDetail() {
    try {
        console.log('Loading medical record detail for ID:', currentRecordId);

        const response = await fetch(`${API_BASE_URL}/api/medical-record/view/${currentRecordId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Không tìm thấy báo cáo y tế với ID này');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        medicalRecordData = data;
        fillForm(data);

        // Sửa tại đây: Gán lại ID và tên bệnh nhân từ dữ liệu hồ sơ
        currentPatientId = data.patientId || data.PatientId || '';
        currentPatientName = data.patientName || data.PatientName || '';
        document.getElementById('patientId').value = currentPatientId;

    } catch (error) {
        console.error('Error loading medical record detail:', error);
        showNotification('Lỗi khi tải chi tiết hồ sơ: ' + error.message, 'error');
    }
}

// Đổ dữ liệu vào form
function fillForm(data) {
    document.getElementById('appointmentId').value = data.appointmentId || data.AppointmentId || '';
    document.getElementById('diseaseSelect').value = data.diseaseId || data.DiseaseId || '';
    document.getElementById('status').value = data.status || data.Status || 'Open';
    document.getElementById('prescriptionId').value = data.prescriptionId || data.PrescriptionId || '';
    document.getElementById('diagnosis').value = data.diagnosis || data.Diagnosis || '';
    document.getElementById('testResults').value = data.testResults || data.TestResults || '';
    document.getElementById('notes').value = data.notes || data.Notes || '';
    updateCharCounter('diagnosis', 'diagnosisCounter', 1000);
    updateCharCounter('testResults', 'testResultsCounter', 2000);
    updateCharCounter('notes', 'notesCounter', 500);
}

// Lấy danh sách bệnh
async function loadDiseases() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/Disease/get-all`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            diseases = await response.json();
            populateDiseaseSelect();
            if (medicalRecordData) {
                fillForm(medicalRecordData);
            }
        } else {
            throw new Error('Lỗi tải danh sách bệnh');
        }
    } catch (error) {
        console.error('Không thể tải danh sách bệnh:', error);
        showNotification('Không thể tải danh sách bệnh: ' + error.message, 'error');
    }
}

function populateDiseaseSelect() {
    const select = document.getElementById('diseaseSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Chọn bệnh --</option>';
    diseases.forEach(disease => {
        const option = document.createElement('option');
        option.value = disease.id;
        option.textContent = disease.name;
        select.appendChild(option);
    });
}

// Validate form
function setupFormValidation() {
    const form = document.getElementById('medicalRecordForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (form.checkValidity()) {
            updateMedicalRecord();
        } else {
            showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
        }
        form.classList.add('was-validated');
    });
}

// Bộ đếm ký tự
function setupCharCounters() {
    const fields = [
        { id: 'diagnosis', counter: 'diagnosisCounter', max: 1000 },
        { id: 'testResults', counter: 'testResultsCounter', max: 2000 },
        { id: 'notes', counter: 'notesCounter', max: 500 }
    ];
    fields.forEach(field => {
        const textarea = document.getElementById(field.id);
        const counter = document.getElementById(field.counter);
        if (!textarea || !counter) return;
        textarea.addEventListener('input', function() {
            updateCharCounter(field.id, field.counter, field.max);
        });
    });
}

function updateCharCounter(fieldId, counterId, max) {
    const textarea = document.getElementById(fieldId);
    const counter = document.getElementById(counterId);
    if (!textarea || !counter) return;
    const length = textarea.value.length;
    counter.textContent = `${length}/${max}`;
    counter.className = 'char-counter';
    if (length > max * 0.8) counter.classList.add('warning');
    if (length > max * 0.95) {
        counter.classList.remove('warning');
        counter.classList.add('danger');
    }
}

// Lấy dữ liệu từ form
function getFormData() {
    const data = {
        Diagnosis: document.getElementById('diagnosis').value.trim(),
        TestResults: document.getElementById('testResults').value.trim(),
        Notes: document.getElementById('notes').value.trim() || null,
        Status: document.getElementById('status').value,
        DoctorId: parseInt(document.getElementById('doctorId').value),
        PatientId: parseInt(document.getElementById('patientId').value),
        DiseaseId: document.getElementById('diseaseSelect').value ? parseInt(document.getElementById('diseaseSelect').value) : null,
        AppointmentId: parseInt(document.getElementById('appointmentId').value),
        PrescriptionId: document.getElementById('prescriptionId').value ? parseInt(document.getElementById('prescriptionId').value) : null
    };

    // Validate
    if (!data.Diagnosis || !data.TestResults || !data.Status || !data.AppointmentId) {
        throw new Error('Thiếu các trường bắt buộc: Chẩn đoán, Kết quả xét nghiệm, Trạng thái hoặc ID cuộc hẹn');
    }
    if (isNaN(data.DoctorId) || isNaN(data.PatientId)) {
        throw new Error('ID bác sĩ hoặc ID bệnh nhân không hợp lệ');
    }
    return data;
}

// Gửi cập nhật lên API
async function updateMedicalRecord() {
    const form = document.getElementById('medicalRecordForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
        return;
    }
    try {
        const formData = getFormData();
        const success = await updateMedicalRecordData(formData);
        if (success) {
            showNotification('Cập nhật hồ sơ bệnh án thành công', 'success');
            setTimeout(() => goBackToMedicalRecords(), 2000);
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật hồ sơ:', error);
        showNotification('Lỗi khi cập nhật hồ sơ: ' + error.message, 'error');
    }
}

async function updateMedicalRecordData(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/medical-record/update/${currentRecordId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMsg = 'Lỗi không xác định';
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.errors) {
                    const validationErrors = Object.entries(errorJson.errors)
                        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                        .join('\n');
                    errorMsg = `Lỗi xác thực:\n${validationErrors}`;
                } else {
                    errorMsg = errorJson.message || errorJson.title || errorText;
                }
            } catch {
                errorMsg = errorText;
            }
            throw new Error(`HTTP ${response.status}: ${errorMsg}`);
        }
        return true;
    } catch (error) {
        throw error;
    }
}

// Quay lại danh sách hồ sơ bệnh án
function goBackToMedicalRecords() {
    const params = new URLSearchParams({
        patientId: currentPatientId,
        patientName: currentPatientName
    });
    window.location.href = `./patient-medical-records.html?${params.toString()}`;
}

// Notification function
function showNotification(message, type = 'info') {
    const alertClass = type === 'error' ? 'danger' : type;
    const notification = document.createElement('div');
    notification.className = `alert alert-${alertClass} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 350px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    let icon = '';
    switch(type) {
        case 'success': icon = '<i class="fas fa-check-circle me-2"></i>'; break;
        case 'error': 
        case 'danger': icon = '<i class="fas fa-exclamation-triangle me-2"></i>'; break;
        case 'warning': icon = '<i class="fas fa-exclamation-circle me-2"></i>'; break;
        case 'info': 
        default: icon = '<i class="fas fa-info-circle me-2"></i>'; break;
    }
    notification.innerHTML = `
        ${icon}${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
}
