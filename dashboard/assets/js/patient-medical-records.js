const API_BASE_URL = 'http://localhost:5082';
let currentPatientId = null;
let currentPatientName = '';
let medicalRecords = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DEBUGGING INFO ===');
    console.log('API_BASE_URL:', API_BASE_URL);
    
    // Lấy patientId từ URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentPatientId = urlParams.get('patientId');
    currentPatientName = urlParams.get('patientName') || 'Bệnh nhân';

    console.log('URL Params:', {
        patientId: currentPatientId,
        patientName: currentPatientName
    });

    if (!currentPatientId) {
        showNotification('Thiếu thông tin bệnh nhân', 'error');
        setTimeout(() => {
            window.history.back();
        }, 2000);
        return;
    }

    loadPatientInfo();
    loadMedicalRecords();
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

        // Gọi API để lấy thông tin chi tiết - SỬA ENDPOINT
        const response = await fetch(`${API_BASE_URL}/api/Patient/FindById/${currentPatientId}`, {
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
                <div class="col-6">
                    <small class="text-muted">Giới tính:</small>
                    <p class="mb-1">${patientData.gender || 'N/A'}</p>
                </div>
                <div class="col-6">
                    <small class="text-muted">Ngày sinh:</small>
                    <p class="mb-1">${patientData.dob ? new Date(patientData.dob).toLocaleDateString('vi-VN') : 'N/A'}</p>
                </div>
                <div class="col-6">
                    <small class="text-muted">Điện thoại:</small>
                    <p class="mb-1">${patientData.phone || 'N/A'}</p>
                </div>
                <div class="col-6">
                    <small class="text-muted">CCCD:</small>
                    <p class="mb-1">${patientData.cccd || 'N/A'}</p>
                </div>
            </div>
        </div>
    `;
}

// Load medical records
async function loadMedicalRecords() {
    try {
        console.log('Loading medical records for patient:', currentPatientId);
        
        const response = await fetch(`${API_BASE_URL}/api/medical-records/patient/${currentPatientId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        // SỬA THEO ĐÚNG RESPONSE STRUCTURE TỪ API
        let recordsArray = [];
        let totalCount = 0;
        
        if (data && data.records && Array.isArray(data.records)) {
            // API trả về đúng format: { totalCount: 1, records: [...] }
            recordsArray = data.records;
            totalCount = data.totalCount || data.records.length;
        } else if (Array.isArray(data)) {
            // Fallback: API trả về array trực tiếp
            recordsArray = data;
            totalCount = data.length;
        } else {
            console.warn('No valid records found in response:', data);
            recordsArray = [];
            totalCount = 0;
        }

        medicalRecords = recordsArray;
        
        displayMedicalRecords(medicalRecords);
        updateRecordCount(totalCount);

    } catch (error) {
        console.error('Error loading medical records:', error);
        showError('Lỗi khi tải danh sách báo cáo y tế: ' + error.message);
    }
}

// Display medical records
function displayMedicalRecords(records) {
    const tbody = document.getElementById('medicalRecordsTableBody');
    tbody.innerHTML = '';

    if (!Array.isArray(records)) {
        console.error('displayMedicalRecords: records is not an array:', records);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
                    <p class="text-muted">Dữ liệu không đúng định dạng</p>
                    <button class="btn btn-sm btn-outline-primary" onclick="refreshRecords()">
                        <i class="fas fa-sync-alt"></i> Thử lại
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-file-medical fa-2x text-muted mb-2"></i>
                    <p class="text-muted">Chưa có báo cáo y tế nào</p>
                </td>
            </tr>
        `;
        return;
    }

    // RENDER DỮ LIỆU THEO ĐÚNG FIELD TỪ API
    records.forEach((record, index) => {
        // SỬA THEO ĐÚNG FIELD TỪ API RESPONSE
        const createDate = new Date(record.createDate || Date.now());
        const formattedDate = createDate.toLocaleDateString('vi-VN');
        const formattedTime = createDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
        const statusClass = getStatusClass(record.status);
        const statusText = getStatusText(record.status);
        
        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div>
                        <strong>${formattedDate}</strong>
                        <br><small class="text-muted">${formattedTime}</small>
                    </div>
                </td>
                <td>${record.doctorName || 'N/A'}</td>
                <td>
                    <div class="text-truncate" style="max-width: 200px;" title="${record.diagnosis || 'N/A'}">
                        ${record.diagnosis || 'N/A'}
                    </div>
                </td>
                <td>${record.diseaseName || 'N/A'}</td>
                <td>
                    <span class="badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="viewMedicalRecordDetail(${record.id})" title="Xem chi tiết báo cáo">
                        <i class="fas fa-file-medical me-1"></i>
                        Chi tiết
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// View medical record detail - CHUYỂN SANG TRANG RIÊNG
function viewMedicalRecordDetail(recordId) {
    // Chuyển đến trang chi tiết medical record
    window.location.href = `./medical-record-detail.html?recordId=${recordId}`;
}

// Refresh records
function refreshRecords() {
    loadMedicalRecords();
}

// Update record count
function updateRecordCount(count) {
    document.getElementById('recordCount').textContent = `Tổng: ${count} báo cáo`;
}

// Show error in table
function showError(message) {
    const tbody = document.getElementById('medicalRecordsTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
                <p class="text-muted">${message}</p>
                <button class="btn btn-sm btn-outline-primary" onclick="refreshRecords()">
                    <i class="fas fa-sync-alt"></i> Thử lại
                </button>
            </td>
        </tr>
    `;
    document.getElementById('recordCount').textContent = 'Lỗi tải dữ liệu';
}

function createNewMedicalRecord() {
    const params = new URLSearchParams({
        patientId: currentPatientId,
        patientName: currentPatientName,
        mode: 'create'
    });
    
    window.location.href = `./medical-record.html?${params.toString()}`;
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
        case 'closed': return 'Đã đóng';  // API có "Closed"
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