document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('https://localhost:7097/api/Service');
        const services = await response.json();

        const listEl = document.getElementById('service-list');
        listEl.innerHTML = '';

        const activeServices = services.filter(service => service.status === 'Active');

        activeServices.forEach(service => {
            const li = document.createElement('li');
            li.className = 'swiper-slide';

            li.innerHTML = `
                <div class="iq-service-block team-standard position-relative">
                    <div class="iq-service-img mb-3">
                        <img src="${service.imageUrl}" alt="${service.name}" class="img-fluid w-100" loading="lazy">
                    </div>
                    <div class="iq-service-info text-center px-3 pb-3">
                        <h5 class="mb-2 iq-service-title">${service.name}</h5>
                        <p class="text-body mb-2">${service.description}</p>
                        <strong class="text-primary">${service.price.toLocaleString('vi-VN')}đ</strong>
                    </div>
                </div>
            `;

            listEl.appendChild(li);
        });

        // Khởi tạo lại Swiper nếu đang dùng
        if (typeof Swiper !== 'undefined') {
            new Swiper('.swiper-service', {
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
        console.error('Lỗi khi tải danh sách dịch vụ:', error);
    }
});
