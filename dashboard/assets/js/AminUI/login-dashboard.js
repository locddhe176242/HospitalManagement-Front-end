document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginDashboardForm');

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = form.querySelector('input[name="user-name"]').value;
    const password = form.querySelector('input[name="pwd"]').value;
    const userType = form.querySelector('input[name="userType"]')?.value;

    if (!email || !password || !userType) {
      alert('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    try {
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
      localStorage.setItem('userInfo', JSON.stringify(data.userInfo));
      localStorage.setItem('userId', data.userInfo.id);

      // Chuyển hướng theo userType
      switch (userType) {
        case 'Admin':
          window.location.href = '../index.html';
          break;
        case 'Doctor':
          try {
            const userId = data.userInfo.id;
              const doctorRes = await fetch(
             `https://localhost:7097/api/Doctors/FindByUserId/${userId}`,
            {
              headers: { 'Authorization': `Bearer ${data.token}` }
            });
              if (doctorRes.ok) {
              const doctorData = await doctorRes.json();
            localStorage.setItem('doctorId', doctorData.id);
            }
    }      catch (err) {
              alert('Không lấy được thông tin bác sĩ!');
              }
          window.location.href = '../doctor-page.html';
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
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    }
  });
});

//reset password
//forgot-password.html
document.addEventListener('DOMContentLoaded', function () {
  // Lấy tất cả form có id bắt đầu bằng "forgotPasswordForm"
  const forms = document.querySelectorAll('form[id^="forgotPasswordFormDoctor"]');

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
  const form = document.getElementById('resetPasswordFormDoctor');
  if (!form) {
      console.error('Không tìm thấy form!');
      return;
    }
    
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
        window.location.href = '/dashboard/auth/sign-in-doctor.html';
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