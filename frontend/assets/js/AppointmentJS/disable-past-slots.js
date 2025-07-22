// disable-past-slots.js
// Tự động disable các slot thời gian đã qua trong ngày hiện tại

/**
 * Disable các slot thời gian đã qua nếu chọn ngày là hôm nay
 * @param {string} selectedDateStr - Ngày được chọn, định dạng 'YYYY-MM-DD'
 * @param {string[]} slotTimes - Mảng các slot thời gian, định dạng 'HH:mm'
 * @param {function} disableSlotCallback - Hàm callback để disable slot, nhận vào slotTime
 */
function disablePastSlots(selectedDateStr, slotTimes, disableSlotCallback) {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    if (selectedDateStr !== todayStr) return;

    slotTimes.forEach(slotTime => {
        // Tạo đối tượng Date cho slot
        const [hour, minute] = slotTime.split(":").map(Number);
        const slotDate = new Date(selectedDateStr + `T${slotTime}:00`);
        // Nếu slot < thời gian hiện tại thì disable
        if (slotDate < now) {
            disableSlotCallback(slotTime);
        }
    });
}

// Ví dụ sử dụng:
// disablePastSlots('2025-07-18', ['08:00','08:15',...], (slot) => {
//   document.querySelector(`[data-slot='${slot}']`).classList.add('disabled');
// });

// Export hàm để dùng ở các file khác
window.disablePastSlots = disablePastSlots; 