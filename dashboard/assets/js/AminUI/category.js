document.addEventListener('DOMContentLoaded', function () {
    fetch('https://localhost:7097/api/Department/get-all')
        .then(res => res.json())
        .then(data => {
            // data là mảng các department
            const container = document.querySelector('.card-body .row');
            container.innerHTML = ''; // Xóa dữ liệu mẫu cũ
            data.forEach(dep => {
                container.innerHTML += `
                <div class="col">
                    <div class="bg-light-subtle p-4 d-flex justify-content-between mb-5 flex-column flex-md-row gap-2 align-items-md-center rounded">
                        <div class="d-flex align-items-start align-items-md-center gap-3 flex-column flex-md-row">
                            <img class="img-fluid avatar avatar-80" src="${dep.imageUrl || './assets/images/doctor/1.webp'}" alt="Dr-profile" loading="lazy" />
                            <div>
                                <h5 class="mb-1 text-capitalize">${dep.name}</h5>
                                <span class="text-body">${dep.description || ''}</span>
                            </div>
                        </div>
                        <span class="text-primary fw-500 text-capitalize">${dep.doctorCount || 0} Doctors</span>
                    </div>
                </div>
                `;
            });
        })
        .catch(() => {
            alert('Không thể tải danh sách phòng ban!');
        });
});

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('addDepartmentForm');
  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const now = new Date().toISOString();
    const body = {
      name: document.getElementById('dep_name').value,
      code: "",
      description: document.getElementById('dep_description').value,
      totalAmountOfPeople: parseInt(document.getElementById('dep_total').value) || 0,
      status: document.getElementById('dep_status').value,
      createDate: now,
      updateDate: now,
      createBy: document.getElementById('dep_createBy').value,
      updateBy: document.getElementById('dep_updateBy').value
    };
    try {
      const res = await fetch('https://localhost:7097/api/Department/add-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        alert('Add department success!');
        form.reset();
        document.querySelector('#offcanvasDepartmentAdd .btn-close').click();
        // Có thể reload lại danh sách department nếu muốn
      } else {
        alert('Add department failed!');
      }
    } catch {
      alert('Error connecting to server!');
    }
  });
});