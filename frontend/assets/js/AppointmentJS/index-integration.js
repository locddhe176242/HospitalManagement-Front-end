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
            } else {
                console.warn('UserSessionManager chưa được khởi tạo');
            }
        }, 200);
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

        // Lắng nghe sự kiện click vào nút đặt lịch
        const appointmentButtons = document.querySelectorAll('a[href="./appointment.html"], .appointment-btn');
        appointmentButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (!this.userSessionManager || !this.userSessionManager.isLoggedIn()) {
                    e.preventDefault();
                    alert('Vui lòng đăng nhập để đặt lịch hẹn!');
                    window.location.href = './login.html';
                }
            });
        });
    }

    // Kiểm tra trạng thái đăng nhập khi chuyển trang
    checkLoginStatus() {
        if (!this.userSessionManager) return false;
        return this.userSessionManager.isLoggedIn();
    }
}

// Khởi tạo IndexIntegration khi trang load
let indexIntegration;
document.addEventListener('DOMContentLoaded', function() {
    indexIntegration = new IndexIntegration();
});

// Export để sử dụng trong các file khác
window.indexIntegration = indexIntegration; 