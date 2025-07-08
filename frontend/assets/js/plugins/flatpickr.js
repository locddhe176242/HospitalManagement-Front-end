// Vietnamese locale for flatpickr
const Vietnamese = {
  weekdays: {
    shorthand: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    longhand: [
      'Chủ nhật',
      'Thứ hai',
      'Thứ ba',
      'Thứ tư',
      'Thứ năm',
      'Thứ sáu',
      'Thứ bảy'
    ]
  },
  months: {
    shorthand: [
      'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6',
      'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'
    ],
    longhand: [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
      'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
      'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ]
  },
  daysInMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  firstDayOfWeek: 0,
  ordinal: function () {
    return '';
  },
  rangeSeparator: ' đến ',
  weekAbbreviation: 'Tuần',
  scrollTitle: 'Cuộn để tăng',
  toggleTitle: 'Click để chuyển đổi',
  amPM: ['SA', 'CH'],
  yearAriaLabel: 'Năm',
  time_24hr: true
};

const datetime = document.querySelectorAll('.flatpickr_datetime')
Array.from(datetime, (elem) => {
  if(typeof flatpickr !== typeof undefined) {
    flatpickr(elem, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        locale: Vietnamese
    })
  }
}) 
const humandate = document.querySelectorAll('.flatpickr_humandate')
Array.from(humandate, (elem) => {
  if(typeof flatpickr !== typeof undefined) {
    flatpickr(elem, {
      altInput: true,
      altFormat: "d F, Y",
      dateFormat: "Y-m-d",
      locale: Vietnamese
  })
  }
}) 
const minDate = document.querySelectorAll('.flatpickr_minDate')
Array.from(minDate, (elem) => {
  if(typeof flatpickr !== typeof undefined) {
    flatpickr(elem, {
      minDate: "2020-01",
      locale: Vietnamese
  }
  )
  }
})
const maxDate = document.querySelectorAll('.flatpickr_maxDate')
Array.from(maxDate, (elem) => {
  if(typeof flatpickr !== typeof undefined) {
    flatpickr(elem,{
      dateFormat: "d.m.Y",
      maxDate: "15.12.2017",
      locale: Vietnamese
  }
  
  )
  }
})
const specificdisable = document.querySelectorAll('.flatpickr_specificdisable')
Array.from(specificdisable, (elem) => {
  if(typeof flatpickr !== typeof undefined) {
    flatpickr(elem ,
      {
        disable: ["2025-01-30", "2025-02-21", "2025-03-08", new Date(2025, 4, 9) ],
        dateFormat: "Y-m-d",
        locale: Vietnamese
    }
  )
  }
})


const disableexcept = document.querySelectorAll('.flatpickr_disableexcept')
Array.from(disableexcept, (elem) => {
  if(typeof flatpickr !== typeof undefined) {
    flatpickr(elem , {
      enable: ["2025-03-30", "2025-05-21", "2025-06-08", new Date(2025, 8, 9) ],
      locale: Vietnamese
  }
      
  )
  }
})
const multidate = document.querySelectorAll('.flatpickr_multidate')
Array.from(multidate, (elem) => {
  if(typeof flatpickr !== typeof undefined) {
    flatpickr(elem , {
      mode: "multiple",
      dateFormat: "Y-m-d",
      locale: Vietnamese
  }
      
  )
  }
})


const range = document.querySelectorAll('.flatpickrrange')
Array.from(range, (elem) => {
  if(typeof flatpickr !== typeof undefined) {
    flatpickr(elem, {
      mode: "range",
      minDate: "today",
      dateFormat: "Y-m-d",
      locale: Vietnamese
    })
  }
})
const date= document.querySelectorAll('.flatpickrdate')
Array.from(date, (elem) => {
  if(typeof flatpickr !== typeof undefined) {
    flatpickr(elem, {
      dateFormat: "d/m/Y",
      locale: Vietnamese
    })
  }
})

const time = document.querySelectorAll('.flatpickrtime')
Array.from(time, (elem) => {
  if(typeof flatpickr !== typeof undefined) {
    flatpickr(elem, {
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      locale: Vietnamese
    })
  }
}) 

const inline = document.querySelectorAll('.inline_flatpickr')
Array.from(inline, (elem) => {
  if(typeof flatpickr !== typeof undefined) {
    flatpickr(elem, {
      inline: true,
      locale: Vietnamese,
      firstDayOfWeek: 0
    })
  }
}) 

const calendarInline = document.getElementById('calendar-inline');
if (calendarInline && typeof flatpickr !== typeof undefined) {
  flatpickr(calendarInline, {
    inline: true,
    dateFormat: "d/m/Y",
    locale: Vietnamese
  });
}

// Sau khi render, tách các thứ thành 7 span con để căn đều
setTimeout(() => {
  const weekdays = calendarInline.querySelector('.flatpickr-weekdays');
  if (weekdays && weekdays.children.length === 1) {
    const text = weekdays.children[0].textContent;
    if (text && text.length === 14) { // "CNT2T3T4T5T6T7"
      weekdays.innerHTML = '';
      for (let i = 0; i < 7; i++) {
        const span = document.createElement('span');
        span.className = 'flatpickr-weekday';
        span.textContent = text.slice(i * 2, i * 2 + 2);
        weekdays.appendChild(span);
      }
    }
  }
}, 100);

if (window.flatpickr) {
  window.flatpickr.l10ns.vi = {
    weekdays: {
      shorthand: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
      longhand: [
        'Chủ nhật',
        'Thứ hai',
        'Thứ ba',
        'Thứ tư',
        'Thứ năm',
        'Thứ sáu',
        'Thứ bảy'
      ]
    },
    months: Vietnamese.months,
    daysInMonth: Vietnamese.daysInMonth,
    firstDayOfWeek: 0,
    ordinal: Vietnamese.ordinal,
    rangeSeparator: Vietnamese.rangeSeparator,
    weekAbbreviation: Vietnamese.weekAbbreviation,
    scrollTitle: Vietnamese.scrollTitle,
    toggleTitle: Vietnamese.toggleTitle,
    amPM: Vietnamese.amPM,
    yearAriaLabel: Vietnamese.yearAriaLabel,
    time_24hr: true
  };
} 


