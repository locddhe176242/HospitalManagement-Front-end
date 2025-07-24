document.addEventListener('DOMContentLoaded', function () {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const token = localStorage.getItem('token');
    if (!userInfo.id || !token) return;

    fetch(`https://localhost:7097/api/Patient/findUserId/${userInfo.id}`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(user => {
        // Gán dữ liệu vào các input
        let genderValue = user.gender;
        if(genderValue == "Male") genderValue = "0";
        else if(genderValue == "Female") genderValue = "1";
        document.getElementById('patientCode').value = user.code || '';
        document.getElementById('fullName').value = user.name || '';
        document.getElementById('email').value = userInfo.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('dob').value = user.dob ? user.dob.split('T')[0] : '';
        document.getElementById('gender').value = genderValue || '';
        document.getElementById('addressPatient').value = user.address || '';
        document.getElementById('cccd').value = user.cccd || '';
        document.getElementById('emergencyContact').value = user.emergencyContact || '';
        document.getElementById('insuranceNumber').value = user.insuranceNumber || '';
        document.getElementById('bloodType').value = user.bloodType || '';
        document.getElementById('allergies').value = user.allergies || '';
        if (user.imageURL) {
            document.getElementById('profileImage').src = user.imageURL;
        }
    })
    .catch(() => {
        alert('Không thể tải thông tin người dùng!');
    });
});

var myWidget = cloudinary.createUploadWidget(
  {
    cloudName: "dwcih9djc",
    uploadPreset: "ml_default",
    sources: ["local", "url", "camera"],
    multiple: false,
    clientAllowedFormats: ["jpg", "png", "jpeg", "gif"],
    cropping: true,
    croppingAspectRatio: 1,
  },
  (error, result) => {
    if (!error && result && result.event === "success") {
      const imageUrl = result.info.secure_url;
      document.getElementById("profileImage").src = imageUrl;
      updateProfileImage(imageUrl);
    }
  }
);

document.getElementById("profileImage").addEventListener("click", function () {
  myWidget.open();
}, false);

function loadUserProfile() {
  const token = localStorage.getItem("token");
  const userId = JSON.parse(localStorage.getItem("userInfo") || "{}").id;

  $.ajax({
    url: `https://localhost:7097/api/Patient/findUserId/${userId}`,
    type: "GET",
    headers: {
      Authorization: "Bearer " + token,
    },
    success: function (response) {
      console.log("Thông tin bệnh nhân:", response);
      $("#patientCode").val(response.code);
      $("#fullName").val(response.name);
      $("#phone").val(response.phone);
      $("#dob").val(response.dob?.split("T")[0] || "");

      if (response.gender === "Male") {
        $('#gender').val("0");
      } else if (response.gender === "Female") {
        $('#gender').val("1");
      }else if (typeof response.gender === "number") {
        $('#gender').val(response.gender.toString());
     }

      $("#addressPatient").val(response.address);
      $("#cccd").val(response.cccd);
      $("#emergencyContact").val(response.emergencyContact);
      $("#insuranceNumber").val(response.insuranceNumber);
      $("#bloodType").val(response.bloodType);
      $("#allergies").val(response.allergies);
      if (response.imageURL) {
        $("#profileImage").attr("src", response.imageURL);
      }

      // Lưu mã và trạng thái để cập nhật sau này
      $("#profileForm").data("code", response.code);
      $("#profileForm").data("status", response.status);
    },
    error: function (xhr) {
        console.error(xhr.responseText);
        alert("Không thể tải thông tin người dùng!");
      
    },
  });
}

function updateProfileImage(imageUrl) {
  const token = localStorage.getItem("token");
  const userId = JSON.parse(localStorage.getItem("userInfo") || "{}").id;

  const updateData = {
    imageURL: imageUrl,
  };

  $.ajax({
    url: `https://localhost:7097/api/Patient/updatePatientImage/${userId}`,
    type: "PUT",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    data: JSON.stringify(updateData),
    success: function (response) {
      alert("Cập nhật ảnh đại diện thành công!");
    },
    error: function (xhr) {
      console.error(xhr.responseText);
      alert("Cập nhật ảnh thất bại!");
    },
  });
}

$("#profileForm").submit(function (e) {
  e.preventDefault();

  const token = localStorage.getItem("token");
  const userId = JSON.parse(localStorage.getItem("userInfo") || "{}").id;

  const updateData = {
    id: 0, // hoặc bỏ nếu API không cần
    code: $("#patientCode").val(),
    name: $("#fullName").val(),
    gender: parseInt($("#gender").val()) || 0,
    dob: $("#dob").val() + "T00:00:00",
    address: $("#addressPatient").val(),
    cccd: $("#cccd").val(),
    phone: $("#phone").val(),
    emergencyContact: $("#emergencyContact").val(),
    insuranceNumber: $("#insuranceNumber").val(),
    bloodType: $("#bloodType").val(),
    allergies: $("#allergies").val(),
    imageURL: $("#profileImage").attr("src") || "",
    status: $("#profileForm").data("status")
  };

  $.ajax({
    url: `https://localhost:7097/api/Patient/updateByUserId/${userId}`,
    type: "PUT",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    data: JSON.stringify(updateData),
    success: function (res) {
      alert("Cập nhật thông tin thành công!");
      loadUserProfile();
    },
    error: function (xhr) {
      console.error(xhr.responseText);
      alert("Không thể cập nhật hồ sơ!");
    },
  });
});

function getStatusText(status) {
  switch (status.toLowerCase()) {
    case "unpaid": return "Chưa thanh toán";
    case "paid": return "Đã thanh toán";
    case "partiallypaid": return "Thanh toán một phần";
    case "cancelled": return "Đã hủy";
    default: return "Không xác định";
  }
}
async function loadInvoices() {
  try {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const userId = userInfo.id;
    
    if (!userId) {
      console.error("Không tìm thấy userId trong localStorage.");
      return;
    }

    const response = await fetch(`https://localhost:7097/api/Invoice/get-by-id/${userId}`);
    const data = await response.json();

    const tbody = document.getElementById("invoice-table-body");
    tbody.innerHTML = "";

    data.forEach((invoice, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
  <td class="p-3">${index + 1}</td>
  <td class="p-3">${invoice.totalAmount.toLocaleString()} VNĐ</td>
  <td class="p-3">${new Date(invoice.createDate).toLocaleDateString()}</td>
  <td class="p-3">${invoice.payments[0]?.payer || "N/A"}</td>
  <td class="p-3">${invoice.payments[0]?.notes || "N/A"}</td>
  <td class="p-3">${getStatusText(invoice.status)}</td>
  <td class="p-3">
    ${
      invoice.status.toLowerCase() === "unpaid"
        ? `<button class="btn btn-sm btn-success" onclick="openPaymentModal(${invoice.id}, ${invoice.totalAmount})">
            Thanh toán
          </button>`
        : invoice.status.toLowerCase() === "paid"
          ? (invoice.hasFeedback
              ? `<span class="text-muted">Hoàn thành</span>`
              : `<button class="btn btn-sm btn-warning" onclick="openFeedbackModal(${invoice.appointmentId})">Gửi Feedback</button>`)
          : `<span class="text-muted">Không khả dụng</span>`
    }
  </td>
`;

      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Lỗi khi tải danh sách hóa đơn:", err);
  }
}

function openPaymentModal(invoiceId, totalAmount) {
  document.getElementById("invoiceId").value = invoiceId;
  document.getElementById("amount").value = totalAmount;
  document.getElementById("payer").value = "";
  document.getElementById("notes").value = "";
  document.getElementById("method").value = "Chuyển khoản";

  const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
  modal.show();
}

document.getElementById("btnSubmitPayment").addEventListener("click", async function () {
  const invoiceId = document.getElementById("invoiceId").value;
  const payer = document.getElementById("payer").value;
  const amount = document.getElementById("amount").value;
  const notes = document.getElementById("notes").value;
  const method = document.getElementById("method").value;

  const now = new Date().toISOString(); // ngày hiện tại ISO format

const paymentData = {
  invoiceId: parseInt(invoiceId),
  amount: parseFloat(amount),
  paymentMethod: method,
  payer: payer,
  notes: notes,
  paymentDate: now,
  name: "string",
  code: "string",
  createDate: now,
  updateDate: now,
  createBy: "string",
  updateBy: "string"
};

  try {
    const res = await fetch(`https://localhost:7097/api/Payment/make-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentData)
    });

    if (res.ok) {
      alert("Thanh toán thành công!");
      loadInvoices();
      bootstrap.Modal.getInstance(document.getElementById("paymentModal")).hide();
    } else {
      alert("Thanh toán thất bại!");
    }
  } catch (err) {
    console.error("Lỗi khi thanh toán:", err);
    alert("Có lỗi xảy ra khi thanh toán.");
  }
});
loadInvoices();

