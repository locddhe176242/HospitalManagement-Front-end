// Clinic Integration for Appointment Page
class ClinicIntegration {
    constructor() {
        this.apiBaseUrl = 'https://localhost:7097';
        this.clinics = [];
        this.selectedClinic = null;
        this.searchTimeout = null;
        this.currentPage = 1; // Trang hiện tại
        this.clinicsPerPage = 2; // Số phòng khám mỗi trang (giảm xuống 1 để test phân trang)
        this.init();
    }

    init() {
        this.loadClinics();
        this.setupEventListeners();
        // Vô hiệu hóa nút Next ban đầu với delay để đảm bảo DOM đã sẵn sàng
        setTimeout(() => {
            this.disableNextButton();
        }, 100);
    }

    // Method để tìm nút Next
    findNextButton() {
        return document.querySelector('.appointment-content-active .next');
    }

    // Method để vô hiệu hóa nút Next
    disableNextButton() {
        const nextButton = this.findNextButton();
        if (nextButton) {
            nextButton.disabled = true;
            nextButton.classList.add('btn-disabled');
            nextButton.classList.remove('btn-enabled');
            // nextButton.title = 'Vui lòng chọn phòng khám để tiếp tục';
            console.log('[ClinicIntegration] Nút Next đã bị vô hiệu hóa');
        }
    }

    // Method để kích hoạt nút Next
    enableNextButton() {
        const nextButton = this.findNextButton();
        if (nextButton) {
            nextButton.disabled = false;
            nextButton.classList.remove('btn-disabled');
            nextButton.classList.add('btn-enabled');
            nextButton.title = 'Tiếp tục';
            console.log('[ClinicIntegration] Nút Next đã được kích hoạt');
        }
    }

