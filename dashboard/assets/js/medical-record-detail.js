const API_BASE_URL = 'https://localhost:7097';
let currentRecordId = null;
let medicalRecordData = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Lấy recordId từ URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentRecordId = urlParams.get('recordId');

    if (!currentRecordId) {
        showError('Thiếu thông tin ID báo cáo y tế');
        setTimeout(() => {
            window.history.back();
        }, 3000);
        return;
    }

    loadMedicalRecordDetail();
});

// Load medical record detail
async function loadMedicalRecordDetail() {
    try {
        showLoading();

        const response = await fetch(`${API_BASE_URL}/api/medical-record/view/${currentRecordId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Không tìm thấy báo cáo y tế với ID này');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        medicalRecordData = data;

        // Hiển thị chi tiết hồ sơ
        displayMedicalRecordDetail(data);

        // Nếu có patientId, gọi API lấy chi tiết bệnh nhân
        if (data.patientId) {
            await loadPatientInfo(data.patientId);
        }

    } catch (error) {
        console.error('Error loading medical record detail:', error);
        showError(error.message);
    }
}

// Load patient info từ API riêng
async function loadPatientInfo(patientId) {
    try {
        document.getElementById('patientInfo').innerHTML = `
            <div class="col-md-12 text-center">
                <small class="text-muted">Đang tải thông tin bệnh nhân...</small>
            </div>
        `;

        const response = await fetch(`${API_BASE_URL}/api/Patient/findId/${patientId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const patientData = await response.json();
            displayPatientInfo(patientData);
        } else {
            document.getElementById('patientInfo').innerHTML = `
                <div class="col-md-12 text-center text-danger">
                    Không tìm thấy thông tin bệnh nhân
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('patientInfo').innerHTML = `
            <div class="col-md-12 text-center text-danger">
                Lỗi khi tải thông tin bệnh nhân
            </div>
        `;
    }
}

// Hiển thị thông tin bệnh nhân chi tiết
function displayPatientInfo(patientData) {
    document.getElementById('patientInfo').innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-2">
                <span class="text-muted">Tên bệnh nhân:</span>
                <div>${patientData.name || patientData.fullName || ''}</div>
            </div>
            <div class="col-md-6 mb-2">
                <span class="text-muted">Ngày sinh:</span>
                <div>${patientData.dob ? new Date(patientData.dob).toLocaleDateString() : (patientData.dateOfBirth ? new Date(patientData.dateOfBirth).toLocaleDateString() : '')}</div>
            </div>
            <div class="col-md-6 mb-2">
                <span class="text-muted">Giới tính:</span>
                <div>${getGenderText(patientData.gender)}</div>
            </div>
            <div class="col-md-6 mb-2">
                <span class="text-muted">Điện thoại:</span>
                <div>${patientData.phone || patientData.phoneNumber || ''}</div>
            </div>
            <div class="col-md-6 mb-2">
                <span class="text-muted">CCCD:</span>
                <div>${patientData.cccd || patientData.identityNumber || patientData.identityCard || ''}</div>
            </div>
            <div class="col-md-6 mb-2">
                <span class="text-muted">Địa chỉ nơi ở:</span>
                <div>${patientData.address || ''}</div>
            </div>
        </div>
    `;
}

// Hiển thị chi tiết hồ sơ bệnh án (không render thông tin bệnh nhân ở đây nữa)
function displayMedicalRecordDetail(data) {
    hideLoading();
    showContent();

    // Record Info
    const createDate = new Date(data.createDate);
    const formattedDate = createDate.toLocaleDateString('vi-VN');
    const formattedTime = createDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
    const statusClass = getStatusClass(data.status);
    const statusText = getStatusText(data.status);

    document.getElementById('recordInfo').innerHTML = `
        <div class="detail-row">
            <strong>Mã báo cáo:</strong>
            <span class="float-end">${data.id}</span>
        </div>
        <div class="detail-row">
            <strong>Ngày tạo:</strong>
            <span class="float-end">${formattedDate} ${formattedTime}</span>
        </div>
        <div class="detail-row">
            <strong>Bác sĩ:</strong>
            <span class="float-end">${data.doctorName || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <strong>Trạng thái:</strong>
            <span class="badge ${statusClass} float-end">${statusText}</span>
        </div>
    `;

    // Medical Details
    document.getElementById('medicalDetails').innerHTML = `
        <div class="detail-row">
            <strong>Bệnh:</strong>
            <span class="float-end">${data.diseaseName || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <strong>Chẩn đoán:</strong>
            <span class="float-end">${data.diagnosis || 'Chưa có chẩn đoán'}</span>
        </div>
        <div class="detail-row">
            <strong>ID Cuộc hẹn:</strong>
            <span class="float-end">${data.appointmentId || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <strong>Đơn thuốc:</strong>
            <span class="float-end">
                ${
                    data.prescriptionId
                    ? `<button class="btn btn-sm btn-outline-primary" onclick="viewPrescription(${data.prescriptionId})">Xem đơn thuốc</button>`
                    : '<span class="text-muted">Chưa có</span>'
                }
            </span>
        </div>
    `;

    // Test Results
    document.getElementById('testResults').innerHTML = `
        <div class="p-3 bg-light rounded">
            <pre class="mb-0">${data.testResults || 'Chưa có kết quả xét nghiệm'}</pre>
        </div>
    `;

    // Notes (Show only if exists)
    if (data.notes && data.notes.trim()) {
        document.getElementById('notesCard').style.display = 'block';
        document.getElementById('notes').innerHTML = `
            <div class="p-3 bg-light rounded">
                <p class="mb-0">${data.notes}</p>
            </div>
        `;
    }

    // Signatures
    document.getElementById('patientSignature').textContent = data.patientName || '________________';
    document.getElementById('doctorSignature').textContent = data.doctorName || '________________';

    // Report Date
    document.getElementById('reportDate').textContent = createDate.toLocaleString('vi-VN');
}

// Helper chuyển giới tính sang text
function getGenderText(gender) {
    switch (gender) {
        case 0: return "Nam";
        case 1: return "Nữ";
        case 2: return "Khác";
        default: return gender || "N/A";
    }
}

// Show loading state
function showLoading() {
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('contentSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
}

// Hide loading state
function hideLoading() {
    document.getElementById('loadingSection').style.display = 'none';
}

// Show content
function showContent() {
    document.getElementById('contentSection').style.display = 'block';
    document.getElementById('errorSection').style.display = 'none';
}

// Show error
function showError(message) {
    hideLoading();
    document.getElementById('contentSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

// Retry loading
function retryLoad() {
    loadMedicalRecordDetail();
}

// Print report
function printReport() {
    window.print();
}

// Export to PDF (Future feature)
function exportToPDF() {
    showNotification('Chức năng xuất PDF đang được phát triển', 'info');
}

// Utility functions
function getStatusClass(status) {
    switch(status?.toLowerCase()) {
        case 'open': return 'bg-info text-white';
        case 'inprogress': return 'bg-warning text-dark';
        case 'closed': return 'bg-success text-white';
        case 'cancelled': return 'bg-danger text-white';
        default: return 'bg-secondary text-white';
    }
}

function getStatusText(status) {
    switch(status?.toLowerCase()) {
        case 'open': return 'Đang mở';
        case 'closed': return 'Đã đóng';
        case 'inprogress': return 'Đang xử lý';
        case 'cancelled': return 'Đã hủy';
        default: return status || 'Không xác định';
    }
}

function showNotification(message, type) {
    const alertClass = type === 'error' ? 'danger' : type;
    const notification = document.createElement('div');
    notification.className = `alert alert-${alertClass} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);

}
function viewPrescription(prescriptionId) {
    window.open(`./preDetail.html?id=${prescriptionId}`, '_blank');
}