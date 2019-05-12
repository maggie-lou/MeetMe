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
    defaultView: 'agendaWeek',
  });

  // Initialize date/time pickers
  var startDate = "";
  var endDate = "";
  const picker1 = datepicker('.date-picker-1', {
    onSelect: (instance, date) => {
      startDate = moment(date);
    }
  });
  const picker2 = datepicker('.date-picker-2', {
    onSelect: (instance, date) => {
      endDate = moment(date);
    }
  });

  $('#time-picker-1').timepicker();
  $('#time-picker-2').timepicker();
  let defaultStart = new Date();
  defaultStart.setHours(9,0,0);
  let defaultEnd = new Date();
  defaultEnd.setHours(17,0,0);
  $('#time-picker-1').timepicker('setTime', defaultStart);
  $('#time-picker-2').timepicker('setTime', defaultEnd);

  // Create new group
  document.getElementById("create-button").onclick = function() {
    var eventName = document.getElementById('name-input').value;
    var startTime = moment($('#time-picker-1').timepicker('getTime', new Date())).format('HH:mm');
    var endTime = moment($('#time-picker-2').timepicker('getTime', new Date())).format('HH:mm');

    if (inputEmpty(startDate, endDate, eventName)) {
      alert("Please fill in all the necessary fields");
    } else if (invalidDates(startDate, endDate)) {
      alert("The start date must be earlier than the end date. Please re-select valid dates.");
    } else if (invalidTimes(startTime, endTime)) {
      alert("The start time must be earlier than the end time. Please re-select valid times.");
    } else {
      $.post(
        '../groups',
        {
          name: eventName,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          minTime: startTime,
          maxTime: endTime,
        }, function(data, status) {
          // Route to group calendar page
          window.location.assign('/' + data.link);
        });
    }
  }
});

function inputEmpty(startDate, endDate, eventName) {
  return startDate == "" || endDate == "" || eventName == "";
}

function invalidDates(startDate, endDate) {
  return startDate.isAfter(endDate);
}

function invalidTimes(startTime, endTime) {
  return moment(startTime, ['h:m']).isAfter(moment(endTime, ['h:m']));
}
