// Appointment Integration - Tích hợp quản lý user trong trang appointment
class AppointmentIntegration {
    constructor() {
        this.userSessionManager = null;
        this.waitForUserSessionManager();
    }

    // Đợi cho đến khi userSessionManager sẵn sàng
    waitForUserSessionManager() {
        if (window.userSessionManager) {
            this.userSessionManager = window.userSessionManager;
            this.init();
        } else {
            setTimeout(() => this.waitForUserSessionManager(), 100);
        }
    }

    // Khởi tạo
    init() {
        // Kiểm tra quyền truy cập trước
        if (!this.checkAccess()) {
            return; // Dừng nếu không có quyền truy cập
        }
        
        this.updateAppointmentUI();
        this.setupEventListeners();
        // Đảm bảo cập nhật lại menu user sau khi trang load hoàn tất
        setTimeout(() => this.updateAppointmentUI(), 1000);
        setTimeout(() => this.updateAppointmentUI(), 2000);
    }

    // Cập nhật giao diện appointment dựa trên trạng thái đăng nhập
    updateAppointmentUI() {
        if (!this.userSessionManager) return;

        const userDropdown = document.querySelector('.dropdown-user');
        if (!userDropdown) return;

        if (this.userSessionManager.isLoggedIn()) {
            const userInfo = this.userSessionManager.getUserInfo();
            
            // Cập nhật dropdown menu
            userDropdown.innerHTML = `
                <li>
                    <div class="dropdown-item d-flex align-items-center">
                        <div class="avatar-40 rounded-circle bg-primary d-flex align-items-center justify-content-center me-3">
                            <i class="fas fa-user text-white"></i>
                        </div>
                        <div>
                            <h6 class="mb-0">${userInfo.fullName || userInfo.email}</h6>
                            <small class="text-muted">${userInfo.userType || 'User'}</small>
                        </div>
                    </div>
                </li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="./my-account.html">
                    <i class="fas fa-user-cog me-2"></i>Tài khoản của tôi
                </a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" onclick="appointmentIntegration.logout()">
                    <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
                </a></li>
            `;

            // Hiển thị thông tin user trong form đặt lịch nếu có
            this.populateAppointmentForm(userInfo);
        } else {
            // User chưa đăng nhập
            userDropdown.innerHTML = `
                <li><a class="dropdown-item border-bottom" href="./login.html">Đăng nhập</a></li>
                <li><a class="dropdown-item" href="./registration.html">Đăng ký</a></li>
            `;

            // Hiển thị thông báo yêu cầu đăng nhập
            this.showLoginRequiredMessage();
        }
    }

