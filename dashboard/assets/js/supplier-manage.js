document.addEventListener("DOMContentLoaded", () => {
  const supplierApiUrl = "https://localhost:7097/api/Supplier/get-all";


  const outputSupplier = document.getElementById("outputSupplier");
  const preBtn = document.getElementById("preBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pageInfo = document.getElementById("pageInfo");
  const errorMessage = document.getElementById("errorMessage");
  const pagination = document.getElementById("pageNumber");
  const searchInput = document.getElementById("searchInput");
  const searchForm = document.getElementById("searchForm");
  const clearBtn = document.getElementById("clearBtn");


  const inputId = document.getElementById("Id");
  const inputName = document.getElementById("Name");
  const inputPhone = document.getElementById("PhoneNumber");
  const inputEmail = document.getElementById("Email");
  const inputAddress = document.getElementById("Address");
  const inputCode = document.getElementById("Code");
  const statusDropdown = document.getElementById("Status");

  // Data & Pagination
  let data = [];
  let dataToShow = [];
  let currentPage = 1;
  const rowsPerPage = 10;

  // Fetch data on load
  fetchSupplierData();

  async function fetchSupplierData() {
    try {
      const response = await fetch(supplierApiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Không thể lấy dữ liệu từ server.");
      }

      const fetchedData = await response.json();

      if (!Array.isArray(fetchedData) || fetchedData.length === 0) {
        data = [];
        dataToShow = [];
        renderTable();
        renderPageInfo();
        renderPageNumber();
        return;
      }

      data = fetchedData;
      dataToShow = [...data];
      currentPage = 1;
      renderTable();
      renderPageInfo();
      renderPageNumber();
    } catch (error) {
      showError(error.message);
      console.error("Lỗi khi lấy dữ liệu:", error);
    }
  }

  function renderTable() {
    outputSupplier.innerHTML = "";

    if (dataToShow.length === 0) {
      outputSupplier.innerHTML = `<tr><td colspan="10">Không có dữ liệu</td></tr>`;
      return;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = dataToShow.slice(startIndex, endIndex);

    pageData.forEach((item, index) => {
      const serialNumber = startIndex + index + 1;
      const createDateFormatted = item.createDate
        ? new Date(item.createDate).toLocaleDateString('vi-VN')
        : "";

      const row = document.createElement("tr");

      let status = '';
      if(item.status === 'Active') {
        status = 'Cung Cấp';
      } else if (item.status === 'Inactive') {
        status = 'Ngừng hoạt động';
      } 
      row.innerHTML = `
        <td>${serialNumber}</td>
        <td>${item.id ?? ''}</td>
        <td>${item.name ?? ''}</td>
        <td>${item.phone ?? ''}</td>
        <td>${item.email ?? ''}</td>
        <td>${status}</td>
        <td>${item.address ?? ''}</td>
        <td>${item.code ?? ''}</td>
        <td>${createDateFormatted}</td>
        <td>${item.createBy ?? ''}</td>
        <td>
          <button class="btn btn-sm btn-primary edit-btn" data-id="${item.id}">Chỉnh sửa</button>
        </td>
      `;
      outputSupplier.appendChild(row);
    });

    attachEditButtonEvents();
  }

  function attachEditButtonEvents() {
    document.querySelectorAll('.edit-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        openEditOffcanvas(id);
      });
    });
  }

  function openEditOffcanvas(id) {
    const supplier = data.find(item => item.id == id);
    if (!supplier) {
      alert("Không tìm thấy Supplier!");
      return;
    }

    // Fill form with supplier data
    inputId.value = supplier.id ?? '';
    inputName.value = supplier.name ?? '';
    inputPhone.value = supplier.phone ?? '';
    inputEmail.value = supplier.email ?? '';
    inputAddress.value = supplier.address ?? '';
    inputCode.value = supplier.code ?? '';
    statusDropdown.value = supplier.status;
    // Open offcanvas
    const editOffcanvas = new bootstrap.Offcanvas('#offcanvasPatientEdit');
    editOffcanvas.show();
  }

  function renderPageInfo() {
    const totalPages = Math.max(1, Math.ceil(dataToShow.length / rowsPerPage));
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
    preBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  }

  function renderPageNumber() {
    const totalPages = Math.ceil(dataToShow.length / rowsPerPage);
    let html = '';

    const createPageItem = (i) => `
      <li class="text-center rounded px-2 py-1 ${i === currentPage ? 'bg-primary text-white' : 'bg-primary-subtle text-primary'} page-link" 
          style="cursor:pointer;" data-page="${i}">
          ${i}
      </li>`;
    const addDots = () => `<li class="text-center text-primary rounded px-2">...</li>`;

    const pagesToShow = new Set([1, 2, currentPage - 1, currentPage, currentPage + 1, totalPages - 1, totalPages]);

    let lastPage = 0;
    for (let i = 1; i <= totalPages; i++) {
      if (pagesToShow.has(i)) {
        if (lastPage && i - lastPage > 1) {
          html += addDots();
        }
        html += createPageItem(i);
        lastPage = i;
      }
    }
    pagination.innerHTML = html;

    document.querySelectorAll('.page-link').forEach(item => {
      item.addEventListener('click', (e) => {
        const page = parseInt(e.target.dataset.page);
        if (page !== currentPage) {
          currentPage = page;
          renderTable();
          renderPageInfo();
          renderPageNumber();
        }
      });
    });
  }

  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
    }
  }

  // Tìm kiếm khi gõ
  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim().toLowerCase();
    dataToShow = data.filter(supplier =>
      supplier.name && supplier.name.toLowerCase().includes(keyword)
    );
    currentPage = 1;
    renderTable();
    renderPageInfo();
    renderPageNumber();
  });

  // Tìm kiếm khi submit form
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const keyword = searchInput.value.trim().toLowerCase();
    dataToShow = data.filter(supplier =>
      supplier.name && supplier.name.toLowerCase().includes(keyword)
    );
    currentPage = 1;
    renderTable();
    renderPageInfo();
    renderPageNumber();
  });

  // Nút clear tìm kiếm
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    dataToShow = [...data];
    currentPage = 1;
    renderTable();
    renderPageInfo();
    renderPageNumber();
  });

  // Pagination buttons
  preBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      renderPageInfo();
      renderPageNumber();
    }
  });

  nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(dataToShow.length / rowsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
      renderPageInfo();
      renderPageNumber();
    }
  });

  //Sắp xếp 
  const sortAscBtn = document.getElementById('sortAscBtn');

  sortAscBtn.addEventListener('click', () => {
    dataToShow.sort((a, b) => new Date(a.createDate) - new Date(b.createDate));
    currentPage = 1;
    renderTable();
    renderPageInfo();
    renderPageNumber();
  });


  const sortDescBtn = document.getElementById('sortDescBtn');
  sortDescBtn.addEventListener('click', () => {
    dataToShow.sort((a, b) => new Date(b.createDate) - new Date(a.createDate));
    currentPage = 1;
    renderTable();
    renderPageInfo();
    renderPageNumber();
  });

  //Update
  const updateSupplierBtn = document.getElementById('updateSupplierBtn');
  updateSupplierBtn.addEventListener('click', async () => {
    const sid = inputId.value.trim();
    if (!sid) {
      alert("ID không hợp lệ!");
      return;
    }

    const sname = inputName.value.trim();
    const sphone = inputPhone.value.trim();
    const semail = inputEmail.value.trim();
    const saddress = inputAddress.value.trim();
    const scode = inputCode.value.trim();
    const sstatus = document.getElementById("Status").value;

    // Kiểm tra các trường dữ liệu
    if (!sid || !sname || !sphone || !semail || !saddress || !scode) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    function isValid(text) {
      text = text.trim();
      if (!text) return false;

      const pattern = /^[\p{L}\d\s\.,\-]+$/u;
      return pattern.test(text);
    }

    if (!isValid(sname)) {
      alert("Tên nhà cung cấp không được chứa ký tự đặc biệt!");
      return;
    }

    if (!isValid(saddress)) {
      alert("Địa chỉ không được chứa ký tự đặc biệt!");
      return;
    }



    const supplierData = {
      id: sid,
      name: sname,
      phone: sphone,
      email: semail,
      address: saddress,
      status: sstatus,
      code: scode,
      updateDate: new Date().toISOString(),
      updateBy: "system"
    };

    try {
      const response = await fetch(`https://localhost:7097/api/Supplier/update/${sid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }


      alert("Cập nhật thành công!");
      fetchSupplierData();
      const editOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasPatientEdit'));
      editOffcanvas.hide();
    } catch (error) {
      alert(`Lỗi: ${error.message}`);
      console.error("Cập nhật thất bại:", error);
    }
  });

  //add supplier
  const addSupplierBtn = document.getElementById("addSupplierBtn");
  addSupplierBtn.addEventListener('click', async () => {
    const addName = document.getElementById("addName").value.trim();
    const addPhone = document.getElementById("addPhoneNumber").value.trim();
    const addEmail = document.getElementById("addEmail").value.trim();
    const addAddress = document.getElementById("addAddress").value.trim();
    const addCode = document.getElementById("addCode").value.trim();

    if (!addName || !addPhone || !addEmail || !addAddress || !addCode) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    function isValid(text) {
      text = text.trim();
      if (!text) return false;

      const pattern = /^[\p{L}\d\s\.,\-]+$/u;
      return pattern.test(text);
    }
    if (!isValid(addName)) {
      alert("Tên nhà cung cấp không được chứa ký tự đặc biệt!");
      return;
    }

    if (!isValid(addAddress)) {
      alert("Địa chỉ không được chứa ký tự đặc biệt!");
      return;
    }

    const addSupplierData = {
      name: addName,
      phone: addPhone,
      email: addEmail,
      address: addAddress,
      code: addCode

    }

    try {
      const response = await fetch(`https://localhost:7097/api/Supplier/add-supplier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(addSupplierData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }


      alert("Tạo thành công!");
      fetchSupplierData();
      const editOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasPatientAdd'));
      editOffcanvas.hide();
    } catch (error) {
      alert(`Lỗi: ${error.message}`);
      console.error("Tạo thất bại:", error);
    }
  });
});
