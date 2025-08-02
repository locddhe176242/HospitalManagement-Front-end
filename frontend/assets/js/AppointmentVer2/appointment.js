document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Bạn cần đăng nhập trước.");
    window.location.href = "login.html";
    return; // Ngăn chặn chạy tiếp
  }

  // Nếu đã đăng nhập thì mới tiếp tục load
  loadClinics();
  setupStepForm();
  loadDoctors();
  loadServices();
  fetchPatientInfo(); // ← nếu bạn có hàm này để lấy thông tin bệnh nhân
});

async function fetchPatientInfo() {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  if (!userId || !token) {
    console.warn("Thiếu userId hoặc token.");
    return;
  }

  try {
    const res = await fetch(`https://localhost:7097/api/Patient/findUserId/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Không thể lấy thông tin bệnh nhân");
    }

    const patient = await res.json();
    console.log("Patient info:", patient);
    localStorage.setItem("patientId", patient.id); // Lưu để dùng khi submit

  } catch (err) {
    console.error("Lỗi khi lấy bệnh nhân:", err.message);
  }
}


async function loadClinics() {
    try {
        const response = await fetch("https://localhost:7097/api/Clinic/get-all");
        const data = await response.json();

        const clinicList = document.getElementById("clinicList");
        clinicList.innerHTML = "";

        data.forEach(clinic => {
            const clinicHTML = `
            <div class="col-md-6 col-lg-6 mb-4">
                <label class="position-relative w-100 h-100 d-block border rounded p-4 text-center bg-white">
                    <input type="radio" name="radios"
                        class="form-check-input position-absolute top-0 end-0 m-2" value="${clinic.id}" style="z-index: 10;">
                    <div class="d-flex flex-column align-items-center h-100 justify-content-between">
                        <img src="${clinic.imageUrl}" alt="Clinic" class="rounded-circle mb-3" width="80" height="80" style="object-fit: cover;">
                        <h5 class="mb-1">${clinic.name}</h5>
                        <p class="mb-1 text-muted">${clinic.address}</p>
                        <h6 class="mb-0 mt-2 fw-bold">Email</h6>
                        <p class="mb-0 text-muted">${clinic.email}</p>
                    </div>
                </label>
            </div>
            `;
            clinicList.insertAdjacentHTML("beforeend", clinicHTML);
        });

    } catch (error) {
        console.error("Lỗi khi tải danh sách phòng khám:", error);
    }
}

async function loadDoctors() {
    try {
        const response = await fetch("https://localhost:7097/api/Doctors/GetAll");
        const doctors = await response.json();

        const doctorList = document.querySelector("#doctorList");
        doctorList.innerHTML = "";

        doctors.forEach(doctor => {
            const doctorHTML = `
            <div class="col-md-6 col-lg-6 mb-4">
                <label class="position-relative w-100 h-100 d-block border rounded p-4 bg-white text-center">
                    <input type="radio" name="selectedDoctor"
                        class="form-check-input position-absolute top-0 end-0 m-2" value="${doctor.id}" style="z-index: 10;">

                    <img src="${doctor.imageURL}" alt="${doctor.name}" class="rounded-circle mb-3" width="80" height="80" style="object-fit: cover;">
                    <h5 class="mb-1">${doctor.name}</h5>

                    <div class="my-2">
                        <span class="badge bg-danger-subtle text-danger px-3 py-1 rounded-pill">
                            Exp: ${doctor.yearOfExperience}yr
                        </span>
                    </div>
                </label>
            </div>
            `;

            doctorList.insertAdjacentHTML("beforeend", doctorHTML);
        });

    } catch (error) {
        console.error("Lỗi khi tải danh sách bác sĩ:", error);
    }
}

async function loadServices() {
    try {
        const response = await fetch("https://localhost:7097/api/Service/get-all");
        const services = await response.json();

        const serviceList = document.querySelector("#serviceList");
        serviceList.innerHTML = ""; // Xóa dữ liệu cũ

        services.forEach(service => {
            const serviceHTML = `
            <div class="col-md-4 mb-4">
                <label class="position-relative w-100 h-100 d-block border rounded p-4 bg-white text-center">
                    <input type="radio" name="selectedService"
                        class="form-check-input position-absolute top-0 end-0 m-2" value="${service.id}" style="z-index: 10;">
                    
                    <img src="${service.imageUrl}" alt="${service.name}" width="70" height="70" class="mb-3 object-cover">

                    <h6 class="fw-bold mb-1">${service.name}</h6>

                    <p class="text-muted small mb-2">${service.description}</p>

                    <div class="d-flex flex-column gap-1">
                        <span class="badge bg-success-subtle text-success px-3 py-1 rounded-pill">
                            ${service.departmentName}
                        </span>
                        <span class="text-primary fw-semibold">${service.price.toLocaleString()}đ</span>
                    </div>
                </label>
            </div>
            `;

            serviceList.insertAdjacentHTML("beforeend", serviceHTML);
        });
    } catch (error) {
        console.error("Lỗi khi tải danh sách dịch vụ:", error);
    }
}

function setupDateAndTimeStep() {
    // Khởi tạo lịch inline
    flatpickr("#appointmentDate", {
        inline: true,
        minDate: "today",
        dateFormat: "Y-m-d",
        onChange: function (selectedDates) {
            const selectedDate = selectedDates[0];
            // Format ngày theo YYYY-MM-DD (theo giờ máy người dùng, không bị lệch UTC)
            const formattedDate = selectedDate.toLocaleDateString("sv-SE"); // "2025-07-31"
            localStorage.setItem("appointmentDate", formattedDate);
        }

    });


    // Danh sách các giờ khám
    const timeSlots = [
        "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
        "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    ];

    const timeSlotContainer = document.querySelector("#timeSlots .gx-3");
    timeSlotContainer.innerHTML = ""; // Xóa cũ nếu có

    timeSlots.forEach(time => {
        const col = document.createElement("div");
        col.className = "col-md-4 col-sm-6 mt-3";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn bg-white border text-uppercase text-body fw-semibold p-2 w-100";
        btn.textContent = time;

        btn.addEventListener("click", () => {
            // Xóa class "active" khỏi tất cả nút
            timeSlotContainer.querySelectorAll("button").forEach(b => {
                b.classList.remove("active", "btn-primary", "text-white");
                b.classList.add("bg-white", "text-body"); // Trạng thái chưa chọn
            });

            // Gán class cho nút được chọn
            btn.classList.remove("bg-white", "text-body");
            btn.classList.add("active", "btn-primary", "text-white");

            // Lưu thời gian đã chọn
            localStorage.setItem("startTime", time);
        });



        col.appendChild(btn);
        timeSlotContainer.appendChild(col);
    });
}



document.addEventListener("DOMContentLoaded", function () {
    const submitBtn = document.getElementById("submitAppointment");
    if (!submitBtn) return;

    submitBtn.addEventListener("click", submitAppointment);
});

async function submitAppointment() {
    try {
        // Lấy dữ liệu từ localStorage
        const appointmentDate = localStorage.getItem("appointmentDate");
        const startTime = localStorage.getItem("startTime");
        const appointmentTitle = localStorage.getItem("appointmentTitle") || "N/A";
        const appointmentNote = localStorage.getItem("appointmentNote") || "N/A";
        const patientId = localStorage.getItem("patientId");
        // Lấy thông tin phần tử đã chọn
        const selectedClinic = document.querySelector('input[name="radios"]:checked')?.value;
        const selectedDoctor = document.querySelector('input[name="selectedDoctor"]:checked')?.value;
        const selectedService = document.querySelector('input[name="selectedService"]:checked')?.value;

        console.log("DEBUG DATA:");
        console.log("Date:", appointmentDate);
        console.log("Time:", startTime);
        console.log("Title:", appointmentTitle);
        console.log("Note:", appointmentNote);
        console.log("Patient ID:", patientId);
        console.log("Clinic ID:", selectedClinic);
        console.log("Doctor ID:", selectedDoctor);
        console.log("Service ID:", selectedService);


        // Kiểm tra thông tin bắt buộc
        if (!appointmentDate || !startTime || !appointmentTitle || !patientId || !selectedClinic || !selectedDoctor || !selectedService) {
            alert("Vui lòng điền đầy đủ thông tin trước khi hoàn tất.");
            return;
        }

        // Xác định buổi sáng hay chiều
        const hour = parseInt(startTime.split(":")[0]);
        const shiftType = hour < 12 ? "Morning" : "Afternoon";
        console.log("Shiftype:", shiftType);
        // Chuẩn bị dữ liệu gửi API
        const appointmentData = {
            appointmentDate,
            startTime,
            status: "Scheduled",
            note: appointmentNote,
            patientId: parseInt(patientId),
            clinicId: parseInt(selectedClinic),
            serviceId: parseInt(selectedService),
            name: appointmentTitle,
            doctorId: parseInt(selectedDoctor),
            shiftType
        };

        // Gọi API
        const response = await fetch("https://localhost:7097/api/ApointmentControllerVer2/cretate-appointmentv2", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(appointmentData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        alert("Đặt lịch thành công!");
    } catch (err) {
        console.error("Lỗi đặt lịch:", err);
        alert("Đặt lịch thất bại: " + err.message);
    }
}





function setupStepForm() {
    let currentStep = 1;
    const steps = document.querySelectorAll(".appointment-step");
    const tabs = document.querySelectorAll("#appointment-tab-list li");
    const totalSteps = steps.length;

    function showStep(step) {
        // Ẩn tất cả các bước
        steps.forEach(el => el.classList.add("d-none"));

        // Hiện bước hiện tại
        const current = document.querySelector(`.appointment-step[data-step="${step}"]`);
        if (current) current.classList.remove("d-none");

        // Nếu là bước 4 thì khởi tạo lịch và giờ
        if (step === 4) {
            setupDateAndTimeStep();
        }

        // Cập nhật trạng thái tab
        tabs.forEach(tab => {
            tab.classList.remove("active");
            if (parseInt(tab.dataset.step) === step) {
                tab.classList.add("active");
            }
        });
    }


    document.querySelectorAll(".next").forEach(btn => {
        btn.addEventListener("click", function () {
            const currentStepEl = document.querySelector(`.appointment-step[data-step="${currentStep}"]`);
            const selectedInput = currentStepEl.querySelector('input[type="radio"]:checked');

            // Kiểm tra các bước chọn radio (1–3)
            if ([1, 2, 3].includes(currentStep)) {
                if (!selectedInput) {
                    alert("Vui lòng chọn một lựa chọn trước khi tiếp tục.");
                    return;
                }
            }

            // Kiểm tra ngày & giờ (bước 4)
            if (currentStep === 4) {
                const selectedDate = localStorage.getItem("appointmentDate");
                const selectedTime = localStorage.getItem("startTime");
                if (!selectedDate || !selectedTime) {
                    alert("Vui lòng chọn ngày và giờ trước khi tiếp tục.");
                    return;
                }
            }

            // Lưu note & title (bước 5)
            if (currentStep === 5) {
                const title = document.getElementById("appointmentTitle")?.value || "";
                const note = document.getElementById("appointmentNote")?.value || "";
                localStorage.setItem("appointmentTitle", title);
                localStorage.setItem("appointmentNote", note);
            }

            // Chuyển sang bước tiếp theo nếu hợp lệ
            if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });





    // Gắn sự kiện cho nút "Trở lại" (Back)
    document.querySelectorAll(".back").forEach(btn => {
        btn.addEventListener("click", function () {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    // Khởi tạo hiển thị bước đầu tiên
    showStep(currentStep);
}



