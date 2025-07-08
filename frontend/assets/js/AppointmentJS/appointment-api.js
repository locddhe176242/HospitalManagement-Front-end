// Appointment API Handler
class AppointmentAPI {
    constructor() {
        // Sử dụng config chung
        this.baseURL = window.API_CONFIG ? window.API_CONFIG.BASE_URL : 'https://localhost:7097';
        this.endpoint = window.API_CONFIG ? window.API_CONFIG.ENDPOINTS.APPOINTMENT_CREATE : '/api/Appointment/create';
        this.initializeConfirmButton();
        console.log('🔗 API Base URL:', this.baseURL, 'Endpoint:', this.endpoint);
    }

    initializeConfirmButton() {
        document.addEventListener('DOMContentLoaded', () => {
            this.attachConfirmButtonListener();
        });
    }

    attachConfirmButtonListener() {
        // Tìm nút xác nhận trong step cuối cùng
        const confirmButton = this.findConfirmButton();
        
        if (confirmButton) {
            // Remove existing listeners để tránh duplicate
            confirmButton.removeEventListener('click', this.handleConfirmClick.bind(this));
            confirmButton.addEventListener('click', this.handleConfirmClick.bind(this));
            console.log('✅ Confirm button listener attached');
        } else {
            console.log('❌ Confirm button not found, retrying...');
            // Thử lại sau 1 giây
            setTimeout(() => this.attachConfirmButtonListener(), 1000);
        }
    }

    findConfirmButton() {
        // Tìm nút trong step xác nhận (step cuối)
        const confirmationStep = document.querySelector('.appointment-tab-content:nth-last-child(2)');
        if (confirmationStep) {
            const confirmButton = confirmationStep.querySelector('.next');
            // Kiểm tra xem có text "Xác Nhận" không
            if (confirmButton && confirmButton.textContent.includes('Xác Nhận')) {
                return confirmButton;
            }
        }
        
        // Fallback: tìm bất kỳ nút nào có text "Xác Nhận"
        const allButtons = document.querySelectorAll('button');
        for (let button of allButtons) {
            if (button.textContent.includes('Xác Nhận')) {
                return button;
            }
        }
        
        return null;
    }

    async handleConfirmClick(event) {
        console.log('🔘 Confirm button clicked!');
        
        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();

        try {
            // Hiển thị loading
            this.showLoading(event.target);

            // Thu thập dữ liệu appointment
            const appointmentData = this.collectAppointmentData();
            console.log('📋 Collected appointment data:', appointmentData);

            // Validate dữ liệu
            const validation = this.validateAppointmentData(appointmentData);
            if (!validation.isValid) {
                this.hideLoading(event.target);
                return;
            }

            // Tạo request payload
            const requestPayload = this.buildRequestPayload(appointmentData);
            console.log('📤 Request payload:', requestPayload);

            // Gọi API
            const response = await this.createAppointment(requestPayload);
            console.log('✅ API Response:', response);

            // Xử lý response thành công
            if (response.success) {
                this.handleSuccess(response);
            } else {
                this.showError(response.message || 'Có lỗi xảy ra khi đặt lịch hẹn');
            }

        } catch (error) {
            console.error('❌ Error creating appointment:', error);
            // Không hiển thị alert lỗi cho người dùng nữa
            // this.showError('Có lỗi xảy ra khi đặt lịch hẹn. Vui lòng thử lại!');
        } finally {
            this.hideLoading(event.target);
        }
    }

    collectAppointmentData() {
        // Sử dụng AppointmentConfirmationHandler nếu có
        if (window.appointmentConfirmation) {
            return window.appointmentConfirmation.collectAppointmentData();
        }
        
        // Fallback: thu thập dữ liệu trực tiếp
        return this.collectDataDirectly();
    }

