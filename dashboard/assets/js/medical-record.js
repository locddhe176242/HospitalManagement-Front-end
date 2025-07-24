const API_BASE_URL = 'https://localhost:7097';
let currentPatientId = null;
let currentPatientName = '';
let currentDoctorId = localStorage.getItem('doctorId');
let diseases = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Lấy parameters từ URL
    const urlParams = new URLSearchParams(window.location.search);
    currentPatientId = urlParams.get('patientId');
    currentPatientName = urlParams.get('patientName') || 'Bệnh nhân';
    const appointmentId = urlParams.get('appointmentId');
    const createBtn = document.getElementById('createPrescriptionBtn');
    if (createBtn) {
        createBtn.addEventListener('click', function() {
            window.open(`./prescriptions.html?patientId=${currentPatientId}`, '_blank');
        });
    }

    if (!currentPatientId) {
        showNotification('Thiếu thông tin bệnh nhân', 'error');
        setTimeout(() => {
            window.history.back();
        }, 2000);
        return;
    }

    // Set hidden fields
    document.getElementById('patientId').value = currentPatientId;
    document.getElementById('doctorId').value = currentDoctorId;


    if (appointmentId) {
        document.getElementById('appointmentId').value = appointmentId;
        
    } else {
        document.getElementById('appointmentId').value = '';
    }

    loadPatientInfo();
    loadDiseases();
    setupFormValidation();
    setupCharCounters();

    // Prescription button event
    const btn = document.getElementById('choosePrescriptionBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            window.open(`../frontend/precriptionDetail.html?patientId=${currentPatientId}`, '_blank');
        });
    }
});

