// Time Slot Integration for Appointment Page
class TimeSlotIntegration {
    constructor() {
        this.apiBaseUrl = 'https://localhost:7097';
        this.bookedTimeSlots = [];
        this.selectedDoctor = null;
        this.selectedDate = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSelectedData();
    }

    setupEventListeners() {
        // Listen for date selection changes
        window.addEventListener('customCalendarDateSelected', (event) => {
            if (event.detail && event.detail.date) {
                console.log('[TimeSlotIntegration] Ngày được chọn:', event.detail.date);
                this.selectedDate = event.detail.date;
                // Lưu lại ngày vào sessionStorage
                if (this.selectedDate instanceof Date && !isNaN(this.selectedDate)) {
                    const d = this.selectedDate;
                    const dateStr = `${d.getDate().toString().padStart(2,0)}/${(d.getMonth()+1).toString().padStart(2,0)}/${d.getFullYear()}`;
                    sessionStorage.setItem('selectedDate', dateStr);
                }
                // Chỉ gọi updateTimeSlots nếu đã có cả bác sĩ và ngày
                if (this.selectedDoctor && this.selectedDate) {
                    console.log('[TimeSlotIntegration] Both doctor and date selected, updating time slots...');
                    this.updateTimeSlots();
                } else if (!this.selectedDoctor) {
                    console.log('[TimeSlotIntegration] Date selected but no doctor yet, keeping time slots disabled');
                    this.resetTimeSlots();
                }
            }
        });

        // Listen for doctor selection changes via storage event
        window.addEventListener('storage', (event) => {
            if (event.key === 'selectedDoctor') {
                if (event.newValue) {
                    try {
                        this.selectedDoctor = JSON.parse(event.newValue);
                        console.log('[TimeSlotIntegration] Bác sĩ được chọn (storage event):', this.selectedDoctor);
                        // Gọi updateTimeSlots nếu đã có ngày
                        if (this.selectedDate) {
                            this.updateTimeSlots();
                        } else {
                            // Reset time slots to disabled state when no date selected
                            this.resetTimeSlots();
                        }
                    } catch (e) {
                        console.error('Error parsing doctor from storage:', e);
                    }
                } else {
                    this.selectedDoctor = null;
                    this.resetTimeSlots();
                }
            }
        });

        // Direct listener for doctor radio button changes
        document.addEventListener('change', (event) => {
            if (event.target.name === 'doctorRadios' && event.target.checked) {
                const doctorId = parseInt(event.target.value);
                const doctorName = event.target.dataset.name || 'Unknown Doctor';
                const doctor = { id: doctorId, name: doctorName };
                console.log('[TimeSlotIntegration] Bác sĩ được chọn (radio change):', doctor);
                this.selectedDoctor = doctor;
                // Lưu vào sessionStorage
                sessionStorage.setItem('selectedDoctor', JSON.stringify(doctor));
                // Gọi updateTimeSlots nếu đã có ngày
                if (this.selectedDate) {
                    this.updateTimeSlots();
                } else {
                    // Reset time slots to disabled state when no date selected
                    this.resetTimeSlots();
                }
            }
        });

        // Listen for time slot clicks
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('time-btn')) {
                this.handleTimeSlotClick(event.target);
            }
        });
    }

    loadSelectedData() {
        // Debug: Check all sessionStorage data
        console.log('=== SessionStorage Debug ===');
        console.log('All sessionStorage keys:', Object.keys(sessionStorage));
        console.log('selectedClinic:', sessionStorage.getItem('selectedClinic'));
        console.log('selectedDoctor:', sessionStorage.getItem('selectedDoctor'));
        console.log('selectedService:', sessionStorage.getItem('selectedService'));
        console.log('selectedDate:', sessionStorage.getItem('selectedDate'));
        console.log('===========================');

        // Load selected doctor from session storage
        const doctorData = sessionStorage.getItem('selectedDoctor');
        if (doctorData) {
            try {
                this.selectedDoctor = JSON.parse(doctorData);
                console.log('Loaded doctor:', this.selectedDoctor);
            } catch (e) {
                console.error('Error parsing doctor data:', e);
            }
        } else {
            console.log('No doctor data found in sessionStorage');
        }

        // KHÔNG tự động load ngày từ sessionStorage khi khởi tạo
        // Chỉ load ngày khi người dùng chọn ngày trên calendar
        this.selectedDate = null;
        console.log('No date auto-loaded - waiting for user selection');

        // Reset time slots to disabled state when no date selected
        this.resetTimeSlots();
    }

    async updateTimeSlots() {
        console.log('[updateTimeSlots] Called', this.selectedDoctor, this.selectedDate);
        if (!this.selectedDoctor || !this.selectedDate) {
            console.log('[updateTimeSlots] Missing doctor or date selection');
            console.log('Selected Doctor:', this.selectedDoctor);
            console.log('Selected Date:', this.selectedDate);
            this.showErrorState();
            return;
        }

        try {
            this.showLoadingState();

            // Format date for API - ensure yyyy-MM-dd format
            const year = this.selectedDate.getFullYear();
            const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(this.selectedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            // Debug logging
            console.log('[updateTimeSlots] Fetching for doctorId:', this.selectedDoctor.id, 'date:', dateStr);
            const url = `${this.apiBaseUrl}/api/Appointment/available-time-slots?doctorId=${this.selectedDoctor.id}&date=${dateStr}`;
            console.log('[updateTimeSlots] API URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                console.error('[updateTimeSlots] HTTP error! status:', response.status);
                this.showErrorState();
                return;
            }

            const result = await response.json();
            console.log('[updateTimeSlots] API Response:', result);

            if (result.success) {
                this.availableTimeSlots = result.data || {};
                console.log('[updateTimeSlots] Available time slots data:', this.availableTimeSlots);
                this.updateTimeSlotDisplay();
            } else {
                console.error('[updateTimeSlots] API returned success=false:', result.message);
                this.showErrorState();
            }
        } catch (error) {
            console.error('[updateTimeSlots] Exception:', error);
            this.showErrorState();
        }
    }

    showLoadingState() {
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.textContent = 'Loading...';
        });
    }

    showErrorState() {
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.style.backgroundColor = '#fef2f2';
            btn.style.color = '#ef4444';
            btn.textContent = 'Error';
        });
    }

    updateTimeSlotDisplay() {
        console.log('[updateTimeSlotDisplay] Starting update with data:', this.availableTimeSlots);
        
        const timeButtons = document.querySelectorAll('.time-btn');
        console.log('[updateTimeSlotDisplay] Found', timeButtons.length, 'time buttons');
        
        // Get time slots from API response
        const morningTimes = this.availableTimeSlots && this.availableTimeSlots.morning ? 
            this.availableTimeSlots.morning.map(slot => slot.time) : [];
        const afternoonTimes = this.availableTimeSlots && this.availableTimeSlots.afternoon ? 
            this.availableTimeSlots.afternoon.map(slot => slot.time) : [];
        
        // Update button text from "Loading... to actual times
        timeButtons.forEach((btn, index) => {
            if (index >= morningTimes.length + afternoonTimes.length) {
                btn.style.display = 'none';  // Ẩn button dư thừa
                return;
            }
            
            let timeText;
            if (index < morningTimes.length) {
                timeText = morningTimes[index];
            } else {
                timeText = afternoonTimes[index - morningTimes.length];
            }
            btn.textContent = timeText;
            btn.style.display = '';
            console.log(`[updateTimeSlotDisplay] Updated button ${index} text to "${timeText}"`);
        });
        
        function padTime(t) {
            if (!t || typeof t !== 'string') return '';
            let [h, m] = t.split(':');
            if (typeof m === 'undefined' || !m) m = '00';
            if (!h || typeof h !== 'string') return '';
            return h.padStart(2, '0') + ':' + m.padStart(2, '0');
        }

        timeButtons.forEach((btn, index) => {
            const timeText = btn.textContent.trim();
            const paddedTime = padTime(timeText);
            console.log(`[updateTimeSlotDisplay] Button ${index}: "${timeText}" -> "${paddedTime}"`);

            // Reset trạng thái
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.style.backgroundColor = '';
            btn.style.color = '';
            btn.classList.remove('booked', 'available', 'outside-hours', 'disabled', 'selected', 'active');
            btn.title = '';

            // Tìm slotData từ API
            let slotData = null;
            if (this.availableTimeSlots && this.availableTimeSlots.morning && Array.isArray(this.availableTimeSlots.morning)) {
                slotData = this.availableTimeSlots.morning.find(slot => padTime(slot.time) === paddedTime);
            }
            if (!slotData && this.availableTimeSlots && this.availableTimeSlots.afternoon && Array.isArray(this.availableTimeSlots.afternoon)) {
                slotData = this.availableTimeSlots.afternoon.find(slot => padTime(slot.time) === paddedTime);
            }

            if (slotData) {
                console.log(`[updateTimeSlotDisplay] Found slot data for ${paddedTime}:`, slotData);
                if (slotData.reason === 'Đã được đặt') {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.style.backgroundColor = '#fef2f2';
                    btn.style.color = '#ef4444';
                    btn.classList.add('booked');
                    btn.title = `Slot ${paddedTime} - Đã được đặt`;
                } else if (slotData.reason === 'Ngoài giờ làm việc') {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.style.backgroundColor = '#f3f4f6';
                    btn.style.color = '#6b7280';
                    btn.classList.add('outside-hours');
                    btn.title = `Slot ${paddedTime} - Ngoài giờ làm việc`;
                } else if (slotData.available === true && !slotData.disabled) {
                    btn.classList.add('available');
                    btn.title = `Slot ${paddedTime} còn trống`;
                } else {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.style.backgroundColor = '#f3f4f6';
                    btn.style.color = '#6b7280';
                    btn.classList.add('disabled');
                    btn.title = `Slot ${paddedTime} - ${slotData.reason || 'Không khả dụng'}`;
                }
            } else {
                console.log(`[updateTimeSlotDisplay] No slot data found for ${paddedTime}`);
                // Không có dữ liệu slot
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.style.backgroundColor = '#f3f4f6';
                btn.style.color = '#6b7280';
                btn.classList.add('disabled');
                btn.title = `Slot ${paddedTime} - Không có dữ liệu`;
            }
        });
        
        // Sau khi cập nhật trạng thái slot từ API, disable slot quá giờ nếu là hôm nay
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
        let selectedDateStr = '';
        if (this.selectedDate instanceof Date && !isNaN(this.selectedDate)) {
            const year = this.selectedDate.getFullYear();
            const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(this.selectedDate.getDate()).padStart(2, '0');
            selectedDateStr = `${year}-${month}-${day}`;
        }
        if (selectedDateStr === todayStr && typeof window.disablePastSlots === 'function') {
            // Lấy danh sách slot đang hiển thị
            const slotTimes = Array.from(timeButtons).map(btn => btn.textContent.trim());
            window.disablePastSlots(selectedDateStr, slotTimes, (slotTime) => {
                // Tìm đúng button theo text
                timeButtons.forEach(btn => {
                    if (btn.textContent.trim() === slotTime) {
                        btn.disabled = true;
                        btn.classList.add('disabled');
                        btn.style.opacity = '0.5';
                        btn.style.cursor = 'not-allowed';
                        btn.style.backgroundColor = '#f3f4f6';
                        btn.style.color = '#6b7280';
                        btn.title = `Slot ${slotTime} - Đã quá giờ hiện tại`;
                    }
                });
            });
        }
        
        console.log('[updateTimeSlotDisplay] Update completed');
    }

    handleTimeSlotClick(button) {
        if (button.disabled || button.classList.contains('booked')) {
            return; // Don't allow selection of booked slots
        }

        // Remove selection from all buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('selected', 'active');
        });

        // Add selection to clicked button
        button.classList.add('selected', 'active');

        // Store selected time
        const selectedTime = button.textContent.trim();
        sessionStorage.setItem('selectedTime', selectedTime);

        // Update confirmation display
        if (window.appointmentConfirmation) {
            window.appointmentConfirmation.updateConfirmationDisplay();
        }

        console.log('Selected time slot:', selectedTime);
    }

    resetTimeSlots() {
        this.availableTimeSlots = [];
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = 0.5;
            btn.style.cursor = 'not-allowed';
            btn.style.backgroundColor = '#f3f4f6';
            btn.style.color = '#6b7280';
            btn.classList.remove('booked', 'available', 'selected', 'active', 'outside-hours', 'disabled');
            btn.title = 'Vui lòng chọn ngày để xem các khung giờ';
        });
    }

    // Public method to refresh time slots
    refreshTimeSlots() {
        if (this.selectedDoctor && this.selectedDate) {
            this.updateTimeSlots();
        }
    }
}

// Initialize time slot integration when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the appointment page
    const appointmentPage = document.querySelector('.appointment-tab-content');
    if (appointmentPage) {
        console.log('Initializing TimeSlotIntegration...');
        window.timeSlotIntegration = new TimeSlotIntegration();
    } else {
        console.log('Appointment page not found, skipping TimeSlotIntegration');
    }
}); 