    // Điền thông tin user vào form đặt lịch
    populateAppointmentForm(userInfo) {
        console.log('🔄 Đang điền thông tin user vào form:', userInfo);
        
        // Tìm các trường input trong form đặt lịch (tab đăng ký cho bản thân)
        const loginTab = document.querySelector('#login'); // Tab đăng ký cho bản thân
        if (!loginTab) {
            console.warn('❌ Không tìm thấy tab đăng ký cho bản thân');
            return;
        }

        console.log('✅ Tìm thấy tab #login, đang tìm các input theo placeholder...');

        // ✅ Tìm input theo placeholder chính xác (không dùng index)
        const fullNameInput = loginTab.querySelector('input[placeholder*="Họ và tên sẽ được tự động điền từ database"]');
        const emailInput = loginTab.querySelector('input[placeholder*="Email sẽ được tự động điền từ database"]');
        const cccdInput = loginTab.querySelector('input[placeholder*="CCCD sẽ được tự động điền từ database"]');
        const phoneInput = loginTab.querySelector('input[placeholder*="Số điện thoại sẽ được tự động điền từ database"]');
        const birthdateInput = loginTab.querySelector('.flatpickrdate');
        const genderInputs = loginTab.querySelectorAll('input[name="genderSelf"]');

        console.log('🔍 Tìm được các input:');
        console.log('- Họ và tên:', fullNameInput ? 'Có' : 'Không có');
        console.log('- Email:', emailInput ? 'Có' : 'Không có'); 
        console.log('- CCCD:', cccdInput ? 'Có' : 'Không có');
        console.log('- Số điện thoại:', phoneInput ? 'Có' : 'Không có');
        console.log('- Ngày sinh:', birthdateInput ? 'Có' : 'Không có');
        console.log('- Radio giới tính:', genderInputs.length, 'button(s)');

        // Debug: In ra tất cả input để kiểm tra
        const allInputs = loginTab.querySelectorAll('input');
        console.log('🔧 DEBUG: Tất cả input trong tab #login:');
        allInputs.forEach((input, index) => {
            console.log(`  [${index}] Type: ${input.type}, Placeholder: "${input.placeholder}", Name: "${input.name}", Class: "${input.className}", Value: "${input.value}"`);
        });

        // Nếu không tìm thấy input theo placeholder, thử tìm theo cách khác
        let finalFullNameInput = fullNameInput;
        let finalEmailInput = emailInput;
        let finalCccdInput = cccdInput;
        let finalPhoneInput = phoneInput;
        let finalBirthdateInput = birthdateInput;

        // Fallback: Tìm theo text content của label
        if (!finalFullNameInput) {
            const nameLabel = Array.from(loginTab.querySelectorAll('label')).find(label => 
                label.textContent.toLowerCase().includes('họ và tên') || 
                label.textContent.toLowerCase().includes('họ tên')
            );
            if (nameLabel) {
                const nameContainer = nameLabel.closest('.col-12, .col-sm-6, .form-group');
                if (nameContainer) {
                    finalFullNameInput = nameContainer.querySelector('input[type="text"]');
                    console.log('🔄 Fallback: Tìm thấy input họ tên qua label');
                }
            }
        }

        if (!finalEmailInput) {
            const emailLabel = Array.from(loginTab.querySelectorAll('label')).find(label => 
                label.textContent.toLowerCase().includes('email')
            );
            if (emailLabel) {
                const emailContainer = emailLabel.closest('.col-12, .col-sm-6, .form-group');
                if (emailContainer) {
                    finalEmailInput = emailContainer.querySelector('input[type="email"], input[type="text"]');
                    console.log('🔄 Fallback: Tìm thấy input email qua label');
                }
            }
        }

        if (!finalCccdInput) {
            const cccdLabel = Array.from(loginTab.querySelectorAll('label')).find(label => 
                label.textContent.toLowerCase().includes('cccd') ||
                label.textContent.toLowerCase().includes('căn cước')
            );
            if (cccdLabel) {
                const cccdContainer = cccdLabel.closest('.col-12, .col-sm-6, .form-group');
                if (cccdContainer) {
                    finalCccdInput = cccdContainer.querySelector('input[type="text"]');
                    console.log('🔄 Fallback: Tìm thấy input CCCD qua label');
                }
            }
        }

        if (!finalPhoneInput) {
            const phoneLabel = Array.from(loginTab.querySelectorAll('label')).find(label => 
                label.textContent.toLowerCase().includes('điện thoại') ||
                label.textContent.toLowerCase().includes('phone')
            );
            if (phoneLabel) {
                const phoneContainer = phoneLabel.closest('.col-12, .col-sm-6, .form-group');
                if (phoneContainer) {
                    finalPhoneInput = phoneContainer.querySelector('input[type="tel"], input[type="text"]');
                    console.log('🔄 Fallback: Tìm thấy input phone qua label');
                }
            }
        }

        if (!finalBirthdateInput) {
            const dobLabel = Array.from(loginTab.querySelectorAll('label')).find(label => 
                label.textContent.toLowerCase().includes('ngày sinh') ||
                label.textContent.toLowerCase().includes('ngày tháng năm sinh')
            );
            if (dobLabel) {
                const dobContainer = dobLabel.closest('.col-12, .col-sm-6, .form-group');
                if (dobContainer) {
                    finalBirthdateInput = dobContainer.querySelector('input[type="text"], input.flatpickrdate');
                    console.log('🔄 Fallback: Tìm thấy input ngày sinh qua label');
                }
            }
        }

        console.log('🔍 Input cuối cùng được chọn:');
        console.log('- Họ và tên:', finalFullNameInput ? `"${finalFullNameInput.placeholder}"` : 'Không có');
        console.log('- Email:', finalEmailInput ? `"${finalEmailInput.placeholder}"` : 'Không có');
        console.log('- CCCD:', finalCccdInput ? `"${finalCccdInput.placeholder}"` : 'Không có');
        console.log('- Số điện thoại:', finalPhoneInput ? `"${finalPhoneInput.placeholder}"` : 'Không có');
        console.log('- Ngày sinh:', finalBirthdateInput ? `"${finalBirthdateInput.placeholder}"` : 'Không có');

        // Kiểm tra xem có input nào bị trùng không
        const inputElements = [finalFullNameInput, finalEmailInput, finalCccdInput, finalPhoneInput, finalBirthdateInput].filter(Boolean);
        const uniqueInputs = new Set(inputElements);
        if (inputElements.length !== uniqueInputs.size) {
            console.warn('⚠️ CẢNH BÁO: Có input bị trùng lặp!');
            inputElements.forEach((input, index) => {
                const names = ['Họ tên', 'Email', 'CCCD', 'Điện thoại', 'Ngày sinh'];
                console.log(`  ${names[index]}: ${input ? input.placeholder || input.outerHTML.substring(0, 100) : 'null'}`);
            });
        }

        // Loại bỏ readonly trước khi điền dữ liệu
        [finalFullNameInput, finalEmailInput, finalCccdInput, finalPhoneInput, finalBirthdateInput].forEach(input => {
            if (input) {
                console.log(`🔓 Bỏ readonly cho input: ${input.placeholder || 'unknown'}`);
                input.removeAttribute('readonly');
                input.removeAttribute('disabled');
            }
        });

        // Loại bỏ disabled cho radio buttons
        genderInputs.forEach(input => {
            input.removeAttribute('disabled');
        });

        // Điền họ và tên
        if (finalFullNameInput && userInfo) {
            let fullName = '';
            
            // Thử nhiều cách lấy tên
            if (userInfo.firstName && userInfo.lastName) {
                fullName = `${userInfo.lastName} ${userInfo.firstName}`;
            } else if (userInfo.name) {
                fullName = userInfo.name;
            } else if (userInfo.fullName) {
                fullName = userInfo.fullName;
            }
            
            if (fullName) {
                console.log(`📝 Điền họ và tên: "${fullName}"`);
                finalFullNameInput.value = fullName;
                finalFullNameInput.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('✅ Đã điền họ và tên:', fullName);
            } else {
                console.warn('❌ Không có dữ liệu tên để điền');
            }
        }

        // Điền email
        if (finalEmailInput && userInfo.email) {
            console.log(`📝 Điền email: "${userInfo.email}"`);
            finalEmailInput.value = userInfo.email;
            finalEmailInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Đã điền email:', userInfo.email);
        }

        // Điền số điện thoại
        if (finalPhoneInput && userInfo.phone) {
            console.log(`📝 Điền số điện thoại: "${userInfo.phone}"`);
            finalPhoneInput.value = userInfo.phone;
            finalPhoneInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Đã điền số điện thoại:', userInfo.phone);
        }

        // Điền CCCD
        if (finalCccdInput && userInfo.cccd) {
            console.log(`📝 Điền CCCD: "${userInfo.cccd}"`);
            finalCccdInput.value = userInfo.cccd;
            finalCccdInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Đã điền CCCD:', userInfo.cccd);
        }

        // Điền giới tính
        if (userInfo.gender && genderInputs.length > 0) {
            let genderValue = userInfo.gender.toLowerCase();
            // Chuyển đổi từ API response sang HTML values
            if (genderValue === 'male' || genderValue === 'nam' || genderValue === '0') genderValue = 'male';
            else if (genderValue === 'female' || genderValue === 'nữ' || genderValue === '1') genderValue = 'female';
            else genderValue = 'other';

            console.log(`📝 Tìm radio giới tính với value: "${genderValue}"`);
            const genderRadio = loginTab.querySelector(`input[name="genderSelf"][value="${genderValue}"]`);
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('✅ Đã chọn giới tính:', genderValue);
            } else {
                console.warn('❌ Không tìm thấy radio button cho giới tính:', genderValue);
                console.log('🔍 Available gender options:', Array.from(genderInputs).map(r => r.value));
            }
        }

