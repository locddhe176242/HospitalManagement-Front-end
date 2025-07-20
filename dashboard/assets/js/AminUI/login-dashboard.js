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