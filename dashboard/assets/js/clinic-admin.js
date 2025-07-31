document.addEventListener('DOMContentLoaded', function () {
    renderAllClinic();
});

let allClinic = [];

async function renderAllClinic() {
    try {
        const res = await fetch('https://localhost:7097/api/Clinic/get-all');
        if (!res.ok) throw new Error('Lỗi khi lấy danh sách phòng.');
        allClinic = await res.json();
        renderClinicToUI(allClinic);
    } catch (err) {
        console.error(err);
        alert('Không thể tải danh sách phòng.');
    }
}

// Sửa đúng biến search
document.getElementById('searchClinicInput').addEventListener('input', function () {
    const keyword = this.value.toLowerCase();
    const filtered = allClinic.filter(c =>
        c.name.toLowerCase().includes(keyword) ||
        c.code.toLowerCase().includes(keyword)
    );
    renderClinicToUI(filtered);
});

// Sửa phần hiển thị chỉ lấy đúng các trường bạn yêu cầu
function renderClinicToUI(clinics) {
    const container = document.getElementById('allClinicList');
    container.innerHTML = '';

    if (clinics.length === 0) {
        container.innerHTML = `<div class="alert alert-warning">Không có phòng nào được tìm thấy.</div>`;
        return;
    }

    clinics.forEach(doc => {
        let statusVN = '';
        switch (doc.status) {
            case 'Available':
                statusVN = 'Sẵn sàng';
                break;
            case 'Unavailable':
                statusVN = 'Không sẵn sàng';
                break;
            case 'UnderMaintenance':
                statusVN = 'Đang bảo trì';
                break;
            default:
                statusVN = 'Không rõ';
        }
        const formattedDate = new Date(doc.createDate).toLocaleString();

        container.innerHTML += `
        <div class="col">
            <div class="bg-light-subtle p-4 mb-3 rounded shadow-sm">
                <h5 class="mb-2 text-primary">${doc.name}</h5>
                <p class="mb-1 text-dark"><strong>Mã phòng:</strong> ${doc.code}</p>
                <p class="mb-1 text-dark"><strong>Trạng thái:</strong> ${statusVN}</p>
                <p class="mb-1 text-dark"><strong>Ngày tạo:</strong> ${formattedDate}</p>
                <p class="mb-0 text-dark"><strong>Tạo bởi:</strong> ${doc.createBy}</p>

                <p class="mb-1 text-muted fw-semibold">Chuyển trạng thái:</p>
                 <div class="d-flex align-items-center gap-2">
                    <select class="form-select form-select-sm w-auto" id="statusSelect-${doc.id}">
                        <option value="Available" ${doc.status === 'Available' ? 'selected' : ''}>Hoạt động</option>
                        <option value="Unavailable" ${doc.status === 'Unavailable' ? 'selected' : ''}>Không hoạt động</option>
                        <option value="UnderMaintenance" ${doc.status === 'UnderMaintenance' ? 'selected' : ''}>Đang bảo trì</option>
                    </select>
                    <button class="btn btn-sm btn-outline-primary" onclick="changeClinicStatus(${doc.id})">Lưu</button>
                </div>

                <button class="btn btn-sm btn-outline-secondary" onclick='openEditClinicModal(${JSON.stringify(doc)})'>
                    Chỉnh sửa
                </button>
            </div>
        </div>
        `;
    });
}

document.getElementById('createClinicForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('currentUser'));
    const createBy = user?.username || 'Unknown';

    const name = document.getElementById('clinicName').value.trim();
    const code = document.getElementById('clinicCode').value.trim();
    const status = document.getElementById('clinicStatus').value;
    const now = new Date().toISOString();

    const newClinic = {
        name,
        code,
        status,
        createDate: now,
        updateDate: now,
        createBy,
        updateBy: createBy
    };

    try {
        const res = await fetch('https://localhost:7097/api/Clinic/add-clinic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClinic)
        });

        if (!res.ok) throw new Error('Tạo phòng khám thất bại.');

        alert('Tạo phòng khám thành công!');
        renderAllClinic();

        // Đóng modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createClinicModal'));
        modal.hide();

        this.reset();
    } catch (err) {
        console.error(err);
        alert('Đã có lỗi xảy ra khi tạo phòng khám.');
    }
});

async function changeClinicStatus(clinicId) {
    const selectEl = document.getElementById(`statusSelect-${clinicId}`);
    const newStatus = selectEl.value;

    try {
        const res = await fetch(`https://localhost:7097/api/Clinic/change-status/${clinicId}?newStatus=${newStatus}`, {
            method: 'PUT'
        });

        if (!res.ok) throw new Error('Không thể cập nhật trạng thái');

        alert('Đã cập nhật trạng thái thành công!');
        renderAllClinic(); 
    } catch (err) {
        console.error(err);
        alert('Có lỗi khi đổi trạng thái.');
    }
}


function openEditClinicModal(clinic) {
    document.getElementById('editClinicId').value = clinic.id;
    document.getElementById('editClinicName').value = clinic.name;
    document.getElementById('editClinicCode').value = clinic.code;
    document.getElementById('editClinicStatus').value = clinic.status;

    // Hiển thị modal
    const editModal = new bootstrap.Modal(document.getElementById('editClinicModal'));
    editModal.show();
}

document.getElementById('editClinicForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem('currentUser'));
    const updateBy = user?.username || 'Unknown';

    const id = document.getElementById('editClinicId').value;
    const name = document.getElementById('editClinicName').value;
    const code = document.getElementById('editClinicCode').value;
    const status = document.getElementById('editClinicStatus').value;
    const now = new Date().toISOString();

    const updatedClinic = {
        id: parseInt(id),
        name,
        code,
        status,
        updateDate: now,
        updateBy,
        createDate: now, 
        createBy: updateBy
    };

    try {
        const res = await fetch(`https://localhost:7097/api/Clinic/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedClinic)
        });

        if (!res.ok) throw new Error('Cập nhật thất bại');

        alert('Cập nhật thành công!');
        const modal = bootstrap.Modal.getInstance(document.getElementById('editClinicModal'));
        modal.hide();
        renderAllClinic(); 
    } catch (err) {
        console.error(err);
        alert('Có lỗi khi cập nhật.');
    }
});