        // Điền ngày sinh
        const birthdate = userInfo.dob || userInfo.birthdate || userInfo.dateOfBirth || userInfo.birth_date;
        console.log('🔍 Debug ngày sinh - userInfo:', userInfo);
        console.log('🔍 Debug ngày sinh - birthdateInput:', finalBirthdateInput);
        console.log('🔍 Debug ngày sinh - birthdate:', birthdate);
        
        if (finalBirthdateInput && birthdate) {
            let formatted = birthdate;
            // Nếu là yyyy-mm-dd thì chuyển sang dd/mm/yyyy
            if (/^\d{4}-\d{2}-\d{2}/.test(formatted)) {
                const date = new Date(formatted);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                formatted = `${day}/${month}/${year}`;
            }
            
            console.log(`📝 Điền ngày sinh: "${formatted}"`);
            finalBirthdateInput.value = formatted;
            finalBirthdateInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Nếu có flatpickr thì dùng API của nó
            if (finalBirthdateInput._flatpickr) {
                finalBirthdateInput._flatpickr.setDate(formatted, true, 'd/m/Y');
                console.log('✅ Đã set ngày qua flatpickr:', formatted);
            } else {
                // Nếu chưa có flatpickr, đợi và thử lại
                setTimeout(() => {
                    if (finalBirthdateInput._flatpickr) {
                        finalBirthdateInput._flatpickr.setDate(formatted, true, 'd/m/Y');
                        console.log('✅ Đã set ngày qua flatpickr (delayed):', formatted);
                    }
                }, 500);
                console.log('✅ Đã set ngày trực tiếp:', formatted);
            }
            
            console.log('✅ Đã điền ngày sinh:', formatted);
        } else {
            console.warn('❌ Không có dữ liệu ngày sinh hoặc không tìm thấy input ngày sinh');
        }

