window.$ = require('jquery');
const datepicker = require('../../node_modules/js-datepicker');
const datepickerCSS = require('../../node_modules/js-datepicker/dist/datepicker.min.css');
const timepicker = require('../../node_modules/timepicker');
const timepickerCSS = require('../../node_modules/timepicker/jquery.timepicker.css');
const moment = require('../../node_modules/moment');
const fullCalendar = require('../../node_modules/fullcalendar');

$(document).ready(function() {

  let minTime = new Date();
  minTime.setHours(9,0,0);
  let maxTime = new Date();
  maxTime.setHours(17,0,0);
  var times = {
    minTime: moment(minTime).format("H:mm"),
    maxTime: moment(maxTime).format("H:mm")
  };

  let startDate = moment(new Date()).startOf('day');
  let endDate = startDate.clone();
  endDate.add(6, 'days');
  var dates = {
    startDate: startDate,
    endDate: endDate
  };

  initCalendar(dates, times);
  initDatepickers(dates);
  initTimepickers(times);

  document.getElementById("create-button").onclick = function() {
    var eventName = document.getElementById('name-input').value;

    if (inputEmpty(eventName)) {
      alert("Please fill in an event name.");
    } else {
      $.post(
        '../groups',
        {
          name: eventName,
          startDate: dates.startDate.toISOString(),
          endDate: dates.endDate.toISOString(),
          minTime: times.minTime,
          maxTime: times.maxTime
        }, function(data, status) {
          // Route to group calendar page
          window.location.assign('/' + data.link);
        });
    }
  }
});

function initCalendar(dates, times) {
  $('#calendar').fullCalendar({
    defaultView: 'agenda',
    minTime: times.minTime,
    maxTime: times.maxTime,
    allDaySlot: false,
    contentHeight: 'auto',
    visibleRange: {
      start: dates.startDate,
      end: dates.endDate.clone().add(1, 'days')
    },
    firstDay: dates.startDate.day(),
    header: {
      left: '',
      center: '',
      right: ''
    },
    columnFormat: 'ddd M/D',
  });
}

function initTimepickers(times) {
  $('#time-picker-1').timepicker();
  $('#time-picker-2').timepicker();

  $('#time-picker-1').timepicker('setTime', times.minTime);
  $('#time-picker-2').timepicker('setTime', times.maxTime);

  $('#time-picker-1').change(function() {
    let prev = times.minTime;
    times.minTime = moment($('#time-picker-1').timepicker('getTime', new Date())).format('HH:mm');

    if (invalidTimes(times.minTime, times.maxTime)) {
      $('#time-picker-1').timepicker('setTime', prev);
      times.minTime = prev;
      alert("The start time must be earlier than the end time. Please re-select valid times.");
    } else {
      $('#calendar').fullCalendar('option', 'minTime', times.minTime);
    }
  });
  $('#time-picker-2').change(function() {
    let prev = times.maxTime;
    times.maxTime = moment($('#time-picker-2').timepicker('getTime', new Date())).format('HH:mm');
    if (invalidTimes(times.minTime, times.maxTime)) {
      $('#time-picker-2').timepicker('setTime', prev);
      times.maxTime = prev;
      alert("The start time must be earlier than the end time. Please re-select valid times.");
    } else {
      $('#calendar').fullCalendar('option', 'maxTime', times.maxTime);
    }
  });


}

function initDatepickers(dates) {
  const picker1 = datepicker('#date-picker-1', {
    onSelect: (instance, date) => {
      var previous = dates.startDate;
      dates.startDate = moment(date).startOf('day');

      if (invalidDates(dates.startDate, dates.endDate)) {
        let eventDuration = Math.abs(previous.diff(dates.endDate, 'days'));
        dates.endDate = dates.startDate.clone();
        dates.endDate.add(eventDuration, 'days');
        picker2.setDate(dates.endDate, true);
      }

      $('#calendar').fullCalendar('option', 'visibleRange', {
        start: dates.startDate,
        end: dates.endDate.clone().add(1, 'days')
      });
      $('#calendar').fullCalendar('option', 'firstDay', dates.startDate.day());
    }
  });
  picker1.setDate(dates.startDate, true);

  const picker2 = datepicker('#date-picker-2', {
    onSelect: (instance, date) => {
      var previous = dates.endDate;
      dates.endDate = moment(date).startOf('day');
      if (invalidDates(dates.startDate, dates.endDate)) {
        picker2.setDate(previous, true);
        dates.endDate = previous;
        alert("The start date must be earlier than the end date. Please re-select valid dates.");
      } else {
        $('#calendar').fullCalendar('option', 'visibleRange', {
          start: dates.startDate,
          end: dates.endDate.clone().add(1, 'days')
        });
      }
    }
  });
  picker2.setDate(dates.endDate, true);
}

function inputEmpty(eventName) {
  return eventName == "";
}

function invalidDates(startDate, endDate) {
  return startDate.isAfter(endDate);
}

function invalidTimes(startTime, endTime) {
  return moment(startTime, ['h:m']).isAfter(moment(endTime, ['h:m']));
}
