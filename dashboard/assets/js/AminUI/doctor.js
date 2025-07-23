document.addEventListener('DOMContentLoaded', function () {
  renderAllDoctors();
  setupAddDoctorForm();
  loadDepartmentOptions();
  setupEditDoctorForm();
});

// Load danh sách khoa khám
async function renderAllDoctors() {
  try {
    const res = await fetch('https://localhost:7097/api/Doctors/GetAll');
    if (!res.ok) throw new Error('Lỗi khi lấy danh sách bác sĩ.');

    const doctors = await res.json();
    const container = document.getElementById('allDoctorsList'); // đảm bảo có div này trong HTML
    container.innerHTML = '';

    if (doctors.length === 0) {
      container.innerHTML = `<div class="alert alert-warning">Không có bác sĩ nào được tìm thấy.</div>`;
      return;
    }

    doctors.forEach(doc => {
  const genderVN = doc.gender === 'Male' ? 'Nam' : doc.gender === 'Female' ? 'Nữ' : doc.gender;
  const statusVN = doc.status === 'Available' ? 'Sẵn sàng' : 'Không rõ';
  const imageSrc = doc.imageURL || './assets/images/doctor/1.webp';

  container.innerHTML += `
  <div class="col">
    <div class="bg-light-subtle p-4 d-flex justify-content-between mb-5 flex-column flex-md-row gap-1 rounded"
         style="cursor: pointer;" 
         onclick="showDoctorsDetail(${doc.userId}, '${doc.name}')">
      <div class="d-flex align-items-start align-items-md-center gap-3 flex-column flex-md-row">
        <img class="img-fluid avatar avatar-80" src="${imageSrc}" alt="Dr-profile" loading="lazy" />
        <div>
          <h5 class="mb-1">${doc.name}</h5>
          <span class="text-body">${genderVN} – SĐT: ${doc.phone}</span>
          <h6 class="mb-0 pt-1"><span class="text-body fw-normal">Trạng thái:</span> ${statusVN}</h6>
        </div>
      </div>

      <div class="d-flex flex-column align-items-end mt-2">
        <span class="text-primary small text-capitalize mb-1">
          Kinh nghiệm: ${doc.yearOfExperience} năm
        </span>
        <div class="d-flex flex-row gap-2">
          <button class="btn btn-outline-primary btn-sm px-2 py-1"
                  onclick="event.stopPropagation(); editDoctor(${doc.userId})">
            <i class="bi bi-pencil"></i> Sửa
          </button>
          <button class="btn btn-outline-danger btn-sm px-2 py-1"
                  onclick="event.stopPropagation(); deleteDoctor(${doc.id})">
            <i class="bi bi-trash"></i> Xóa
          </button>
        </div>
      </div>

    </div>
  </div>
`;
});
  } catch (err) {
    console.error(err);
    alert('Không thể tải danh sách bác sĩ.');
  }
}


// Xử lý form thêm bác sĩ
function setupAddDoctorForm() {
  const form = document.getElementById('addDoctorForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Bạn cần đăng nhập trước.');
      return;
    }

    const body = {
      email: document.getElementById('doctor_email').value.trim(),
      password: document.getElementById('doctor_password').value.trim(),
      fullName: document.getElementById('doctor_name').value.trim(),
      code:  "string",
      gender: document.getElementById('doctor_gender').value,
      dob: new Date(document.getElementById('doctor_dob').value).toISOString(),
      cccd: document.getElementById('doctor_cccd').value.trim(),
      phone: document.getElementById('doctor_phone').value.trim(),
      licenseNumber: document.getElementById('doctor_license').value.trim(),
      departmentId: parseInt(document.getElementById('doctor_departmentId').value)
    };

    // Kiểm tra dữ liệu trước khi gửi
    if (!body.email || !body.password || !body.fullName || !body.phone || !body.departmentId) {
      alert('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    console.log(' Đang gửi:', JSON.stringify(body));

    try {
      const res = await fetch('https://localhost:7097/api/Authentication/register/doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert('Thêm bác sĩ thành công!');
        form.reset();
        bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasAddDoctor')).hide();
        renderAllDoctors();
      } else {
        const err = await res.text();
        console.error(' Lỗi 400 từ server:', err);
        alert('Thêm bác sĩ thất bại:\n' + err);
      }
    } catch (err) {
      console.error(' Lỗi kết nối:', err);
      alert(' Lỗi kết nối đến máy chủ!');
    }
  });
}


