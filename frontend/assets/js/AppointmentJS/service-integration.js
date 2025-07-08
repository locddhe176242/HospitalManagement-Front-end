// Service Integration for Appointment Page
class ServiceIntegration {
    constructor() {
        this.apiBaseUrl = 'https://localhost:7097';
        this.services = [];
        this.selectedDoctor = null;
        this.selectedService = null;
        // Pagination variables
        this.currentPage = 1;
        this.servicesPerPage = 2; // Đặt thành 1 để dễ test pagination
        console.log('[ServiceIntegration] Constructor được gọi');
        this.init();
        this.setupEventListeners(); // Đảm bảo luôn gán event cho nút Next
    }

    init() {
        console.log('[ServiceIntegration] Init được gọi');
        this.loadSelectedDoctor();
    }

    // Method để cleanup khi cần khởi tạo lại
    destroy() {
        console.log('[ServiceIntegration] Destroy được gọi');
        // Cleanup any event listeners if needed
        this.services = [];
        this.selectedDoctor = null;
        this.selectedService = null;
        this.currentPage = 1;
    }

    loadSelectedDoctor() {
        // Lấy bác sĩ đã chọn từ session storage
        const doctorData = sessionStorage.getItem('selectedDoctor');
        if (doctorData) {
            this.selectedDoctor = JSON.parse(doctorData);
            console.log('[ServiceIntegration] Đã lấy selectedDoctor:', this.selectedDoctor);
            this.loadServices();
        } else {
            console.error('[ServiceIntegration] Không tìm thấy selectedDoctor trong sessionStorage');
        }
    }

