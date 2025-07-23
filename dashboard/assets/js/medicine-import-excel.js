let currentPreviewData = null;

// Load nhà cung cấp từ API
async function loadSuppliers() {
    try {
        const res = await fetch("https://localhost:7097/api/Supplier/get-all");
        const suppliers = await res.json();

        const activeSuppliers = suppliers.filter(s => s.status === 'Active');


        const supplierSelect = document.getElementById("supplierSelect");
        activeSuppliers.forEach(s => {
            const option = document.createElement("option");
            option.value = s.id;
            option.textContent = s.name;
            supplierSelect.appendChild(option);
        });
    } catch (err) {
        alert("Lỗi khi tải danh sách nhà cung cấp: " + err);
    }
}

loadSuppliers();

document.getElementById("importForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const supplierId = formData.get("supplierId");
    const file = formData.get("file");
    const importName = formData.get("importName");

    if (!supplierId || !file || !importName) {
        alert("Vui lòng chọn nhà cung cấp, nhập tên đơn nhập và file Excel!");
        return;
    }

    try {
        const response = await fetch("https://localhost:7097/api/MedicineImportExcel/import-excel-preview", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText);
        }

        const data = await response.json();
        currentPreviewData = data;

        const tbody = document.querySelector("table tbody");
        tbody.innerHTML = "";

        data.details.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                    <td>${item.batchNumber}</td>
                    <td>${item.medicineCode}</td>
                    <td>${item.medicineName}</td>
                    <td>${item.unitName}</td>
                    <td>${item.unitPrice}</td>
                    <td>${item.quantity}</td>
                    <td>${item.ingredients}</td>
                    <td>${item.dosage}</td>
                    <td>${item.manufactureDate?.split("T")[0]}</td>
                    <td>${item.expiryDate?.split("T")[0]}</td>
                    <td>${item.categoryName}</td>
                    <td>${item.prescribed}</td>
                    <td>${item.medicineDescription}</td>
                    <td>${item.medicineDetailDescription}</td>
                    <td>${item.waring}</td>
                    <td>${item.storageInstructions}</td>
                `;
            tbody.appendChild(row);
        });

        // Hiện nút
        document.getElementById("confirmImportBtn").style.display = "inline-block";
        document.getElementById("cancelImportBtn").style.display = "inline-block";
    } catch (err) {
        alert("Lỗi khi xem trước file Excel:\n" + err.message);
    }
});

document.getElementById("confirmImportBtn").addEventListener("click", async function () {
    if (!currentPreviewData) return alert("Không có dữ liệu để xác nhận.");

    try {
        const response = await fetch("https://localhost:7097/api/MedicineImportExcel/confirm-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentPreviewData)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText);
        }

        alert("Nhập kho thành công!");
        location.reload();
    } catch (err) {
        alert("Lỗi khi xác nhận:\n" + err.message);
    }
});

// Hủy
document.getElementById("cancelImportBtn").addEventListener("click", function () {
    document.querySelector("table tbody").innerHTML = "";
    document.getElementById("confirmImportBtn").style.display = "none";
    document.getElementById("cancelImportBtn").style.display = "none";
    currentPreviewData = null;
});