async function loadDepartmentOptions() {
  try {
    const res = await fetch('https://localhost:7097/api/Department/get-all');
    if (!res.ok) throw new Error('Không thể tải danh sách khoa.');

    const departments = await res.json();
    const select = document.getElementById('doctor_departmentId');
    select.innerHTML = '';

    departments.forEach(dep => {
      const opt = document.createElement('option');
      opt.value = dep.id;
      opt.textContent = dep.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    alert('Lỗi khi tải khoa!');
  }
}

// Gọi API lấy thông tin 1 khoa, hiển thị form sửa
function editDoctor(userId) {
  fetch(`https://localhost:7097/api/Doctors/FindByUserId/${userId}`)
    .then(async res => {
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Lỗi API: ${res.status} - ${errText}`);
      }
      return res.json();
    })
    .then(doc => {
      document.getElementById('edit_doctor_userId').value = doc.userId;
      document.getElementById('edit_doctor_name').value = doc.name;
      document.getElementById('edit_doctor_code').value = doc.code;
      document.getElementById('edit_doctor_gender').value = doc.gender;
      document.getElementById('edit_doctor_dob').value = doc.dob.split("T")[0];
      document.getElementById('edit_doctor_cccd').value = doc.cccd;
      document.getElementById('edit_doctor_phone').value = doc.phone;
      document.getElementById('edit_doctor_imageURL').value = doc.imageURL;
      document.getElementById('edit_doctor_licenseNumber').value = doc.licenseNumber;
      document.getElementById('edit_doctor_yearOfExperience').value = doc.yearOfExperience;
      document.getElementById('edit_doctor_workingHours').value = doc.workingHours;
      document.getElementById('edit_doctor_status').value = doc.status;
      populateDepartmentSelect('edit_doctor_departmentId', doc.departmentId);
      document.getElementById('edit_doctor_createBy').value = doc.createBy;
      document.getElementById('edit_doctor_updateBy').value = doc.updateBy;

      const offcanvas = new bootstrap.Offcanvas('#offcanvasDepartmentEdit');
      offcanvas.show();
    })
    .catch(err => {
      console.error('Lỗi khi load thông tin bác sĩ:', err);
      alert('Không thể tải thông tin bác sĩ.');
    });
}


// Xử lý submit form sửa bác sĩ
function setupEditDoctorForm() {
  const form = document.getElementById('editDoctorForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const userId = document.getElementById('edit_doctor_userId').value;

    const body = {
      userId: Number(userId),
      name: document.getElementById('edit_doctor_name').value.trim(),
      code: document.getElementById('edit_doctor_code').value.trim(),
      gender: document.getElementById('edit_doctor_gender').value,
      dob: new Date(document.getElementById('edit_doctor_dob').value).toISOString(),
      cccd: document.getElementById('edit_doctor_cccd').value.trim(),
      phone: document.getElementById('edit_doctor_phone').value.trim(),
      imageURL: document.getElementById('edit_doctor_imageURL').value.trim(),
      licenseNumber: document.getElementById('edit_doctor_licenseNumber').value.trim(),
      yearOfExperience: Number(document.getElementById('edit_doctor_yearOfExperience').value),
      workingHours: Number(document.getElementById('edit_doctor_workingHours').value),
      status: document.getElementById('edit_doctor_status').value,
      departmentId: parseInt(document.getElementById('doctor_departmentId').value),
      createBy: document.getElementById('edit_doctor_createBy').value.trim(),
      updateBy: document.getElementById('edit_doctor_updateBy').value.trim(),
      createDate: new Date().toISOString(),
      updateDate: new Date().toISOString()
    };

    try {
      const res = await fetch(`https://localhost:7097/api/Doctors/UpdateDoctor/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert(' Cập nhật bác sĩ thành công!');
        bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasDepartmentEdit')).hide();
        renderAllDoctors();
      } else {
        const err = await res.text();
        alert(' Cập nhật bác sĩ thất bại:\n' + err);
      }
    } catch (error) {
      console.error(' Lỗi kết nối:', error);
      alert(' Không thể kết nối đến máy chủ!');
    }
  });
}

