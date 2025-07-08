document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const form = e.target;

  const genderValue = parseInt(form.gender.value); // ← kiểu số enum

  if (isNaN(genderValue)) {
    alert("Vui lòng chọn giới tính hợp lệ!");
    return;
  }

  const body = {
    email: form.email.value,
    password: form.password.value,
    fullName: form.fullName.value,
    gender: genderValue, // ← gửi 0 hoặc 1
    code: "P12345678", // vẫn phải gửi nếu [Required]
    dob: form.dob.value,
    cccd: form.cccd.value,
    phone: form.phone.value,
    emergencyContact: form.emergencyContact.value,
    address: form.address.value
  };

  try {
    console.log("BODY gửi lên:", body);
    const res = await fetch('https://localhost:7097/api/Authentication/register/patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      window.location.href = 'login.html';
    } else {
      const err = await res.json();
      alert('Đăng ký thất bại: ' + (err.message || 'Vui lòng kiểm tra lại thông tin!'));
    }
  } catch (error) {
    console.error('Lỗi kết nối:', error);
    alert('Không thể kết nối máy chủ!');
  }
});
