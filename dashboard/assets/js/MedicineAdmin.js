const medicineAdmin = "https://localhost:7097/api/MedicineAdmin/get-all";
const searchApi = "https://localhost:7097/api/MedicineAdmin/search";
const preBtn = document.getElementById("preBtn");
const nextBtn = document.getElementById("nextBtn");
const pagination = document.getElementById("pageNumber");
const pageInfo = document.getElementById("pageInfo");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");
const clearBtn = document.getElementById("clearBtn");


let dataToShow = [];
let currentPage = 1;
const rowsPerPage = 10;
let totalPages = 1;

fetchMedicineAdmin();

async function fetchMedicineAdmin() {
    try {
        const response = await fetch(`${medicineAdmin}?pageNumber=${currentPage}&rowsPerPage=${rowsPerPage}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });

        if (!response.ok) {
            throw new Error("Không thể lấy dữ liệu từ server.");
        }

        const fetchedData = await response.json();

        if (!fetchedData || fetchedData.items.length === 0) {
            dataToShow = [];
            renderTable();
            renderPageInfo();
            renderPageNumber();
            return;
        }

        dataToShow = fetchedData.items;
        totalPages = fetchedData.totalPages;

        renderTable();
        renderPageInfo();
        renderPageNumber();
    }
    catch (error) {
        console.error("Lỗi khi lấy dữ liệu: ", error);
    }
}
function renderTable() {
    console.log("Rendering data for current page:", dataToShow);

    const outputMedicineAdmin = document.getElementById("outputMedicineAdmin2");

    outputMedicineAdmin.innerHTML = "";

    if (dataToShow.length === 0) {
        outputMedicineAdmin.innerHTML = `<tr><td colspan="13">Không có dữ liệu</td></tr>`;
        return;
    }

    dataToShow.forEach((item, index) => {
        const imageSrc = (item.medicineImage && item.medicineImage !== "Chưa có ảnh") ? item.medicineImage : "";
        // Chuyển đổi trạng thái
        let medicineStatusDisplay = '';
        if (item.medicineStatus === 'Active') {
            medicineStatusDisplay = 'Cung Cấp';
        } else if (item.medicineStatus === 'Discontinued') {
            medicineStatusDisplay = 'Ngừng Cung Cấp';
        } else {
            medicineStatusDisplay = item.medicineStatus ?? '';
        }

        // Chuyển đổi prescribled
        let prescribledDisplay = '';
        if (item.prescribled?.toLowerCase() === 'yes') {
            prescribledDisplay = 'Có';
        } else if (item.prescribled?.toLowerCase() === 'no') {
            prescribledDisplay = 'Không';
        } else {
            prescribledDisplay = item.prescribled ?? '';
        }
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.id}</td>
        <td><img src="${imageSrc}" alt="Medicine Image" width="50" height="50"> </td>
        <td>${item.medicineCode}</td>
        <td>${item.medicineName}</td>
        <td>${item.ingredients}</td>
        <td>${item.unitName}</td>
        <td>${item.unitPrice}</td>
        <td>${item.categoryName}</td>
        <td>${medicineStatusDisplay}</td>
        <td>${item.mDescription}</td>
        <td>${item.mdDescription}</td>
        <td>${item.warning}</td>
        <td>${prescribledDisplay}</td>
        <td>${item.storageIntructions}</td>
        <td>
            <button class="btn btn-sm btn-primary edit-btn" data-id="${item.id}">Cập nhật </button>
            <button class="btn btn-sm btn-warning update-image-btn" data-id="${item.id}">Cập nhật ảnh</button>
        </td>    
        `;
        outputMedicineAdmin.appendChild(row);
    });
    attachEditButtonEvents();
    attachUpdateImageButtonEvents();
}

// Cập nhật ảnh
function attachUpdateImageButtonEvents() {
    document.querySelectorAll('.update-image-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            console.log("ID lấy được từ nút 'Cập nhật ảnh':", id);
            openImageUpdateOffcanvas(id);
        });
    });
}

