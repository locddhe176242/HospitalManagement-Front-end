// Custom Calendar for Appointment (no dependency)
(function() {
  // Wait for DOM to be ready
  function initCalendar() {
    const container = document.getElementById('custom-calendar-container');
    if (!container) {
      console.log('Calendar container not found, retrying...');
      setTimeout(initCalendar, 100);
      return;
    }

    console.log('Initializing custom calendar...');

    // Config
    const MONTHS = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    // State
    let selectedDate = null;
    let currentMonth = (new Date()).getMonth();
    let currentYear = (new Date()).getFullYear();

    function renderCalendar(month, year) {
      container.innerHTML = '';
      
      // Header with navigation
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '8px';

      const prevBtn = document.createElement('button');
      prevBtn.innerHTML = '‹';
      prevBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 20px;
        color: #3b82f6;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
      `;
      prevBtn.onclick = () => {
        if (month === 0) {
          month = 11; year--;
        } else {
          month--;
        }
        currentMonth = month; currentYear = year;
        renderCalendar(month, year);
      };
      header.appendChild(prevBtn);

      const monthYear = document.createElement('span');
      monthYear.textContent = `${MONTHS[month]} ${year}`;
      monthYear.style.cssText = `
        color: #3b82f6;
        font-weight: 500;
        font-size: 1.1rem;
      `;
      header.appendChild(monthYear);

      const nextBtn = document.createElement('button');
      nextBtn.innerHTML = '›';
      nextBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 20px;
        color: #3b82f6;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
      `;
      nextBtn.onclick = () => {
        if (month === 11) {
          month = 0; year++;
        } else {
          month++;
        }
        currentMonth = month; currentYear = year;
        renderCalendar(month, year);
      };
      header.appendChild(nextBtn);

      container.appendChild(header);

      // Weekdays header
      const weekdaysRow = document.createElement('div');
      weekdaysRow.style.cssText = `
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        margin-bottom: 4px;
      `;
      WEEKDAYS.forEach(wd => {
        const wdDiv = document.createElement('div');
        wdDiv.textContent = wd;
        wdDiv.style.cssText = `
          color: #a0aec0;
          font-weight: 600;
          padding: 8px 0;
        `;
        weekdaysRow.appendChild(wdDiv);
      });
      container.appendChild(weekdaysRow);

      // Days grid
      const daysGrid = document.createElement('div');
      daysGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        text-align: center;
      `;

      const firstDay = new Date(year, month, 1).getDay(); // 0=CN
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Fill blanks for first week
      for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.style.height = '36px';
        daysGrid.appendChild(blank);
      }
      
      // Fill days
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = day;
        dayDiv.className = 'calendar-day';
        dayDiv.style.cssText = `
          cursor: pointer;
          height: 36px;
          line-height: 36px;
          border-radius: 50%;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        `;
        
        // Check if this day is today
        const today = new Date();
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        
        // Check if this day is selected
        const isSelected = selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
        
        if (isSelected) {
          dayDiv.style.cssText += `
            background: #2563eb;
            color: #fff;
            font-weight: bold;
            border: 2px solid #2563eb;
          `;
        } else if (isToday) {
          dayDiv.style.cssText += `
            background: #fff;
            color: #2563eb;
            font-weight: normal;
            border: 2px solid #2563eb;
          `;
        } else {
          dayDiv.style.cssText += `
            background: #fff;
            color: #22223b;
            font-weight: normal;
            border: 2px solid transparent;
          `;
        }
        
        dayDiv.onclick = (e) => {
          console.log('Day clicked:', day);
          selectedDate = new Date(year, month, day);
          currentMonth = month;
          currentYear = year;
          renderCalendar(month, year);
          
          // Store selected date globally
          window.selectedCalendarDay = selectedDate;
          
          // Dispatch event for integration
          const event = new CustomEvent('customCalendarDateSelected', { 
            detail: { date: selectedDate } 
          });
          window.dispatchEvent(event);
          
          console.log('Selected date:', selectedDate);
        };
        
        daysGrid.appendChild(dayDiv);
      }
      
      // Fill blanks for last week
      const totalCells = firstDay + daysInMonth;
      const remainingCells = 7 * Math.ceil(totalCells / 7) - totalCells;
      for (let i = 0; i < remainingCells; i++) {
        const blank = document.createElement('div');
        blank.style.height = '36px';
        daysGrid.appendChild(blank);
      }
      
      container.appendChild(daysGrid);
    }

    // Initialize with current month/year
    if (!selectedDate) {
      selectedDate = new Date(currentYear, currentMonth, (new Date()).getDate());
    }
    
    renderCalendar(currentMonth, currentYear);
    console.log('Calendar initialized successfully');

    // Expose selected date getter
    window.getCustomCalendarDate = function() {
      return selectedDate;
    };
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalendar);
  } else {
    initCalendar();
  }
})(); 