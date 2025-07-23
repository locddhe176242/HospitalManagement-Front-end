document.addEventListener("DOMContentLoaded", () => {
    const importMedicineApi = "https://localhost:7097/api/MedicineImportDetail/get-all";
    const searchApi = "https://localhost:7097/api/MedicineImportDetail/search"
    const preBtn = document.getElementById("preBtn");
    const nextBtn = document.getElementById("nextBtn");
    const pagination = document.getElementById("pageNumber");
    const pageInfo = document.getElementById("pageInfo");
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const startDateInput = document.getElementById("startDateInput");
    const endDateInput = document.getElementById("endDateInput");
    const clearBtn = document.getElementById("clearBtn");
    const sortByDropdown = document.getElementById("sortByDropdown");
    const ascendingDropdown = document.getElementById("ascendingDropdown");

    let dataToShow = [];
    let currentPage = 1;  // Trang hiện tại
    const rowsPerPage = 10;  // Số dòng mỗi trang
    let totalPages = 1;  // Tổng số trang
    let isSearching = false;
    let lastSearchKeyword = '';
    let lastStartDate = '';
    let lastEndDate = '';

    // Lấy dữ liệu khi trang được tải
    fetchImportMedicine();

    // Hàm lấy dữ liệu từ API
    async function fetchImportMedicine() {
        try {
            const response = await fetch(`${importMedicineApi}?pageNumber=${currentPage}&rowsPerPage=${rowsPerPage}`, {
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
                renderTable();  // Gọi renderTable để xử lý khi không có dữ liệu
                renderPageInfo();
                renderPageNumber();
                return;
            }

            // Lưu dữ liệu và tổng số trang từ backend
            dataToShow = fetchedData.items;
            totalPages = fetchedData.totalPages; // Tổng số trang từ API

            console.log("Dữ liệu nhận được từ API:", dataToShow); // Kiểm tra dữ liệu

            renderTable();
            renderPageInfo();
            renderPageNumber();

        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu:", error);
        }
    }


    // Xử lý nút Search
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (startDateInput.value && endDateInput.value && new Date(startDateInput.value) > new Date(endDateInput.value)) {
            alert("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
            return;
        }
        currentPage = 1;
        isSearching = true;
        lastSearchKeyword = searchInput.value.trim();
        lastStartDate = startDateInput.value;
        lastEndDate = endDateInput.value;
        fetchSearchResults();
    });

    // Hàm gọi API tìm kiếm
    async function fetchSearchResults() {
        try {
            let url = `${searchApi}?keyword=${(lastSearchKeyword)}&pageNumber=${currentPage}&pageSize=${rowsPerPage}`;
            if (lastStartDate) {
                url += `&startDate=${(lastStartDate)}`;
            }
            if (lastEndDate) {
                url += `&endDate=${(lastEndDate)}`;
            }
            if (sortByDropdown.value) {
                url += `&sortBy=${sortByDropdown.value}`;
            }
            if (ascendingDropdown.value) {
                url += `&ascending=${ascendingDropdown.value}`;
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

    // Hàm render bảng

    function renderTable() {
        console.log("Rendering data for current page:", dataToShow);  // Kiểm tra lại dữ liệu

        const outputImportMedicine = document.getElementById("ImportMedicine");

        if (!outputImportMedicine) {
            console.error("Không tìm thấy phần tử bảng ImportMedicine.");
            return;
        }

        outputImportMedicine.innerHTML = "";

        if (dataToShow.length === 0) {
            outputImportMedicine.innerHTML = `<tr><td colspan="13">Không có dữ liệu</td></tr>`;
            return;
        }

        dataToShow.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.importName}</td>
            <td>${item.medicineCode ?? ''}</td>
            <td>${item.medicineName ?? ''}</td>
            <td>${item.quantity ?? ''}</td>
            <td>${item.unitName ?? ''}</td>
            <td>${item.unitPrice ?? ''}</td>
            <td>${item.categoryName ?? ''}</td>
            <td>${new Date(item.manufactureDate).toLocaleDateString('vi-VN') ?? ''}</td>
            <td>${new Date(item.expiryDate).toLocaleDateString('vi-VN') ?? ''}</td>
            <td>${item.batchNumber ?? ''}</td>
            <td>${item.supplierName ?? ''}</td>
            <td>${new Date(item.createDate).toLocaleDateString('vi-VN') ?? ''}</td>
            <td>${item.createBy ?? ''}</td>
        `;
            outputImportMedicine.appendChild(row);  // Thêm dòng vào bảng
        });
    }

    // Hàm phân trang
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
                        fetchSearchResults();
                    } else {
                        fetchImportMedicine();
                    }

                    renderPageInfo();
                    renderPageNumber();
                }
            });
        });
    }

    // Previous
    preBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            if (isSearching) {
                fetchSearchResults();
            } else {
                fetchImportMedicine();
            }
            renderPageInfo();
            renderPageNumber();
        }
    });

    // Next
    nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            if (isSearching) {
                fetchSearchResults();
            } else {
                fetchImportMedicine();
            }
            renderPageInfo();
            renderPageNumber();
        }
    });


    // Hàm hiển thị thông tin trang
    function renderPageInfo() {
        pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
        preBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }

    clearBtn.addEventListener("click", () => {

        searchInput.value = "";
        startDateInput.value = "";
        endDateInput.value = "";
        sortByDropdown.selectedIndex = 0;
        ascendingDropdown.selectedIndex = 0;


        isSearching = false;
        currentPage = 1;
        lastSearchKeyword = "";
        lastStartDate = "";
        lastEndDate = "";


        fetchImportMedicine();
    });

});