function openImageUpdateOffcanvas(id) {
    const medicine = dataToShow.find(item => item.id == id);
    if (!medicine) {
        alert("Không tìm thấy thuốc!");
        return;
    }

    const offcanvas = new bootstrap.Offcanvas('#offcanvasMedicineImageEdit');
    offcanvas.show();

    const submitButton = document.getElementById('submitBtn2');
    if (!submitButton) {
        console.error('Không tìm thấy submitBtn2!');
        return;
    }

    submitButton.dataset.id = id;
    console.log("ID đã được gán vào submitBtn2:", submitButton.dataset.id);
}

document.getElementById('submitBtn2').addEventListener('click', async function (e) {
    e.preventDefault();

    const submitButton = document.getElementById('submitBtn2');
    const medicineId = submitButton.dataset.id;
    console.log("ID lấy được từ submitBtn2:", medicineId);


    if (!medicineId) {
        alert("ID thuốc không hợp lệ.");
        return;
    }

    const fileInput = document.getElementById('fileInput');
    console.log("File Input:", fileInput.files);

    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Vui lòng chọn ảnh.');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    try {
        const response = await fetch(`https://localhost:7097/api/MedicineAdmin/update-image/${medicineId}`, {
            method: 'PUT',
            body: formData,
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (response.ok) {
            alert('Cập nhật ảnh thành công!');
            fetchMedicineAdmin();

            // Đóng offcanvas
            const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasMedicineImageEdit'));
            if (offcanvas) offcanvas.hide();
        } else {
            const errorData = await response.json();
            console.error("API Error Details:", errorData);
            alert('Lỗi khi cập nhật ảnh: ' + errorData.message);
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Đã xảy ra lỗi khi gọi API.');
    }
});




function attachEditButtonEvents() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            openEditOffcanvas(id);
        });
    });
}

const inputId = document.getElementById("Id");
const inputImage = document.getElementById("Image");
const inputCode = document.getElementById("Code");
const inputName = document.getElementById("Name");
const inputIngredients = document.getElementById("Ingredients");
const inputUnitName = document.getElementById("UnitName");
const inputUnitPrice = document.getElementById("UnitPrice");
const inputCategoryName = document.getElementById("CategoryName");
const inputMedicineStatus = document.getElementById("MedicineStatus");
const inputMDescription = document.getElementById("MDescription");
const inputMDDescription = document.getElementById("MDDescription");
const inputWarning = document.getElementById("Warning");
const inputPrescribled = document.getElementById("Prescribled");
const inputStorageIntructions = document.getElementById("StorageIntructions");

function openEditOffcanvas(id) {
    const medicine = dataToShow.find(item => item.id == id);
    if (!medicine) {
        alert("Không tìm thấy thuốc!");
        return;
    }

    // Điền thông tin vào form
    inputId.value = medicine.id;
    inputCode.value = medicine.medicineCode || '';
    inputName.value = medicine.medicineName || '';
    inputIngredients.value = medicine.ingredients || '';
    inputUnitPrice.value = medicine.unitPrice || '';
    inputMedicineStatus.value = medicine.medicineStatus || '';
    inputMDescription.value = medicine.mDescription || '';
    inputMDDescription.value = medicine.mdDescription || '';
    inputWarning.value = medicine.warning || '';
    inputPrescribled.value = medicine.prescribled || '';
    inputStorageIntructions.value = medicine.storageIntructions || '';

    // Điền giá trị cũ vào dropdown cho Đơn Vị Thuốc
    const unitSelect = document.getElementById('UnitName');
    const categorySelect = document.getElementById('CategoryName');

    // Lặp qua các options và chọn đúng giá trị cũ
    for (let option of unitSelect.options) {
        if (option.value == medicine.unitId) {
            option.selected = true;
            break;
        }
    }

    // Lặp qua các options và chọn đúng giá trị cũ
    for (let option of categorySelect.options) {
        if (option.value == medicine.medicineCategoryId) {
            option.selected = true;
            break;
        }
    }

    // Mở offcanvas để chỉnh sửa
    const editOffcanvas = new bootstrap.Offcanvas('#offcanvasMedicineEdit');
    editOffcanvas.show();
}


