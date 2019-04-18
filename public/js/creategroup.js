window.$ = require('jquery');
const datepicker = require('../../node_modules/js-datepicker');
const datepickerCSS = require('../../node_modules/js-datepicker/dist/datepicker.min.css');
const moment = require('../../node_modules/moment');
const fullCalendar = require('../../node_modules/fullcalendar');

const baseAPI = "localhost:3000/"

$(document).ready(function() {
  $('#calendar').fullCalendar({
    defaultView: 'agendaWeek',
  });

  var startDate = "";
  var endDate = "";
  const picker1 = datepicker('.date-picker-1', {
    onSelect: (instance, date) => {
      startDate = moment(date).toISOString();
    }
  });
  const picker2 = datepicker('.date-picker-2', {
    onSelect: (instance, date) => {
      endDate = moment(date).toISOString();
    }
  });

  document.getElementById("create").onclick = function() {
    var eventName = document.getElementById('inputEventName').value;

    if (inputEmpty(startDate, endDate, eventName, link)) {
      alert("Please fill in all the necessary fields");
    } else {
      $.post(
        '../groups',
        {
          name: eventName,
          startDate: startDate,
          endDate: endDate,
        }, function(data, status) {
          // Route to group calendar page
          window.location.assign('/' + data.link);
        });
    }
  }
});

function inputEmpty(startDate, endDate, eventName, link) {
  return startDate == "" || endDate == "" || eventName == "" || link == "";
}