    collectDataDirectly() {
        try {
            console.log('🔍 Collecting appointment data directly...');
            
            // Lấy clinic đã chọn
            const selectedClinic = document.querySelector('input[name="clinicRadios"]:checked');
            const clinic = selectedClinic ? {
                id: parseInt(selectedClinic.value),
                name: selectedClinic.dataset.name || 'Unknown Clinic'
            } : null;
            console.log('🏥 Selected clinic:', clinic);

            // Lấy doctor đã chọn
            const selectedDoctor = document.querySelector('input[name="doctorRadios"]:checked');
            const doctor = selectedDoctor ? {
                id: parseInt(selectedDoctor.value),
                name: selectedDoctor.dataset.name || 'Unknown Doctor'
            } : null;
            console.log('👨‍⚕️ Selected doctor:', doctor);

            // Lấy service đã chọn
            const selectedService = document.querySelector('input[name="serviceRadios"]:checked');
            const service = selectedService ? {
                id: parseInt(selectedService.value),
                name: selectedService.dataset.name || 'Unknown Service'
            } : null;
            console.log('🔧 Selected service:', service);

            // Lấy ngày giờ
            const dateInput = document.querySelector('.flatpickrdate-appointment, .inline_flatpickr');
            const selectedTime = sessionStorage.getItem('selectedTime');
            console.log('📅 Date input value:', dateInput ? dateInput.value : 'none');
            console.log('⏰ Selected time:', selectedTime);
            
            // Lấy thông tin bệnh nhân từ tab active
            const activeTab = document.querySelector('.tab-pane.active');
            const patient = this.getPatientFromActiveTab(activeTab);
            console.log('👤 Patient data:', patient);

            // Lấy note
            const noteInput = document.querySelector('.appointment-note');
            const note = noteInput ? noteInput.value.trim() : '';
            console.log('📝 Note:', note);

            const result = {
                clinic,
                doctor, 
                service,
                date: dateInput ? dateInput.value : null,
                startTime: selectedTime,
                patient,
                note
            };
            
            console.log('📋 Final collected data:', result);
            return result;
        } catch (error) {
            console.error('Error collecting data directly:', error);
            return {};
        }
    }

    getPatientFromActiveTab(activeTab) {
        if (!activeTab) return null;

        const form = activeTab.querySelector('form');
        if (!form) return null;

        // Lấy dữ liệu từ form
        const fullNameInput = form.querySelector('input[placeholder*="tên"], input[placeholder*="database"]');
        const emailInput = form.querySelector('input[type="email"]');
        const cccdInput = form.querySelector('input[placeholder*="CCCD"]');
        const phoneInput = form.querySelector('input[placeholder*="điện thoại"], input[type="tel"]');
        const birthdateInput = form.querySelector('.flatpickrdate');
        
        // Lấy giới tính
        let gender = null;
        const genderInput = form.querySelector('input[name="gender"]:checked, input[name="genderSelf"]:checked');
        if (genderInput) gender = genderInput.value;

        return {
            name: fullNameInput ? fullNameInput.value.trim() : '',
            email: emailInput ? emailInput.value.trim() : '',
            cccd: cccdInput ? cccdInput.value.trim() : '',
            phone: phoneInput ? phoneInput.value.trim() : '',
            dob: birthdateInput ? birthdateInput.value.trim() : '',
            gender: gender,
            address: '' // Có thể thêm sau
        };
    }

    validateAppointmentData(data) {
        // XÓA TOÀN BỘ THÔNG BÁO LIÊN QUAN ĐẾN VALIDATION ĐẶT LỊCH
        // 1. validateAppointmentData: Xóa tất cả errors.push('...')
        // 2. handleConfirmClick: Xóa this.showError(validation.message) và this.showError(response.message...)
        return {
            isValid: true, // Always true now
            message: '' // Always empty now
        };
    }

