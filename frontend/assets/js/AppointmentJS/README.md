# Tích hợp API cho Trang Đặt lịch hẹn

## Tổng quan
Các file tích hợp API cung cấp chức năng để hiển thị và quản lý danh sách phòng khám và bác sĩ trong trang đặt lịch hẹn.

## Danh sách file tích hợp

### 1. Clinic Integration (`clinic-integration.js`)
Quản lý danh sách phòng khám và chọn phòng khám.

### 2. Doctor Integration (`doctor-integration.js`)
Quản lý danh sách bác sĩ theo phòng khám đã chọn và chọn bác sĩ.

## Tính năng

### 1. Tải danh sách phòng khám
- Tự động tải danh sách phòng khám đang hoạt động khi trang được load
- Sử dụng API endpoint: `GET /api/Appointment/clinics?date={date}`
- Hiển thị loading spinner trong quá trình tải

### 2. Tìm kiếm phòng khám
- Tìm kiếm theo tên phòng khám
- Sử dụng API endpoint: `GET /api/Appointment/clinics/search?name={searchTerm}`
- Tìm kiếm real-time khi người dùng nhập

### 3. Chọn phòng khám
- Hiển thị thông tin chi tiết phòng khám (tên, địa chỉ, email, hình ảnh)
- Kiểm tra trạng thái kín lịch (isFull)
- Lưu phòng khám đã chọn vào session storage

### 4. Xử lý lỗi
- Hiển thị thông báo lỗi khi không thể tải dữ liệu
- Nút "Thử lại" để load lại dữ liệu
- Fallback cho hình ảnh không tải được

## API Endpoints được sử dụng

### 1. Lấy danh sách phòng khám đang hoạt động
```
GET https://localhost:7097/api/Appointment/clinics?date={date}
```

**Response:**
```json
{
  "success": true,
  "message": "Lấy danh sách phòng khám thành công",
  "data": [
    {
      "id": 1,
      "name": "Phòng khám Miracle",
      "code": "CL001",
      "status": 0,
      "address": "123 Đường ABC, Quận 1, TP.HCM",
      "email": "miracle@example.com",
      "imageUrl": "path/to/image.jpg",
      "isFull": false
    }
  ]
}
```

### 2. Tìm kiếm phòng khám
```
GET https://localhost:7097/api/Appointment/clinics/search?name={searchTerm}
```

**Response:**
```json
{
  "success": true,
  "message": "Tìm kiếm phòng khám thành công",
  "data": [
    {
      "id": 1,
      "name": "Phòng khám Miracle",
      "code": "CL001",
      "status": 0,
      "address": "123 Đường ABC, Quận 1, TP.HCM",
      "email": "miracle@example.com",
      "imageUrl": "path/to/image.jpg",
      "isFull": false
    }
  ]
}
```

### 3. Lấy danh sách bác sĩ theo phòng khám
```
GET https://localhost:7097/api/Appointment/doctors/{clinicId}?date={date}
```

**Response:**
```json
{
  "success": true,
  "message": "Lấy danh sách bác sĩ thành công",
  "data": [
    {
      "id": 1,
      "name": "Dr. Alexandra Johnson",
      "code": "DR001",
      "gender": 1,
      "dob": "1985-03-15T00:00:00",
      "phone": "0123456789",
      "imageURL": "path/to/image.jpg",
      "licenseNumber": "BS001",
      "yearOfExperience": 5.5,
      "workingHours": 8.0,
      "status": 0,
      "userId": 1,
      "departmentId": 1,
      "isFull": false
    }
  ]
}
```

### 4. Tìm kiếm bác sĩ theo tên
```
GET https://localhost:7097/api/Doctors/FindByName/{name}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Dr. Alexandra Johnson",
    "code": "DR001",
    "gender": 1,
    "dob": "1985-03-15T00:00:00",
    "phone": "0123456789",
    "imageURL": "path/to/image.jpg",
    "licenseNumber": "BS001",
    "yearOfExperience": 5.5,
    "workingHours": 8.0,
    "status": 0,
    "userId": 1,
    "departmentId": 1,
    "isFull": false
  }
]
```

## Cấu trúc HTML cần thiết

### Clinic Integration

#### Container chính
```html
<div class="row" id="clinic-container">
  <!-- Clinic cards sẽ được render động ở đây -->
</div>
```