// Load patient information
async function loadPatientInfo() {
    try {
        // Hiển thị thông tin cơ bản trước
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

        // Gọi API để lấy thông tin chi tiết
        const response = await fetch(`${API_BASE_URL}/api/Patient/findId/${currentPatientId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const patientData = await response.json();
            displayPatientInfo(patientData);
        }

    } catch (error) {
        console.error('Error loading patient info:', error);
        // Vẫn hiển thị thông tin cơ bản nếu API lỗi
    }
}

// Display patient information
function displayPatientInfo(patientData) {
    document.getElementById('patientInfo').innerHTML = `
        <div class="col-md-8">
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
        <div class="col-md-4">
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

// Load diseases list
async function loadDiseases() {
    try {
        const response = await fetch('https://localhost:7097/api/Disease/get-all');
        if (response.ok) {
            diseases = await response.json();
            populateDiseaseSelect();
        } else {
            showNotification('Lỗi tải danh sách bệnh', 'error');
        }
    } catch (error) {
        showNotification('Không thể kết nối API bệnh', 'error');
    }
}

// Populate disease select
function populateDiseaseSelect() {
    const select = document.getElementById('diseaseSelect');
    
    if (!select) {
        console.error('Disease select element not found!');
        return;
    }
    
    // Xóa options cũ
    select.innerHTML = '<option value="">-- Chọn bệnh --</option>';
    
    // Thêm options từ diseases array
    diseases.forEach(disease => {
        const option = document.createElement('option');
        option.value = disease.id;
        option.textContent = disease.name;
        select.appendChild(option);
    });
    
    console.log(`Populated ${diseases.length} diseases in select`);
    
    // Thêm event listener để log khi user chọn
    select.addEventListener('change', function() {
        const selectedDisease = diseases.find(d => d.id == this.value);
        if (selectedDisease) {
            console.log('Selected disease:', selectedDisease.name);
        }
    });
}

// Setup form validation
function setupFormValidation() {
    const form = document.getElementById('medicalRecordForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (form.checkValidity()) {
            submitForm();
        }
        
        form.classList.add('was-validated');
    });
}

// Setup character counters
function setupCharCounters() {
    const fields = [
        { id: 'diagnosis', counter: 'diagnosisCounter', max: 1000 },
        { id: 'testResults', counter: 'testResultsCounter', max: 2000 },
        { id: 'notes', counter: 'notesCounter', max: 500 }
    ];
    
    fields.forEach(field => {
        const textarea = document.getElementById(field.id);
        const counter = document.getElementById(field.counter);
        
        textarea.addEventListener('input', function() {
            const length = this.value.length;
            counter.textContent = `${length}/${field.max}`;
            
            // Update counter color
            counter.className = 'char-counter';
            if (length > field.max * 0.8) {
                counter.classList.add('warning');
            }
            if (length > field.max * 0.95) {
                counter.classList.remove('warning');
                counter.classList.add('danger');
            }
        });
    });
}

// Save draft
async function saveDraft() {
    const formData = getFormData();
    formData.status = 'Open'; // Draft status
    
    showLoading('Đang lưu nháp...');
    
    try {
        const success = await submitMedicalRecord(formData);
        if (success) {
            showNotification('Đã lưu nháp thành công', 'success');
        }
    } catch (error) {
        showNotification('Lỗi khi lưu nháp: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Submit form
async function submitForm() {
    const form = document.getElementById('medicalRecordForm');
    
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
        
        // Log validation errors
        const invalidFields = form.querySelectorAll(':invalid');
        console.log('Invalid fields:', [...invalidFields].map(field => field.id));
        return;
    }
    
    try {
        const formData = getFormData();
        console.log('Form validation passed, submitting...');
        
        showLoading('Đang lưu hồ sơ bệnh án...');
        
        const success = await submitMedicalRecord(formData);
        if (success) {
            showNotification('Đã tạo hồ sơ bệnh án thành công', 'success');
            setTimeout(() => {
                goBackToMedicalRecords();
            }, 2000);
        }
    } catch (error) {
        console.error('Submit form error:', error);
        showNotification('Lỗi khi tạo hồ sơ: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Get form data
function getFormData() {
    const data = {
        Diagnosis: document.getElementById('diagnosis').value.trim(),
        TestResults: document.getElementById('testResults').value.trim(),
        Notes: document.getElementById('notes').value.trim() || null,
        Status: document.getElementById('status').value,
        DoctorId: parseInt(document.getElementById('doctorId').value),
        PatientId: parseInt(document.getElementById('patientId').value),
        DiseaseId: parseInt(document.getElementById('diseaseSelect').value),
        AppointmentId: parseInt(document.getElementById('appointmentId').value),
        PrescriptionId: document.getElementById('prescriptionId').value ? 
                       parseInt(document.getElementById('prescriptionId').value) : 0
    };

    // Validation
    if (!data.Diagnosis || !data.TestResults || !data.DiseaseId || !data.AppointmentId) {
        throw new Error('Missing required fields');
    }

    return data;
}

// Submit medical record to API
async function submitMedicalRecord(data) {
    try {
        console.log('=== SUBMITTING TO API ===');
        console.log('URL:', `${API_BASE_URL}/api/medical-record/create`);
        console.log('Request data:', JSON.stringify(data, null, 2));
        
        const response = await fetch(`${API_BASE_URL}/api/medical-record/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('=== API ERROR ===');
            console.error('Status:', response.status);
            console.error('Response body:', errorText);
            
            // Try to parse error as JSON
            let errorMsg = 'Lỗi không xác định';
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.errors) {
                    // ASP.NET Core validation errors
                    const validationErrors = Object.entries(errorJson.errors)
                        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                        .join('\n');
                    errorMsg = `Validation errors:\n${validationErrors}`;
                } else {
                    errorMsg = errorJson.message || errorJson.title || errorText;
                }
            } catch {
                errorMsg = errorText;
            }
            
            throw new Error(`HTTP ${response.status}: ${errorMsg}`);
        }

        const result = await response.json();
        console.log('=== API SUCCESS ===');
        console.log('Response data:', result);
        return true;

    } catch (error) {
        console.error('=== SUBMIT ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        throw error;
    }
}

// Navigation functions
function goBack() {
    if (confirm('Bạn có chắc muốn thoát? Dữ liệu chưa lưu sẽ bị mất.')) {
        window.history.back();
    }
}

function goBackToMedicalRecords() {
    const params = new URLSearchParams({
        patientId: currentPatientId,
        patientName: currentPatientName
    });
    window.location.href = `./patient-medical-records.html?${params.toString()}`;
}

// Loading functions
function showLoading(text = 'Đang xử lý...') {
    document.getElementById('loadingText').textContent = text;
    const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
    modal.show();
}

function hideLoading() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
    if (modal) {
        modal.hide();
    }
}

// Notification function
function showNotification(message, type = 'info') {
    // Tạo thông báo Bootstrap alert
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
    
    // Icon theo loại thông báo
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
    
    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('choosePrescriptionBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            window.open(`../frontend/precriptionDetail.html?patientId=${currentPatientId}`, '_blank');
        });
    }
});