// Appointment Confirmation Handler
class AppointmentConfirmationHandler {
    constructor() {
        this.appointmentData = {};
        this.patientFormTimeout = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        function attachTimeBtnEventsAndRestore() {
            // Time slot events are now handled by TimeSlotIntegration
            // This function is kept for backward compatibility but simplified
            const selectedDate = sessionStorage.getItem('selectedDate');
            const selectedTime = sessionStorage.getItem('selectedTime');
            if (selectedDate && selectedTime) {
                document.querySelectorAll('.time-btn').forEach(btn => {
                    if (btn.textContent.trim() === selectedTime && !btn.disabled) {
                        btn.classList.add('selected');
                    }
                });
            }
        }
        function attachDateInputChangeEvent() {
            // Chỉ lắng nghe sự kiện trên .flatpickrdate-appointment
            document.querySelectorAll('.flatpickrdate-appointment').forEach(input => {
                input.onchange = function() {
                    sessionStorage.setItem('selectedDate', this.value); // Lưu ngày khám
                    resetTimeSelection();
                    setTimeout(attachTimeBtnEventsAndRestore, 100);
                    if (window.appointmentConfirmation) {
                        setTimeout(() => window.appointmentConfirmation.updateConfirmationDisplay(), 120);
                    }
                };
            });
        }
        document.addEventListener('DOMContentLoaded', attachTimeBtnEventsAndRestore);
        document.addEventListener('shown.bs.tab', attachTimeBtnEventsAndRestore);
        document.addEventListener('DOMContentLoaded', attachDateInputChangeEvent);
        document.addEventListener('shown.bs.tab', attachDateInputChangeEvent);
        // Nếu dùng custom calendar, khi chọn ngày cũng phải gọi updateConfirmationDisplay
        if (typeof window.getCustomCalendarDate === 'function') {
            window.addEventListener('customCalendarDateSelected', function(e) {
                if (e && e.detail && e.detail.date) {
                    const d = e.detail.date.getDate().toString().padStart(2, '0');
                    const m = (e.detail.date.getMonth() + 1).toString().padStart(2, '0');
                    const y = e.detail.date.getFullYear();
                    sessionStorage.setItem('selectedDate', `${d}/${m}/${y}`);
                }
                resetTimeSelection();
                if (window.appointmentConfirmation) {
                    setTimeout(() => window.appointmentConfirmation.updateConfirmationDisplay(), 10);
                }
            });
        }
        // Gắn listener cho note khi khởi tạo
        attachNoteInputListener();
    }

