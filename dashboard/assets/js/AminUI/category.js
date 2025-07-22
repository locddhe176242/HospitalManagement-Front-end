document.addEventListener('DOMContentLoaded', function () {
  renderDepartmentList(); // Khi trang load
  setupAddDepartmentForm(); // Gắn xử lý form thêm
  setupEditDepartmentForm(); // Gắn xử lý form sửa
});

// Load danh sách khoa khám
async function renderDepartmentList() {
  const container = document.querySelector('.card-body .row');
  container.innerHTML = ''; // Clear list cũ

  try {
    const res = await fetch('https://localhost:7097/api/Department/get-all');

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Lỗi API: ${err}`);
    }

    const departments = await res.json();

    if (!departments || departments.length === 0) {
      container.innerHTML = `<div class="alert alert-warning">Chưa có khoa khám nào.</div>`;
      return;
    }

    departments.forEach(dep => {
  container.innerHTML += `
    <div class="col">
      <div class="bg-light-subtle p-4 d-flex justify-content-between mb-5 flex-column flex-md-row gap-2 align-items-md-center rounded"
           style="cursor: pointer;" 
           onclick="showDoctorsInDepartment(${dep.id}, '${dep.name}')">
        <div class="d-flex align-items-start align-items-md-center gap-3 flex-column flex-md-row">
          <img class="img-fluid avatar avatar-80" src="${dep.imageUrl || './assets/images/doctor/1.webp'}" alt="Doctor" />
          <div>
            <h5 class="mb-1 text-capitalize">${dep.name}</h5>
            <span class="text-body">${dep.description}</span>
          </div>
        </div>
        <div class="mt-2 d-flex gap-2">
          <span class="badge bg-secondary mt-2">${dep.totalAmountOfPeople} người</span>
          <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); editDepartment(${dep.id})">
            <i class="bi bi-pencil"></i> Sửa
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteDepartment(${dep.id})">
            <i class="bi bi-trash"></i> Xóa
          </button>
        </div>
      </div>
    </div>
  `;
});

  } catch (err) {
    console.error('Lỗi khi load danh sách khoa khám:', err);
    container.innerHTML = `<div class="alert alert-danger">Không thể tải danh sách khoa khám.</div>`;
  }
}


// Xử lý form thêm khoa
function setupAddDepartmentForm() {
  const form = document.getElementById('addDepartmentForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('dep_name').value.trim();
    const description = document.getElementById('dep_description').value.trim();
    const now = new Date().toISOString();

    if (!name || !description) {
      alert('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    const body = {
      name,
      code: "",
      description,
      totalAmountOfPeople: 0,
      status: "Active",
      createDate: now,
      updateDate: now,
      createBy: "",
      updateBy: ""
    };

    try {
      const res = await fetch('https://localhost:7097/api/Department/add-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert('Thêm khoa thành công!');
        form.reset();
        document.getElementById('closeCanvasBtn')?.click();
        renderDepartmentList();
      } else {
        const err = await res.text();
        alert('Thêm khoa thất bại:\n' + err);
      }
    } catch (err) {
      alert('Lỗi kết nối đến máy chủ!');
    }
  });
}

// Gọi API lấy thông tin 1 khoa, hiển thị form sửa
function editDepartment(id) {
  fetch(`https://localhost:7097/api/Department/find-id/${id}`)
    .then(async res => {
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Lỗi API: ${res.status} - ${errText}`);
      }
      return res.json();
    })
    .then(dep => {
      document.getElementById('edit_dep_id').value = dep.id;
      document.getElementById('edit_dep_name').value = dep.name;
      document.getElementById('edit_dep_description').value = dep.description;

      const offcanvas = new bootstrap.Offcanvas('#offcanvasDepartmentEdit');
      offcanvas.show();
    })
    .catch(err => {
      console.error('Lỗi khi load thông tin khoa:', err);
      alert('Không thể tải thông tin khoa khám.');
    });
}

// Xử lý submit form sửa khoa
function setupEditDepartmentForm() {
  const form = document.getElementById('editDepartmentForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const id = document.getElementById('edit_dep_id').value;
    const name = document.getElementById('edit_dep_name').value.trim();
    const description = document.getElementById('edit_dep_description').value.trim();
    const now = new Date().toISOString();

    const body = {
      id: Number(id),
      name,
      description,
      code: "",
      totalAmountOfPeople: 0,
      status: "Active",
      createDate: now,
      updateDate: now,
      createBy: "",
      updateBy: ""
    };

    try {
      const res = await fetch(`https://localhost:7097/api/Department/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert('Cập nhật thành công!');
        const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasDepartmentEdit'));
        offcanvas.hide();
        renderDepartmentList();
      } else {
        const err = await res.text();
        alert('Cập nhật thất bại:\n' + err);
      }
    } catch {
      alert('Lỗi kết nối đến máy chủ!');
    }
  });
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

async function showDoctorsInDepartment(departmentId, departmentName) {
  try {
    const res = await fetch(`https://localhost:7097/api/Doctors/get-by-departmentId?departmentId=${departmentId}`);
    if (!res.ok) throw new Error('Không thể lấy danh sách bác sĩ');

    const doctors = await res.json();
    const list = document.getElementById('doctorList');
    const title = document.getElementById('doctorModalLabel');
    title.textContent = `Danh sách bác sĩ của khoa "${departmentName}"`;

    list.innerHTML = '';
    if (doctors.length === 0) {
  list.innerHTML = `<p class="text-danger">Không có bác sĩ nào</p>`;
} else {
  list.innerHTML = `
    <div class="table-responsive">
      <table class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th>Họ tên</th>
            <th>Giới tính</th>
            <th>Ngày sinh</th>
            <th>Điện thoại</th>
            <th>Mã giấy phép</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          ${doctors.map(doc => `
            <tr>
              <td>${doc.name}</td>
              <td>${doc.gender}</td>
              <td>${new Date(doc.dob).toLocaleDateString('vi-VN')}</td>
              <td>${doc.phone}</td>
              <td>${doc.licenseNumber}</td>
              <td>${doc.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}


    new bootstrap.Modal(document.getElementById('doctorModal')).show();
  } catch (err) {
    alert('Lỗi khi tải danh sách bác sĩ!');
    console.error(err);
  }
}