    async loadServices() {
        if (!this.selectedDoctor) {
            console.error('[ServiceIntegration] Không có selectedDoctor khi loadServices');
            return;
        }
        try {
            this.showLoading(true);
            console.log('[ServiceIntegration] Gọi API lấy dịch vụ với doctorId:', this.selectedDoctor.id);
            const response = await fetch(`${this.apiBaseUrl}/api/Appointment/services-by-doctor/${this.selectedDoctor.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            console.log('[ServiceIntegration] Kết quả API:', result);
            if (result.success) {
                this.services = result.data;
                // Nếu không có dữ liệu thì tạo test data để test pagination
                if (this.services.length === 0) {
                    console.log('[ServiceIntegration] Không có dữ liệu từ API, tạo test data');
                    this.createTestServices();
                }
                this.renderServices();
            } else {
                console.log('[ServiceIntegration] API không thành công, tạo test data');
                this.createTestServices();
                this.renderServices();
            }
        } catch (error) {
            console.error('Error loading services:', error);
            console.log('[ServiceIntegration] Lỗi API, tạo test data');
            this.createTestServices();
            this.renderServices();
        } finally {
            this.showLoading(false);
        }
    }



    renderServices() {
        const container = document.querySelector('#service-container');
        console.log('[ServiceIntegration] === renderServices START ===');
        console.log('[ServiceIntegration] services.length:', this.services.length);
        console.log('[ServiceIntegration] servicesPerPage:', this.servicesPerPage);
        if (!container) return;
        
        container.innerHTML = '';

        // FORCE cleanup old pagination from EVERYWHERE
        this.forceCleanupAllPagination();
        
        // Luôn reset selectedService và sessionStorage khi render lại
        this.selectedService = null;
        sessionStorage.removeItem('selectedService');
        this.updateNextButtonState();

        if (this.services.length === 0) {
            console.log('[ServiceIntegration] No services found');
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">Không có dịch vụ nào cho bác sĩ này.</p>
                </div>
            `;
            return;
        }

        // Pagination logic
        const totalPages = Math.ceil(this.services.length / this.servicesPerPage);
        console.log('[ServiceIntegration] totalPages calculated:', totalPages);
        
        // Reset currentPage if it's invalid
        if (this.currentPage > totalPages) {
            this.currentPage = 1;
        }

        const startIndex = (this.currentPage - 1) * this.servicesPerPage;
        const endIndex = startIndex + this.servicesPerPage;
        const currentServices = this.services.slice(startIndex, endIndex);

        console.log('[ServiceIntegration] currentServices:', currentServices);

        // Render services for current page
        currentServices.forEach((service, index) => {
            const serviceCard = this.createServiceCard(service, index);
            container.appendChild(serviceCard);
        });

        // ALWAYS show pagination if we have at least 1 service
        const shouldShowPagination = this.services.length > 0;
        console.log('[ServiceIntegration] shouldShowPagination:', shouldShowPagination, '(services.length > 0)');
        
        if (shouldShowPagination) {
            console.log('[ServiceIntegration] ✅ WILL SHOW pagination');
            this.renderServicePagination(totalPages);
        } else {
            console.log('[ServiceIntegration] ❌ WILL NOT show pagination');
            // Reset currentPage to 1 when no pagination is needed
            this.currentPage = 1;
            // Force cleanup again to be sure
            this.forceCleanupAllPagination();
        }
        
        // Sau khi render xong, bỏ chọn tất cả radio dịch vụ
        setTimeout(() => {
            const radios = document.querySelectorAll('.service-radio');
            radios.forEach(radio => {
                radio.checked = false;
                radio.addEventListener('change', () => this.updateNextButtonState());
            });
            this.updateNextButtonState();
        }, 0);
        
        console.log('[ServiceIntegration] === renderServices END ===');
    }

    renderServicePagination(totalPages) {
        console.log('[ServiceIntegration] renderServicePagination called with totalPages:', totalPages, 'services.length:', this.services.length);
        
        // ALWAYS show pagination if we have services (no more restrictions)
        if (this.services.length === 0) {
            console.log('[ServiceIntegration] Skipping pagination render - no services');
            this.forceCleanupAllPagination();
            return;
        }
        
        // Ensure totalPages is at least 1
        const actualTotalPages = Math.max(1, totalPages);
        console.log('[ServiceIntegration] actualTotalPages:', actualTotalPages);
        
        // Find the action buttons container for service section
        const serviceContainer = document.querySelector('#service-container');
        const actionButtonsContainer = serviceContainer.parentElement.nextElementSibling;
        console.log('[ServiceIntegration] actionButtonsContainer:', actionButtonsContainer);
        
        if (!actionButtonsContainer) {
            console.log('[ServiceIntegration] Could not find action buttons container');
            return;
        }
        
        // Change the container class to justify-content-between to put pagination on left and buttons on right
        actionButtonsContainer.className = 'd-flex align-items-center justify-content-between px-3 mb-3 mt-3 gap-3';
        
        // Check if pagination already exists
        let paginationContainer = actionButtonsContainer.querySelector('.service-pagination-outer');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.className = 'service-pagination-outer';
            // Insert pagination as first child (left side)
            actionButtonsContainer.insertBefore(paginationContainer, actionButtonsContainer.firstChild);
            console.log('[ServiceIntegration] Created new pagination container in action row');
        } else {
            console.log('[ServiceIntegration] Using existing pagination container');
        }

        paginationContainer.innerHTML = `
            <div class="service-pagination-wrap-advanced">
                <div class="d-flex align-items-center justify-content-center gap-1 pagination-controls">
                    <button class="pagination-btn" onclick="window.serviceIntegration.goToPage(1)" ${this.currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-angle-double-left"></i>
                    </button>
                    <button class="pagination-btn" onclick="window.serviceIntegration.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-angle-left"></i>
                    </button>
                    ${this.generatePageNumbers(actualTotalPages)}
                    <button class="pagination-btn" onclick="window.serviceIntegration.goToPage(${this.currentPage + 1})" ${this.currentPage === actualTotalPages ? 'disabled' : ''}>
                        <i class="fas fa-angle-right"></i>
                    </button>
                    <button class="pagination-btn" onclick="window.serviceIntegration.goToPage(${actualTotalPages})" ${this.currentPage === actualTotalPages ? 'disabled' : ''}>
                        <i class="fas fa-angle-double-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        console.log('[ServiceIntegration] Pagination rendered successfully in action row with actualTotalPages:', actualTotalPages);
    }

    generatePageNumbers(totalPages) {
        console.log('[ServiceIntegration] generatePageNumbers currentPage:', this.currentPage, 'totalPages:', totalPages);
        const pageNumbers = [];
        
        // Always show at least page 1
        if (totalPages <= 0) {
            pageNumbers.push(`<button class="pagination-btn active" onclick="window.serviceIntegration.goToPage(1)">1</button>`);
            return pageNumbers.join('');
        }
        
        if (totalPages <= 7) {
            // Show all pages if 7 or fewer
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(`<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="window.serviceIntegration.goToPage(${i})">${i}</button>`);
            }
        } else {
            // Show smart ellipsis for more than 7 pages
            if (this.currentPage <= 4) {
                // Show first 5 pages, then ellipsis and last page
                for (let i = 1; i <= 5; i++) {
                    pageNumbers.push(`<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="window.serviceIntegration.goToPage(${i})">${i}</button>`);
                }
                pageNumbers.push(`<span class="pagination-btn disabled">...</span>`);
                pageNumbers.push(`<button class="pagination-btn" onclick="window.serviceIntegration.goToPage(${totalPages})">${totalPages}</button>`);
            } else if (this.currentPage >= totalPages - 3) {
                // Show first page, ellipsis, then last 5 pages
                pageNumbers.push(`<button class="pagination-btn" onclick="window.serviceIntegration.goToPage(1)">1</button>`);
                pageNumbers.push(`<span class="pagination-btn disabled">...</span>`);
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pageNumbers.push(`<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="window.serviceIntegration.goToPage(${i})">${i}</button>`);
                }
            } else {
                // Show first page, ellipsis, current page ± 1, ellipsis, last page
                pageNumbers.push(`<button class="pagination-btn" onclick="window.serviceIntegration.goToPage(1)">1</button>`);
                pageNumbers.push(`<span class="pagination-btn disabled">...</span>`);
                for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
                    pageNumbers.push(`<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="window.serviceIntegration.goToPage(${i})">${i}</button>`);
                }
                pageNumbers.push(`<span class="pagination-btn disabled">...</span>`);
                pageNumbers.push(`<button class="pagination-btn" onclick="window.serviceIntegration.goToPage(${totalPages})">${totalPages}</button>`);
            }
        }
        
        console.log('[ServiceIntegration] Generated page numbers for', totalPages, 'pages');
        return pageNumbers.join('');
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.services.length / this.servicesPerPage);
        const actualTotalPages = Math.max(1, totalPages);
        
        console.log('[ServiceIntegration] goToPage called with page:', page, 'actualTotalPages:', actualTotalPages);
        
        if (page >= 1 && page <= actualTotalPages && page !== this.currentPage) {
            console.log('[ServiceIntegration] Changing to page:', page);
            this.currentPage = page;
            setTimeout(() => {
                this.renderServices();
            }, 100);
        } else {
            console.log('[ServiceIntegration] Invalid page or same page:', page);
        }
    }

    createServiceCard(service, index) {
        const col = document.createElement('div');
        col.className = 'col-sm-6' + (index > 0 ? ' mt-sm-0 mt-4' : '');
        
        // Sử dụng hình ảnh mặc định cố định thay vì load từ service
        const defaultImage = './assets/images/general/service-default.webp';
        
        col.innerHTML = `
            <div class="form-check form-check-inline m-0 p-0 position-relative d-block box-checked">
                <input type="radio" name="serviceRadios" class="form-check-input service-radio" 
                       id="service_${service.id}" value="${service.id}">
                <label class="form-check-label d-inline-block w-100" for="service_${service.id}">
                    <span class="d-block appointment-clinic-box p-4 text-center">
                        <span class="d-block mb-4">
                            <img alt="${service.name}" src="${defaultImage}" height="80" width="80" 
                                 class="rounded-circle object-cover">
                        </span>
                        <span class="d-block h5 mb-2">${service.name}</span>
                        <span class="text-body">${service.description || 'Dịch vụ chất lượng cao'}</span>
                    </span>
                </label>
            </div>
        `;
        // Không cần gán sự kiện ở đây nữa, đã gán ở renderServices
        return col;
    }

    handleServiceSelection(service) {
        this.selectedService = service;
        sessionStorage.setItem('selectedService', JSON.stringify(service));
        this.updateNextButtonState();
    }

    // Hàm mới: chỉ kiểm tra radio checked để enable/disable nút Next
    updateNextButtonState() {
        // Chỉ disable nút Next trong tab chọn dịch vụ
        const serviceTab = document.querySelector('#service-container')?.closest('.appointment-tab-content');
        const nextButton = serviceTab ? serviceTab.querySelector('button.next') : null;
        const checked = serviceTab ? serviceTab.querySelector('.service-radio:checked') : null;
        if (nextButton) {
            if (checked) {
                nextButton.disabled = false;
                nextButton.style.opacity = '1';
                nextButton.style.pointerEvents = 'auto';
                nextButton.style.cursor = 'pointer';
            } else {
                nextButton.disabled = true;
                nextButton.style.opacity = '0.4';
                nextButton.style.pointerEvents = 'none';
                nextButton.style.cursor = 'not-allowed';
            }
        }
    }

    showLoading(show) {
        const container = document.querySelector('#service-container');
        if (!container) return;
        if (show) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <p class="mt-2">Đang tải danh sách dịch vụ...</p>
                </div>
            `;
        }
    }

    // Đặt ngoài class ServiceIntegration
    showError(message) {
        // XÓA TOÀN BỘ THÔNG BÁO LIÊN QUAN ĐẾN DỊCH VỤ/BÁC SĨ
        // 1. loadSelectedDoctor: Xóa this.showError('Vui lòng chọn bác sĩ trước khi chọn dịch vụ...')
        // 2. loadServices: Xóa this.showError('Vui lòng chọn bác sĩ trước...')
        // 3. handleNextStep: Xóa this.showError('Bạn phải chọn dịch vụ để tiếp tục.')
        // 4. setupEventListeners: Xóa this.showError('Bạn phải chọn dịch vụ để tiếp tục.')
        // 5. searchServices: Xóa this.showError('Vui lòng chọn bác sĩ trước.')
    }

    handleNextStep() {
        if (!this.selectedService) {
            // XÓA TOÀN BỘ THÔNG BÁO LIÊN QUAN ĐẾN DỊCH VỤ/BÁC SĨ
            // 1. loadSelectedDoctor: Xóa this.showError('Vui lòng chọn bác sĩ trước khi chọn dịch vụ...')
            // 2. loadServices: Xóa this.showError('Vui lòng chọn bác sĩ trước...')
            // 3. handleNextStep: Xóa this.showError('Bạn phải chọn dịch vụ để tiếp tục.')
            // 4. setupEventListeners: Xóa this.showError('Bạn phải chọn dịch vụ để tiếp tục.')
            // 5. searchServices: Xóa this.showError('Vui lòng chọn bác sĩ trước.')
            // Ngăn chặn chuyển bước
            return false;
        }
        // Logic chuyển bước chỉ chạy khi đã chọn
        // ... existing code ...
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.querySelector('#service-search');
        const searchBtn = document.querySelector('#service-search-btn');
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                this.searchServices(searchInput.value);
            });
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.searchServices(searchInput.value);
                }
            });
            // Tự động trở về danh sách gốc khi xóa hết nội dung
            searchInput.addEventListener('input', (e) => {
                if (e.target.value.trim() === '') {
                    this.loadServices();
                }
            });
        }
        // Next button functionality
        const nextButton = document.querySelector('.appointment-tab-content .next');
        if (nextButton) {
            nextButton.disabled = true;
            nextButton.classList.add('btn-disabled');
            nextButton.classList.remove('btn-enabled');
            nextButton.style.opacity = '0.4'; // 40%
            nextButton.style.cursor = 'not-allowed';
            nextButton.style.pointerEvents = 'none';
            // Bắt cả sự kiện mousedown để hiện thông báo kể cả khi nút bị disable
            nextButton.addEventListener('mousedown', (e) => {
                if (nextButton.disabled) {
                    // XÓA TOÀN BỘ THÔNG BÁO LIÊN QUAN ĐẾN DỊCH VỤ/BÁC SĨ
                    // 1. loadSelectedDoctor: Xóa this.showError('Vui lòng chọn bác sĩ trước khi chọn dịch vụ...')
                    // 2. loadServices: Xóa this.showError('Vui lòng chọn bác sĩ trước...')
                    // 3. handleNextStep: Xóa this.showError('Bạn phải chọn dịch vụ để tiếp tục.')
                    // 4. setupEventListeners: Xóa this.showError('Bạn phải chọn dịch vụ để tiếp tục.')
                    // 5. searchServices: Xóa this.showError('Vui lòng chọn bác sĩ trước.')
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            });
            nextButton.addEventListener('click', (e) => {
                if (!this.selectedService || !this.selectedService.id) {
                    // XÓA TOÀN BỘ THÔNG BÁO LIÊN QUAN ĐẾN DỊCH VỤ/BÁC SĨ
                    // 1. loadSelectedDoctor: Xóa this.showError('Vui lòng chọn bác sĩ trước khi chọn dịch vụ...')
                    // 2. loadServices: Xóa this.showError('Vui lòng chọn bác sĩ trước...')
                    // 3. handleNextStep: Xóa this.showError('Bạn phải chọn dịch vụ để tiếp tục.')
                    // 4. setupEventListeners: Xóa this.showError('Bạn phải chọn dịch vụ để tiếp tục.')
                    // 5. searchServices: Xóa this.showError('Vui lòng chọn bác sĩ trước.')
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                // Chỉ khi đã chọn mới chuyển bước
                nextButton.disabled = true;
                setTimeout(() => { nextButton.disabled = false; }, 1500);
                // Gọi bước tiếp theo nếu có
                // ... (tùy logic của bạn)
            });
        }
        // Theo dõi việc bỏ chọn dịch vụ (nếu có)
        const container = document.querySelector('#service-container');
        if (container) {
            container.addEventListener('click', (e) => {
                setTimeout(() => {
                    const checked = container.querySelector('.service-radio:checked');
                    if (!checked) {
                        if (nextButton) {
                            nextButton.disabled = true;
                            nextButton.classList.add('btn-disabled');
                            nextButton.classList.remove('btn-enabled');
                            nextButton.style.opacity = '0.4'; // 40%
                            nextButton.style.cursor = 'not-allowed';
                            nextButton.style.pointerEvents = 'none';
                        }
                        sessionStorage.removeItem('selectedService');
                        this.selectedService = null;
                        this.updateNextButtonState();
                    }
                }, 10);
            });
        }
    }

    // Thêm hàm tìm kiếm dịch vụ
    async searchServices(searchTerm) {
        if (!searchTerm || searchTerm.trim() === "") {
            this.loadServices();
            return;
        }
        if (!this.selectedDoctor) {
            console.error('[ServiceIntegration] Không có selectedDoctor khi searchServices');
            return;
        }
        try {
            this.showLoading(true);
            const response = await fetch(`${this.apiBaseUrl}/api/Appointment/services-by-doctor/${this.selectedDoctor.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.success) {
                let services = result.data;
                const lower = searchTerm.trim().toLowerCase();
                services = services.filter(s => s.name.toLowerCase().includes(lower));
                this.services = services;
                this.renderServices();
            } else {
                this.services = [];
                this.renderServices();
            }
        } catch (error) {
            console.error('Error searching services:', error);
            this.services = [];
            this.renderServices();
        } finally {
            this.showLoading(false);
        }
    }

    // Test method để tạo dữ liệu mẫu
    createTestServices() {
        this.services = [
            {
                id: 1,
                name: 'Khám tổng quát',
                description: 'Khám sức khỏe toàn diện'
            },
            {
                id: 2,
                name: 'Siêu âm tim',
                description: 'Siêu âm tim mạch - Chẩn đoán bệnh tim mạch'
            },
            {
                id: 3,
                name: 'Điện tâm đồ',
                description: 'Điện tâm đồ - Kiểm tra hoạt động tim'
            },
            {
                id: 4,
                name: 'Xét nghiệm máu',
                description: 'Xét nghiệm máu cơ bản'
            },
            {
                id: 5,
                name: 'Chụp X-quang',
                description: 'Chụp X-quang theo yêu cầu'
            }
        ];
        console.log('[ServiceIntegration] Đã tạo test services:', this.services);
    }

    // Force cleanup all pagination containers
    forceCleanupAllPagination() {
        console.log('[ServiceIntegration] Force cleanup ALL pagination');
        
        // Method 1: Find all service pagination elements by class
        const allServicePaginations = document.querySelectorAll('.service-pagination-outer');
        allServicePaginations.forEach(el => {
            console.log('[ServiceIntegration] Removing pagination element:', el);
            el.remove();
        });
        
        // Reset action buttons container class back to justify-content-end
        const serviceContainer = document.querySelector('#service-container');
        if (serviceContainer) {
            const actionButtonsContainer = serviceContainer.parentElement.nextElementSibling;
            if (actionButtonsContainer) {
                actionButtonsContainer.className = 'd-flex align-items-center justify-content-end px-3 mb-3 mt-3 gap-3';
            }
        }
        
        console.log('[ServiceIntegration] Force cleanup completed');
    }
}

// Khởi tạo khi DOM loaded, khi chuyển sang tab dịch vụ
// Bạn cần gọi window.serviceIntegration = new ServiceIntegration(); khi sang bước chọn dịch vụ
window.ServiceIntegration = ServiceIntegration; 

// Global method để force test pagination
window.testServicePagination = function() {
    console.log('[Global] testServicePagination called');
    
    // Mock a selected doctor
    const mockDoctor = {
        id: 1,
        name: 'Dr. Test',
        specialization: 'Test Specialization'
    };
    
    // Set mock doctor in session storage
    sessionStorage.setItem('selectedDoctor', JSON.stringify(mockDoctor));
    console.log('[Global] Mock doctor set in sessionStorage');
    
    if (!window.serviceIntegration) {
        console.log('[Global] Creating new ServiceIntegration instance');
        window.serviceIntegration = new ServiceIntegration();
    }
    
    // Force create test services
    window.serviceIntegration.createTestServices();
    window.serviceIntegration.renderServices();
    console.log('[Global] Service pagination test completed - should see pagination now!');
    
    // Alert for user
    setTimeout(() => {
        alert('✅ Service pagination test completed! Check the service section - you should see pagination with 5 services (1 per page).');
    }, 500);
};

// Hàm toast đặt ngoài class
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