    setupNavigationHandlers() {
        // Lắng nghe sự kiện khi chuyển đến step cuối cùng
        const nextButtons = document.querySelectorAll('.next');
        nextButtons.forEach(button => {
            button.addEventListener('click', () => {
                setTimeout(() => {
                    this.updateConfirmationDisplay();
                }, 500);
            });
        });

        // Lắng nghe sự kiện khi có thay đổi trong các step
        document.addEventListener('appointmentDataChanged', (event) => {
            this.appointmentData = { ...this.appointmentData, ...event.detail };
            this.updateConfirmationDisplay();
        });

        // Lắng nghe sự kiện khi chọn clinic
        document.addEventListener('change', (event) => {
            if (event.target.name === 'clinicRadios') {
                setTimeout(() => this.updateConfirmationDisplay(), 100);
            }
        });

        // Lắng nghe sự kiện khi chọn doctor
        document.addEventListener('change', (event) => {
            if (event.target.name === 'doctorRadios') {
                setTimeout(() => this.updateConfirmationDisplay(), 100);
            }
        });

        // Lắng nghe sự kiện khi chọn service
        document.addEventListener('change', (event) => {
            if (event.target.name === 'serviceRadios') {
                setTimeout(() => this.updateConfirmationDisplay(), 100);
            }
        });

        // Lắng nghe sự kiện khi chọn time slot
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('time-btn')) {
                setTimeout(() => this.updateConfirmationDisplay(), 100);
            }
        });

        // Lắng nghe sự kiện thay đổi flatpickr
        const flatpickrInput = document.querySelector('.inline_flatpickr');
        if (flatpickrInput) {
            // Đợi flatpickr được khởi tạo
            setTimeout(() => {
                if (flatpickrInput._flatpickr) {
                    flatpickrInput._flatpickr.config.onChange.push(() => {
                        setTimeout(() => this.updateConfirmationDisplay(), 100);
                    });
                }
            }, 1000);
        }

        // Lắng nghe sự kiện thay đổi thông tin bệnh nhân
        this.setupPatientFormListeners();
    }

    setupPatientFormListeners() {
        // Lắng nghe thay đổi trong form thông tin bệnh nhân
        document.addEventListener('input', (event) => {
            const target = event.target;
            if (target.closest('#register form') || target.closest('#login form')) {
                clearTimeout(this.patientFormTimeout);
                this.patientFormTimeout = setTimeout(() => {
                    this.updateConfirmationDisplay();
                }, 100);
            }
        });
        document.addEventListener('change', (event) => {
            const target = event.target;
            if (target.closest('#register form') || target.closest('#login form')) {
                clearTimeout(this.patientFormTimeout);
                this.patientFormTimeout = setTimeout(() => {
                    this.updateConfirmationDisplay();
                }, 100);
            }
        });
        // Lắng nghe thay đổi tab
        document.addEventListener('shown.bs.tab', (event) => {
            if (event.target.getAttribute('data-bs-target') === '#register' || 
                event.target.getAttribute('data-bs-target') === '#login') {
                setTimeout(() => this.updateConfirmationDisplay(), 100);
            }
        });
    }

    setupConfirmationDisplay() {
        // Kiểm tra xem có phải đang ở step cuối không
        const confirmationStep = document.querySelector('.appointment-tab-content.appointment-content-active');
        if (confirmationStep && confirmationStep.querySelector('.appointment-confirmation-content')) {
            this.updateConfirmationDisplay();
        }
    }

    // Lấy dữ liệu từ các step trước đó
    collectAppointmentData() {
        try {
            // Lấy dữ liệu phòng khám đã chọn
            const selectedClinic = this.getSelectedClinic();
            
            // Lấy dữ liệu bác sĩ đã chọn
            const selectedDoctor = this.getSelectedDoctor();
            
            // Lấy dữ liệu dịch vụ đã chọn
            const selectedService = this.getSelectedService();
            
            // Lấy dữ liệu ngày giờ đã chọn
            const selectedDateTime = this.getSelectedDateTime();
            
            // Lấy dữ liệu bệnh nhân
            const patientData = this.getPatientData();

            // Lấy note (nếu có)
            let note = '';
            const noteInput = document.querySelector('.appointment-note');
            if (noteInput) {
                note = noteInput.value.trim();
            } else {
                note = sessionStorage.getItem('appointmentNote') || '';
            }

            this.appointmentData = {
                clinic: selectedClinic,
                doctor: selectedDoctor,
                service: selectedService,
                date: selectedDateTime.date,
                startTime: selectedDateTime.startTime, // Đổi tên thành startTime
                rawDate: selectedDateTime.rawDate,
                patient: patientData,
                note: note
            };

            return this.appointmentData;
        } catch (error) {
            console.error('Error collecting appointment data:', error);
            return {};
        }
    }

    getSelectedClinic() {
        // Tìm clinic đã được chọn từ radio button
        const selectedClinicRadio = document.querySelector('input[name="clinicRadios"]:checked');
        
        if (selectedClinicRadio) {
            const clinicCard = selectedClinicRadio.closest('.form-check');
            const clinicLabel = clinicCard.querySelector('label');
            const clinicSpan = clinicLabel.querySelector('.appointment-clinic-box');
            
            // Lấy tên clinic từ h5
            const nameElement = clinicSpan.querySelector('.h5');
            const name = nameElement ? nameElement.textContent.trim() : 'Valley Clinic';
            
            // Lấy địa chỉ - thường là text-body đầu tiên (không phải email)
            const textBodyElements = clinicSpan.querySelectorAll('.text-body');
            let address = '3/e, Naaz Bldg, Lamington Road, Mumbai, 400004, India';
            
            if (textBodyElements.length > 0) {
                // Lấy text-body đầu tiên (thường là địa chỉ)
                address = textBodyElements[0].textContent.trim();
            }
            
            return {
                id: selectedClinicRadio.value,
                name: name,
                address: address
            };
        }
        
        // Fallback: Lấy từ sessionStorage nếu có
        const storedClinic = sessionStorage.getItem('selectedClinic');
        if (storedClinic) {
            try {
                return JSON.parse(storedClinic);
            } catch (e) {
                console.error('Error parsing stored clinic:', e);
            }
        }
        
        // Fallback data
        return {
            id: '1',
            name: 'Valley Clinic',
            address: '3/e, Naaz Bldg, Lamington Road, Mumbai, 400004, India'
        };
    }

    getSelectedDoctor() {
        // Tìm doctor đã được chọn từ radio button
        const selectedDoctorRadio = document.querySelector('input[name="doctorRadios"]:checked');
        
        if (selectedDoctorRadio) {
            const doctorCard = selectedDoctorRadio.closest('.form-check');
            const doctorLabel = doctorCard.querySelector('label');
            const doctorSpan = doctorLabel.querySelector('.appointment-doctor-box');
            
            // Lấy tên doctor từ h5
            const nameElement = doctorSpan.querySelector('.h5');
            const name = nameElement ? nameElement.textContent.trim() : 'Emily Thompson';
            
            return {
                id: selectedDoctorRadio.value,
                name: name
            };
        }
        
        // Fallback: Lấy từ sessionStorage nếu có
        const storedDoctor = sessionStorage.getItem('selectedDoctor');
        if (storedDoctor) {
            try {
                return JSON.parse(storedDoctor);
            } catch (e) {
                console.error('Error parsing stored doctor:', e);
            }
        }
        
        // Fallback data
        return {
            id: '1',
            name: 'Emily Thompson'
        };
    }

    getSelectedService() {
        // Tìm service đã được chọn từ radio button
        const selectedServiceRadio = document.querySelector('input[name="serviceRadios"]:checked');
        if (selectedServiceRadio) {
            const serviceCard = selectedServiceRadio.closest('.form-check');
            const serviceLabel = serviceCard.querySelector('label');
            const serviceSpan = serviceLabel.querySelector('.appointment-clinic-box');
            // Lấy tên service từ h5
            const nameElement = serviceSpan.querySelector('.h5');
            const name = nameElement ? nameElement.textContent.trim() : '';
            return {
                id: selectedServiceRadio.value,
                name: name
            };
        }
        // Fallback: Lấy từ sessionStorage nếu có
        const storedService = sessionStorage.getItem('selectedService');
        if (storedService) {
            try {
                return JSON.parse(storedService);
            } catch (e) {
                console.error('Error parsing stored service:', e);
            }
        }
        // Không trả về service mặc định nữa
        return null;
    }

    getSelectedDateTime() {
        let formattedDate = sessionStorage.getItem('selectedDate') || '';
        let time = sessionStorage.getItem('selectedTime') || '';
        // Nếu dùng custom calendar mà sessionStorage chưa có, lấy từ window.getCustomCalendarDate
        if (!formattedDate && typeof window.getCustomCalendarDate === 'function') {
            const customDate = window.getCustomCalendarDate();
            if (customDate instanceof Date && !isNaN(customDate)) {
                const d = customDate.getDate().toString().padStart(2, '0');
                const m = (customDate.getMonth() + 1).toString().padStart(2, '0');
                const y = customDate.getFullYear();
                formattedDate = `${d}/${m}/${y}`;
            }
        }
        return {
            date: formattedDate,
            startTime: time,
            rawDate: formattedDate
        };
    }

    getPatientData() {
        // Lấy dữ liệu từ form đăng ký
        const activeTab = document.querySelector('.tab-pane.active');
        if (activeTab) {
            const form = activeTab.querySelector('form');
            if (form) {
                let firstName = '', lastName = '', phone = '', email = '', birthdate = '', cccd = '';
                // Lấy tất cả input trong form
                const inputEls = form.querySelectorAll('input');
                inputEls.forEach(input => {
                    // Tìm label gần nhất phía trên input
                    let label = '';
                    let parent = input.parentElement;
                    while (parent && !label) {
                        const labelEl = parent.querySelector('label');
                        if (labelEl) label = labelEl.textContent.toLowerCase();
                        parent = parent.parentElement;
                    }
                    if (label.includes('họ và tên')) {
                        const fullName = input.value.trim();
                        // Tách họ và tên từ trường "Họ và tên"
                        const nameParts = fullName.split(' ');
                        if (nameParts.length >= 2) {
                            lastName = nameParts[0]; // Phần đầu là họ
                            firstName = nameParts.slice(1).join(' '); // Phần còn lại là tên
                        } else {
                            firstName = fullName; // Nếu chỉ có 1 từ thì coi như là tên
                        }
                    }
                    if (label.includes('điện thoại')) phone = input.value.trim();
                    if (label.includes('email')) email = input.value.trim();
                    if (label.includes('ngày sinh') || input.classList.contains('flatpickrdate')) birthdate = input.value.trim();
                    if (label.includes('cccd')) cccd = input.value.trim();
                });
                return {
                    type: activeTab.id === 'register' ? 'relative' : 'self',
                    name: `${lastName} ${firstName}`.trim() || 'Chưa nhập họ và tên',
                    phone: phone || 'Chưa nhập số điện thoại',
                    email: email || 'Chưa nhập email',
                    dob: birthdate || 'Chưa nhập ngày sinh', // Đổi birthdate thành dob
                    cccd: cccd || 'Chưa nhập CCCD'
                };
            }
        }
        // Fallback data
        return {
            type: 'unknown',
            name: 'Chưa có thông tin',
            phone: 'Chưa có thông tin',
            email: 'Chưa có thông tin',
            birthdate: 'Chưa có thông tin',
            cccd: 'Chưa có thông tin'
        };
    }

    updateConfirmationDisplay() {
        // Collect latest data
        this.collectAppointmentData();
        
        // Debug log
        console.log('🔄 Updating confirmation display with data:', this.appointmentData);
        
        // Update clinic information
        this.updateClinicInfo();
        
        // Update appointment summary
        this.updateAppointmentSummary();
        
        // Update patient information
        this.updatePatientInfo();
        
        console.log('✅ Confirmation display updated');
        attachNoteInputListener(); // Gắn lại listener cho note mỗi lần cập nhật
    }

    updateClinicInfo() {
        const clinicNameElement = document.querySelector('.confirmation-clinic-name');
        const clinicAddressElement = document.querySelector('.confirmation-clinic-address');
        
        if (clinicNameElement && this.appointmentData.clinic) {
            clinicNameElement.textContent = this.appointmentData.clinic.name;
        }
        
        if (clinicAddressElement && this.appointmentData.clinic) {
            clinicAddressElement.textContent = this.appointmentData.clinic.address;
        }
    }

    updateAppointmentSummary() {
        const doctorElement = document.querySelector('.confirmation-doctor');
        const dateElement = document.querySelector('.confirmation-date');
        const timeElement = document.querySelector('.confirmation-time');
        const serviceElement = document.querySelector('.confirmation-service');
        const noteElement = document.querySelector('.confirmation-note');
        if (doctorElement && this.appointmentData.doctor) {
            doctorElement.textContent = this.appointmentData.doctor.name;
        }
        if (dateElement && this.appointmentData.date) {
            dateElement.textContent = this.appointmentData.date;
        }
        if (timeElement) {
            let timeToShow = this.appointmentData.startTime;
            if (!timeToShow) {
                // Lấy từ sessionStorage nếu không có
                timeToShow = sessionStorage.getItem('selectedTime') || '';
            }
            if (!timeToShow) timeToShow = 'Chưa chọn';
            timeElement.textContent = timeToShow;
            console.log('[DEBUG] Render giờ ra DOM:', timeToShow, 'appointmentData:', this.appointmentData);
        }
        if (serviceElement && this.appointmentData.service) {
            serviceElement.textContent = this.appointmentData.service.name;
        }
        if (noteElement) {
            noteElement.textContent = this.appointmentData.note || '';
        }
    }

    updatePatientInfo() {
        const patientNameElement = document.querySelector('.confirmation-patient-name');
        const patientPhoneElement = document.querySelector('.confirmation-patient-phone');
        const patientEmailElement = document.querySelector('.confirmation-patient-email');
        
        if (patientNameElement && this.appointmentData.patient) {
            patientNameElement.textContent = this.appointmentData.patient.name;
        }
        
        if (patientPhoneElement && this.appointmentData.patient) {
            patientPhoneElement.textContent = this.appointmentData.patient.phone;
        }
        
        if (patientEmailElement && this.appointmentData.patient) {
            patientEmailElement.textContent = this.appointmentData.patient.email;
        }
    }

    // Phương thức để các component khác có thể cập nhật dữ liệu
    updateData(newData) {
        this.appointmentData = { ...this.appointmentData, ...newData };
        this.updateConfirmationDisplay();
    }

    // Lấy dữ liệu hiện tại để gửi API
    getConfirmationData() {
        return this.appointmentData;
    }
}