    buildRequestPayload(data) {
        // Chuyển đổi ngày từ DD/MM/YYYY sang yyyy-MM-dd
        let appointmentDate = data.date;
        if (appointmentDate && appointmentDate.includes('/')) {
            const [day, month, year] = appointmentDate.split('/');
            appointmentDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // Nếu có ký tự T thì chỉ lấy phần yyyy-MM-dd
        if (appointmentDate && appointmentDate.includes('T')) {
            appointmentDate = appointmentDate.split('T')[0];
        }
        // Chuyển đổi giờ thành TimeSpan (HH:mm:ss)
        let startTime = '07:30:00'; // default
        if (data.startTime) {
            const timeStr = data.startTime.trim();
            if (/^\d{2}:\d{2}$/.test(timeStr)) {
                startTime = `${timeStr}:00`;
            } else if (/^\d{1,2}:\d{1,2}$/.test(timeStr)) {
                // Trường hợp 7:5 => 07:05:00
                const [h, m] = timeStr.split(':');
                startTime = `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
            } else if (/^\d{4}$/.test(timeStr)) {
                // Trường hợp 0730 => 07:30:00
                startTime = `${timeStr.substring(0,2)}:${timeStr.substring(2,4)}:00`;
            }
        }
        // Log lại dữ liệu gửi đi để debug
        console.log('[DEBUG] Payload gửi lên backend:', {
            clinicId: data.clinic.id,
            doctorId: data.doctor.id,
            serviceId: data.service.id,
            appointmentDate,
            startTime,
            note: data.note || '',
            patientInfo: data.patient
        });

        // Chuyển đổi ngày sinh từ DD/MM/YYYY sang yyyy-MM-ddTHH:mm:ss
        let dob = data.patient.dob;
        if (dob && dob.includes('/')) {
            const [day, month, year] = dob.split('/');
            dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`;
        }

        // Đảm bảo các trường nullable luôn có
        const insuranceNumber = data.patient.insuranceNumber || null;
        const allergies = data.patient.allergies || null;
        const bloodType = data.patient.bloodType || null;

        // Đảm bảo trường CCCD viết hoa đúng
        const CCCD = data.patient.cccd || '';

        return {
            clinicId: data.clinic.id,
            doctorId: data.doctor.id,
            serviceId: data.service.id,
            appointmentDate: appointmentDate,
            // shift: shift, // BỎ TRƯỜNG shift
            startTime: startTime,
            note: data.note || '',
            patientInfo: {
                name: data.patient.name,
                phone: data.patient.phone,
                gender: data.patient.gender || 'male',
                dob: dob,
                CCCD: CCCD,
                address: data.patient.address || '',
                insuranceNumber: insuranceNumber,
                allergies: allergies,
                bloodType: bloodType
            }
        };
    }

    async createAppointment(payload) {
        const token = localStorage.getItem('kivicare_token');
        const url = this.baseURL + this.endpoint;
        const headers = window.API_CONFIG ? window.API_CONFIG.getAuthHeaders(token) : {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
        console.log(`📤 Calling ${url} with payload:`, payload);
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        console.log('📡 API Response status:', response.status);
        const responseData = await response.json();
        console.log('📡 API Response data:', responseData);
        if (!response.ok) {
            // Nếu server trả về error message trong response
            const errorMessage = responseData.message || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }
        return responseData;
    }

    handleSuccess(response) {
        console.log('🎉 Appointment created successfully!', response);
        
        // Lưu thông tin appointment để hiển thị
        if (response.data) {
            sessionStorage.setItem('appointmentResult', JSON.stringify(response.data));
        }

        // Hiển thị thông báo thành công
        this.showSuccessMessage('Đặt lịch hẹn thành công!');

        // Chuyển đến step thành công sau 1.5 giây
        setTimeout(() => {
            this.goToSuccessStep();
        }, 1500);
    }

    goToSuccessStep() {
        // Trigger click nút next để chuyển đến step cuối
        const confirmButton = this.findConfirmButton();
        if (confirmButton) {
            // Remove event listener tạm thời để tránh loop
            confirmButton.removeEventListener('click', this.handleConfirmClick.bind(this));
            
            // Chuyển step bằng logic jQuery hiện tại
            jQuery("#appointment-tab-list").find(".active").addClass("done");
            jQuery(confirmButton).parents(".appointment-content-active").fadeOut("slow", function () {
                jQuery(this).next(".appointment-content-active").fadeIn("slow");
            });
        }
    }

    showLoading(button) {
        button.disabled = true;
        button.style.opacity = '0.7';
        const textHolder = button.querySelector('.iq-btn-text-holder');
        if (textHolder) {
            textHolder.textContent = 'Đang xử lý...';
        }
    }

    hideLoading(button) {
        button.disabled = false;
        button.style.opacity = '1';
        const textHolder = button.querySelector('.iq-btn-text-holder');
        if (textHolder) {
            textHolder.textContent = 'Xác Nhận';
        }
    }

    showError(message) {
        // Tạo alert bootstrap
        const alertHtml = `
            <div class="alert alert-danger alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                <strong>Lỗi!</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Remove existing alerts
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
        
        // Add new alert
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert');
            if (alert) alert.remove();
        }, 5000);
    }

    showSuccessMessage(message) {
        // Tạo alert thành công
        const alertHtml = `
            <div class="alert alert-success alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                <strong>Thành công!</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Remove existing alerts
        document.querySelectorAll('.alert').forEach(alert => alert.remove());
        
        // Add new alert
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert');
            if (alert) alert.remove();
        }, 3000);
    }
}

// Khởi tạo khi DOM ready
const appointmentAPI = new AppointmentAPI();

// Export để sử dụng global
window.AppointmentAPI = AppointmentAPI;
window.appointmentAPI = appointmentAPI; 