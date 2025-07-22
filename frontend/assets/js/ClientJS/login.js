document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm');

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = form.querySelector('input[name="user-name"]').value;
    const password = form.querySelector('input[name="pwd"]').value;
    const userType = form.querySelector('input[name="userType"]')?.value;

    // Kiểm tra userType hợp lệ
    const validUserTypes = ["Patient", "Doctor", "Nurse", "Admin"];
    if (!validUserTypes.includes(userType)) {
      alert("Loại tài khoản không hợp lệ! Vui lòng chọn đúng: Patient, Doctor, Nurse hoặc Admin.");
      return;
    }

    if (!email || !password || !userType) {
      alert('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    try {
      // Sử dụng UserSessionManager nếu có
      if (window.userSessionManager) {
        const result = await window.userSessionManager.login(email, password, userType);
        if (result.success) {
          // Chuyển hướng theo userType
          switch (userType) {
            case 'Admin':
              window.location.href = '/dashboard/index.html';
              break;
            case 'Doctor':
              window.location.href = '/dashboard/doctor-page.html';
              break;
            case 'Patient':
              window.location.href = '/frontend/index.html';
              break;
            case 'Nurse':
              window.location.href = '/frontend/nurse-ui.html';
              break;
            default:
              window.location.href = '/home';
          }
        } else {
          alert(result.message);
        }
      } else {
        // Fallback cho trường hợp UserSessionManager chưa khởi tạo
        const response = await fetch('https://localhost:7097/api/Authentication/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, userType })
        });

        if (!response.ok) {
          alert('Login failed!');
          return;
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('kivicare_token', data.token);
        localStorage.setItem('userInfo', JSON.stringify(data.userInfo));
        localStorage.setItem('userId', data.userInfo.id);
        // Đồng bộ session cho UserSessionManager
        const userSession = {
          email: data.userInfo.email,
          fullName: data.userInfo.fullName || data.userInfo.userName || '',
          userType: data.userInfo.userType || '',
          token: data.token,
          userId: data.userInfo.id
        };
        localStorage.setItem('kivicare_user_session', JSON.stringify(userSession));

        // Chuyển hướng theo userType
        switch (userType) {
          case 'Admin':
            window.location.href = '/dashboard/index.html';
            break;
          case 'Doctor':
            window.location.href = '/dashboard/doctor-page.html';
            break;
          case 'Patient':
            window.location.href = '/frontend/index.html';
            break;
          case 'Nurse':
            window.location.href = '/frontend/nurse-ui.html';
            break;
          default:
            window.location.href = '/home';
        }
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    }
  });
});


//reset password
//forgot-password.html
document.addEventListener('DOMContentLoaded', function () {
  // Lấy tất cả form có id bắt đầu bằng "forgotPasswordForm"
  const forms = document.querySelectorAll('form[id^="forgotPasswordForm"]');

  forms.forEach(form => {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email = form.elements['user_login'].value;
      const userType = form.elements['userType'].value;

      try {
        const response = await fetch('https://localhost:7097/api/Authentication/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userType })
        });

        if (response.ok) {
          alert('Vui lòng kiểm tra email để đặt lại mật khẩu!');
          form.reset();
        } else {
          const data = await response.json();
          alert(data.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        }
      } catch (error) {
        alert('Không thể kết nối đến máy chủ.');
      }
    });
  });
});

//reset password
//reset-password-form.html
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('resetPasswordForm');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const newPassword = form.elements['new_password'].value;
    const confirmPassword = form.elements['confirm_password'].value;

    if (newPassword.length < 8) {
      alert('Mật khẩu phải có ít nhất 8 ký tự!');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu không khớp!');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userTypeRaw = urlParams.get('userType') || form.elements['userType'].value;

    if (!token || !userTypeRaw) {
      alert('Link không hợp lệ!');
      return;
    }

    const userType = userTypeRaw.charAt(0).toUpperCase() + userTypeRaw.slice(1).toLowerCase();

    const payload = {
      Token: token,
      NewPassword: newPassword,
      UserType: userType
    };

    console.log('Sending to server:', payload);

    try {
      const response = await fetch('https://localhost:7097/api/Authentication/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Đặt lại mật khẩu thành công!');
        window.location.href = '/frontend/login.html';
      } else {
        const data = await response.json();
        console.error('Server response:', data);
        alert(data.message || 'Đặt lại mật khẩu thất bại!');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Không thể kết nối đến máy chủ.');
    }
  });
});

//change password
//my-account.html
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('changePasswordForm');

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const oldPassword = form.elements['currentPassword'].value;
    const newPassword = form.elements['newPassword'].value;
    const confirmPassword = form.elements['confirmNewPassword'].value;

    // Validation cơ bản
    if (newPassword.length < 8) {
      alert('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới và xác nhận không khớp.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      alert('Bạn chưa đăng nhập.');
      return;
    }

    const payload = {
      oldPassword,
      newPassword,
      confirmPassword
    };

    try {
      const response = await fetch('https://localhost:7097/api/Authentication/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Đổi mật khẩu thành công!');
        form.reset();
      } else {
        const data = await response.json();
        alert(data.message || 'Đổi mật khẩu thất bại!');
      }
    } catch (error) {
      console.error('Lỗi kết nối:', error);
      alert('Không thể kết nối đến máy chủ.');
    }
  });
});



    