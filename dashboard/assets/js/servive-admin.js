document.addEventListener('DOMContentLoaded', function () {
    renderAllService();
    setupAddServiceForm();
    loadDepartmentOptions();
    setupEditServiceForm();
});



let allServices = []; // lưu toàn bộ danh sách sau khi load từ API

async function renderAllService() {
    try {
        const res = await fetch('https://localhost:7097/api/Service/get-all');
        if (!res.ok) throw new Error('Lỗi khi lấy danh sách dịch vụ.');

        allServices = await res.json(); // Lưu vào biến toàn cục
        renderServicesToUI(allServices); // Hàm render hiển thị bên dưới
    } catch (err) {
        console.error(err);
        alert('Không thể tải danh sách dịch vụ.');
    }
}

document.getElementById('searchServiceInput').addEventListener('input', function () {
    const keyword = this.value.toLowerCase();
    const filtered = allServices.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(keyword);
        const priceMatch = s.price.toString().toLowerCase().includes(keyword);

        return nameMatch || priceMatch 
    });
    renderServicesToUI(filtered);
});


// Load danh sách khoa khám
function renderServicesToUI(services) {
    const container = document.getElementById('allServiceList');
    container.innerHTML = '';

    if (services.length === 0) {
        container.innerHTML = `<div class="alert alert-warning">Không có dịch vụ nào được tìm thấy.</div>`;
        return;
    }

    services.forEach(doc => {
        const statusVN = doc.status === 'Active' ? 'Sẵn sàng' : 'Không hoạt động';
        const imageSrc = doc.imageUrl || './assets/images/doctor/1.webp';

        container.innerHTML += `
        <div class="col-12 col-md-6 col-lg-4 mb-4">
            <div class="card shadow-sm h-100 p-3" onclick="showServiceDetail(${doc.id}, '${doc.name}')" style="cursor:pointer;">
                <div class="d-flex align-items-start gap-3">
                    <img src="${imageSrc}" class="rounded" width="80" height="80" style="object-fit: cover;" alt="Service">
                    <div class="flex-grow-1">
                        <h5 class="mb-1 fw-bold">${doc.name}</h5>
                        <p class="mb-1 text-muted small">
                            <strong>Mô tả:</strong> ${doc.description}
                        </p>
                        <p class="mb-1"><strong>Giá:</strong> ${doc.price.toLocaleString()} VND</p>
                        <p class="mb-1"><strong>Trạng thái:</strong> 
                            <span class="${doc.status === 'Active' ? 'text-success' : 'text-danger'}">${statusVN}</span>
                        </p>
                    </div>
                    <div class="ms-auto">
                        <button class="btn btn-outline-primary btn-sm"
                            onclick="event.stopPropagation(); editServive(${doc.id})">
                            <i class="bi bi-pencil"></i> Sửa
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    });
}



//Xử lý form thêm dịch vụ 
function setupAddServiceForm() {
    const form = document.getElementById('addServiceForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Bạn cần đăng nhập trước.');
            return;
        }

        const body = {
            name: document.getElementById('name').value.trim(),
            code: document.getElementById('code').value.trim(),
            description: document.getElementById('description').value,
            price: parseFloat(document.getElementById('price').value.trim()),
            departmentId: document.getElementById('departmentId').value.trim(),
            image: " ",
            status: "Active"
        };

        // Kiểm tra dữ liệu trước khi gửi
        if (!body.name || !body.code || !body.description || !body.price || !body.departmentId) {
            alert('Vui lòng nhập đầy đủ thông tin.');
            return;
        }

        console.log(' Đang gửi:', JSON.stringify(body));

        try {
            const res = await fetch('https://localhost:7097/api/Service/add-service', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert('Thêm dịch vụ thành công!');
                form.reset();
                bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasAddService')).hide();
                renderAllService();
            } else {
                const err = await res.text();
                console.error(' Lỗi 400 từ server:', err);
                alert('Thêm dịch vụ thất bại:\n' + err);
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
        const select = document.getElementById('departmentId');
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
function editServive(id) {
  fetch(`https://localhost:7097/api/Service/get-by/${id}`)
    .then(async res => {
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Lỗi API: ${res.status} - ${errText}`);
      }
      return res.json();
    })
    .then(doc => {
      document.getElementById('edit_service_userId').value = doc.id;
      document.getElementById('edit_service_name').value = doc.name;
      document.getElementById('edit_service_code').value = doc.code;
      document.getElementById('edit_service_description').value = doc.description;
      document.getElementById('edit_price').value = doc.price;
      document.getElementById('edit_service_imageURL').value = doc.imageUrl;
      document.getElementById('edit_service_status').value = doc.status;
      populateDepartmentSelect('edit_service_departmentId', doc.departmentId);
      const offcanvas = new bootstrap.Offcanvas('#offcanvasServiceEdit');
      offcanvas.show();
    })
    .catch(err => {
      console.error('Lỗi khi load thông tin dịch vụ:', err);
      alert('Không thể tải thông tin dịch vụ.');
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


// Xử lý submit form sửa bác sĩ
function setupEditServiceForm() {
  const form = document.getElementById('editServiceForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const id = document.getElementById('edit_service_userId').value;

    const body = {
      name: document.getElementById('edit_service_name').value.trim(),
      code: document.getElementById('edit_service_code').value.trim(),
      description: document.getElementById('edit_service_description').value,
      price: document.getElementById('edit_price').value.trim(),
      status: document.getElementById('edit_service_status').value.trim(),
      imageUrl: document.getElementById('edit_service_imageURL').value.trim(),
      departmentId: parseInt(document.getElementById('edit_service_departmentId').value),
    };

    try {
      const res = await fetch(`https://localhost:7097/api/Service/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert(' Cập nhật dịch vụ thành công!');
        bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasServiceEdit')).hide();
        renderAllService();
      } else {
        const err = await res.text();
        alert(' Cập nhật dịch vụ thất bại:\n' + err);
      }
    } catch (error) {
      console.error(' Lỗi kết nối:', error);
      alert(' Không thể kết nối đến máy chủ!');
    }
  });
}




