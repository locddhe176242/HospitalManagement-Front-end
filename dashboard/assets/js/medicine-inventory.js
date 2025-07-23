const medicineInventoryApi = "https://localhost:7097/api/MedicineInventory/get-all"
const searchApi = "https://localhost:7097/api/MedicineInventory/search"

const preBtn = document.getElementById("preBtn");
const nextBtn = document.getElementById("nextBtn");
const pagination = document.getElementById("pageNumber");
const pageInfo = document.getElementById("pageInfo");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");
const sortByDropdown = document.getElementById("sortByDropdown");
const ascendingDropdown = document.getElementById("ascendingDropdown");


let dataToShow = [];
let currentPage = 1;
const rowsPerPage = 10;
let totalPages = 1;

let currentMode = "all";
let currentKeyword = "";
let currentSortBy = "";
let currentAscending = "";



fetchMedicineInventory();

async function fetchMedicineInventory() {
    try {
        const response = await fetch(`${medicineInventoryApi}?pageNumber=${currentPage}&rowsPerPage=${rowsPerPage}`, {
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

//serch
// searchForm.addEventListener("input", () => {
//     searchMedicine(searchInput.value);
// });


searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    currentPage = 1;
    searchMedicine();
});



async function searchMedicine() {
    try {
        // Gán giá trị hiện tại để dùng cho phân trang
        currentKeyword = searchInput.value.trim();
        currentSortBy = sortByDropdown.value;
        currentAscending = ascendingDropdown.value;

        // Nếu không có gì để tìm, thì quay về chế độ all
        if (!currentKeyword && !currentSortBy && !currentAscending) {
            currentMode = "all";
            await fetchMedicineInventory();
            return;
        }

        currentMode = "search"; // Đặt chế độ tìm kiếm

        // Bắt đầu build URL
        let url = `${searchApi}?pageNumber=${currentPage}&pageSize=${rowsPerPage}`;

        if (currentKeyword) {
            url += `&keyword=${encodeURIComponent(currentKeyword)}`;
        }

        if (currentSortBy) {
            url += `&sortBy=${currentSortBy}`;
        }

        if (currentAscending) {
            url += `&ascending=${currentAscending}`;
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




function renderTable() {
    const outputMedicineAdmin = document.getElementById("outputMedicineAdmin");

    outputMedicineAdmin.innerHTML = "";

    if (dataToShow.length === 0) {
        outputMedicineAdmin.innerHTML = `<tr><td colspan="13">Không có dữ liệu</td></tr>`;
        return;
    }

    dataToShow.forEach((item, index) => {
        const row = document.createElement("tr");

        let medicineinventorystatus = '';
        if(item.status === "Discontinued") {
            medicineinventorystatus = 'Ngừng cung cấp';
        } else if(item.status === "InStock") {
            medicineinventorystatus = 'Còn hàng';
        } else if(item.status === "OutOfStock") {
            medicineinventorystatus = 'Hết hàng';
        } 
        row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.medicineCode}</td>
        <td>${item.batchNumber}</td>
        <td>${item.medicineName}</td>
        <td>${item.categoryName}</td>
        <td>${item.unitName}</td>
        <td>${item.quantity}</td>
        <td>${medicineinventorystatus}</td>
        <td>${new Date(item.manufactureDate).toLocaleDateString('vi-VN')}</td>
        <td>${new Date(item.expiryDate).toLocaleDateString('vi-VN')}</td>
        <td>${item.supplierName ?? ''}</td>
        <td>${new Date(item.importDate).toLocaleDateString('vi-VN')}</td>        
        `;
        outputMedicineAdmin.appendChild(row);
    });
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
                loadData();
            }
        });
    });
}

async function loadData() {
    if (currentMode === "search") {
        await searchMedicine(currentKeyword);
    }
    else {
        await fetchMedicineInventory();
    }
}



function renderPageInfo() {
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
    preBtn.disable = currentPage === 1;
    nextBtn.disable = currentPage === totalPages;
}

preBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        loadData();
    }
});

nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadData();
    }
});

clearBtn.addEventListener("click", () => {
    
    searchInput.value = '';
    sortByDropdown.value = '';
    ascendingDropdown.value = '';

    
    currentPage = 1;
    currentMode = "all";
    currentKeyword = "";
    currentSortBy = "";
    currentAscending = "";

    
    fetchMedicineInventory();
});