#### Input tìm kiếm
```html
<input type="text" class="form-control" id="clinic-search" placeholder="Tìm kiếm phòng khám...">
```

### Doctor Integration

#### Container chính
```html
<div class="row" id="doctor-container">
  <!-- Doctor cards sẽ được render động ở đây -->
</div>
```

#### Input tìm kiếm
```html
<input type="text" class="form-control" id="doctor-search" placeholder="Tìm kiếm bác sĩ...">
```

## Sử dụng

### Clinic Integration

#### 1. Khởi tạo
```javascript
// Tự động khởi tạo khi DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    const clinicSection = document.querySelector('.appointment-content-active');
    if (clinicSection && clinicSection.querySelector('.tab-widget-inner-data')) {
        window.clinicIntegration = new ClinicIntegration();
    }
});
```

#### 2. Lấy phòng khám đã chọn
```javascript
const selectedClinic = clinicIntegration.getSelectedClinic();
console.log('Selected clinic:', selectedClinic);
```

#### 3. Xóa lựa chọn
```javascript
clinicIntegration.clearSelection();
```

#### 4. Load lại danh sách
```javascript
clinicIntegration.loadClinics();
```

#### 5. Xóa tìm kiếm
```javascript
clinicIntegration.clearSearch();
```

### Doctor Integration

#### 1. Khởi tạo
```javascript
// Tự động khởi tạo khi DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    const doctorSection = document.querySelector('.appointment-tab-content');
    if (doctorSection && doctorSection.querySelector('#doctor-container')) {
        window.doctorIntegration = new DoctorIntegration();
    }
});
```

#### 2. Lấy bác sĩ đã chọn
```javascript
const selectedDoctor = doctorIntegration.getSelectedDoctor();
console.log('Selected doctor:', selectedDoctor);
```

#### 3. Xóa lựa chọn
```javascript
doctorIntegration.clearSelection();
```

#### 4. Load lại danh sách
```javascript
doctorIntegration.loadDoctors();
```

## Dữ liệu phòng khám

### ClinicResponseDTO
```typescript
interface ClinicResponseDTO {
  id: number;
  name: string;
  code: string;
  status: ClinicStatus;
  createDate: DateTime;
  updateDate?: DateTime;
  createBy: string;
  updateBy?: string;
  address?: string;
  email?: string;
  imageUrl?: string;
  isFull: boolean;
}
```

## Xử lý lỗi

### 1. Lỗi mạng
- Hiển thị thông báo "Không thể tải danh sách phòng khám. Vui lòng thử lại sau."
- Nút "Thử lại" để load lại dữ liệu

### 2. Lỗi tìm kiếm
- Hiển thị thông báo "Không thể tìm kiếm phòng khám. Vui lòng thử lại."
- Tự động load lại danh sách gốc

### 3. Không có dữ liệu
- Hiển thị "Không tìm thấy phòng khám nào."

## Tùy chỉnh

### 1. Thay đổi API base URL
```javascript
class ClinicIntegration {
    constructor() {
        this.apiBaseUrl = 'https://your-api-domain.com'; // Thay đổi URL
        // ...
    }
}
```

### 2. Thay đổi placeholder tìm kiếm
```html
<input type="text" class="form-control" id="clinic-search" placeholder="Tìm kiếm phòng khám...">
```

### 3. Thay đổi hình ảnh mặc định
```javascript
const defaultImage = './assets/images/pages/clinic-1.webp'; // Thay đổi đường dẫn
```

## Lưu ý

1. **CORS**: Đảm bảo backend cho phép CORS từ frontend domain
2. **HTTPS**: Sử dụng HTTPS cho production
3. **Error Handling**: Luôn xử lý lỗi và hiển thị thông báo phù hợp
4. **Loading States**: Hiển thị loading spinner để UX tốt hơn
5. **Session Storage**: Dữ liệu phòng khám được lưu trong session storage để sử dụng ở các bước tiếp theo

## Troubleshooting

### 1. Không tải được dữ liệu
- Kiểm tra console để xem lỗi
- Đảm bảo backend đang chạy
- Kiểm tra CORS configuration

### 2. Tìm kiếm không hoạt động
- Kiểm tra ID của input search
- Đảm bảo event listener được attach đúng

### 3. Không chọn được phòng khám
- Kiểm tra radio button có bị disabled không
- Kiểm tra event listener cho radio button 