document.addEventListener('DOMContentLoaded', function () {
  const roleNameMap = {
    Admin: 'Quản trị viên',
    Doctor: 'Bác sĩ',
    Nurse: 'Y tá',
    Receptionist: 'Lễ tân',
    Patient: 'Bệnh nhân'
  };

  // --- 1. Hàm load toàn bộ role
  function loadAllRoles() {
    fetch('https://localhost:7097/api/Role/get-all')
      .then(res => res.json())
      .then(data => {
        const container = document.querySelector('.card-body .row');
        if (!container) return;
        container.innerHTML = ''; // Xóa dữ liệu cũ
        data.forEach(dep => {
          const viName = roleNameMap[dep.name] || dep.name;
          container.innerHTML += `
            <div class="col">
              <div class="bg-light-subtle p-4 d-flex justify-content-between mb-5 flex-column flex-md-row gap-2 align-items-md-center rounded">
                <div class="d-flex align-items-start align-items-md-center gap-3 flex-column flex-md-row">
                  <img class="img-fluid avatar avatar-80" src="${dep.imageUrl || './assets/images/doctor/1.webp'}" alt="Dr-profile" loading="lazy" />
                  <div>
                    <h5 class="mb-1 text-capitalize">${viName}</h5>
                  </div>
                </div>
              </div>
            </div>
          `;
        });
      })
      .catch(() => alert('Không thể tải danh sách vai trò!'));
  }

  // Gọi khi trang load
  loadAllRoles();

  // --- 2. Xử lý thêm role mới
  const form = document.getElementById('addRoleForm');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const now = new Date().toISOString();
      const body = {
        name: document.getElementById('role_name').value.trim(),
        code: "",
        createDate: now,
        updateDate: now,
        createBy: "",
        updateBy: ""
      };

      try {
        const res = await fetch('https://localhost:7097/api/Role/add-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          alert('Thêm vai trò thành công!');
          form.reset();
          document.querySelector('#offcanvasDepartmentAdd .btn-close')?.click();
          loadAllRoles(); // ✅ Load lại danh sách sau khi thêm
        } else {
          alert('Thêm vai trò thất bại!');
        }
      } catch {
        alert('Lỗi kết nối đến máy chủ!');
      }
    });
  }

  // --- 3. Tìm kiếm vai trò
  const searchBtn = document.getElementById('searchRoleBtn');
  const searchInput = document.getElementById('searchRoleInput');
  const resultContainer = document.getElementById('searchRoleResult');

  if (searchBtn && searchInput && resultContainer) {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
      }
    });

    async function handleSearch() {
      const roleName = searchInput.value.trim();
      if (!roleName) {
        alert('Vui lòng nhập vai trò!');
        return;
      }

      try {
        const res = await fetch(`https://localhost:7097/api/Role/find-by-name/${roleName}`);
        resultContainer.innerHTML = '';

        if (res.ok) {
          const dep = await res.json();
          if (dep && dep.name) {
            const viName = roleNameMap[dep.name] || dep.name;
            resultContainer.innerHTML = `
              <div class="p-2 bg-light rounded mt-2">
                <div class="d-flex align-items-center gap-2">
                  <img src="${dep.imageUrl || './assets/images/doctor/1.webp'}" alt="Role" width="40" height="40" class="rounded-circle" />
                  <strong>${viName}</strong>
                </div>
              </div>
            `;
          } else {
            resultContainer.innerHTML = `<div class="p-2">Không tìm thấy vai trò</div>`;
          }
        } else {
          resultContainer.innerHTML = `<div class="p-2">Không tìm thấy vai trò</div>`;
        }
      } catch {
        alert('Lỗi kết nối đến máy chủ!');
      }
    }
  }
});