        console.log('✅ Hoàn thành điền thông tin user vào form');
        
        // Trigger validation để enable nút Tiếp Theo
        setTimeout(() => {
            // Trigger validation events cho tất cả input
            [finalFullNameInput, finalEmailInput, finalCccdInput, finalPhoneInput, finalBirthdateInput].forEach(input => {
                if (input && input.value) {
                    input.dispatchEvent(new Event('blur', { bubbles: true }));
                    input.dispatchEvent(new Event('keyup', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`🔄 Triggered validation cho: ${input.placeholder || 'unknown'}`);
                }
            });

            // Trigger validation cho radio buttons
            genderInputs.forEach(input => {
                if (input.checked) {
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`🔄 Triggered validation cho gender: ${input.value}`);
                }
            });

            // Kiểm tra và enable nút Tiếp Theo CHỈ CHO TAB ĐĂNG KÝ BẢN THÂN
            const selfNextButton = document.getElementById('next-btn-self');
            if (selfNextButton) {
                selfNextButton.disabled = false;
                selfNextButton.classList.remove('disabled', 'btn-disabled');
                selfNextButton.classList.add('btn-enabled');
                selfNextButton.style.opacity = '1';
                selfNextButton.style.cursor = 'pointer';
                selfNextButton.style.pointerEvents = 'auto';
                selfNextButton.title = 'Tiếp tục';
                console.log('✅ Đã enable nút Tiếp Theo cho tab "Đăng ký cho bản thân"');
            } else {
                console.warn('❌ Không tìm thấy nút Tiếp Theo cho tab "Đăng ký cho bản thân" (id="next-btn-self")');
            }

            // KHÔNG TOUCH NÚT CỦA TAB NGƯỜI THÂN (id="next-btn-relatives")
            console.log('ℹ️ Không thay đổi nút Tiếp Theo của tab "Đăng ký cho người thân"');

            // Tìm nút theo text content (fallback - CHỈ TRONG TAB ĐĂNG KÝ BẢN THÂN)
            const loginTab = document.querySelector('#login');
            if (loginTab) {
                const loginTabButtons = loginTab.querySelectorAll('button');
                loginTabButtons.forEach(btn => {
                    const text = btn.textContent.trim().toLowerCase();
                    if ((text.includes('tiếp') || text.includes('next')) && btn.disabled) {
                        btn.disabled = false;
                        btn.classList.remove('disabled', 'btn-disabled');
                        btn.classList.add('btn-enabled');
                        btn.style.opacity = '1';
                        btn.style.cursor = 'pointer';
                        btn.style.pointerEvents = 'auto';
                        console.log('✅ Đã enable nút Tiếp Theo (fallback) trong tab đăng ký bản thân:', btn.textContent);
                    }
                });
            }

            // Kiểm tra form validation function nếu có
            if (typeof window.checkAndUpdate === 'function') {
                window.checkAndUpdate();
                console.log('🔄 Đã gọi checkAndUpdate validation');
            }

            // Kiểm tra validation custom
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                if (form.checkValidity && typeof form.checkValidity === 'function') {
                    const isValid = form.checkValidity();
                    console.log(`📋 Form validation result: ${isValid}`);
                }
            });

