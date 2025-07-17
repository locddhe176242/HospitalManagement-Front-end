// Unified Registration Form Handler
class UnifiedRegistrationHandler {
    constructor() {
        this.initializeEventListeners();
        this.loadUserData();
        this.restoreFormData();
        
        // Lắng nghe sự kiện khi tab được active để khôi phục dữ liệu
        this.setupTabActivationListener();
    }

    initializeEventListeners() {
        // Lắng nghe thay đổi loại đăng ký
        document.addEventListener('change', (event) => {
            if (event.target.name === 'registrationType') {
                this.handleRegistrationTypeChange(event.target.value);
            }
        });

        // Khởi tạo flatpickr cho ngày sinh
        this.initializeDatePicker();
        
        // Xử lý nút "Tiếp theo"
        this.setupNextButtonHandler();
    }

    handleRegistrationTypeChange(type) {
        const selfInfoAlert = document.getElementById('selfInfoAlert');
        const emailField = document.getElementById('emailField');
        const fullName = document.getElementById('fullName');
        const email = document.getElementById('email');
        const cccd = document.getElementById('cccd');
        const phone = document.getElementById('phone');
        const dob = document.getElementById('dob');
        const genderRadios = document.querySelectorAll('input[name="gender"]');

        if (type === 'self') {
            // Lưu dữ liệu hiện tại trước khi chuyển đổi
            this.saveFormData();
            
            // Hiển thị thông báo và trường email
            if (selfInfoAlert) selfInfoAlert.style.display = 'block';
            if (emailField) emailField.style.display = 'block';
            
            // Tự động điền thông tin người dùng
            this.populateUserData();
            
            // Khóa các trường không cho sửa
            this.setFieldsReadonly(true);
            
        } else {
            // Lưu dữ liệu hiện tại trước khi chuyển đổi
            this.saveFormData();
            
            // Ẩn thông báo và trường email
            if (selfInfoAlert) selfInfoAlert.style.display = 'none';
            if (emailField) emailField.style.display = 'none';
            
            // Khôi phục dữ liệu đã lưu trước đó (nếu có)
            const savedData = sessionStorage.getItem('patientFormData');
            if (savedData) {
                try {
                    const formData = JSON.parse(savedData);
                    if (formData.registrationType === 'family') {
                        // Khôi phục dữ liệu cho đăng ký người thân
                        if (formData.fullName) fullName.value = formData.fullName;
                        if (formData.phone) phone.value = formData.phone;
                        if (formData.cccd) cccd.value = formData.cccd;
                        if (formData.dob) dob.value = formData.dob;
                        if (formData.gender) {
                            const genderRadio = document.querySelector(`input[name="gender"][value="${formData.gender}"]`);
                            if (genderRadio) genderRadio.checked = true;
                        }
                    } else {
                        // Xóa dữ liệu nếu trước đó là đăng ký cho bản thân
                        this.clearFormData();
                    }
                } catch (error) {
                    console.error('Error restoring family data:', error);
                    this.clearFormData();
                }
            } else {
                // Xóa dữ liệu nếu không có dữ liệu đã lưu
                this.clearFormData();
            }
            
            // Mở khóa các trường
            this.setFieldsReadonly(false);
        }
    }

