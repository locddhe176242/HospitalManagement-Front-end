document.addEventListener('DOMContentLoaded', function () {
    const userInfo = localStorage.getItem('userInfo');
    const userDropdown = document.querySelector('#itemdropdown1 .dropdown-menu');
    const userIcon = document.querySelector('#itemdropdown1 .btn-inner');
    if (userInfo) {
        const user = JSON.parse(userInfo);
        const displayName = user.fullName || user.email || user.userName || 'User';

        // Hiển thị tên user bên cạnh icon
        let nameSpan = document.getElementById('user-name-display');
        if (!nameSpan) {
            nameSpan = document.createElement('span');
            nameSpan.id = 'user-name-display';
            nameSpan.style.marginLeft = '8px';
            nameSpan.style.marginRight = '12px';
            nameSpan.style.fontWeight = '400';
            nameSpan.style.fontSize = '0.85rem';
            nameSpan.style.whiteSpace = 'nowrap';
            nameSpan.style.overflow = 'hidden';
            nameSpan.style.textOverflow = 'ellipsis';
            nameSpan.style.maxWidth = '120px';
            nameSpan.style.display = 'inline-block';
            nameSpan.style.cursor = 'pointer';
            nameSpan.title = displayName;

            userIcon.appendChild(nameSpan);
        }
        nameSpan.textContent = displayName;
        nameSpan.onclick = function () {
            window.location.href = './my-account.html';
        };

         userDropdown.innerHTML = `
            <li>
                <a class="dropdown-item" href="./my-account.html" style="font-size: 0.85rem;">
                    ${displayName}
                </a>
            </li>
            <li>
                <a class="dropdown-item" href="#" id="logout-btn">Logout</a>
            </li>
        `;

        // Xử lý logout
        document.getElementById('logout-btn').onclick = function (e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            window.location.reload();
        };
    }
    // const userId = localStorage.getItem('userId');
    // if (userId) {
    // loadUserProfile();
    // }
});
//Profile patient
// function loadUserProfile() {
//     const userId = localStorage.getItem("userId");
//     $.ajax({
//         url: `https://localhost:7097/api/Patient/findId/${userId}`,
//         type: "GET",
//         headers: {
//             Authorization: "Bearer " + localStorage.getItem("token"),
//         },
//         success: function (response) {
//             console.log("Thông tin người dùng:", response);

//             // Gán dữ liệu vào các input
//             $("#fullName").val(response.name);
//             $("#phone").val(response.phone);
//             $("#dob").val(response.dob?.split("T")[0] || "");
//             $("#gender").val(response.gender);
//             $("#address").val(response.address);
//             $("#cccd").val(response.cccd);
//             $("#emergencyContact").val(response.emergencyContact);
//             $("#insuranceNumber").val(response.insuranceNumber);
//             $("#bloodType").val(response.bloodType);

//             // Ảnh đại diện
//             if (response.imageURL) {
//                 $("#profileImage").attr("src", response.imageURL);
//             }

//             // Lưu lại thông tin nếu cần dùng sau
//             $("#profileForm").data("code", response.code);
//             $("#profileForm").data("status", response.status);
//         },
//         error: function (xhr) {
//             console.error("Lỗi khi tải thông tin:", xhr);
//             alert("Không thể tải thông tin người dùng!");
//         },
//     });
// }