            console.log('✅ Đã trigger validation và enable buttons');

            // SAU KHI VALIDATION - Set readonly để khóa form
            setTimeout(() => {
                [finalFullNameInput, finalEmailInput, finalCccdInput, finalPhoneInput, finalBirthdateInput].forEach(input => {
                    if (input) {
                        input.setAttribute('readonly', 'readonly');
                        input.style.backgroundColor = '#f8f9fa';
                        input.style.cursor = 'not-allowed';
                        input.title = 'Thông tin được lấy từ tài khoản đã đăng nhập';
                        console.log(`🔒 Đã khóa input: ${input.placeholder || 'unknown'}`);
                        
                        // Đặc biệt cho flatpickr input (ngày sinh)
                        if (input.classList.contains('flatpickrdate') || input === finalBirthdateInput) {
                            // Vô hiệu hóa flatpickr
                            if (input._flatpickr) {
                                input._flatpickr.set('clickOpens', false);
                                input._flatpickr.set('allowInput', false);
                                console.log(`🔒 Đã vô hiệu hóa flatpickr cho ngày sinh`);
                            }
                            
                            // Thêm event listener để ngăn click
                            input.addEventListener('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                return false;
                            });
                            
                            input.addEventListener('focus', function(e) {
                                e.preventDefault();
                                input.blur();
                                return false;
                            });
                            
                            console.log(`🔒 Đã thêm event block cho input ngày sinh`);
                        }
                    }
                });

                // Khóa radio buttons giới tính
                genderInputs.forEach(input => {
                    input.setAttribute('disabled', 'disabled');
                    input.style.cursor = 'not-allowed';
                    // Thêm style cho label
                    const label = document.querySelector(`label[for="${input.id}"]`);
                    if (label) {
                        label.style.cursor = 'not-allowed';
                        label.style.opacity = '0.7';
                        label.title = 'Thông tin được lấy từ tài khoản đã đăng nhập';
                    }
                });
                
                console.log('🔒 Đã khóa form "Đăng ký cho bản thân" - thông tin được lấy từ tài khoản đã đăng nhập');
            }, 100);

        }, 200);

        console.log('ℹ️ Form sẽ được khóa sau khi validation để bảo vệ thông tin tài khoản');
    }

    // Hiển thị thông báo yêu cầu đăng nhập
    showLoginRequiredMessage() {
        // Tìm container để hiển thị thông báo
        const appointmentForm = document.querySelector('.appointment-tab-form');
        if (appointmentForm) {
            // Kiểm tra xem đã có thông báo chưa
            let loginMessage = document.getElementById('login-required-message');
            if (!loginMessage) {
                loginMessage = document.createElement('div');
                loginMessage.id = 'login-required-message';
                loginMessage.className = 'alert alert-info text-center mb-4';
                loginMessage.innerHTML = `
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Vui lòng đăng nhập để đặt lịch hẹn</strong>
                    <br>
                    <a href="./login.html" class="btn btn-primary btn-sm mt-2">Đăng nhập ngay</a>
                `;
                
                // Chèn thông báo vào đầu form
                appointmentForm.insertBefore(loginMessage, appointmentForm.firstChild);
            }
        }
    }

    // Xử lý đăng xuất
    logout() {
        if (this.userSessionManager) {
            this.userSessionManager.logout();
        }
    }

    // Thiết lập các event listeners
    setupEventListeners() {
        // Lắng nghe sự kiện thay đổi trạng thái đăng nhập
        window.addEventListener('storage', (e) => {
            if (e.key === 'kivicare_user_session') {
                setTimeout(() => {
                    this.updateAppointmentUI();
                }, 100);
            }
        });

        // Lắng nghe sự kiện click vào nút đặt lịch
        const appointmentButtons = document.querySelectorAll('button[type="submit"], .appointment-submit');
        appointmentButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (!this.userSessionManager || !this.userSessionManager.isLoggedIn()) {
                    e.preventDefault();
                    window.location.href = './login.html';
                }
            });
        });
    }

    // Kiểm tra quyền truy cập trang appointment
    checkAccess() {
        if (!this.userSessionManager || !this.userSessionManager.isLoggedIn()) {
            // Nếu chưa đăng nhập, chuyển về trang đăng nhập
            window.location.href = './login.html';
            return false;
        }
        return true;
    }
}

