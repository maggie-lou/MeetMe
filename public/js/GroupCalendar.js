const Rainbow = require('../../node_modules/rainbowvis.js');
const Utils = require('../../helpers/utils');

function GroupCalendar(id, calendar, size, startDate, endDate, minTime, maxTime) {
  this.id = id;
  this.size = size;
  this.startDate = startDate;
  this.endDate = endDate;
  this.minTime = minTime;
  this.maxTime = maxTime;

  this.cal = calendar; // Dictionary of start time to calendar event object for full group (including current user)
  this.events= null; // List of FullCalendar events, parsed from current calendar dictionary

  this.participants = null;
}

// Returns all current users in a group
GroupCalendar.prototype.getParticipants = function getParticipants(callback) {
  if (this.participants != null) {
    callback(this.participants);
  } else {
    let calendar = this;
    $.ajax({
      type: 'GET',
      url: 'users/group/' + this.id,
      dataType: 'JSON',
      success: function(users) {
        let usernames = users.map(user => user.username);
        calendar.participants = usernames;
        callback(this.participants);
      }
    });
  }
}

// Lazily computes and caches list of FullCalendar events for active group calendar
GroupCalendar.prototype.getEvents = function getEvents() {
  if (this.events!= null) return this.events;

  this.events = deserializeCalendar(this.cal, this.size);
  return this.events;
}

// Transforms dictionary of calendar events to array of FullCalendar events
function deserializeCalendar(calDict, groupSize) {
  let events = [];

  if (groupSize > 0) {
    var rainbow = new Rainbow();
    rainbow.setNumberRange(0, groupSize);
    rainbow.setSpectrum('#9eeaff', '#1c7c96');

    for (var key in calDict) {
      // Make Event Object
      var timeslot = calDict[key];

      var eventObj = {};
      eventObj.title = `${timeslot.busyPeople.length}/ ${groupSize} ✘`
      eventObj.start = timeslot.startTime;
      eventObj.end = timeslot.endTime;
      eventObj.color = "#" + rainbow.colourAt(timeslot.busyPeople.length);

      events.push(eventObj);
    }
  }
  return events;
}


GroupCalendar.prototype.updateCal = function updateCal(cal) {
  this.cal = cal;
  this.events = null; // Clear cache
}

module.exports = GroupCalendar;
