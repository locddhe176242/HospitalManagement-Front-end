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
      `;

      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Lỗi khi tải danh sách hóa đơn:", err);
  }
}
loadInvoices();
