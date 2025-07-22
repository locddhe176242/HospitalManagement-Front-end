// Index Integration - Tích hợp quản lý user trong trang index
class IndexIntegration {
    constructor() {
        this.userSessionManager = null;
        this.init();
    }

    // Khởi tạo
    init() {
        // Chờ UserSessionManager khởi tạo
        setTimeout(() => {
            if (window.userSessionManager) {
                this.userSessionManager = window.userSessionManager;
                this.updateIndexUI();
                this.setupEventListeners();
                this.startAppointmentButtonWatcher(); // Bắt đầu watcher
            } else {
                console.warn('UserSessionManager chưa được khởi tạo');
            }
        }, 200);
        
        // Chạy logic chặn ngay lập tức và sau đó
        this.setupAppointmentBlocking();
        setTimeout(() => this.setupAppointmentBlocking(), 500);
        setTimeout(() => this.setupAppointmentBlocking(), 1000);
        setTimeout(() => this.setupAppointmentBlocking(), 2000);
    }

    // Cập nhật giao diện index dựa trên trạng thái đăng nhập
    updateIndexUI() {
        if (!this.userSessionManager) return;

        const userDropdown = document.querySelector('.dropdown-user');
        const userIcon = document.querySelector('#itemdropdown1 .btn-inner');
        
        if (!userDropdown) return;

        if (this.userSessionManager.isLoggedIn()) {
            const userInfo = this.userSessionManager.getUserInfo();
            const displayName = userInfo.fullName || userInfo.email || 'User';

            // Hiển thị tên user bên cạnh icon
            if (userIcon) {
                let nameSpan = document.getElementById('user-name-display');
                if (!nameSpan) {
                    nameSpan = document.createElement('span');
                    nameSpan.id = 'user-name-display';
                    nameSpan.style.marginLeft = '8px';
                    nameSpan.style.marginRight = '12px';
                    nameSpan.style.fontWeight = '400';
                    nameSpan.style.fontSize = '0.85rem';
                    nameSpan.style.whiteSpace = 'nowrap';
                    nameSpan.style.overflow = 'hidden';
                    nameSpan.style.textOverflow = 'ellipsis';
                    nameSpan.style.maxWidth = '120px';
                    nameSpan.style.display = 'inline-block';
                    nameSpan.style.cursor = 'pointer';
                    nameSpan.title = displayName;

                    userIcon.appendChild(nameSpan);
                }
                nameSpan.textContent = displayName;
                nameSpan.onclick = function () {
                    window.location.href = './my-account.html';
                };
            }

            // Cập nhật dropdown menu
            userDropdown.innerHTML = `
                <li>
                    <a class="dropdown-item" href="./my-account.html" style="font-size: 0.85rem;">
                        ${displayName}
                    </a>
                </li>
                <li>
                    <a class="dropdown-item" href="#" id="logout-btn">Đăng xuất</a>
                </li>
            `;

            // Xử lý logout
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.onclick = (e) => {
                    e.preventDefault();
                    this.logout();
                };
            }
        } else {
            // User chưa đăng nhập
            userDropdown.innerHTML = `
                <li><a class="dropdown-item border-bottom" href="./login.html">Đăng nhập</a></li>
                <li><a class="dropdown-item" href="./registration.html">Đăng ký</a></li>
            `;

            // Xóa tên user nếu có
            const nameSpan = document.getElementById('user-name-display');
            if (nameSpan) {
                nameSpan.remove();
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
                    this.updateIndexUI();
                }, 100);
            }
        });

        // Thiết lập logic chặn appointment khi chưa đăng nhập
        this.setupAppointmentBlocking();
    }

    // Thiết lập logic chặn appointment khi chưa đăng nhập
    setupAppointmentBlocking() {
        // Chạy ngay lập tức
        this.blockAppointmentButtons();
        
        // Chạy sau khi tất cả script khác đã load
        setTimeout(() => {
            this.blockAppointmentButtons();
        }, 1000); // Chạy sau 1 giây để đảm bảo tất cả script đã load
        
        // Chạy thêm một lần nữa khi window load hoàn toàn
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.blockAppointmentButtons();
            }, 500);
        });
        
        // Override tất cả event listener có thể có
        this.overrideAllAppointmentEvents();
    }
    
    // Override tất cả event listener có thể có
    overrideAllAppointmentEvents() {
        // Override addEventListener để chặn appointment
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (type === 'click' && this.matches && this.matches('a[href*="appointment"], .appointment-btn')) {
                // Nếu là nút appointment, thêm logic chặn
                const originalListener = listener;
                listener = function(e) {
                    if (!window.indexIntegration || !window.indexIntegration.forceRefreshLoginStatus()) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        window.indexIntegration.showLoginRequiredModal();
                        return false;
                    }
                    return originalListener.call(this, e);
                };
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
        
        // Thiết lập thông báo cho nút appointment
        this.setupAppointmentNotification();
    }
    
    // Thiết lập thông báo cho nút appointment khi chưa đăng nhập
    setupAppointmentNotification() {
        const selectors = [
            'a[href="./appointment.html"]',
            'a[href="appointment.html"]',
            'a[href="/appointment.html"]',
            '.appointment-btn',
            '[data-href*="appointment"]'
        ];
        
        selectors.forEach(selector => {
            try {
                const buttons = document.querySelectorAll(selector);
                buttons.forEach(button => {
                    // Luôn cho phép click, nhưng hiển thị thông báo khi chưa đăng nhập
                    button.style.pointerEvents = 'auto';
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                    button.classList.remove('disabled-appointment');
                    
                    // Thêm tooltip thông báo dựa trên trạng thái đăng nhập thực tế
                    const isLoggedIn = this.checkLoginStatus();
                    if (!isLoggedIn) {
                        button.title = 'Vui lòng đăng nhập để đặt lịch hẹn';
                    } else {
                        button.title = 'Đặt lịch hẹn';
                    }
                });
            } catch (e) {
                // Bỏ qua selector không hợp lệ
            }
        });
    }

    // Chặn các nút appointment khi chưa đăng nhập
    blockAppointmentButtons() {
        // Tìm tất cả nút appointment với nhiều selector khác nhau
        const selectors = [
            'a[href="./appointment.html"]',
            'a[href="appointment.html"]',
            'a[href="/appointment.html"]',
            '.appointment-btn',
            '[data-href*="appointment"]',
            'a:contains("Appointment")',
            'a:contains("appointment")',
            'a:contains("Đặt lịch")',
            'a:contains("Lịch hẹn")'
        ];
        
        let appointmentButtons = [];
        selectors.forEach(selector => {
            try {
                const buttons = document.querySelectorAll(selector);
                appointmentButtons = appointmentButtons.concat(Array.from(buttons));
            } catch (e) {
                // Bỏ qua selector không hợp lệ
            }
        });
        
        // Loại bỏ duplicate
        appointmentButtons = [...new Set(appointmentButtons)];
        
        console.log('Found appointment buttons to block:', appointmentButtons.length);
        
        appointmentButtons.forEach((button, index) => {
            console.log(`Setting up block handler for button ${index}:`, button);
            
            // Xóa tất cả event listener cũ bằng cách clone
            const newButton = button.cloneNode(true);
            if (button.parentNode) {
                button.parentNode.replaceChild(newButton, button);
            }
            
            // Thêm event listener mới - hiển thị thông báo khi chưa đăng nhập
            newButton.addEventListener('click', (e) => {
                console.log('Appointment button clicked - checking login status');
                
                // Force refresh trạng thái đăng nhập trước khi kiểm tra
                const isLoggedIn = this.forceRefreshLoginStatus();
                console.log('Final login status check result:', isLoggedIn);
                
                if (!isLoggedIn) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    
                    // Hiển thị thông báo đẹp hơn
                    this.showLoginRequiredModal();
                    return false;
                }
                
                // Nếu đã đăng nhập thì cho phép truy cập
                console.log('✅ User is logged in, allowing access to appointment page');
            }, true); // Capture phase để chặn sớm nhất
            
            // Thêm onclick handler trực tiếp
            newButton.onclick = (e) => {
                const isLoggedIn = this.forceRefreshLoginStatus();
                if (!isLoggedIn) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    this.showLoginRequiredModal();
                    return false;
                }
            };
            
            // Đánh dấu đã setup
            newButton.setAttribute('data-appointment-blocked', 'true');
        });
    }

    // Chạy liên tục để đảm bảo tất cả nút appointment đều có thông báo
    startAppointmentButtonWatcher() {
        setInterval(() => {
            // Chạy logic setup notification
            this.setupAppointmentNotification();
            
            // Tìm tất cả nút appointment với nhiều selector
            const selectors = [
                'a[href="./appointment.html"]',
                'a[href="appointment.html"]',
                'a[href="/appointment.html"]',
                '.appointment-btn',
                '[data-href*="appointment"]'
            ];
            
            let appointmentButtons = [];
            selectors.forEach(selector => {
                try {
                    const buttons = document.querySelectorAll(selector);
                    appointmentButtons = appointmentButtons.concat(Array.from(buttons));
                } catch (e) {
                    // Bỏ qua selector không hợp lệ
                }
            });
            
            // Loại bỏ duplicate
            appointmentButtons = [...new Set(appointmentButtons)];
            
            appointmentButtons.forEach((button) => {
                // Kiểm tra xem button có data attribute đánh dấu đã setup chưa
                if (!button.hasAttribute('data-appointment-blocked')) {
                    console.log('Found new appointment button, setting up block...');
                    button.setAttribute('data-appointment-blocked', 'true');
                    
                    // Thêm event listener hiển thị thông báo với capture phase
                    button.addEventListener('click', (e) => {
                        const isLoggedIn = this.forceRefreshLoginStatus();
                        if (!isLoggedIn) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            e.stopPropagation();
                            this.showLoginRequiredModal();
                            return false;
                        }
                    }, true);
                    
                    // Thêm onclick handler trực tiếp
                    button.onclick = (e) => {
                        const isLoggedIn = this.forceRefreshLoginStatus();
                        if (!isLoggedIn) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            e.stopPropagation();
                            this.showLoginRequiredModal();
                            return false;
                        }
                    };
                }
            });
        }, 1000); // Kiểm tra mỗi 1 giây
    }

    // Force refresh trạng thái đăng nhập
    forceRefreshLoginStatus() {
        console.log('=== FORCE REFRESH LOGIN STATUS ===');
        
        // Kiểm tra lại UserSessionManager
        if (window.userSessionManager) {
            this.userSessionManager = window.userSessionManager;
            console.log('✅ Updated UserSessionManager reference');
        }
        
        // Force refresh từ localStorage
        if (this.userSessionManager) {
            this.userSessionManager.userInfo = this.userSessionManager.getUserInfo();
            console.log('✅ Force refreshed userInfo:', this.userSessionManager.userInfo);
        }
        
        // KIỂM TRA UI TRƯỚC - Nếu UI hiển thị user đã đăng nhập thì bypass tất cả logic khác
        const userNameDisplay = document.querySelector('#user-name-display');
        const userDropdown = document.querySelector('.dropdown-user');
        const hasUserNameInUI = userNameDisplay && userNameDisplay.textContent && userNameDisplay.textContent.trim() !== '';
        const hasUserMenu = userDropdown && userDropdown.innerHTML.includes('Đăng xuất');
        
        console.log('UI Check - userNameDisplay:', userNameDisplay?.textContent);
        console.log('UI Check - hasUserNameInUI:', hasUserNameInUI);
        console.log('UI Check - hasUserMenu:', hasUserMenu);
        
        // Nếu UI hiển thị user đã đăng nhập thì coi như đã đăng nhập
        if (hasUserNameInUI || hasUserMenu) {
            console.log('✅ UI indicates user is logged in - BYPASSING ALL OTHER CHECKS');
            return true;
        }
        
        // Kiểm tra lại trạng thái
        const finalStatus = this.checkLoginStatus();
        console.log('Final login status after force refresh:', finalStatus);
        return finalStatus;
    }

    // Hiển thị modal yêu cầu đăng nhập
    showLoginRequiredModal() {
        // Tạo modal HTML
        const modalHTML = `
            <div id="login-required-modal" class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-lock me-2"></i>Yêu cầu đăng nhập
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <div class="mb-3">
                                <i class="fas fa-calendar-check fa-3x text-primary mb-3"></i>
                                <h5>Vui lòng đăng nhập để đặt lịch hẹn</h5>
                                <p class="text-muted">Bạn cần đăng nhập để có thể đặt lịch hẹn với bác sĩ</p>
                            </div>
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>Đóng
                            </button>
                            <a href="./login.html" class="btn btn-primary">
                                <i class="fas fa-sign-in-alt me-2"></i>Đăng nhập
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Xóa modal cũ nếu có
        const existingModal = document.getElementById('login-required-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Thêm modal vào body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Xử lý đóng modal
        const modal = document.getElementById('login-required-modal');
        const closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"], .btn-close');
        
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        // Đóng modal khi click bên ngoài
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Đóng modal khi nhấn ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    // Kiểm tra trạng thái đăng nhập khi chuyển trang
    checkLoginStatus() {
        console.log('=== DEBUG: checkLoginStatus() called ===');
        
        // Kiểm tra UserSessionManager có tồn tại không
        if (!this.userSessionManager) {
            console.log('❌ UserSessionManager not found');
            return false;
        }
        
        console.log('✅ UserSessionManager exists');
        
        // Kiểm tra trạng thái đăng nhập từ UserSessionManager
        const isLoggedIn = this.userSessionManager.isLoggedIn();
        console.log('UserSessionManager.isLoggedIn() result:', isLoggedIn);
        
        // Kiểm tra thêm từ localStorage trực tiếp
        const storageKey = 'kivicare_user_session';
        const userData = localStorage.getItem(storageKey);
        console.log('localStorage user data:', userData);
        
        // KIỂM TRA THÊM TỪ UI - Nếu có tên user hiển thị thì coi như đã đăng nhập
        const userNameDisplay = document.querySelector('#user-name-display');
        const userDropdown = document.querySelector('.dropdown-user');
        const hasUserNameInUI = userNameDisplay && userNameDisplay.textContent && userNameDisplay.textContent.trim() !== '';
        const hasUserMenu = userDropdown && userDropdown.innerHTML.includes('Đăng xuất');
        
        console.log('UI Check - userNameDisplay:', userNameDisplay?.textContent);
        console.log('UI Check - hasUserNameInUI:', hasUserNameInUI);
        console.log('UI Check - hasUserMenu:', hasUserMenu);
        
        // Nếu UI hiển thị user đã đăng nhập thì coi như đã đăng nhập
        if (hasUserNameInUI || hasUserMenu) {
            console.log('✅ UI indicates user is logged in');
            return true;
        }
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                console.log('Parsed user data:', user);
                
                // Nếu có user data trong localStorage, coi như đã đăng nhập
                const hasUserData = user && (user.email || user.fullName || user.userId);
                console.log('localStorage has user data:', hasUserData);
                
                // Nếu localStorage có user data nhưng UserSessionManager nói chưa đăng nhập
                if (hasUserData && !isLoggedIn) {
                    console.log('⚠️ Inconsistency detected: localStorage has user data but UserSessionManager says not logged in');
                    // Cập nhật UserSessionManager
                    this.userSessionManager.userInfo = user;
                    console.log('✅ Updated UserSessionManager.userInfo');
                    return true;
                }
                
                console.log('Final result from localStorage check:', hasUserData);
                return hasUserData;
            } catch (e) {
                console.log('❌ Error parsing localStorage user data:', e);
                return isLoggedIn;
            }
        } else {
            console.log('❌ No user data in localStorage');
        }
        
        console.log('Final result:', isLoggedIn);
        return isLoggedIn;
    }
}

// Khởi tạo IndexIntegration khi trang load
let indexIntegration;
document.addEventListener('DOMContentLoaded', function() {
    indexIntegration = new IndexIntegration();
    // Export để sử dụng trong các file khác
    window.indexIntegration = indexIntegration;
});

// Khởi tạo ngay lập tức nếu DOM đã sẵn sàng
if (document.readyState === 'loading') {
    // DOM chưa load xong, chờ DOMContentLoaded
} else {
    // DOM đã sẵn sàng, khởi tạo ngay
    indexIntegration = new IndexIntegration();
    window.indexIntegration = indexIntegration;
}

// Thêm method debug vào window để test từ console
window.debugLoginStatus = function() {
    console.log('=== DEBUG LOGIN STATUS FROM CONSOLE ===');
    if (window.indexIntegration) {
        window.indexIntegration.forceRefreshLoginStatus();
    } else {
        console.log('❌ indexIntegration not found');
    }
    
    if (window.userSessionManager) {
        console.log('userSessionManager exists:', !!window.userSessionManager);
        console.log('userSessionManager.isLoggedIn():', window.userSessionManager.isLoggedIn());
        console.log('userSessionManager.userInfo:', window.userSessionManager.userInfo);
    } else {
        console.log('❌ userSessionManager not found');
    }
    
    console.log('localStorage kivicare_user_session:', localStorage.getItem('kivicare_user_session'));
    console.log('localStorage token:', localStorage.getItem('token'));
    console.log('localStorage userInfo:', localStorage.getItem('userInfo'));
};

// Thêm method để test appointment button click
window.testAppointmentClick = function() {
    console.log('=== TESTING APPOINTMENT BUTTON CLICK ===');
    const appointmentButtons = document.querySelectorAll('a[href="./appointment.html"], .appointment-btn');
    console.log('Found appointment buttons:', appointmentButtons.length);
    
    if (appointmentButtons.length > 0) {
        console.log('Clicking first appointment button...');
        appointmentButtons[0].click();
    } else {
        console.log('No appointment buttons found');
    }
};

// Thêm method để check UI status
window.checkUIStatus = function() {
    console.log('=== CHECKING UI STATUS ===');
    const userNameDisplay = document.querySelector('#user-name-display');
    const userDropdown = document.querySelector('.dropdown-user');
    
    console.log('userNameDisplay element:', userNameDisplay);
    console.log('userNameDisplay text:', userNameDisplay?.textContent);
    console.log('userDropdown element:', userDropdown);
    console.log('userDropdown HTML:', userDropdown?.innerHTML);
    console.log('Has logout button:', userDropdown?.innerHTML.includes('Đăng xuất'));
    
    // Kiểm tra tất cả elements có thể chứa tên user
    const allElements = document.querySelectorAll('*');
    const userElements = Array.from(allElements).filter(el => 
        el.textContent && el.textContent.includes('Giang Nguyễn Đức')
    );
    console.log('Elements containing user name:', userElements);
}; 