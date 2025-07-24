const API_BASE = "https://localhost:7097/api/Disease";

// Hiển thị danh sách bệnh
async function loadDiseases() {
    const tbody = document.querySelector("table tbody");
    tbody.innerHTML = "";
    try {
        const res = await fetch(`${API_BASE}/get-all`);
        if (!res.ok) throw new Error("Lỗi khi lấy danh sách bệnh");
        const data = await res.json();
        data.forEach((disease, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${disease.name}</td>
                <td>${disease.description || ""}</td>
                <td>${disease.updateDate ? new Date(disease.updateDate).toLocaleDateString() : ""}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="openEdit(${disease.id}, '${escapeQuotes(disease.name)}', '${escapeQuotes(disease.description || "")}', '${escapeQuotes(disease.code || "")}')">Sửa</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteDisease(${disease.id})">Xóa</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        alert("Không thể tải danh sách bệnh!");
    }
}

// Thêm bệnh mới
document.getElementById("addDiseaseForm").onsubmit = async function(e) {
    e.preventDefault();
    const name = document.getElementById("disease_name").value.trim();
    const description = document.getElementById("disease_description").value.trim();
    const CreateBy = localStorage.getItem("username") || "admin";
    if (!name) return alert("Tên bệnh không được để trống!");
    if (!description) return alert("Mô tả không được để trống!");
    try {
        const res = await fetch(`${API_BASE}/add-disease`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description, CreateBy })
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg);
        }
        document.getElementById("addDiseaseForm").reset();
        document.querySelector("#offcanvasDiseaseAdd .btn-close").click();
        loadDiseases();
    } catch (err) {
        alert("Thêm bệnh thất bại!\n" + err.message);
    }
};

window.openEdit = function(id, name, description) {
    document.getElementById("edit_disease_id").value = id;
    document.getElementById("edit_disease_name").value = name;
    document.getElementById("edit_disease_description").value = description;
    const offcanvas = new bootstrap.Offcanvas(document.getElementById("offcanvasDiseaseEdit"));
    offcanvas.show();
};

// Sửa bệnh
document.getElementById("editDiseaseForm").onsubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById("edit_disease_id").value;
    const name = document.getElementById("edit_disease_name").value.trim();
    const description = document.getElementById("edit_disease_description").value.trim();
    const UpdateBy = localStorage.getItem("username") || "admin";
    if (!name) return alert("Tên bệnh không được để trống!");
    if (!description) return alert("Mô tả không được để trống!");
    try {
        const res = await fetch(`${API_BASE}/update/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description, UpdateBy })
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg);
        }
        document.querySelector("#offcanvasDiseaseEdit .btn-close").click();
        loadDiseases();
    } catch (err) {
        alert("Sửa bệnh thất bại!\n" + err.message);
    }
};

// Xóa bệnh
window.deleteDisease = async function(id) {
    if (!confirm("Bạn có chắc muốn xóa bệnh này?")) return;
    try {
        const res = await fetch(`${API_BASE}/delete-disease/${id}`, { method: "DELETE" });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg);
        }
        loadDiseases();
    } catch (err) {
        alert("Xóa bệnh thất bại!\n" + err.message);
    }
};

function escapeQuotes(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

window.addEventListener("DOMContentLoaded", loadDiseases);