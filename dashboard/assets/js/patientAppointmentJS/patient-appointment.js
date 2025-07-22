// Patient Appointment JavaScript - Calendar Integration

class PatientAppointmentManager {
    constructor() {
        this.calendar = null;
        this.appointments = [];
        this.currentView = 'dayGridMonth';
        this.apiBaseUrl = 'https://localhost:7097'; // Backend API URL
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupToastContainer();
        this.checkLoginStatus();
        this.initializeCalendar();
        this.loadAppointments();
    }

    setupEventListeners() {
        // Calendar view change events
        document.addEventListener('DOMContentLoaded', () => {
            // Listen for calendar view changes
            const viewButtons = document.querySelectorAll('[data-calendar-view]');
            viewButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const view = e.target.dataset.calendarView;
                    this.changeCalendarView(view);
                });
            });

            // Listen for date navigation
            const prevButton = document.querySelector('[data-calendar-prev]');
            const nextButton = document.querySelector('[data-calendar-next]');
            const todayButton = document.querySelector('[data-calendar-today]');

            if (prevButton) prevButton.addEventListener('click', () => this.navigateCalendar('prev'));
            if (nextButton) nextButton.addEventListener('click', () => this.navigateCalendar('next'));
            if (todayButton) todayButton.addEventListener('click', () => this.navigateCalendar('today'));
        });
    }

    setupToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
    }

    showLoading() {
        const loadingSpinner = document.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.classList.add('show');
        }
    }

    hideLoading() {
        const loadingSpinner = document.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.classList.remove('show');
        }
    }

    async loadAppointments() {
        try {
            this.showLoading();
            console.log('🔄 Đang tải lịch hẹn từ API...');

            const token = this.getToken();
            if (!token) {
                console.log('⚠️ Không có token, chuyển sang dữ liệu mẫu');
                this.loadSampleData();
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/appointment/patient-appointments`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 API Response status:', response.status);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('API endpoint không tồn tại. Vui lòng kiểm tra backend server.');
                } else if (response.status === 401) {
                    throw new Error('Chưa đăng nhập hoặc token hết hạn. Vui lòng đăng nhập lại.');
                } else if (response.status === 403) {
                    throw new Error('Không có quyền truy cập. Vui lòng kiểm tra tài khoản.');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            const data = await response.json();
            console.log('📊 API Response data:', data);
            
            if (data.success) {
                this.appointments = data.data.appointments || [];
                console.log('✅ Đã tải được', this.appointments.length, 'lịch hẹn của bạn');
                this.updateCalendarEvents();
                
                if (this.appointments.length === 0) {
                    this.showToast('info', 'Bạn chưa có lịch hẹn nào. Hãy đặt lịch hẹn mới!');
                } else {
                    this.showToast('success', `Đã tải ${this.appointments.length} lịch hẹn của bạn`);
                }
            } else {
                this.showToast('error', 'Lỗi khi tải danh sách lịch hẹn: ' + (data.message || 'Không xác định'));
                this.loadSampleData();
            }
        } catch (error) {
            console.error('❌ Error loading appointments:', error);
            
            if (error.message.includes('401') || error.message.includes('403')) {
                this.showToast('warning', 'Vui lòng đăng nhập để xem lịch hẹn của bạn');
                this.loadSampleData();
            } else {
                this.showToast('error', 'Lỗi khi tải danh sách lịch hẹn: ' + error.message);
                this.loadSampleData();
            }
        } finally {
            this.hideLoading();
        }
    }

    loadSampleData() {
        console.log('🔄 Đang tải dữ liệu mẫu cho calendar...');
        
        // Tạo dữ liệu mẫu cho testing
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        this.appointments = [
            {
                id: 1,
                appointmentDate: today.toLocaleDateString('vi-VN'),
                startTime: '09:00',
                endTime: '10:00',
                status: 'Scheduled',
                note: 'Khám tổng quát định kỳ',
                clinic: {
                    id: 1,
                    name: 'Phòng Khám Đa Khoa ABC',
                    address: '123 Đường ABC, Quận 1, TP.HCM'
                },
                service: {
                    id: 1,
                    name: 'Khám tổng quát',
                    price: 200000
                },
                doctors: [
                    {
                        id: 1,
                        name: 'Bác sĩ Nguyễn Văn A',
                        imageUrl: './assets/images/avatars/01.png'
                    }
                ]
            },
            {
                id: 2,
                appointmentDate: tomorrow.toLocaleDateString('vi-VN'),
                startTime: '14:30',
                endTime: '15:30',
                status: 'Scheduled',
                note: 'Tái khám sau điều trị',
                clinic: {
                    id: 2,
                    name: 'Phòng Khám Chuyên Khoa Tim Mạch',
                    address: '456 Đường XYZ, Quận 3, TP.HCM'
                },
                service: {
                    id: 2,
                    name: 'Khám tim mạch',
                    price: 350000
                },
                doctors: [
                    {
                        id: 2,
                        name: 'Bác sĩ Trần Thị B',
                        imageUrl: './assets/images/avatars/02.png'
                    }
                ]
            },
            {
                id: 3,
                appointmentDate: nextWeek.toLocaleDateString('vi-VN'),
                startTime: '10:00',
                endTime: '11:00',
                status: 'Scheduled',
                note: 'Xét nghiệm máu',
                clinic: {
                    id: 1,
                    name: 'Phòng Khám Đa Khoa ABC',
                    address: '123 Đường ABC, Quận 1, TP.HCM'
                },
                service: {
                    id: 3,
                    name: 'Xét nghiệm máu',
                    price: 150000
                },
                doctors: [
                    {
                        id: 3,
                        name: 'Bác sĩ Lê Văn C',
                        imageUrl: './assets/images/avatars/03.png'
                    }
                ]
            }
        ];
        
        console.log('✅ Đã tải', this.appointments.length, 'lịch hẹn mẫu');
        this.updateCalendarEvents();
        this.showToast('info', `Đang hiển thị dữ liệu mẫu. Vui lòng đăng nhập để xem lịch hẹn thực của bạn.`);
    }

    initializeCalendar() {
        console.log('🔧 Đang khởi tạo calendar...');
        
        // Wait for FullCalendar to be available
        const checkFullCalendar = () => {
            if (typeof FullCalendar !== 'undefined') {
                console.log('✅ FullCalendar đã sẵn sàng');
                this.setupCalendar();
            } else {
                console.log('⏳ FullCalendar chưa sẵn sàng, thử lại sau 500ms...');
                setTimeout(checkFullCalendar, 500);
            }
        };
        
        // Bắt đầu kiểm tra sau 500ms
        setTimeout(checkFullCalendar, 500);
    }

    setupCalendar() {
        const calendarEl = document.getElementById('bookingcalendar');
        if (!calendarEl) {
            console.error('❌ Không tìm thấy calendar element với id "bookingcalendar"');
            this.showToast('error', 'Không tìm thấy calendar element');
            return;
        }

        console.log('🔧 Đang khởi tạo FullCalendar...');

        try {
            this.calendar = new FullCalendar.Calendar(calendarEl, {
                plugins: ["timeGrid", "dayGrid", "list", "interaction"],
                initialView: 'dayGridMonth',
                locale: 'vi',
                timeZone: "UTC",
                contentHeight: "auto",
                eventLimit: true,
                dayMaxEvents: 4,
                firstDay: 1,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                },
                buttonText: {
                    today: 'Hôm nay',
                    month: 'Tháng',
                    week: 'Tuần',
                    day: 'Ngày',
                    list: 'Danh sách'
                },
                dayHeaderFormat: { weekday: 'short' },
                height: 'auto',
                selectable: true,
                selectMirror: true,
                dayMaxEvents: true,
                weekends: true,
                events: this.getCalendarEvents(),
                eventClick: (info) => {
                    this.handleEventClick(info);
                },
                dateClick: (info) => {
                    this.handleDateClick(info);
                },
                eventDidMount: (info) => {
                    this.handleEventMount(info);
                },
                loading: (isLoading) => {
                    if (isLoading) {
                        this.showLoading();
                    } else {
                        this.hideLoading();
                    }
                }
            });

            this.calendar.render();
            console.log('✅ Calendar đã được khởi tạo thành công');
            this.showToast('success', 'Calendar đã được khởi tạo thành công');
            
        } catch (error) {
            console.error('❌ Lỗi khi khởi tạo calendar:', error);
            this.showToast('error', 'Lỗi khi khởi tạo calendar: ' + error.message);
        }
    }

    getCalendarEvents() {
        console.log('🔧 Đang tạo calendar events từ', this.appointments.length, 'appointments');
        
        const events = this.appointments.map(appointment => {
            const event = {
                id: appointment.id,
                title: this.getEventTitle(appointment),
                start: this.parseAppointmentDate(appointment.appointmentDate, appointment.startTime),
                end: appointment.endTime ? this.parseAppointmentDate(appointment.appointmentDate, appointment.endTime) : null,
                backgroundColor: this.getStatusColor(appointment.status),
                borderColor: this.getStatusColor(appointment.status),
                textColor: '#ffffff',
                extendedProps: {
                    appointment: appointment
                }
            };
            
            console.log('📅 Created event:', {
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end,
                status: appointment.status
            });
            
            return event;
        });
        
        console.log('✅ Đã tạo', events.length, 'calendar events');
        return events;
    }

    getEventTitle(appointment) {
        let title = appointment.startTime;
        if (appointment.service) {
            title += ` - ${appointment.service.name}`;
        }
        if (appointment.doctors && appointment.doctors.length > 0) {
            title += ` (${appointment.doctors[0].name})`;
        }
        return title;
    }

    parseAppointmentDate(dateStr, timeStr) {
        try {
            console.log('🔧 Parsing date:', dateStr, timeStr);
            
            // Xử lý định dạng dd/mm/yyyy
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    const date = `${year}-${month}-${day}`;
                    const result = `${date}T${timeStr}:00`;
                    console.log('✅ Parsed date result:', result);
                    return result;
                }
            }
            
            // Xử lý định dạng Date object
            if (dateStr instanceof Date) {
                const date = dateStr.toISOString().split('T')[0];
                const result = `${date}T${timeStr}:00`;
                console.log('✅ Parsed Date object result:', result);
                return result;
            }
            
            // Xử lý định dạng yyyy-mm-dd
            if (dateStr.includes('-') && dateStr.length === 10) {
                const result = `${dateStr}T${timeStr}:00`;
                console.log('✅ Parsed ISO date result:', result);
                return result;
            }
            
            console.log('⚠️ Không thể parse date, sử dụng ngày hiện tại');
            return new Date().toISOString();
        } catch (error) {
            console.error('❌ Lỗi parse date:', dateStr, timeStr, error);
            return new Date().toISOString();
        }
    }

    getStatusColor(status) {
        const colors = {
            'Scheduled': '#1976d2',
            'Completed': '#2e7d32',
            'Cancelled': '#c62828',
            'NoShow': '#ef6c00'
        };
        return colors[status] || '#1976d2';
    }

    updateCalendarEvents() {
        if (this.calendar) {
            console.log('🔄 Đang cập nhật calendar events...');
            this.calendar.removeAllEvents();
            const events = this.getCalendarEvents();
            this.calendar.addEventSource(events);
            console.log('✅ Đã cập nhật calendar với', events.length, 'events');
        } else {
            console.log('❌ Calendar chưa được khởi tạo');
        }
    }

    handleEventClick(info) {
        const appointment = info.event.extendedProps.appointment;
        if (appointment) {
            this.showAppointmentDetailModal(appointment);
        }
    }

    handleDateClick(info) {
        // Show appointment creation modal or date info
        this.showDateInfoModal(info.dateStr);
    }

    handleEventMount(info) {
        // Add tooltip or additional styling
        const appointment = info.event.extendedProps.appointment;
        if (appointment) {
            info.el.title = this.getEventTooltip(appointment);
        }
    }

    getEventTooltip(appointment) {
        let tooltip = `Ngày: ${appointment.appointmentDate}\n`;
        tooltip += `Giờ: ${appointment.startTime}\n`;
        tooltip += `Trạng thái: ${this.getStatusText(appointment.status)}\n`;
        if (appointment.clinic) {
            tooltip += `Phòng khám: ${appointment.clinic.name}\n`;
        }
        if (appointment.service) {
            tooltip += `Dịch vụ: ${appointment.service.name}\n`;
        }
        if (appointment.doctors && appointment.doctors.length > 0) {
            tooltip += `Bác sĩ: ${appointment.doctors[0].name}`;
        }
        return tooltip;
    }

    changeCalendarView(view) {
        if (this.calendar) {
            this.calendar.changeView(view);
            this.currentView = view;
        }
    }

    navigateCalendar(direction) {
        if (this.calendar) {
            switch (direction) {
                case 'prev':
                    this.calendar.prev();
                    break;
                case 'next':
                    this.calendar.next();
                    break;
                case 'today':
                    this.calendar.today();
                    break;
            }
        }
    }

    showAppointmentDetailModal(appointment) {
        const modalHTML = `
            <div class="modal fade" id="appointmentDetailModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Chi tiết lịch hẹn</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Thông tin lịch hẹn</h6>
                                    <p><strong>Ngày:</strong> ${appointment.appointmentDate}</p>
                                    <p><strong>Giờ:</strong> ${appointment.startTime}${appointment.endTime ? ' - ' + appointment.endTime : ''}</p>
                                    <p><strong>Trạng thái:</strong> <span class="status-badge ${this.getStatusClass(appointment.status)}">${this.getStatusText(appointment.status)}</span></p>
                                    ${appointment.note ? `<p><strong>Ghi chú:</strong> ${appointment.note}</p>` : ''}
                                </div>
                                <div class="col-md-6">
                                    <h6>Thông tin phòng khám</h6>
                                    <p><strong>Tên:</strong> ${appointment.clinic.name}</p>
                                    <p><strong>Địa chỉ:</strong> ${appointment.clinic.address}</p>
                                </div>
                            </div>
                            ${appointment.service ? `
                                <hr>
                                <div class="row">
                                    <div class="col-12">
                                        <h6>Thông tin dịch vụ</h6>
                                        <p><strong>Tên dịch vụ:</strong> ${appointment.service.name}</p>
                                        <p><strong>Giá:</strong> ${this.formatCurrency(appointment.service.price)}</p>
                                    </div>
                                </div>
                            ` : ''}
                            ${appointment.doctors && appointment.doctors.length > 0 ? `
                                <hr>
                                <div class="row">
                                    <div class="col-12">
                                        <h6>Bác sĩ phụ trách</h6>
                                        ${appointment.doctors.map(doctor => `
                                            <div class="doctor-info">
                                                <img src="${doctor.imageUrl || '/assets/images/avatars/default-avatar.png'}" 
                                                     alt="${doctor.name}" class="doctor-avatar">
                                                <div>
                                                    <div class="doctor-name">${doctor.name}</div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            ${appointment.status === 'Scheduled' ? `
                                <button type="button" class="btn btn-warning" onclick="appointmentManager.editAppointment(${appointment.id})">
                                    <i class="fas fa-edit"></i> Chỉnh sửa
                                </button>
                                <button type="button" class="btn btn-danger" onclick="appointmentManager.cancelAppointment(${appointment.id})">
                                    <i class="fas fa-times"></i> Hủy lịch
                                </button>
                            ` : ''}
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('appointmentDetailModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('appointmentDetailModal'));
        modal.show();

        // Clean up modal after it's hidden
        document.getElementById('appointmentDetailModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    showDateInfoModal(dateStr) {
        const appointmentsOnDate = this.appointments.filter(apt => 
            apt.appointmentDate === this.formatDateForDisplay(dateStr)
        );

        const modalHTML = `
            <div class="modal fade" id="dateInfoModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Lịch hẹn ngày ${this.formatDateForDisplay(dateStr)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${appointmentsOnDate.length > 0 ? `
                                <div class="list-group">
                                    ${appointmentsOnDate.map(appointment => `
                                        <div class="list-group-item">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 class="mb-1">${appointment.startTime} - ${appointment.service ? appointment.service.name : 'Không có dịch vụ'}</h6>
                                                    <p class="mb-1">${appointment.clinic.name}</p>
                                                    <small class="text-muted">${this.getStatusText(appointment.status)}</small>
                                                </div>
                                                <button class="btn btn-sm btn-outline-primary" onclick="appointmentManager.showAppointmentDetailModal(${JSON.stringify(appointment).replace(/"/g, '&quot;')})">
                                                    Xem chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <p class="text-center text-muted">Không có lịch hẹn nào trong ngày này.</p>
                            `}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('dateInfoModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('dateInfoModal'));
        modal.show();

        // Clean up modal after it's hidden
        document.getElementById('dateInfoModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    async editAppointment(appointmentId) {
        const appointment = this.appointments.find(a => a.id === appointmentId);
        if (!appointment) return;

        this.showEditAppointmentModal(appointment);
    }

    showEditAppointmentModal(appointment) {
        const modalHTML = `
            <div class="modal fade" id="editAppointmentModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Chỉnh sửa lịch hẹn</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editAppointmentForm">
                                <div class="form-group">
                                    <label class="form-label">Ngày hẹn</label>
                                    <input type="date" class="form-control" id="editAppointmentDate" 
                                           value="${this.formatDateForInput(appointment.appointmentDate)}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Giờ hẹn</label>
                                    <input type="time" class="form-control" id="editAppointmentTime" 
                                           value="${appointment.startTime}" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Ghi chú</label>
                                    <textarea class="form-control" id="editAppointmentNote" rows="3">${appointment.note || ''}</textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                            <button type="button" class="btn btn-primary" onclick="appointmentManager.updateAppointment(${appointment.id})">
                                Cập nhật
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('editAppointmentModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editAppointmentModal'));
        modal.show();

        // Clean up modal after it's hidden
        document.getElementById('editAppointmentModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    async updateAppointment(appointmentId) {
        try {
            const appointmentDate = document.getElementById('editAppointmentDate').value;
            const appointmentTime = document.getElementById('editAppointmentTime').value;
            const note = document.getElementById('editAppointmentNote').value;

            if (!appointmentDate || !appointmentTime) {
                this.showToast('error', 'Vui lòng điền đầy đủ thông tin');
                return;
            }

            this.showLoading();

            const requestData = {
                appointmentDate: appointmentDate + 'T00:00:00',
                startTime: appointmentTime + ':00',
                note: note
            };

            const token = this.getToken();
            if (!token) {
                this.showToast('error', 'Vui lòng đăng nhập để thực hiện thao tác này');
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/Appointment/patient-appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.showToast('success', 'Cập nhật lịch hẹn thành công');
                this.loadAppointments();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editAppointmentModal'));
                modal.hide();
            } else {
                this.showToast('error', 'Lỗi khi cập nhật lịch hẹn: ' + data.message);
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
            this.showToast('error', 'Lỗi khi cập nhật lịch hẹn: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async cancelAppointment(appointmentId) {
        this.showCancelAppointmentModal(appointmentId);
    }

    showCancelAppointmentModal(appointmentId) {
        const modalHTML = `
            <div class="modal fade" id="cancelAppointmentModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Hủy lịch hẹn</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Bạn có chắc chắn muốn hủy lịch hẹn này?</p>
                            <div class="form-group">
                                <label class="form-label">Lý do hủy (tùy chọn)</label>
                                <textarea class="form-control" id="cancelReason" rows="3" 
                                          placeholder="Nhập lý do hủy lịch hẹn..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Không</button>
                            <button type="button" class="btn btn-danger" onclick="appointmentManager.confirmCancelAppointment(${appointmentId})">
                                Hủy lịch hẹn
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('cancelAppointmentModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('cancelAppointmentModal'));
        modal.show();

        // Clean up modal after it's hidden
        document.getElementById('cancelAppointmentModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    async confirmCancelAppointment(appointmentId) {
        try {
            const reason = document.getElementById('cancelReason').value;

            this.showLoading();

            const requestData = {
                reason: reason
            };

            const token = this.getToken();
            if (!token) {
                this.showToast('error', 'Vui lòng đăng nhập để thực hiện thao tác này');
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/Appointment/patient-appointments/${appointmentId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.showToast('success', 'Hủy lịch hẹn thành công');
                this.loadAppointments();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('cancelAppointmentModal'));
                modal.hide();
            } else {
                this.showToast('error', 'Lỗi khi hủy lịch hẹn: ' + data.message);
            }
        } catch (error) {
            console.error('Error canceling appointment:', error);
            this.showToast('error', 'Lỗi khi hủy lịch hẹn: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    getStatusClass(status) {
        const statusMap = {
            'Scheduled': 'status-scheduled',
            'Completed': 'status-completed',
            'Cancelled': 'status-cancelled',
            'NoShow': 'status-noshow'
        };
        return statusMap[status] || 'status-scheduled';
    }

    getStatusText(status) {
        const statusMap = {
            'Scheduled': 'Đã lên lịch',
            'Completed': 'Đã hoàn thành',
            'Cancelled': 'Đã hủy',
            'NoShow': 'Không đến'
        };
        return statusMap[status] || 'Không xác định';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDateForInput(dateString) {
        // Convert dd/mm/yyyy to yyyy-mm-dd
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return dateString;
    }

    formatDateForDisplay(dateString) {
        // Convert yyyy-mm-dd to dd/mm/yyyy
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }

    checkLoginStatus() {
        const token = this.getToken();
        const userInfo = this.getUserInfo();
        
        console.log('🔍 Kiểm tra trạng thái đăng nhập...');
        console.log('Token:', token ? 'Có' : 'Không có');
        console.log('User info:', userInfo);
        
        // Hiển thị/ẩn nút đăng nhập
        const loginBtn = document.getElementById('loginBtn');
        const addAppointmentBtn = document.getElementById('addAppointmentBtn');
        
        if (token && userInfo) {
            this.showToast('success', `Chào mừng ${userInfo.name || 'bạn'}! Đang tải lịch hẹn của bạn...`);
            if (loginBtn) loginBtn.style.display = 'none';
            if (addAppointmentBtn) addAppointmentBtn.style.display = 'inline-block';
        } else if (!token) {
            this.showToast('warning', 'Vui lòng đăng nhập để xem lịch hẹn của bạn');
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (addAppointmentBtn) addAppointmentBtn.style.display = 'none';
        }
    }

    getUserInfo() {
        // Lấy thông tin user từ localStorage/sessionStorage
        const userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
        if (userInfo) {
            try {
                return JSON.parse(userInfo);
            } catch (e) {
                console.warn('⚠️ Lỗi parse user info:', e);
                return null;
            }
        }
        return null;
    }

    getToken() {
        // Get token from localStorage or sessionStorage
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
        
        if (!token) {
            console.warn('⚠️ Không tìm thấy token, có thể chưa đăng nhập');
        }
        
        return token;
    }

    showToast(type, message) {
        // Tạo toast container nếu chưa có
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        const iconMap = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };

        const bgColorMap = {
            'success': 'bg-success',
            'error': 'bg-danger',
            'warning': 'bg-warning',
            'info': 'bg-info'
        };

        const toastHTML = `
            <div class="toast show ${bgColorMap[type] || 'bg-primary'} text-white" role="alert" style="min-width: 300px;">
                <div class="toast-header ${bgColorMap[type] || 'bg-primary'} text-white">
                    <strong class="me-auto">${iconMap[type] || 'ℹ️'} Thông báo</strong>
                    <button type="button" class="btn-close btn-close-white" onclick="this.parentElement.parentElement.remove()"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        // Auto remove toast after 5 seconds
        setTimeout(() => {
            const toast = toastContainer.querySelector('.toast:last-child');
            if (toast) {
                toast.remove();
            }
        }, 5000);

        console.log(`📢 Toast [${type}]:`, message);
    }
}

// Initialize the appointment manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Khởi tạo Patient Appointment Manager...');
    window.appointmentManager = new PatientAppointmentManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PatientAppointmentManager;
} 