// User Session Manager - Quản lý thông tin đăng nhập người dùng
class UserSessionManager {
    constructor() {
        this.storageKey = 'kivicare_user_session';
        this.legacyKey = 'userInfo';
        this.userInfo = this.getUserInfo();
        this.migrateLegacyUserInfo();
        this.init();
    }

    // Di chuyển dữ liệu từ key cũ sang key mới nếu có
    migrateLegacyUserInfo() {
        const legacyData = localStorage.getItem(this.legacyKey);
        if (legacyData && !localStorage.getItem(this.storageKey)) {
            try {
                const user = JSON.parse(legacyData);
                // Chỉ lấy các trường cơ bản
                const migrated = {
                    email: user.email || '',
                    fullName: user.fullName || user.userName || '',
                    userType: user.userType || '',
                    token: user.token || localStorage.getItem('token') || '',
                    userId: user.userId || user.id || ''
                };
                localStorage.setItem(this.storageKey, JSON.stringify(migrated));
                this.userInfo = migrated;
            } catch (e) {
                // Nếu lỗi thì bỏ qua
            }
        }
    }

    // Lấy thông tin user từ localStorage (ưu tiên key mới, fallback key cũ)
    getUserInfo() {
        let userData = localStorage.getItem(this.storageKey);
        if (!userData) {
            userData = localStorage.getItem(this.legacyKey);
        }
        return userData ? JSON.parse(userData) : null;
    }

    // Lưu thông tin user vào localStorage
    saveUserInfo(userData) {
        localStorage.setItem(this.storageKey, JSON.stringify(userData));
        this.userInfo = userData;
        this.updateUI();
    }

    // Xóa thông tin user
    clearUserInfo() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.legacyKey);
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userId');
        this.userInfo = null;
        this.updateUI();
    }

    // Kiểm tra user đã đăng nhập chưa
    isLoggedIn() {
        // Kiểm tra từ localStorage trước
        const currentUserInfo = this.getUserInfo();
        console.log('UserSessionManager.isLoggedIn() - currentUserInfo:', currentUserInfo);
        
        // Nếu có userInfo trong localStorage, coi như đã đăng nhập
        if (currentUserInfo) {
            // Cập nhật userInfo nếu có thay đổi
            if (!this.userInfo || JSON.stringify(this.userInfo) !== JSON.stringify(currentUserInfo)) {
                this.userInfo = currentUserInfo;
                console.log('Updated userInfo from localStorage:', this.userInfo);
            }
            console.log('User is logged in (has userInfo)');
            return true;
        }
        
        // Fallback về userInfo trong memory
        const memoryResult = this.userInfo !== null;
        console.log('Fallback to memory userInfo:', this.userInfo, 'Result:', memoryResult);
        return memoryResult;
    }

    // Cập nhật giao diện dựa trên trạng thái đăng nhập
    updateUI() {
        const userDropdown = document.querySelector('.dropdown-user');
        if (!userDropdown) return;

        if (this.isLoggedIn()) {
            // User đã đăng nhập - hiển thị thông tin user
            userDropdown.innerHTML = `
                <li>
                    <div class="dropdown-item d-flex align-items-center">
                        <div class="avatar-40 rounded-circle bg-primary d-flex align-items-center justify-content-center me-3">
                            <i class="fas fa-user text-white"></i>
                        </div>
                        <div>
                            <h6 class="mb-0">${this.userInfo.fullName || this.userInfo.email}</h6>
                            <small class="text-muted">${this.userInfo.userType || 'User'}</small>
                        </div>
                    </div>
                </li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="./my-account.html">
                    <i class="fas fa-user-cog me-2"></i>Tài khoản của tôi
                </a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" onclick="userSessionManager.logout()">
                    <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
                </a></li>
            `;
        } else {
            // User chưa đăng nhập - hiển thị menu đăng nhập/đăng ký
            userDropdown.innerHTML = `
                <li><a class="dropdown-item border-bottom" href="./login.html">Đăng nhập</a></li>
                <li><a class="dropdown-item" href="./registration.html">Đăng ký</a></li>
            `;
        }
    }

    // Xử lý đăng xuất
    async logout() {
        try {
            // Gọi API logout trước
            if (this.userInfo && this.userInfo.token) {
                const baseUrl = window.API_CONFIG ? window.API_CONFIG.getUrl('/api/Authentication/logout') : 'https://localhost:7097/api/Authentication/logout';
                const response = await fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.userInfo.token}`
                    }
                });
                
                if (response.ok) {
                    console.log('Logout API call successful');
                } else {
                    console.warn('Logout API call failed, but continuing with local logout');
                }
            }
        } catch (error) {
            console.warn('Error calling logout API:', error);
        }
        
        // Xóa thông tin local và chuyển về trang chủ
        this.clearUserInfo();
        window.location.href = './index.html';
    }

    // Khởi tạo
    init() {
        this.updateUI();
        
        // Lắng nghe sự kiện storage change (khi user đăng nhập từ tab khác)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.userInfo = e.newValue ? JSON.parse(e.newValue) : null;
                this.updateUI();
            }
        });
    }

    // API để đăng nhập
    async login(email, password, userType) {
        try {
            const baseUrl = window.API_CONFIG ? window.API_CONFIG.getUrl('/api/Authentication/login') : 'https://localhost:7097/api/Authentication/login';
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    userType: userType
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Lưu thông tin user
                    this.saveUserInfo({
                        email: email,
                        fullName: data.data.fullName || email,
                        userType: userType,
                        token: data.data.token,
                        userId: data.data.userId
                    });
                    return { success: true, message: 'Đăng nhập thành công!' };
                } else {
                    return { success: false, message: data.message || 'Đăng nhập thất bại!' };
                }
            } else {
                const errorData = await response.json();
                return { success: false, message: errorData.message || 'Đăng nhập thất bại!' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Lỗi kết nối! Vui lòng thử lại.' };
        }
    }

    // API để đăng ký
    async register(userData) {
        try {
            const baseUrl = window.API_CONFIG ? window.API_CONFIG.getUrl('/api/Authentication/register') : 'https://localhost:7097/api/Authentication/register';
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    return { success: true, message: 'Đăng ký thành công!' };
                } else {
                    return { success: false, message: data.message || 'Đăng ký thất bại!' };
                }
            } else {
                const errorData = await response.json();
                return { success: false, message: errorData.message || 'Đăng ký thất bại!' };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Lỗi kết nối! Vui lòng thử lại.' };
        }
    }
}

// Khởi tạo UserSessionManager khi trang load
let userSessionManager;
document.addEventListener('DOMContentLoaded', function() {
    userSessionManager = new UserSessionManager();
});

// Export để sử dụng trong các file khác
window.userSessionManager = userSessionManager; 