// Hàm tự động lấy thông tin user và điền vào form khi đăng nhập
async function fetchAndFillUserInfo() {
  console.log('🔍 === DEBUG TOKEN ===');
  
  // Kiểm tra tất cả các key có thể có
  const token1 = localStorage.getItem('kivicare_token');
  const token2 = sessionStorage.getItem('kivicare_token');
  const token3 = localStorage.getItem('token');
  const token4 = sessionStorage.getItem('token');
  
  console.log('🔍 localStorage.kivicare_token:', token1);
  console.log('🔍 sessionStorage.kivicare_token:', token2);
  console.log('🔍 localStorage.token:', token3);
  console.log('🔍 sessionStorage.token:', token4);
  
  // Kiểm tra UserSessionManager
  let tokenFromSession = null;
  if (window.userSessionManager && window.userSessionManager.isLoggedIn()) {
    const userInfo = window.userSessionManager.getUserInfo();
    tokenFromSession = userInfo ? userInfo.token : null;
    console.log('🔍 Token từ UserSessionManager:', tokenFromSession);
  }
  
  // Kiểm tra kivicare_user_session
  const userSession = localStorage.getItem('kivicare_user_session');
  console.log('🔍 kivicare_user_session:', userSession);
  if (userSession) {
    try {
      const parsed = JSON.parse(userSession);
      console.log('🔍 Token trong user session:', parsed.token);
    } catch (e) {
      console.error('❌ Lỗi parse user session:', e);
    }
  }
  
  // Chọn token tốt nhất
  const token = token1 || token2 || token3 || token4 || tokenFromSession;
  console.log('🔍 Token cuối cùng được chọn:', token ? 'Có token' : 'Không có token');
  console.log('🔍 === END DEBUG ===');
  
  if (!token) {
    console.warn('❌ Không tìm thấy token nào. Có thể chưa đăng nhập hoặc token bị xóa.');
    return;
  }
  
  try {
    console.log('📡 Đang gọi API lấy thông tin user...');
    const response = await fetch('https://localhost:7097/api/appointment/user-info', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📩 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📩 Response data:', data);
      
      if (data && data.data) {
        // ✅ Dữ liệu user nằm trong data.data (theo response thực tế)
        console.log('✅ Có dữ liệu user, đang điền vào form...');
        
        // Tạo instance AppointmentIntegration nếu chưa có
        if (!window.appointmentIntegration) {
          console.log('🔄 Tạo AppointmentIntegration instance mới...');
          window.appointmentIntegration = new AppointmentIntegration();
        }
        
        window.appointmentIntegration.populateAppointmentForm(data.data);
      } else {
        // ⚠️ Nếu không có data.data thì cảnh báo  
        console.warn('❌ Không có dữ liệu user trong response');
        console.log('🔍 Debug - data:', data);
        console.log('🔍 Debug - data.data:', data ? data.data : 'undefined');
      }
    } else {
      console.error('❌ API trả về lỗi:', response.status, await response.text());
    }
  } catch (e) {
    console.error('❌ Lỗi gọi API:', e);
    }
}

