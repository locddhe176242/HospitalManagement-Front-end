document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('https://localhost:7097/api/Doctors/GetAll');
        const doctors = await response.json();

        const listEl = document.getElementById('doctor-list');
        listEl.innerHTML = '';

        doctors.forEach(doctor => {
            const li = document.createElement('li');
            li.className = 'swiper-slide';

            li.innerHTML = `
    <div class="iq-team-block team-standard position-relative">
        <div class="iq-team-img">
            <a href="./doctor-details.html?id=${doctor.id}">
                <img src="${doctor.imageURL}" alt="${doctor.name}" class="img-fluid w-100" loading="lazy">
            </a>
        </div>
        <div class="iq-team-info text-center pt-5 px-3 pb-3 letter-spacing-1">
            <a href="./doctor-detail.html?id=${doctor.id}">
                <h5 class="mb-2 iq-team-title">${doctor.name}</h5>
            </a>
            <p class="mb-0 mt-1 text-uppercase fw-500 letter-spacing-2">
                ${doctor.yearOfExperience} năm kinh nghiệm – Mã số: ${doctor.code}
            </p>
        </div>
    </div>
`;


            listEl.appendChild(li);
        });

        // Re-initialize Swiper
        if (typeof Swiper !== 'undefined') {
            new Swiper('.swiper-general', {
                slidesPerView: 3,
                loop: true,
                spaceBetween: 30,
                autoplay: {
                    delay: 3000,
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                breakpoints: {
                    1024: { slidesPerView: 3 },
                    768: { slidesPerView: 2 },
                    480: { slidesPerView: 1 },
                }
            });
        }

    } catch (error) {
        console.error('Lỗi khi tải danh sách bác sĩ:', error);
    }
});