async function showServiceDetail(id, serviceName) {
    try {
        const res = await fetch(`https://localhost:7097/api/Service/get-by/${id}`);
        if (!res.ok) throw new Error('Không thể lấy thông tin dịch vụ');

        const servive = await res.json();
        const list = document.getElementById('serviceList');
        const title = document.getElementById('serviceModalLabel');
        title.textContent = `Thông tin chi tiết về dịch vụ "${serviceName}"`;

        if (!servive || !servive.name) {
            list.innerHTML = `<p class="text-danger">Không có thông tin dịch vụ</p>`;
        } else {
            list.innerHTML = `
  <div class="p-4 border rounded bg-white">
    <h5 class="mb-4 text-primary">Thông tin dịch vụ</h5>
    <div class="row g-3">
      <div class="col-md-6">
        <strong>Tên dịch vụ:</strong> <span class="text-muted">${servive.name}</span>
      </div>
      <div class="col-md-6">
        <strong>Mã dịch vụ:</strong> <span class="text-muted">${servive.code}</span>
      </div>
      <div class="col-md-6">
        <strong>Mô tả:</strong> <span class="text-muted">${servive.description}</span>
      </div>
      <div class="col-md-6">
        <strong>Giá:</strong> <span class="text-muted">${servive.price}</span>
      </div>
      <div class="col-md-6">
        <strong>Trạng thái:</strong> 
        <span class="text-muted">
        ${servive.status === "Active" ? "Hoạt động" : "Không hoạt động"}
        </span>
      </div>
      <div class="col-md-6">
        <strong>Thuộc khoa:</strong> <span class="text-muted">${servive.departmentName}</span>
      </div>
      <div class="col-md-6">
        <strong>Ngày tạo:</strong> <span class="text-muted">${new Date(servive.createDate).toLocaleDateString('vi-VN')}</span>
      </div>
      <div class="col-md-6">
        <strong>Tạo bởi:</strong> <span class="text-muted">${servive.createBy}</span>
      </div>
    </div>
  </div>
`;
        }

        new bootstrap.Modal(document.getElementById('serviceModal')).show();
    } catch (err) {
        alert('Lỗi khi tải thông tin dịch vụ!');
        console.error(err);
    }
}

var myWidget = cloudinary.createUploadWidget(
    {
        cloudName: "dbt3cbfou",
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
            document.getElementById("edit_service_imageURL").src = imageUrl;
        }
    }
);

function uploadServiceImage() {
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
        document.getElementById('edit_service_imageURL').value = url;
        document.getElementById('edit_service_imagePreview').src = url;
      }
    }
  );
  widget.open();
}