// Thêm hàm resetTimeSelection ở đầu class hoặc ngoài class
function resetTimeSelection() {
    sessionStorage.removeItem('selectedTime');
    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
    // Nếu có nút Next, disable luôn
    const dateTab = document.querySelector('.appointment-tab-content.appointment-content-active');
    if (dateTab) {
        const nextButton = dateTab.querySelector('button.next');
        if (nextButton) {
            nextButton.disabled = true;
            nextButton.style.opacity = '0.4';
            nextButton.style.pointerEvents = 'none';
            nextButton.style.cursor = 'not-allowed';
        }
    }
}

// Thêm ngoài class
function attachNoteInputListener() {
    document.querySelectorAll('.appointment-note').forEach(input => {
        if (!input._hasListener) {
            input.addEventListener('input', function() {
                sessionStorage.setItem('appointmentNote', this.value); // Lưu vào sessionStorage
                if (window.appointmentConfirmation) {
                    window.appointmentConfirmation.updateConfirmationDisplay();
                }
            });
            input._hasListener = true;
        }
    });
}

// Khởi tạo handler
const appointmentConfirmation = new AppointmentConfirmationHandler();

// Export để sử dụng global
window.AppointmentConfirmationHandler = AppointmentConfirmationHandler;
window.appointmentConfirmation = appointmentConfirmation; 

