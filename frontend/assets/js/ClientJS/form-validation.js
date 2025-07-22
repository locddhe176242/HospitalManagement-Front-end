// SIMPLE AND DIRECT FORM VALIDATION
(function() {
    'use strict';
    
    console.log('=== SIMPLE VALIDATION SCRIPT LOADED ===');
    
    // Kiểm tra CCCD hợp lệ (12 số)
    function isValidCCCD(value) {
        return value && /^\d{12}$/.test(value.trim());
    }
    // Kiểm tra SĐT hợp lệ (bắt đầu bằng 0, đủ 10 số)
    function isValidPhone(value) {
        return value && /^0\d{9}$/.test(value.trim());
    }
    // Kiểm tra tên/họ hợp lệ (chỉ chữ cái và khoảng trắng, 2-50 ký tự)
    function isValidName(value) {
        return value && /^[A-Za-zÀ-Ỹà-ỹ\s]{2,50}$/.test(value.trim());
    }
    // Kiểm tra ngày sinh hợp lệ (không được trong tương lai)
    function isValidDate(value) {
        if (!value) return false;
        const selectedDate = new Date(value);
        const today = new Date();
        return selectedDate < today;
    }
    // Hiển thị lỗi
    function showError(input, message) {
        let errorDiv = input.parentNode.querySelector('.text-danger');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'text-danger mt-1';
            errorDiv.style.fontSize = '14px';
            errorDiv.style.fontWeight = '500';
            input.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
        input.classList.add('is-invalid');
        input.style.borderColor = '#dc3545';
    }
    // Xóa lỗi
    function clearError(input) {
        const errorDiv = input.parentNode.querySelector('.text-danger');
        if (errorDiv) {
            errorDiv.textContent = '';
        }
        input.classList.remove('is-invalid');
        input.style.borderColor = '';
    }
    // Hiển thị thành công
    function showSuccess(input) {
        input.classList.add('is-valid');
        input.style.borderColor = '#28a745';
    }
    // Xóa thành công
    function clearSuccess(input) {
        input.classList.remove('is-valid');
        input.style.borderColor = '';
    }
    // Disable nút Tiếp theo
    function disableNextButton(button) {
        if (button) {
            button.disabled = true;
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
            button.style.pointerEvents = 'none';
            button.title = 'Vui lòng điền đầy đủ tất cả thông tin bắt buộc trước khi tiếp tục';
        }
    }
    // Enable nút Tiếp theo
    function enableNextButton(button) {
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.style.pointerEvents = 'auto';
            button.title = '';
        }
    }
    
    // Lấy tab hiện tại đang active
    function getActiveTab() {
        const registerTab = document.getElementById('register');
        const loginTab = document.getElementById('login');
        
        if (registerTab && registerTab.classList.contains('active')) {
            return 'register';
        } else if (loginTab && loginTab.classList.contains('active')) {
            return 'login';
        }
        return null;
    }
    
    // Tìm nút Tiếp theo
    function findNextButton() {
        return document.getElementById('next-btn-self');
    }
    
    // Tìm inputs cho tab "Đăng ký cho người thân"
    function findRelativeInputs() {
        const registerTab = document.getElementById('register');
        if (!registerTab) return {};
        
        return {
            name: registerTab.querySelector('input[placeholder*="người thân"]'),
            cccd: registerTab.querySelector('input[placeholder*="CCCD"]'),
            birthdate: registerTab.querySelector('input.flatpickrdate'),
            phone: registerTab.querySelector('input[placeholder*="điện thoại"]') || registerTab.querySelector('input[type="tel"]'),
            gender: registerTab.querySelector('input[name="gender"]:checked')
        };
    }
    
    // Tìm inputs cho tab "Đăng ký cho bản thân"
    function findSelfInputs() {
        const loginTab = document.getElementById('login');
        if (!loginTab) return {};
        
        return {
            name: loginTab.querySelector('input[placeholder*="database"]'),
            email: loginTab.querySelector('input[type="email"]'),
            cccd: loginTab.querySelector('input[placeholder*="CCCD"]'),
            birthdate: loginTab.querySelector('input.flatpickrdate'),
            phone: loginTab.querySelector('input[placeholder*="điện thoại"]') || loginTab.querySelector('input[type="tel"]'),
            gender: loginTab.querySelector('input[name="genderSelf"]:checked')
        };
    }
    
    // Validate tab "Đăng ký cho người thân"
    function validateRelativeTab() {
        const inputs = findRelativeInputs();
        const nextButton = findNextButton();
        
        if (!inputs.name || !inputs.cccd || !inputs.phone || !inputs.birthdate) {
            if (nextButton) disableNextButton(nextButton);
            return false;
        }
        
        let isValid = true;
        let firstErrorField = null;
        
        // Kiểm tra Tên
        clearError(inputs.name); clearSuccess(inputs.name);
        if (!inputs.name.value.trim()) {
            showError(inputs.name, 'Vui lòng nhập họ và tên.');
            isValid = false; if (!firstErrorField) firstErrorField = inputs.name;
        } else if (!isValidName(inputs.name.value)) {
            showError(inputs.name, 'Tên chỉ được chứa chữ cái và khoảng trắng (2-50 ký tự).');
            isValid = false; if (!firstErrorField) firstErrorField = inputs.name;
        } else { showSuccess(inputs.name); }
        
        // Kiểm tra Giới tính
        if (!inputs.gender) {
            const registerTab = document.getElementById('register');
            const genderContainer = registerTab.querySelector('.form-check');
            if (genderContainer) {
                let errorDiv = genderContainer.parentNode.querySelector('.text-danger');
                if (!errorDiv) {
                    errorDiv = document.createElement('div');
                    errorDiv.className = 'text-danger mt-1';
                    errorDiv.style.fontSize = '14px';
                    errorDiv.style.fontWeight = '500';
                    genderContainer.parentNode.appendChild(errorDiv);
                }
                errorDiv.textContent = 'Vui lòng chọn giới tính.';
            }
            isValid = false; if (!firstErrorField) firstErrorField = inputs.name;
        } else {
            const registerTab = document.getElementById('register');
            const genderContainer = registerTab.querySelector('.form-check');
            if (genderContainer) {
                const errorDiv = genderContainer.parentNode.querySelector('.text-danger');
                if (errorDiv) { errorDiv.textContent = ''; }
            }
        }
        
        // Kiểm tra CCCD
        clearError(inputs.cccd); clearSuccess(inputs.cccd);
        if (!inputs.cccd.value.trim()) {
            showError(inputs.cccd, 'Vui lòng nhập CCCD.');
            isValid = false; if (!firstErrorField) firstErrorField = inputs.cccd;
        } else if (!isValidCCCD(inputs.cccd.value)) {
            showError(inputs.cccd, 'CCCD phải gồm đúng 12 số.');
            isValid = false; if (!firstErrorField) firstErrorField = inputs.cccd;
        } else { showSuccess(inputs.cccd); }
        
        // Kiểm tra Ngày sinh
        clearError(inputs.birthdate); clearSuccess(inputs.birthdate);
        if (!inputs.birthdate.value.trim()) {
            showError(inputs.birthdate, 'Vui lòng chọn ngày sinh.');
            isValid = false; if (!firstErrorField) firstErrorField = inputs.birthdate;
        } else if (!isValidDate(inputs.birthdate.value)) {
            showError(inputs.birthdate, 'Ngày sinh phải nhỏ hơn ngày hiện tại.');
            isValid = false; if (!firstErrorField) firstErrorField = inputs.birthdate;
        } else { showSuccess(inputs.birthdate); }
        
        // Kiểm tra SĐT
        clearError(inputs.phone); clearSuccess(inputs.phone);
        if (!inputs.phone.value.trim()) {
            showError(inputs.phone, 'Vui lòng nhập số điện thoại.');
            isValid = false; if (!firstErrorField) firstErrorField = inputs.phone;
        } else if (!isValidPhone(inputs.phone.value)) {
            showError(inputs.phone, 'Số điện thoại phải bắt đầu bằng 0 và gồm đúng 10 số.');
            isValid = false; if (!firstErrorField) firstErrorField = inputs.phone;
        } else { showSuccess(inputs.phone); }
        
        if (isValid) { 
            if (nextButton) enableNextButton(nextButton); 
        } else { 
            if (nextButton) disableNextButton(nextButton); 
        }
        
        return isValid;
    }
    
    // Validate tab "Đăng ký cho bản thân"
    function validateSelfTab() {
        const inputs = findSelfInputs();
        const nextButton = findNextButton();
        
        // Tab "Đăng ký cho bản thân" có thông tin tự động điền nên luôn valid
        // Chỉ cần kiểm tra các field bắt buộc đã có dữ liệu
        if (!inputs.name || !inputs.email || !inputs.cccd || !inputs.phone || !inputs.birthdate) {
            if (nextButton) disableNextButton(nextButton);
            return false;
        }
        
        let isValid = true;
        
        // Kiểm tra các field đã có dữ liệu
        if (!inputs.name.value.trim() || !inputs.email.value.trim() || 
            !inputs.cccd.value.trim() || !inputs.phone.value.trim() || 
            !inputs.birthdate.value.trim() || !inputs.gender) {
            isValid = false;
        }
        
        if (isValid) { 
            if (nextButton) enableNextButton(nextButton); 
        } else { 
            if (nextButton) disableNextButton(nextButton); 
        }
        
        return isValid;
    }
    
    // Kiểm tra và cập nhật trạng thái dựa vào tab active
    function checkAndUpdate() {
        const activeTab = getActiveTab();
        
        if (activeTab === 'register') {
            return validateRelativeTab();
        } else if (activeTab === 'login') {
            return validateSelfTab();
        }
        
        return false;
    }
    
    // Clear tất cả validation errors
    function clearAllValidations() {
        const allInputs = document.querySelectorAll('input');
        allInputs.forEach(input => {
            clearError(input);
            clearSuccess(input);
        });
        
        // Clear gender validation errors
        const errorDivs = document.querySelectorAll('.text-danger');
        errorDivs.forEach(div => {
            if (div.textContent.includes('giới tính')) {
                div.textContent = '';
            }
        });
    }
    
    // Gắn event listeners cho tab "Đăng ký cho người thân"
    function attachRelativeInputListeners() {
        const inputs = findRelativeInputs();
        [inputs.name, inputs.cccd, inputs.phone, inputs.birthdate].forEach(input => {
            if (input) {
                input.addEventListener('input', function() { 
                    if (getActiveTab() === 'register') {
                        checkAndUpdate(); 
                    }
                });
                input.addEventListener('blur', function() { 
                    if (getActiveTab() === 'register') {
                        checkAndUpdate(); 
                    }
                });
            }
        });
        
        const genderRadios = document.querySelectorAll('input[name="gender"]');
        genderRadios.forEach(radio => {
            radio.addEventListener('change', function() { 
                if (getActiveTab() === 'register') {
                    checkAndUpdate(); 
                }
            });
        });
    }
    
    // Gắn event listeners cho tab "Đăng ký cho bản thân"
    function attachSelfInputListeners() {
        const inputs = findSelfInputs();
        [inputs.name, inputs.email, inputs.cccd, inputs.phone, inputs.birthdate].forEach(input => {
            if (input) {
                input.addEventListener('input', function() { 
                    if (getActiveTab() === 'login') {
                        checkAndUpdate(); 
                    }
                });
                input.addEventListener('change', function() { 
                    if (getActiveTab() === 'login') {
                        checkAndUpdate(); 
                    }
                });
            }
        });
        
        const genderRadios = document.querySelectorAll('input[name="genderSelf"]');
        genderRadios.forEach(radio => {
            radio.addEventListener('change', function() { 
                if (getActiveTab() === 'login') {
                    checkAndUpdate(); 
                }
            });
        });
    }
    
    function attachButtonListeners() {
        const nextButton = findNextButton();
        if (nextButton) {
            nextButton.removeEventListener('click', handleNextClick);
            nextButton.addEventListener('click', handleNextClick);
        }
    }
    
    function handleNextClick(e) {
        if (!checkAndUpdate()) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showAlert('Vui lòng điền đầy đủ tất cả thông tin bắt buộc trước khi tiếp tục!', 'error');
            return false;
        }
        // showAlert('Thông tin hợp lệ! Đang chuyển sang bước tiếp theo...', 'success'); // Đã xóa theo yêu cầu
    }
    
    function showAlert(message, type = 'error') {
        const existingAlerts = document.querySelectorAll('.validation-alert');
        existingAlerts.forEach(alert => alert.remove());
        const alertDiv = document.createElement('div');
        alertDiv.className = `validation-alert alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';
        alertDiv.style.maxWidth = '400px';
        alertDiv.innerHTML = `<strong>${type === 'error' ? 'Lỗi!' : 'Thành công!'}</strong> ${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.body.appendChild(alertDiv);
        setTimeout(() => { if (alertDiv.parentNode) { alertDiv.remove(); } }, 5000);
    }
    
    function initValidation() {
        attachRelativeInputListeners();
        attachSelfInputListeners();
        attachButtonListeners();
        checkAndUpdate();
    }
    
    function startContinuousValidation() {
        setInterval(() => {
            const activeTab = getActiveTab();
            if (activeTab) {
                checkAndUpdate();
            }
        }, 500);
    }
    
    // Lắng nghe sự kiện chuyển tab
    function attachTabChangeListeners() {
        document.addEventListener('shown.bs.tab', function(event) {
            const target = event.target.getAttribute('data-bs-target');
            console.log('Tab changed to:', target);
            
            // Clear validation khi chuyển tab
            clearAllValidations();
            
            // Validate tab mới
            setTimeout(() => {
                checkAndUpdate();
            }, 100);
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initValidation();
            attachTabChangeListeners();
            startContinuousValidation();
        });
    } else {
        initValidation();
        attachTabChangeListeners();
        startContinuousValidation();
    }
    
    window.simpleValidator = {
        checkAndUpdate: checkAndUpdate,
        getActiveTab: getActiveTab,
        validateRelativeTab: validateRelativeTab,
        validateSelfTab: validateSelfTab,
        clearAllValidations: clearAllValidations,
        init: initValidation
    };
    
    console.log('=== SIMPLE VALIDATION SCRIPT READY ===');
})(); 