// Khởi tạo AppointmentIntegration khi trang load
let appointmentIntegration;
document.addEventListener('DOMContentLoaded', function() {
    appointmentIntegration = new AppointmentIntegration();

    // Khởi tạo flatpickr cho input ngày khám
    const appointmentDateInputs = document.querySelectorAll('.flatpickrdate-appointment');
    if (typeof flatpickr !== typeof undefined) {
        Array.from(appointmentDateInputs).forEach(input => {
            flatpickr(input, {
                dateFormat: 'd/m/Y',
                locale: 'vn',
                minDate: 'today',
                allowInput: true,
                onChange: function() {
                    if (window.appointmentConfirmation) {
                        window.appointmentConfirmation.updateConfirmationDisplay();
                    }
                }
            });
            input.addEventListener('change', function() {
                if (window.appointmentConfirmation) {
                    window.appointmentConfirmation.updateConfirmationDisplay();
                }
            });
        });
    }

    // Khởi tạo flatpickr cho input ngày sinh
    const birthdateInputs = document.querySelectorAll('.flatpickrdate-patient');
    if (typeof flatpickr !== typeof undefined) {
        Array.from(birthdateInputs).forEach(input => {
            flatpickr(input, {
                dateFormat: 'd/m/Y',
                locale: 'vn',
                minDate: '1900-01-01',
                maxDate: new Date(),
                allowInput: true,
                onChange: function() {
                    if (window.appointmentConfirmation) {
                        window.appointmentConfirmation.updateConfirmationDisplay();
                    }
                }
            });
            input.addEventListener('change', function() {
                if (window.appointmentConfirmation) {
                    window.appointmentConfirmation.updateConfirmationDisplay();
                }
            });
        });
    }
    
    fetchAndFillUserInfo();
    
    // Lắng nghe sự kiện chuyển tab để điền thông tin khi vào tab đăng ký cho bản thân
    document.addEventListener('shown.bs.tab', function(event) {
        if (event.target.getAttribute('data-bs-target') === '#login') {
            console.log('🔄 Đã chuyển sang tab đăng ký cho bản thân, đang điền thông tin...');
            setTimeout(() => fetchAndFillUserInfo(), 200);
        }
    });
});

// Export để sử dụng trong các file khác
window.appointmentIntegration = appointmentIntegration; 