// Doctor Integration for Appointment Page
class DoctorIntegration {
    constructor() {
        this.apiBaseUrl = 'https://localhost:7097';
        this.doctors = [];
        this.selectedDoctor = null;
        this.selectedClinic = null;
        this.currentPage = 1;
        this.doctorsPerPage = 2;
        this.init();
    }

    init() {
        this.loadSelectedClinic();
        this.setupEventListeners();
        // Disable next button initially
        this.disableNextButton();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('#doctor-search');
        const searchBtn = document.querySelector('#doctor-search-btn');
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                this.loadDoctors(searchInput.value);
            });
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.loadDoctors(searchInput.value);
                }
            });
            // Tự động trở về danh sách gốc khi xóa hết nội dung
            searchInput.addEventListener('input', (e) => {
                if (e.target.value.trim() === '') {
                    this.loadDoctors();
                }
            });
        }

        // Next button functionality
        const nextButton = this.findNextButton();
        if (nextButton) {
            // Bắt cả sự kiện mousedown để hiện thông báo kể cả khi nút bị disable
            nextButton.addEventListener('mousedown', (e) => {
                if (nextButton.disabled) {
                    return false;
                }
            });
            nextButton.addEventListener('click', (e) => {
                if (!this.selectedDoctor) {
                    return false;
                }
                // Chỉ khi đã chọn mới chuyển bước
                this.disableNextButton();
                setTimeout(() => { this.enableNextButton(); }, 1500);
                
                // Đảm bảo ServiceIntegration được khởi tạo và load dữ liệu
                setTimeout(() => {
                    if (typeof window.ensureServiceIntegration === 'function') {
                        console.log('[DoctorIntegration] Gọi ensureServiceIntegration');
                        window.ensureServiceIntegration();
                    } else {
                        // Fallback nếu function global chưa có
                        console.log('[DoctorIntegration] Fallback: khởi tạo ServiceIntegration trực tiếp');
                        if (!window.serviceIntegration) {
                            window.serviceIntegration = new ServiceIntegration();
                        } else {
                    window.serviceIntegration.loadSelectedDoctor();
                }
                    }
                }, 100); // Delay nhỏ để đảm bảo tab đã chuyển
            });
        }

        // Back button functionality
        const backButton = document.querySelector('.appointment-tab-content .back');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.handleBackStep();
            });
        }
    }

    // Method to find next button
    findNextButton() {
        return document.querySelector('.appointment-tab-content .next');
    }

    // Method to disable next button with visual feedback
    disableNextButton() {
        const nextButton = this.findNextButton();
        if (nextButton) {
            nextButton.disabled = true;
            nextButton.classList.add('btn-disabled');
            nextButton.classList.remove('btn-enabled');
            nextButton.title = 'Vui lòng chọn bác sĩ để tiếp tục';
            console.log('[DoctorIntegration] Next button disabled');
        }
    }

    // Method to enable next button with visual feedback
    enableNextButton() {
        const nextButton = this.findNextButton();
        if (nextButton) {
            nextButton.disabled = false;
            nextButton.classList.remove('btn-disabled');
            nextButton.classList.add('btn-enabled');
            nextButton.title = 'Tiếp tục';
            console.log('[DoctorIntegration] Next button enabled');
        }
    }

    loadSelectedClinic() {
        // Lấy phòng khám đã chọn từ session storage
        const clinicData = sessionStorage.getItem('selectedClinic');
        if (clinicData) {
            this.selectedClinic = JSON.parse(clinicData);
            this.selectedDoctor = null; // Clear doctor selection khi đổi phòng khám
            sessionStorage.removeItem('selectedDoctor'); // Clear from session storage
            
            // Clear calendar working days
            if (typeof window.clearDoctorWorkingDays === 'function') {
                window.clearDoctorWorkingDays();
            }
            
            this.loadDoctors(); // Luôn gọi lại API khi vào tab này hoặc đổi phòng khám
        } else {
            console.error('No clinic selected. Please select a clinic first.');
            // this.showError('Vui lòng chọn phòng khám trước khi chọn bác sĩ.');
        }
    }

    async loadDoctors(searchTerm = '') {
        if (!this.selectedClinic) {
            // this.showError('Vui lòng chọn phòng khám trước.');
            return;
        }
        try {
            this.showLoading(true);
            const today = getTodayVN();
            const response = await fetch(`${this.apiBaseUrl}/api/Appointment/doctors/${this.selectedClinic.id}?date=${today}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.success) {
                let doctors = result.data;
                if (searchTerm.trim()) {
                    const lower = searchTerm.trim().toLowerCase();
                    doctors = doctors.filter(d => d.name.toLowerCase().includes(lower));
                }
                this.doctors = doctors;
                this.renderDoctors();
            } else {
                throw new Error(result.message || 'Không thể tải danh sách bác sĩ');
            }
        } catch (error) {
            console.error('Error loading doctors:', error);
            // this.showError('Không thể tải danh sách bác sĩ. Vui lòng thử lại sau.');
        } finally {
            this.showLoading(false);
        }
    }

    renderDoctors() {
        const container = document.querySelector('#doctor-container');
        if (!container) return;

        console.log('[DoctorIntegration] === renderDoctors START ===');
        console.log('[DoctorIntegration] doctors.length:', this.doctors.length);
        console.log('[DoctorIntegration] doctorsPerPage:', this.doctorsPerPage);

        // Clear container first
        container.innerHTML = '';

        // FORCE cleanup old pagination from EVERYWHERE
        this.forceCleanupAllPagination();

        if (this.doctors.length === 0) {
            console.log('[DoctorIntegration] No doctors found');
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">Không tìm thấy bác sĩ nào trong phòng khám này.</p>
                </div>
            `;
            return;
        }

        // Calculate pagination
        const totalPages = Math.ceil(this.doctors.length / this.doctorsPerPage);
        console.log('[DoctorIntegration] totalPages calculated:', totalPages);
        
        // Reset currentPage if it's invalid
        if (this.currentPage > totalPages) {
            this.currentPage = 1;
        }

        const startIndex = (this.currentPage - 1) * this.doctorsPerPage;
        const endIndex = startIndex + this.doctorsPerPage;
        const currentDoctors = this.doctors.slice(startIndex, endIndex);

        console.log('[DoctorIntegration] currentPage:', this.currentPage, 'startIndex:', startIndex, 'endIndex:', endIndex, 'currentDoctors:', currentDoctors.length);

        // Create and append doctor cards for current page
        currentDoctors.forEach((doctor, index) => {
            const doctorCard = this.createDoctorCard(doctor, index);
            container.appendChild(doctorCard);
        });

        // ALWAYS show pagination if we have at least 1 doctor
        const shouldShowPagination = this.doctors.length > 0;
        console.log('[DoctorIntegration] shouldShowPagination:', shouldShowPagination, '(doctors.length > 0)');
        
        if (shouldShowPagination) {
            console.log('[DoctorIntegration] ✅ WILL SHOW pagination');
            this.renderDoctorPagination(totalPages);
        } else {
            console.log('[DoctorIntegration] ❌ WILL NOT show pagination');
            // Reset currentPage to 1 when no pagination is needed
            this.currentPage = 1;
            // Force cleanup again to be sure
            this.forceCleanupAllPagination();
        }
        
        console.log('[DoctorIntegration] === renderDoctors END ===');
    }

    renderDoctorPagination(totalPages) {
        console.log('[DoctorIntegration] renderDoctorPagination called with totalPages:', totalPages, 'doctors.length:', this.doctors.length);
        
        // ALWAYS show pagination if we have doctors (no more restrictions)
        if (this.doctors.length === 0) {
            console.log('[DoctorIntegration] Skipping pagination render - no doctors');
            this.forceCleanupAllPagination();
            return;
        }
        
        // Ensure totalPages is at least 1
        const actualTotalPages = Math.max(1, totalPages);
        console.log('[DoctorIntegration] actualTotalPages:', actualTotalPages);
        
        // Tìm container cha của nút Tiếp theo - giống y hệt clinic pagination
        const actionRow = document.querySelector('.appointment-tab-content .d-flex.align-items-center.px-3.mb-3.mt-3');
        if (!actionRow) {
            console.log('[DoctorIntegration] Action row not found');
            return;
        }
        
        actionRow.classList.remove('justify-content-end');
        actionRow.classList.add('justify-content-between');
        
        // Xóa phân trang cũ nếu có
        const oldPag = actionRow.querySelector('.doctor-pagination-outer');
        if (oldPag) oldPag.remove();
        
        // Tạo phân trang mới
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'doctor-pagination-outer';
        
        let html = '<div class="doctor-pagination-wrap-advanced">';
        
        // Nút đầu tiên
        html += `<button type="button" class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" data-page="1" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <span>&laquo;</span>
                 </button>`;
        
        // Nút trước
        html += `<button type="button" class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <span>&lsaquo;</span>
                 </button>`;
        
        // Logic hiển thị số trang
        const pageNumbers = this.generatePageNumbers(this.currentPage, actualTotalPages);
        pageNumbers.forEach(page => {
            if (page === '...') {
                html += '<span class="pagination-ellipsis">...</span>';
            } else {
                html += `<button type="button" class="pagination-btn ${page === this.currentPage ? 'active' : ''}" data-page="${page}">
                            ${page}
                         </button>`;
            }
        });
        
        // Nút sau
        html += `<button type="button" class="pagination-btn ${this.currentPage === actualTotalPages ? 'disabled' : ''}" data-page="${this.currentPage + 1}" ${this.currentPage === actualTotalPages ? 'disabled' : ''}>
                    <span>&rsaquo;</span>
                 </button>`;
        
        // Nút cuối cùng
        html += `<button type="button" class="pagination-btn ${this.currentPage === actualTotalPages ? 'disabled' : ''}" data-page="${actualTotalPages}" ${this.currentPage === actualTotalPages ? 'disabled' : ''}>
                    <span>&raquo;</span>
                 </button>`;
        
        html += '</div>';
        paginationDiv.innerHTML = html;
        
        // Thêm vào bên trái actionRow
        actionRow.prepend(paginationDiv);
        
        console.log('[DoctorIntegration] Pagination rendered successfully with actualTotalPages:', actualTotalPages);
        
        // Gán sự kiện cho tất cả nút
        setTimeout(() => {
            const allBtns = paginationDiv.querySelectorAll('.pagination-btn:not(.disabled)');
            allBtns.forEach(btn => {
                btn.onclick = () => {
                    const page = parseInt(btn.dataset.page);
                    if (page && page !== this.currentPage && page >= 1 && page <= actualTotalPages) {
                        console.log('[DoctorIntegration] Changing to page:', page);
                        this.currentPage = page;
                        this.renderDoctors();
                    }
                };
            });
        }, 0);
    }

    generatePageNumbers(currentPage, totalPages) {
        const pageNumbers = [];
        const maxVisiblePages = 7;

        console.log('[DoctorIntegration] generatePageNumbers currentPage:', currentPage, 'totalPages:', totalPages);

        // Always show at least page 1
        if (totalPages <= 0) {
            pageNumbers.push(1);
            return pageNumbers;
        }

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pageNumbers.push(i);
                }
            } else {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            }
        }

        console.log('[DoctorIntegration] Generated page numbers:', pageNumbers);
        return pageNumbers;
    }

    createDoctorCard(doctor, index) {
        const col = document.createElement('div');
        col.className = 'col-sm-6' + (index > 0 ? ' mt-sm-0 mt-4' : '');
        
        const defaultImage = './assets/images/general/dralexandrajohnson.webp';
        const doctorImage = doctor.imageURL || defaultImage;
        
        // Tính tuổi từ ngày sinh
        const age = this.calculateAge(doctor.dob);
        
        col.innerHTML = `
            <div class="form-check form-check-inline m-0 p-0 position-relative d-block box-checked">
                <input type="radio" name="doctorRadios" class="form-check-input doctor-radio" 
                       id="doctor_${doctor.id}" value="${doctor.id}" data-name="${doctor.name}">
                <label class="form-check-label d-inline-block overflow-hidden w-100" for="doctor_${doctor.id}">
                    <span class="d-block appointment-doctor-box p-4 text-center position-relative">
                        <span class="d-block bg-light py-5 position-absolute top-0 start-0 end-0">
                            <span class="py-1"></span>
                        </span>
                        <span class="d-block mb-3 position-relative">
                            <img alt="${doctor.name}" src="${doctorImage}" height="80" width="80" 
                                 class="rounded-circle object-cover p-1 bg-white" onerror="this.src='${defaultImage}'">
                        </span>
                        <span class="d-block h5 mb-2">${doctor.name}</span>
                        <span class="d-flex align-items-center gap-1 justify-content-between">
                            <span class="border d-inline-block w-25"></span>
                            <span class="bg-secondary px-3 py-2 rounded-pill text-white">Kinh nghiệm: ${doctor.yearOfExperience} năm</span>
                            <span class="border d-inline-block w-25"></span>
                        </span>
                        <span class="d-block h6 mt-3 mb-1 fw-500">Thông tin liên hệ</span>
                        <span class="text-body">SĐT: ${doctor.phone || 'Chưa cập nhật'}</span>
                        <span class="d-block text-body">Tuổi: ${age} tuổi</span>
                        <span class="d-block text-body">Giới tính: ${this.getGenderText(doctor.gender)}</span>
                    </span>
                </label>
            </div>
        `;

        // Add event listener for doctor selection
        const radio = col.querySelector('.doctor-radio');
        radio.addEventListener('change', (e) => {
            this.handleDoctorSelection(doctor);
        });

        // Add event listener for doctor radio change
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.handleDoctorSelection(doctor);
            } else {
                // Clear calendar when doctor is unselected
                if (typeof window.clearDoctorWorkingDays === 'function') {
                    window.clearDoctorWorkingDays();
                }
            }
        });

        return col;
    }

    handleDoctorSelection(doctor) {
        this.selectedDoctor = doctor;
        console.log('Selected doctor:', doctor);
        
        // Store selected doctor in session storage for later use
        sessionStorage.setItem('selectedDoctor', JSON.stringify(doctor));
        
        // Update calendar with doctor's working days
        if (typeof window.updateDoctorWorkingDays === 'function') {
            window.updateDoctorWorkingDays(doctor.id);
        }
        
        // Enable next button if doctor is selected
        this.enableNextButton();
    }

    handleNextStep() {
        if (!this.selectedDoctor) {
            return false;
        }

        // Move to next step (this will be handled by existing appointment flow)
        console.log('Proceeding to next step with doctor:', this.selectedDoctor);
    }

    handleBackStep() {
        // Clear doctor selection when going back
        this.selectedDoctor = null;
        sessionStorage.removeItem('selectedDoctor');
        
        // Clear calendar working days
        if (typeof window.clearDoctorWorkingDays === 'function') {
            window.clearDoctorWorkingDays();
        }
        
        console.log('Going back to clinic selection');
    }

    showLoading(show) {
        const container = document.querySelector('#doctor-container');
        if (!container) return;

        if (show) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <p class="mt-2">Đang tải danh sách bác sĩ...</p>
                </div>
            `;
        }
    }

    showError(message) {
        // showGlobalToast(message); // XÓA TOÀN BỘ THÔNG BÁO LIÊN QUAN ĐẾN BÁC SĨ
    }

    // Helper methods
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    getGenderText(gender) {
        switch (gender) {
            case 0: return 'Nam';
            case 1: return 'Nữ';
            default: return 'Khác';
        }
    }

    // Public method to get selected doctor
    getSelectedDoctor() {
        return this.selectedDoctor;
    }

    // Public method to clear selection
    clearSelection() {
        this.selectedDoctor = null;
        sessionStorage.removeItem('selectedDoctor');
        const radios = document.querySelectorAll('.doctor-radio');
        radios.forEach(radio => radio.checked = false);
        this.disableNextButton();
        
        // Clear calendar working days
        if (typeof window.clearDoctorWorkingDays === 'function') {
            window.clearDoctorWorkingDays();
        }
    }

    // Khi load lại tab, kiểm tra sessionStorage để set trạng thái nút
    checkNextButtonState() {
        const doctorData = sessionStorage.getItem('selectedDoctor');
        if (doctorData) {
            this.selectedDoctor = JSON.parse(doctorData);
            this.enableNextButton();
            console.log('[DoctorIntegration] Restored doctor selection from sessionStorage');
        } else {
            this.disableNextButton();
            console.log('[DoctorIntegration] No doctor selected, button disabled');
        }
    }

    cleanupOldPagination() {
        // Find and remove any existing pagination
        const actionRow = document.querySelector('.appointment-tab-content .d-flex.align-items-center.px-3.mb-3.mt-3');
        if (actionRow) {
            const oldPag = actionRow.querySelector('.doctor-pagination-outer');
            if (oldPag) {
                oldPag.remove();
                console.log('[DoctorIntegration] Removed old pagination');
            }
            // Reset action row classes
            actionRow.classList.remove('justify-content-between');
            actionRow.classList.add('justify-content-end');
        }
    }

    forceCleanupAllPagination() {
        console.log('[DoctorIntegration] Force cleanup ALL pagination');
        
        // Method 1: Find all doctor pagination elements by class
        const allDoctorPaginations = document.querySelectorAll('.doctor-pagination-outer');
        allDoctorPaginations.forEach(el => {
            console.log('[DoctorIntegration] Removing pagination element:', el);
            el.remove();
        });
        
        // Method 2: Reset action row classes 
        const actionRows = document.querySelectorAll('.appointment-tab-content .d-flex.align-items-center.px-3.mb-3.mt-3');
        actionRows.forEach(actionRow => {
            actionRow.classList.remove('justify-content-between');
            actionRow.classList.add('justify-content-end');
            console.log('[DoctorIntegration] Reset action row classes');
        });
        
        // Method 3: Specific cleanup
        this.cleanupOldPagination();
        
        console.log('[DoctorIntegration] Force cleanup completed');
    }
}

function showGlobalToast(message) {
  const toast = document.getElementById('global-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, 2500);
}

// Helper: Lấy ngày hiện tại theo múi giờ Việt Nam (UTC+7)
function getTodayVN() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + now.getTimezoneOffset() + 420);
  return now.toISOString().split('T')[0];
}

// Initialize doctor integration when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the appointment page and in the doctor selection step
    const doctorSection = document.querySelector('.appointment-tab-content');
    if (doctorSection && doctorSection.querySelector('#doctor-container')) {
        window.doctorIntegration = new DoctorIntegration();
        // Check button state after initialization
        setTimeout(() => {
            if (window.doctorIntegration) {
                window.doctorIntegration.checkNextButtonState();
            }
        }, 100);
    }
});

// Export for use in other files
window.DoctorIntegration = DoctorIntegration; 