    setupEventListeners() {
        // Search functionality: chỉ tìm kiếm khi click nút hoặc nhấn Enter
        const searchInput = document.querySelector('#clinic-search');
        const searchBtn = document.querySelector('#clinic-search-btn');
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                this.searchClinics(searchInput.value);
            });
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.searchClinics(searchInput.value);
                }
            });
            // Tự động trở về danh sách gốc khi xóa hết nội dung
            searchInput.addEventListener('input', (e) => {
                if (e.target.value.trim() === '') {
                    this.loadClinics();
                }
            });
        }
        // Next button functionality
        const nextButton = this.findNextButton();
        if (nextButton) {
            // Bắt cả sự kiện mousedown để hiện thông báo kể cả khi nút bị disable
            nextButton.addEventListener('mousedown', (e) => {
                if (nextButton.disabled) {
                    // this.showError('Bạn phải chọn phòng khám để tiếp tục.');
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            });
            nextButton.addEventListener('click', (e) => {
                if (!this.selectedClinic) {
                    // this.showError('Bạn phải chọn phòng khám để tiếp tục.');
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                // Chỉ khi đã chọn mới chuyển bước
                this.disableNextButton();
                setTimeout(() => { this.enableNextButton(); }, 1500);
                if (window.doctorIntegration) {
                    window.doctorIntegration.loadSelectedClinic();
                }
            });
        }
    }

    async loadClinics() {
        try {
            this.showLoading(true);
            
            // Sử dụng API endpoint từ AppointmentController để lấy phòng khám đang hoạt động
            const today = getTodayVN();
            const response = await fetch(`${this.apiBaseUrl}/api/Appointment/clinics?date=${today}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.clinics = result.data;
                this.renderClinics();
            } else {
                throw new Error(result.message || 'Không thể tải danh sách phòng khám');
            }
        } catch (error) {
            console.error('Error loading clinics:', error);
            this.showLoading(false);
        } finally {
            this.showLoading(false);
        }
    }

    async searchClinics(searchTerm) {
        if (!searchTerm || searchTerm.trim() === "") {
            // Nếu search term rỗng, load lại danh sách gốc
            this.loadClinics();
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiBaseUrl}/api/Appointment/clinics/search?name=${encodeURIComponent(searchTerm)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.clinics = result.data;
                this.renderClinics();
            } else {
                // Nếu có lỗi từ API, hiển thị danh sách rỗng thay vì throw error
                this.clinics = [];
                this.renderClinics();
            }
        } catch (error) {
            console.error('Error searching clinics:', error);
            // Nếu có lỗi network, hiển thị danh sách rỗng
            this.clinics = [];
            this.renderClinics();
        } finally {
            this.showLoading(false);
        }
    }

    renderClinics() {
        const container = document.querySelector('#clinic-container');
        if (!container) return;

        container.innerHTML = '';

        if (this.clinics.length === 0) {
            // Kiểm tra xem có đang tìm kiếm hay không
            const searchInput = document.querySelector('#clinic-search');
            const isSearching = searchInput && searchInput.value.trim() !== '';
            
            if (isSearching) {
                container.innerHTML = `
                    <div class="col-12 text-center">
                        <p class="text-muted">Không tìm thấy phòng khám nào phù hợp với từ khóa tìm kiếm.</p>
                        <button class="btn btn-outline-primary mt-2" onclick="clinicIntegration.loadClinics()">
                            <i class="fas fa-arrow-left me-2"></i>Xem tất cả phòng khám
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="col-12 text-center">
                        <p class="text-muted">Không có phòng khám nào đang hoạt động.</p>
                        <button class="btn btn-outline-primary mt-2" onclick="clinicIntegration.loadClinics()">
                            <i class="fas fa-redo me-2"></i>Thử lại
                        </button>
                    </div>
                `;
            }
            return;
        }

        // PHÂN TRANG
        const totalClinics = this.clinics.length;
        const totalPages = Math.max(1, Math.ceil(totalClinics / this.clinicsPerPage));
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        if (this.currentPage < 1) this.currentPage = 1;
        const startIdx = (this.currentPage - 1) * this.clinicsPerPage;
        const endIdx = startIdx + this.clinicsPerPage;
        const clinicsToShow = this.clinics.slice(startIdx, endIdx);

        clinicsToShow.forEach((clinic, index) => {
            const clinicCard = this.createClinicCard(clinic, startIdx + index);
            container.appendChild(clinicCard);
        });

        // Khôi phục trạng thái đã chọn sau khi render
        if (this.selectedClinic) {
            const selectedRadio = document.querySelector(`#clinic_${this.selectedClinic.id}`);
            if (selectedRadio) {
                selectedRadio.checked = true;
                console.log('[ClinicIntegration] Đã khôi phục trạng thái chọn phòng khám:', this.selectedClinic.name);
            }
        }

        // Luôn render lại phân trang mỗi lần renderClinics
        this.renderClinicPagination(totalPages);
    }

    renderClinicPagination(totalPages) {
        if (totalPages <= 1) return; // Không hiển thị phân trang nếu chỉ có 1 trang
        
        // Tìm container cha của nút Tiếp theo
        const actionRow = document.querySelector('.appointment-content-active .d-flex.align-items-center.px-3.mb-3.mt-3');
        if (actionRow) {
            actionRow.classList.remove('justify-content-end');
            actionRow.classList.add('justify-content-between');
            // Xóa phân trang cũ nếu có
            const oldPag = actionRow.querySelector('.clinic-pagination-outer');
            if (oldPag) oldPag.remove();
            
            // Tạo phân trang mới
            const paginationDiv = document.createElement('div');
            paginationDiv.className = 'clinic-pagination-outer';
            
            let html = '<div class="clinic-pagination-wrap-advanced">';
            
            // Nút đầu tiên
            html += `<button type="button" class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" data-page="1" ${this.currentPage === 1 ? 'disabled' : ''}>
                        <span>&laquo;</span>
                     </button>`;
            
            // Nút trước
            html += `<button type="button" class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
                        <span>&lsaquo;</span>
                     </button>`;
            
            // Logic hiển thị số trang
            const pageNumbers = this.generatePageNumbers(this.currentPage, totalPages);
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
            html += `<button type="button" class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''}>
                        <span>&rsaquo;</span>
                     </button>`;
            
            // Nút cuối cùng
            html += `<button type="button" class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" data-page="${totalPages}" ${this.currentPage === totalPages ? 'disabled' : ''}>
                        <span>&raquo;</span>
                     </button>`;
            
            html += '</div>';
            paginationDiv.innerHTML = html;
            
            // Thêm vào bên trái actionRow
            actionRow.prepend(paginationDiv);
            
            // Gán sự kiện cho tất cả nút
            setTimeout(() => {
                const allBtns = paginationDiv.querySelectorAll('.pagination-btn:not(.disabled)');
                allBtns.forEach(btn => {
                    btn.onclick = () => {
                        const page = parseInt(btn.dataset.page);
                        if (page && page !== this.currentPage) {
                            this.currentPage = page;
                            this.renderClinics();
                        }
                    };
                });
            }, 0);
        }
    }

    generatePageNumbers(current, total) {
        const pages = [];
        
        if (total <= 7) {
            // Nếu ít hơn 7 trang, hiển thị tất cả
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
        } else {
            // Logic phức tạp cho nhiều trang
            if (current <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', total);
            } else if (current >= total - 3) {
                pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
            } else {
                pages.push(1, '...', current - 1, current, current + 1, '...', total);
            }
        }
        
        return pages;
    }

    createClinicCard(clinic, index) {
        const col = document.createElement('div');
        col.className = 'col-sm-6' + (index > 0 ? ' mt-sm-0 mt-4' : '');
        
        const defaultImage = './assets/images/pages/clinic-1.webp';
        const clinicImage = clinic.imageUrl || defaultImage;
        
        // Kiểm tra xem phòng khám này có được chọn không
        const isSelected = this.selectedClinic && this.selectedClinic.id === clinic.id;
        
        col.innerHTML = `
            <div class="form-check form-check-inline m-0 p-0 position-relative d-block box-checked">
                <input type="radio" name="clinicRadios" class="form-check-input clinic-radio" 
                       id="clinic_${clinic.id}" value="${clinic.id}" ${clinic.isFull ? 'disabled' : ''} ${isSelected ? 'checked' : ''}>
                <label class="form-check-label d-inline-block w-100" for="clinic_${clinic.id}">
                    <span class="d-block appointment-clinic-box p-4 text-center ${clinic.isFull ? 'opacity-50' : ''}">
                        <span class="d-block mb-4">
                            <img alt="${clinic.name}" src="${clinicImage}" height="80" width="80" 
                                 class="rounded-circle object-cover" onerror="this.src='${defaultImage}'">
                        </span>
                        <span class="d-block h5 mb-2">${clinic.name}</span>
                        <span class="text-body">${clinic.address || 'Địa chỉ chưa cập nhật'}</span>
                        <span class="d-block h6 mt-3 mb-1 fw-500">Thư điện tử</span>
                        <span class="text-body">${clinic.email || 'Email chưa cập nhật'}</span>
                        ${clinic.isFull ? '<span class="badge bg-danger mt-2">Đã kín lịch</span>' : ''}
                    </span>
                </label>
            </div>
        `;

        // Add event listener for clinic selection
        const radio = col.querySelector('.clinic-radio');
        if (!clinic.isFull) {
            radio.addEventListener('change', (e) => {
                this.handleClinicSelection(clinic);
            });
        } else {
            // Nếu là full, khi click vào label/card thì hiện toast
            const label = col.querySelector('label');
            label.style.cursor = 'not-allowed';
            label.addEventListener('click', (e) => {
                e.preventDefault();
                // showGlobalToast('Phòng khám này đã kín lịch, vui lòng chọn phòng khám khác.');
            });
        }

        return col;
    }

    handleClinicSelection(clinic) {
        this.selectedClinic = clinic;
        console.log('Selected clinic:', clinic);
        
        // Store selected clinic in session storage for later use
        sessionStorage.setItem('selectedClinic', JSON.stringify(clinic));
        // Enable next button if clinic is selected
        this.enableNextButton();
    }

    handleNextStep() {
        if (!this.selectedClinic) {
            // Ngăn chặn chuyển bước
            return false;
        }
        // Logic chuyển bước chỉ chạy khi đã chọn
        console.log('Proceeding to next step with clinic:', this.selectedClinic);
        return true;
    }

    showLoading(show) {
        const container = document.querySelector('#clinic-container');
        if (!container) return;

        if (show) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <p class="mt-2">Đang tải danh sách phòng khám...</p>
                </div>
            `;
        }
    }

    // Public method to get selected clinic
    getSelectedClinic() {
        return this.selectedClinic;
    }

    // Public method to clear selection
    clearSelection() {
        this.selectedClinic = null;
        sessionStorage.removeItem('selectedClinic');
        const radios = document.querySelectorAll('.clinic-radio');
        radios.forEach(radio => radio.checked = false);
        // Vô hiệu hóa nút Next khi xóa lựa chọn
        this.disableNextButton();
    }

    // Public method to clear search
    clearSearch() {
        const searchInput = document.querySelector('#clinic-search');
        if (searchInput) {
            searchInput.value = '';
        }
        this.loadClinics();
    }

    // Khi load lại tab, kiểm tra sessionStorage để set trạng thái nút
    checkNextButtonState() {
        // Kiểm tra xem có phòng khám đã chọn không
        const clinicData = sessionStorage.getItem('selectedClinic');
        if (clinicData) {
            this.selectedClinic = JSON.parse(clinicData);
            this.enableNextButton();
            console.log('[ClinicIntegration] Đã khôi phục trạng thái nút Next từ sessionStorage');
        } else {
            this.disableNextButton();
            console.log('[ClinicIntegration] Không có phòng khám đã chọn, vô hiệu hóa nút Next');
        }
    }
}

// Helper: Lấy ngày hiện tại theo múi giờ Việt Nam (UTC+7)
function getTodayVN() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + now.getTimezoneOffset() + 420);
  return now.toISOString().split('T')[0];
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

// Initialize clinic integration when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the appointment page and in the clinic selection step
    const clinicSection = document.querySelector('.appointment-content-active');
    if (clinicSection && clinicSection.querySelector('.tab-widget-inner-data')) {
        window.clinicIntegration = new ClinicIntegration();
        // Kiểm tra trạng thái nút khi load lại tab
        setTimeout(() => {
            if (window.clinicIntegration && window.clinicIntegration.checkNextButtonState) {
                window.clinicIntegration.checkNextButtonState();
            }
        }, 100);
    }
});

// Export for use in other files
window.ClinicIntegration = ClinicIntegration; 