function openFeedbackModal(appointmentId) {
  document.getElementById("feedbackAppointmentId").value = appointmentId;
  document.getElementById("feedbackContent").value = "";
  const modal = new bootstrap.Modal(document.getElementById("feedbackModal"));
  modal.show();
}

async function submitFeedback() {
  const content = document.getElementById("feedbackContent").value;
  const appointmentId = document.getElementById("feedbackAppointmentId").value;

  if (!content.trim()) {
    alert("Vui lòng nhập nội dung feedback.");
    return;
  }

  try {
    const response = await fetch("https://localhost:7097/api/Feedback/add-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Nếu cần token thì thêm Authorization
      },
      body: JSON.stringify({
        content: content,
        appointmentId: parseInt(appointmentId),
        doctorId: 0 // Sẽ được backend xử lý như bạn viết
      }),
    });

    if (!response.ok) throw new Error(await response.text());

    alert("Gửi feedback thành công!");
    bootstrap.Modal.getInstance(document.getElementById("feedbackModal")).hide();
    await loadInvoices(); // refresh lại danh sách hóa đơn
  } catch (err) {
    console.error("Lỗi khi gửi feedback:", err);
    alert("Lỗi: " + err.message);
  }
}


document.getElementById("btnLogout").addEventListener("click", function () {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    localStorage.clear();
    window.location.href = "login.html";
  }
});