async function fetchUnitsAndCategories() {
    try {
        const unitResponse = await fetch("https://localhost:7097/api/Unit/get-all", {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
        });
        const unitData = await unitResponse.json();
        const unitSelect = document.getElementById('UnitName');
        // unitSelect.innerHTML = '';
        unitData.forEach(unit => {
            const option = document.createElement("option");
            option.value = unit.id;
            option.textContent = unit.name;
            unitSelect.appendChild(option);
        });

        const categoryResponse = await fetch("https://localhost:7097/api/MedicineCategory/get-all", {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
        });
        const categoryData = await categoryResponse.json();
        const categorySelect = document.getElementById('CategoryName');
        // categorySelect.innerHTML = '';
        categoryData.forEach(category => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error fetching units or categories:", error);
    }
}

// Gọi hàm khi tải trang
fetchUnitsAndCategories();


document.getElementById('submitBtn').addEventListener('click', updateMedicineAdmin);



async function updateMedicineAdmin() {
    const id = inputId.value;
    if (!id) {
        alert("Thiếu ID thuốc.");
        return;
    }
    if (!inputUnitName.value || !inputCategoryName.value) {
        alert("Vui lòng chọn Đơn Vị và Danh Mục.");
        return;
    }
    const checkunitprice = parseFloat(inputUnitPrice.value);
    if (isNaN(checkunitprice) || checkunitprice <= 0) {
        alert("Giá bán phải là số và lớn hơn 0.");
        return;
    }

    const checkvalid = /[^a-zA-Z0-9À-ỹ\s.,]/;


    // Danh sách các trường cần kiểm tra ký tự đặc biệt
    const truongCanKiemTra = [
        { giaTri: inputMDescription.value, ten: "Mô tả" },
        { giaTri: inputMDDescription.value, ten: "Mô tả chi tiết" },
        { giaTri: inputWarning.value, ten: "Cảnh báo" },
        { giaTri: inputStorageIntructions.value, ten: "Hướng dẫn bảo quản" },
    ];

    // Duyệt từng trường để kiểm tra
    for (let truong of truongCanKiemTra) {
        if (checkvalid.test(truong.giaTri)) {
            alert(`${truong.ten} không được chứa ký tự đặc biệt.`);
            return; // Dừng lại nếu phát hiện ký tự lạ
        }
    }
    // Tạo đối tượng dữ liệu để gửi
    const medicineData = {
        MedicineCode: inputCode.value,
        MedicineName: inputName.value,
        Ingredients: inputIngredients.value,
        UnitPrice: inputUnitPrice.value,
        MDescription: inputMDescription.value,
        MDDescription: inputMDDescription.value,
        Warning: inputWarning.value,
        Prescribed: inputPrescribled.value,
        StorageInstructions: inputStorageIntructions.value,
        Status: inputMedicineStatus.value,
    };

    // Nếu đơn vị hoặc danh mục thay đổi, thêm chúng vào request
    if (inputUnitName.value) {
        medicineData.UnitId = inputUnitName.value;  // Cập nhật đơn vị
    }
    if (inputCategoryName.value) {
        medicineData.MedicineCategoryId = inputCategoryName.value;  // Cập nhật danh mục
    }

    // Gửi dữ liệu không có ảnh dưới dạng JSON
    try {
        const response = await fetch(`https://localhost:7097/api/MedicineAdmin/update/${id}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(medicineData)  // Gửi thông tin thuốc trong body
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData);
        }

        alert('Cập nhật thuốc thành công!');
        fetchMedicineAdmin();  // Reload lại danh sách thuốc

        // Đóng offcanvas
        const editOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasMedicineEdit'));
        if (editOffcanvas) editOffcanvas.hide();
    } catch (error) {
        console.error('Lỗi khi cập nhật thuốc:', error);
        alert(`Có lỗi xảy ra khi cập nhật thuốc: ${error.message}`);
    }
}



//Search
let isSearching = false;

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const min = parseFloat(minPrice.value);
    const max = parseFloat(maxPrice.value);


    if (min < 1 || min > 1000000000 || max < 1 || max > 1000000000) {
        alert("Giá nhập vào không hợp lệ!");
        return;
    }
    currentPage = 1;
    isSearching = true;
    searchMedicine();
});

async function searchMedicine() {
    try {
        let url = `${searchApi}?keyword=${searchInput.value.trim()}&pageNumber=${currentPage}&pageSize=${rowsPerPage}`;
        if (minPrice.value) {
            url += `&startPrice=${minPrice.value}`;
        }
        if (maxPrice.value) {
            url += `&endPrice=${maxPrice.value}`;
        }

        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        if (!response.ok) {
            throw new Error("Không thể tìm kiếm dữ liệu từ server.");
        }

        const fetchedData = await response.json();

        dataToShow = fetchedData.items ?? [];
        totalPages = fetchedData.totalPages ?? 1;

        renderTable();
        renderPageInfo();
        renderPageNumber();
    } catch (error) {
        console.error("Lỗi khi tìm kiếm:", error);
    }
}


function renderPageNumber() {
    let html = '';
    const createPageItem = (i) => `
    <li class="text-center rounded px-2 py-1 ${i === currentPage ? 'bg-primary text-white' : 'bg-primary-subtle text-primary'} page-link" 
        style="cursor:pointer;" data-page="${i}">
        ${i}
    </li>`;

    // Điều kiện để hiển thị 3 trang đầu và 3 trang cuối
    const pagesToShow = new Set();
    if (totalPages <= 6) {
        // Nếu tổng số trang <= 6, hiển thị tất cả
        for (let i = 1; i <= totalPages; i++) {
            pagesToShow.add(i);
        }
    } else {
        // Nếu tổng số trang > 6, hiển thị 3 trang đầu, 3 trang cuối, và trang hiện tại
        pagesToShow.add(1);
        pagesToShow.add(2);
        pagesToShow.add(3);

        pagesToShow.add(currentPage - 1);
        pagesToShow.add(currentPage);
        pagesToShow.add(currentPage + 1);

        pagesToShow.add(totalPages - 2);
        pagesToShow.add(totalPages - 1);
        pagesToShow.add(totalPages);
    }

    // Tạo mã HTML cho các trang
    let lastPage = 0;
    for (let i = 1; i <= totalPages; i++) {
        if (pagesToShow.has(i)) {
            if (lastPage && i - lastPage > 1) {
                html += `<li class="text-center text-primary rounded px-2">...</li>`; // Hiển thị dấu ba chấm
            }
            html += createPageItem(i);
            lastPage = i;
        }
    }

    pagination.innerHTML = html;

    // Xử lý sự kiện khi nhấp vào trang
    document.querySelectorAll('.page-link').forEach(item => {
        item.addEventListener('click', (e) => {
            const page = parseInt(e.target.dataset.page);
            if (page !== currentPage) {
                currentPage = page;
                if (isSearching) {
                    searchMedicine();
                } else {
                    fetchMedicineAdmin();
                }
                renderPageInfo();
                renderPageNumber();
            }
        });
    });
}

function renderPageInfo() {
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
    preBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;

}

preBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        if (isSearching) {
            searchMedicine();
        } else {
            fetchMedicineAdmin();
        }
        renderPageInfo();
        renderPageNumber();
    }
});

nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        if (isSearching) {
            searchMedicine();
        } else {
            fetchMedicineAdmin();
        }
        renderPageInfo();
        renderPageNumber();
    }
});

clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    minPrice.value = "";
    maxPrice.value = "";
    isSearching = false;
    currentPage = 1;
    fetchMedicineAdmin();
})