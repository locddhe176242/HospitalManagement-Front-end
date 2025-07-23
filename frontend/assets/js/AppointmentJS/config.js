// Configuration file for API endpoints
const API_CONFIG = {
    // Backend base URL - Sử dụng HTTPS
    BASE_URL: 'https://localhost:7097',
    
    // API endpoints
    ENDPOINTS: {
        // Authentication
        LOGIN: '/api/Authentication/login',
        REGISTER: '/api/Authentication/register',
        REGISTER_PATIENT: '/api/Authentication/register/patient',
        FORGOT_PASSWORD: '/api/Authentication/forgot-password',
        RESET_PASSWORD: '/api/Authentication/reset-password',
        CHANGE_PASSWORD: '/api/Authentication/change-password',
        
        // Patient
        PATIENT_FIND_ID: '/api/Patient/findId',
        PATIENT_FIND_USER_ID: '/api/Patient/findUserId',
        PATIENT_UPDATE: '/api/Patient/updateByUserId',
        PATIENT_UPDATE_IMAGE: '/api/Patient/updatePatientImage',
        
        // Appointment
        APPOINTMENT_CREATE: '/api/Appointment/create',
        APPOINTMENT_GET_ALL: '/api/Appointment/getAll',
        APPOINTMENT_GET_BY_USER: '/api/Appointment/getByUser',
        APPOINTMENT_GET_DOCTOR_WORKING_DAYS: '/api/Appointment/doctor-working-days',
        APPOINTMENT_GET_BOOKED_TIME_SLOTS: '/api/Appointment/booked-time-slots',
        
        // Doctor
        DOCTOR_GET_ALL: '/api/Doctor/getAll',
        DOCTOR_GET_BY_ID: '/api/Doctor/getById',
        
        // Clinic
        CLINIC_GET_ALL: '/api/Clinic/getAll',
        CLINIC_GET_BY_ID: '/api/Clinic/getById',
        
        // Department
        DEPARTMENT_GET_ALL: '/api/Department/getAll',
        DEPARTMENT_GET_BY_ID: '/api/Department/getById'
    },
    
    // Headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json'
    },
    
    // Helper function to get full URL
    getUrl: function(endpoint) {
        return this.BASE_URL + endpoint;
    },
    
    // Helper function to get headers with authorization
    getAuthHeaders: function(token) {
        return {
            ...this.DEFAULT_HEADERS,
            'Authorization': `Bearer ${token}`
        };
    }
};

// Export for use in other files
window.API_CONFIG = API_CONFIG; 