    async loadUserData() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('Không có token, bỏ qua việc load user data');
                return;
            }

            const response = await fetch('/api/appointment/user-info', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('User data loaded:', data);
                
                if (data.data) {
                    // Lưu user data vào sessionStorage để sử dụng sau
                    sessionStorage.setItem('userData', JSON.stringify(data.data));
                }
            } else {
                console.error('Failed to load user data:', response.status);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    populateUserData() {
        const userData = sessionStorage.getItem('userData');
        if (!userData) {
            console.log('Không có user data để điền');
            return;
        }

        try {
            const user = JSON.parse(userData);
            console.log('Populating form with user data:', user);

            // Điền thông tin vào form
            const fullName = document.getElementById('fullName');
            const email = document.getElementById('email');
            const emailRelative = document.getElementById('emailRelative');
            const cccd = document.getElementById('cccd');
            const phone = document.getElementById('phone');
            const dob = document.getElementById('dob');

            // Ghép họ và tên
            if (fullName && user.firstName && user.lastName) {
                fullName.value = `${user.lastName} ${user.firstName}`;
            } else if (fullName && user.firstName) {
                fullName.value = user.firstName;
            }

            if (email && user.email) email.value = user.email;
            if (emailRelative && user.email) emailRelative.value = user.email;
            if (cccd && user.cccd) cccd.value = user.cccd;
            if (phone && user.phone) phone.value = user.phone;
            
            // Xử lý ngày sinh
            if (dob && user.dob) {
                // Chuyển đổi format ngày nếu cần
                const date = new Date(user.dob);
                if (!isNaN(date.getTime())) {
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();
                    dob.value = `${day}/${month}/${year}`;
                }
            }

            // Xử lý giới tính
            if (user.gender) {
                const genderRadio = document.querySelector(`input[name="gender"][value="${user.gender}"]`);
                if (genderRadio) {
                    genderRadio.checked = true;
                }
            }
        } catch (e) {
            console.error('Lỗi khi điền user data:', e);
        }
    }

    setFieldsReadonly(readonly) {
        const fields = ['fullName', 'email', 'cccd', 'phone'];
        const genderRadios = document.querySelectorAll('input[name="gender"]');
        const dob = document.getElementById('dob');

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.readOnly = readonly;
                if (readonly) {
                    field.style.backgroundColor = '#f8f9fa';
                    field.style.cursor = 'not-allowed';
                } else {
                    field.style.backgroundColor = '';
                    field.style.cursor = '';
                }
            }
        });

        // Xử lý radio buttons giới tính
        genderRadios.forEach(radio => {
            radio.disabled = readonly;
        });

        // Xử lý ngày sinh
        if (dob) {
            if (readonly) {
                dob.readOnly = true;
                dob.style.backgroundColor = '#f8f9fa';
                dob.style.cursor = 'not-allowed';
                // Disable flatpickr nếu có
                if (dob._flatpickr) {
                    dob._flatpickr.disable();
                }
            } else {
                dob.readOnly = false;
                dob.style.backgroundColor = '';
                dob.style.cursor = '';
                // Enable flatpickr nếu có
                if (dob._flatpickr) {
                    dob._flatpickr.enable();
                }
            }
        }
    }

    clearFormData() {
        const fields = ['fullName', 'email', 'cccd', 'phone', 'dob'];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
            }
        });

        // Xóa chọn giới tính
        const genderRadios = document.querySelectorAll('input[name="gender"]');
        genderRadios.forEach(radio => {
            radio.checked = false;
        });
    }

    initializeDatePicker() {
        const dobInput = document.getElementById('dob');
        if (dobInput && !dobInput._flatpickr) {
            flatpickr(dobInput, {
                dateFormat: "d/m/Y",
                maxDate: "today",
                locale: "vi",
                allowInput: true,
                clickOpens: true
            });
        }
    }

    setupNextButtonHandler() {
        // Lắng nghe sự kiện click trên nút "Tiếp theo"
        document.addEventListener('click', (event) => {
            if (event.target.closest('#next-btn-self')) {
                event.preventDefault();
                event.stopPropagation();
                
                // Kiểm tra validation
                if (this.validateForm()) {
                    // Chuyển sang tab tiếp theo
                    this.goToNextStep();
                }
            }
        });

        // Lắng nghe sự kiện click trên nút "Quay lại"
        document.addEventListener('click', (event) => {
            if (event.target.closest('button.back')) {
                event.preventDefault();
                event.stopPropagation();
                
                // Lưu dữ liệu form trước khi quay lại
                this.saveFormData();
                
                // Chuyển về tab trước đó
                this.goToPreviousStep();
            }
        });
    }

    validateForm() {
        const form = document.querySelector('.py-5.px-4.bg-primary-subtle form');
        if (!form) return false;

        const registrationType = form.querySelector('input[name="registrationType"]:checked')?.value;
        const fullName = document.getElementById('fullName')?.value.trim();
        const phone = document.getElementById('phone')?.value.trim();
        const cccd = document.getElementById('cccd')?.value.trim();
        const dob = document.getElementById('dob')?.value.trim();
        const gender = form.querySelector('input[name="gender"]:checked')?.value;

        // Kiểm tra loại đăng ký
        if (!registrationType) {
            return false;
        }

        // Kiểm tra các trường bắt buộc
        if (!fullName) {
            return false;
        }

        if (!phone) {
            return false;
        }
        // Kiểm tra format số điện thoại
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return false;
        }

        if (!cccd) {
            return false;
        }
        // Kiểm tra format CCCD
        const cccdRegex = /^\d{12}$/;
        if (!cccdRegex.test(cccd)) {
            return false;
        }

        if (!dob) {
            return false;
        }
        // Kiểm tra format ngày sinh
        const dobRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dobRegex.test(dob)) {
            return false;
        }
        // Kiểm tra ngày sinh không được lớn hơn ngày hiện tại
        const dobParts = dob.split('/');
        const dobDate = new Date(dobParts[2], dobParts[1] - 1, dobParts[0]);
        const today = new Date();
        if (dobDate > today) {
            return false;
        }

        if (!gender) {
            return false;
        }

        // Kiểm tra email nếu là đăng ký cho bản thân
        if (registrationType === 'self') {
            const email = document.getElementById('email')?.value.trim();
            if (!email) {
                return false;
            }
            // Kiểm tra format email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return false;
            }
        }

        return true;
    }

    goToNextStep() {
        // Lưu dữ liệu form vào sessionStorage
        this.saveFormData();
        // Đã xóa hiển thị thông báo thành công
        // Chuyển sang tab tiếp theo
        const currentTab = document.querySelector('.appointment-tab-content.appointment-content-active');
        if (currentTab) {
            const nextTab = currentTab.nextElementSibling;
            if (nextTab && nextTab.classList.contains('appointment-tab-content')) {
                // Ẩn tab hiện tại
                currentTab.classList.remove('appointment-content-active');
                // Hiển thị tab tiếp theo
                nextTab.classList.add('appointment-content-active');
                // Cập nhật confirmation display
                if (window.appointmentConfirmation) {
                    setTimeout(() => {
                        window.appointmentConfirmation.updateConfirmationDisplay();
                    }, 100);
                }
            }
        }
    }

    goToPreviousStep() {
        // Chuyển về tab trước đó
        const currentTab = document.querySelector('.appointment-tab-content.appointment-content-active');
        if (currentTab) {
            const previousTab = currentTab.previousElementSibling;
            if (previousTab && previousTab.classList.contains('appointment-tab-content')) {
                // Ẩn tab hiện tại
                currentTab.classList.remove('appointment-content-active');
                // Hiển thị tab trước đó
                previousTab.classList.add('appointment-content-active');
            }
        }
    }

    saveFormData() {
        const form = document.querySelector('.py-5.px-4.bg-primary-subtle form');
        if (!form) return;

        const formData = {
            registrationType: form.querySelector('input[name="registrationType"]:checked')?.value,
            fullName: document.getElementById('fullName')?.value.trim(),
            email: document.getElementById('email')?.value.trim(),
            phone: document.getElementById('phone')?.value.trim(),
            cccd: document.getElementById('cccd')?.value.trim(),
            dob: document.getElementById('dob')?.value.trim(),
            gender: form.querySelector('input[name="gender"]:checked')?.value
        };

        sessionStorage.setItem('patientFormData', JSON.stringify(formData));
    }

    restoreFormData() {
        const savedData = sessionStorage.getItem('patientFormData');
        if (!savedData) return;

        try {
            const formData = JSON.parse(savedData);
            const form = document.querySelector('.py-5.px-4.bg-primary-subtle form');
            if (!form) return;

            // Khôi phục loại đăng ký
            const registrationTypeRadio = form.querySelector(`input[name="registrationType"][value="${formData.registrationType}"]`);
            if (registrationTypeRadio) {
                registrationTypeRadio.checked = true;
                // Trigger change event để cập nhật UI
                this.handleRegistrationTypeChange(formData.registrationType);
            }

            // Khôi phục các trường input
            if (formData.fullName) document.getElementById('fullName').value = formData.fullName;
            if (formData.email) document.getElementById('email').value = formData.email;
            if (formData.phone) document.getElementById('phone').value = formData.phone;
            if (formData.cccd) document.getElementById('cccd').value = formData.cccd;
            if (formData.dob) document.getElementById('dob').value = formData.dob;

            // Khôi phục giới tính
            if (formData.gender) {
                const genderRadio = form.querySelector(`input[name="gender"][value="${formData.gender}"]`);
                if (genderRadio) {
                    genderRadio.checked = true;
                }
            }

        } catch (error) {
            console.error('Error restoring form data:', error);
        }
    }

    setupTabActivationListener() {
        // Lắng nghe sự kiện khi tab được active
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('appointment-tab-content') && 
                        target.classList.contains('appointment-content-active')) {
                        
                        // Kiểm tra xem có phải tab đăng ký thông tin bệnh nhân không
                        if (target.querySelector('.py-5.px-4.bg-primary-subtle form')) {
                            // Khôi phục dữ liệu form
                            setTimeout(() => {
                                this.restoreFormData();
                            }, 100);
                        }
                    }
                }
            });
        });

        // Quan sát tất cả các tab content
        document.querySelectorAll('.appointment-tab-content').forEach(tab => {
            observer.observe(tab, { 
                attributes: true, 
                attributeFilter: ['class'] 
            });
        });
    }
}

// Khởi tạo handler khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.unifiedRegistration = new UnifiedRegistrationHandler();
});

// Export để sử dụng global
window.UnifiedRegistrationHandler = UnifiedRegistrationHandler; 