async function populateDepartmentSelect(selectId, selectedId = null) {
  try {
    const res = await fetch('https://localhost:7097/api/Department/get-all');
    if (!res.ok) throw new Error('Không thể tải danh sách khoa.');

    const departments = await res.json();
    const select = document.getElementById(selectId);
    select.innerHTML = '';

    departments.forEach(dep => {
      const opt = document.createElement('option');
      opt.value = dep.id;
      opt.textContent = dep.name;
      if (selectedId !== null && dep.id === selectedId) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    alert('Lỗi khi tải khoa khám!');
  }
}


// Xóa khoa
 function  deleteDepartment(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa khoa này?')) return;

  fetch(`https://localhost:7097/api/Department/delete-permanent/${id}`, {
    method: 'DELETE'
  })
    .then(async res => {
      if (res.ok) {
        alert('Đã xóa thành công!');
        await renderDepartmentList();
      } else {
        alert('Xóa thất bại!');
      }
    })
    .catch(() => alert('Lỗi khi xóa khoa khám!'));
        
}

async function showDoctorsDetail(userId, departmentName) {
  try {
    const res = await fetch(`https://localhost:7097/api/Doctors/FindByUserId/${userId}`);
    if (!res.ok) throw new Error('Không thể lấy thông tin bác sĩ');

    const doctor = await res.json(); 
    const list = document.getElementById('doctorList');
    const title = document.getElementById('doctorModalLabel');
    title.textContent = `Thông tin bác sĩ của khoa "${departmentName}"`;

    if (!doctor || !doctor.name) {
      list.innerHTML = `<p class="text-danger">Không có thông tin bác sĩ</p>`;
    } else {
      list.innerHTML = `
  <div class="p-4 border rounded bg-white">
    <h5 class="mb-4 text-primary">Thông tin bác sĩ</h5>
    <div class="row g-3">
      <div class="col-md-6">
        <strong>Họ tên:</strong> <span class="text-muted">${doctor.name}</span>
      </div>
      <div class="col-md-6">
        <strong>Giới tính:</strong> <span class="text-muted">${doctor.gender}</span>
      </div>
      <div class="col-md-6">
        <strong>Ngày sinh:</strong> <span class="text-muted">${new Date(doctor.dob).toLocaleDateString('vi-VN')}</span>
      </div>
      <div class="col-md-6">
        <strong>Căn cước công dân:</strong> <span class="text-muted">${doctor.cccd}</span>
      </div>
      <div class="col-md-6">
        <strong>Điện thoại:</strong> <span class="text-muted">${doctor.phone}</span>
      </div>
      <div class="col-md-6">
        <strong>Mã giấy phép:</strong> <span class="text-muted">${doctor.licenseNumber}</span>
      </div>
      <div class="col-md-6">
        <strong>Kinh nghiệm:</strong> <span class="text-muted">${doctor.yearOfExperience || 'Chưa cập nhật'} năm</span>
      </div>
      <div class="col-md-6">
        <strong>Giờ làm việc:</strong> <span class="text-muted">${doctor.workingHours || 'Chưa cập nhật'} giờ</span>
      </div>
      <div class="col-md-6">
        <strong>Trạng thái:</strong> <span class="text-muted">${doctor.status}</span>
      </div>
    </div>
  </div>
`;
    }

    new bootstrap.Modal(document.getElementById('doctorModal')).show();
  } catch (err) {
    alert('Lỗi khi tải thông tin bác sĩ!');
    console.error(err);
  }
}

var myWidget = cloudinary.createUploadWidget(
  {
    cloudName: "dwcih9djc",
    uploadPreset: "ml_default",
    sources: ["local", "url", "camera"],
    multiple: false,
    clientAllowedFormats: ["jpg", "png", "jpeg", "gif"],
    cropping: true,
    croppingAspectRatio: 1,
  },
  (error, result) => {
    if (!error && result && result.event === "success") {
      const imageUrl = result.info.secure_url;
      document.getElementById("profileImage").src = imageUrl;
      updateProfileImage(imageUrl);
    }
  }
);

function uploadDoctorImage() {
  const widget = cloudinary.createUploadWidget(
    {
      cloudName: 'dwcih9djc',
      uploadPreset: 'ml_default',
      sources: ['local', 'url', 'camera'],
      cropping: true,
      croppingAspectRatio: 1,
      multiple: false,
      clientAllowedFormats: ['jpg', 'png', 'jpeg', 'gif']
    },
    (error, result) => {
      if (!error && result && result.event === 'success') {
        const url = result.info.secure_url;
        document.getElementById('edit_doctor_imageURL').value = url;
        document.getElementById('edit_doctor_imagePreview').src = url;
      }
    }
  );
  widget.open();
}
