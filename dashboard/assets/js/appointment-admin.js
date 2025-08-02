document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    const tableBody = document.getElementById("appointment");
    const searchInput = document.getElementById("searchInput");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const clearBtn = document.getElementById("clearFilters");


    const prevBtn = document.getElementById("preBtn");
    const nextBtn = document.getElementById("nextBtn");

    const pageSize = 10; // số bản ghi mỗi trang
    let currentPage = 1;
    let appointments = [];
    let filteredAppointments = [];

    try {
        const res = await fetch("https://localhost:7097/api/AppointmentController_1/get-app-admin", {
            headers: {
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : ""
            }
        });

        if (!res.ok) throw new Error("Không thể tải dữ liệu lịch hẹn");

        appointments = await res.json();
        filteredAppointments = appointments;
        renderPage(currentPage);

    } catch (error) {
        console.error("Lỗi khi tải lịch hẹn:", error);
        tableBody.innerHTML = `
            <tr><td colspan="8" class="text-danger text-center">Không thể tải dữ liệu.</td></tr>
        `;
    }

    function renderPage(page) {
        tableBody.innerHTML = "";
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pageData = filteredAppointments.slice(start, end);

        pageData.forEach((item, index) => {
            const row = `
                <tr>
                    <td>${start + index + 1}</td>
                    <td>${item.patientName || "N/A"}</td>
                    <td>${item.startTime || ""}</td>
                    <td>${new Date(item.appointmentDate).toLocaleDateString("vi-VN")}</td>
                    <td>${item.serviceName || "N/A"}</td>
                    <td>${item.doctorName || "N/A"}</td>
                    <td>${item.clinicName || "N/A"}</td>
                    <td>${new Date(item.createDate).toLocaleDateString("vi-VN")}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML("beforeend", row);
        });

        prevBtn.classList.toggle("disabled", currentPage === 1);
        nextBtn.classList.toggle("disabled", currentPage >= Math.ceil(filteredAppointments.length / pageSize));
    }

    function applyFilters() {
        const keyword = searchInput.value.toLowerCase().trim();
        const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value) : null;

        filteredAppointments = appointments.filter(item => {
            const matchSearch =
                (item.patientName && item.patientName.toLowerCase().includes(keyword)) ||
                (item.serviceName && item.serviceName.toLowerCase().includes(keyword)) ||
                (item.doctorName && item.doctorName.toLowerCase().includes(keyword));

            const createDate = new Date(item.createDate);
            const matchDate =
                (!startDate || createDate >= startDate) &&
                (!endDate || createDate <= endDate);

            return matchSearch && matchDate;
        });

        currentPage = 1;
        renderPage(currentPage);
    }

    searchInput.addEventListener("input", applyFilters);
    startDateInput.addEventListener("change", applyFilters);
    endDateInput.addEventListener("change", applyFilters);

    prevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPage);
        }
    });

    nextBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (currentPage < Math.ceil(filteredAppointments.length / pageSize)) {
            currentPage++;
            renderPage(currentPage);
        }
    });
    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        startDateInput.value = "";
        endDateInput.value = "";
        filteredAppointments = appointments;
        currentPage = 1;
        renderPage(currentPage);
    });
});