function updateNextButtonStateForDateTime() {
    // Chỉ tìm trong tab đang active
    const dateTab = document.querySelector('.appointment-tab-content.appointment-content-active');
    if (!dateTab) return;
    const nextButton = dateTab.querySelector('button.next');
    // Kiểm tra đã chọn ngày chưa
    const flatpickrInput = dateTab.querySelector('.inline_flatpickr, .flatpickrdate');
    let hasDate = false;
    if (flatpickrInput) hasDate = !!flatpickrInput.value;
    // Kiểm tra đã chọn giờ chưa (sessionStorage.selectedTime)
    const hasTime = !!sessionStorage.getItem('selectedTime');
    if (nextButton) {
        if (hasDate && hasTime) {
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
// Gắn lại khi chọn ngày hoặc giờ
document.querySelectorAll('.inline_flatpickr, .flatpickrdate').forEach(input => {
    input.addEventListener('change', function() {
        setTimeout(updateNextButtonStateForDateTime, 120);
    });
});
document.addEventListener('DOMContentLoaded', updateNextButtonStateForDateTime);
document.addEventListener('shown.bs.tab', updateNextButtonStateForDateTime);
document.addEventListener('click', function(e) {
    if (e.target.classList && e.target.classList.contains('time-btn')) {
        setTimeout(updateNextButtonStateForDateTime, 20);
    }
}); 

// Đảm bảo luôn gắn listener cho note kể cả khi DOM render lại động
setInterval(attachNoteInputListener, 1000); 

// Gắn event listener cho tất cả nút .next để luôn cập nhật xác nhận khi chuyển bước
setTimeout(() => {
    document.querySelectorAll('.next').forEach(btn => {
        if (!btn._hasUpdateConfirmListener) {
            btn.addEventListener('click', function() {
                if (window.appointmentConfirmation) {
                    window.appointmentConfirmation.updateConfirmationDisplay();
                }
            });
            btn._hasUpdateConfirmListener = true;
        }
    });
}, 1000); 