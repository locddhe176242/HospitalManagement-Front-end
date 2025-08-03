

document.addEventListener("DOMContentLoaded", async function () {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const token = localStorage.getItem("token");

  if (!userInfo.id || !token) return;

  try {
    const res = await fetch(`https://localhost:7097/api/Patient/findUserId/${userInfo.id}`, {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    const patient = await res.json();
    const patientId = patient.id;

    const res2 = await fetch(`https://localhost:7097/api/AppointmentController_1/get-app-by-paid/${patientId}`, {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });

    const allAppointments = await res2.json();
    let appointments = Array.isArray(allAppointments) ? allAppointments : [allAppointments];
    appointments = appointments.filter(item =>
      item.status && item.status.toLowerCase() === "scheduled"
    );

    if (appointments.length === 0) {
      tableBody.innerHTML = `
    <tr>
      <td colspan="11" class="p-3 text-center text-muted">
        Bạn không có lịch hẹn nào
      </td>
    </tr>
  `;
      return; 
    }

    const pageSize = 5;
    let currentPage = 1;
    const tableBody = document.getElementById("appointment-patient");
    const pageInfo = document.getElementById("pageInfo");
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");

    function renderPage(page) {
      tableBody.innerHTML = "";
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const pageAppointments = appointments.slice(start, end);

      pageAppointments.forEach((item, index) => {
        const row = `
          <tr>
            <td class="p-3">${start + index + 1}</td>
            <td class="p-3">${item.clinicName || "N/A"}</td>
            <td class="p-3">${item.serviceName || "N/A"}</td>
            <td class="p-3">${item.patientName || "N/A"}</td>
            <td class="p-3">${item.startTime || ""}</td>
            <td class="p-3">${new Date(item.appointmentDate).toLocaleDateString("vi-VN")}</td>
            <td class="p-3">${item.doctorName || "N/A"}</td>
            <td class="p-3">${item.note || ""}</td>
            <td class="p-3">${translateStatus(item.status)}</td>
            <td class="p-3">${new Date(item.createDate).toLocaleDateString("vi-VN")}</td>
            <td class="p-3">
              <button class="btn btn-sm btn-danger" onclick="cancelAppointment(${item.id})">Huỷ</button>
            </td>
          </tr>`;
        tableBody.insertAdjacentHTML("beforeend", row);
      });

      pageInfo.textContent = `Trang ${currentPage} / ${Math.ceil(appointments.length / pageSize)}`;
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = currentPage * pageSize >= appointments.length;
    }

    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentPage * pageSize < appointments.length) {
        currentPage++;
        renderPage(currentPage);
      }
    });

    renderPage(currentPage);

  } catch (err) {
    console.error("Lỗi khi lấy lịch hẹn:", err);
    document.getElementById("appointment-patient").innerHTML = `
      <tr><td colspan="10" class="p-3 text-danger">Không thể tải lịch hẹn.</td></tr>`;
  }

  function translateStatus(status) {
    switch (status?.toLowerCase()) {
      case "scheduled": return "Đã lên lịch";
      case "completed": return "Đã hoàn thành";
      case "cancelled": return "Đã huỷ";
      default: return "Không đến";
    }
  }
});

async function cancelAppointment(id) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Bạn cần đăng nhập để thực hiện hành động này.");
    return;
  }

  if (!confirm("Bạn có chắc chắn muốn hủy lịch hẹn này không?")) {
    return;
  }

  try {
    const res = await fetch(`https://localhost:7097/api/AppointmentController_1/change-status/${id}?newStatus=Cancelled`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Hủy lịch hẹn thất bại");
      return;
    }

    alert(data.message || "Hủy lịch hẹn thành công");

    location.reload();


  } catch (err) {
    console.error("Lỗi khi hủy lịch hẹn:", err);
    alert("Có lỗi xảy ra khi hủy lịch hẹn");
  }
}
