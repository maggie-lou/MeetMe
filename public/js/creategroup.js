window.$ = require('jquery');
const datepicker = require('../../node_modules/js-datepicker');
const datepickerCSS = require('../../node_modules/js-datepicker/dist/datepicker.min.css');
const timepicker = require('../../node_modules/timepicker');
const timepickerCSS = require('../../node_modules/timepicker/jquery.timepicker.css');
const moment = require('../../node_modules/moment');
const fullCalendar = require('../../node_modules/fullcalendar');

const baseAPI = "localhost:3000/"

$(document).ready(function() {
  $('#calendar').fullCalendar({
    defaultView: 'agenda',
    minTime: "9:00",
    maxTime: "17:00",
    allDaySlot: false,
    contentHeight: 'auto',
    visibleRange: {
      start: moment(new Date()).startOf('day'),
      end: moment(new Date()).add(7, 'days')
    },
    firstDay: (new Date()).getDay(),
    header: {
      left: 'title',
      center: '',
      right: ''
    },
  });

  initDatepickers();
  initTimepickers();

  // Create new group
  document.getElementById("create-button").onclick = function() {
    var eventName = document.getElementById('name-input').value;

    if (inputEmpty(startDate, endDate, eventName)) {
      alert("Please fill in all the necessary fields");
    } else if (invalidDates(startDate, endDate)) {
      alert("The start date must be earlier than the end date. Please re-select valid dates.");
    } else if (invalidTimes(minTime, maxTime)) {
      alert("The start time must be earlier than the end time. Please re-select valid times.");
    } else {
      $.post(
        '../groups',
        {
          name: eventName,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          minTime: minTime,
          maxTime: maxTime,
        }, function(data, status) {
          // Route to group calendar page
          window.location.assign('/' + data.link);
        });
    }
  }
});

function initTimepickers() {
  $('#time-picker-1').timepicker();
  $('#time-picker-2').timepicker();

  let defaultStart = new Date();
  defaultStart.setHours(9,0,0);
  let defaultEnd = new Date();
  defaultEnd.setHours(17,0,0);
  $('#time-picker-1').timepicker('setTime', defaultStart);
  $('#time-picker-2').timepicker('setTime', defaultEnd);

  $('#time-picker-1').change(function() {
    let minTime = moment($('#time-picker-1').timepicker('getTime', new Date())).format('HH:mm');
    $('#calendar').fullCalendar('option', 'minTime', minTime);
  });
  $('#time-picker-2').change(function() {
    let maxTime = moment($('#time-picker-2').timepicker('getTime', new Date())).format('HH:mm');
    $('#calendar').fullCalendar('option', 'maxTime', maxTime);
  });


}

function initDatepickers() {
  let startDate = moment(new Date()).startOf('day');
  let endDate = startDate.clone();
  endDate.add(6, 'days');

  const picker1 = datepicker('#date-picker-1', {
    onSelect: (instance, date) => {
      startDate = moment(date).startOf('day');
      $('#calendar').fullCalendar('option', 'visibleRange', {
        start: startDate,
        end: endDate.clone().add(1, 'days')
      });
      $('#calendar').fullCalendar('option', 'firstDay', startDate.day());
    }
  });
  picker1.setDate(startDate, true);

  const picker2 = datepicker('#date-picker-2', {
    onSelect: (instance, date) => {
      endDate = moment(date).startOf('day');
      $('#calendar').fullCalendar('option', 'visibleRange', {
        start: startDate,
        end: endDate.clone().add(1, 'days')
      });
    }
  });
  picker2.setDate(endDate, true);
}

function inputEmpty(startDate, endDate, eventName) {
  return startDate == "" || endDate == "" || eventName == "";
}

function invalidDates(startDate, endDate) {
  return startDate.isAfter(endDate);
}

function invalidTimes(startTime, endTime) {
  return moment(startTime, ['h:m']).isAfter(moment(endTime, ['h:m']));
}
