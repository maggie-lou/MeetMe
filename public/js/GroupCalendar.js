const Rainbow = require('../../node_modules/rainbowvis.js');
const Utils = require('../../helpers/utils');

function GroupCalendar(id, calendar, size, startDate, endDate, minTime, maxTime) {
  this.id = id;
  this.size = size;
  this.startDate = startDate;
  this.endDate = endDate;
  this.minTime = minTime;
  this.maxTime = maxTime;

  this.calFull = calendar; // Dictionary of start time to calendar event object for full group (including current user)
  this.calCurrentUserRemoved; // Dictionary of start time to calendar event object for  group excluding current user
  this.fullCalActive = true;

  this.eventsFull = null; // List of FullCalendar events, parsed from current calendar dictionary
  this.eventsCurrentUserRemoved = null;
}

// Lazily computes and caches list of FullCalendar events for active group calendar
GroupCalendar.prototype.getEvents = function getEvents() {
  let events;
  if (this.fullCalActive) {
    if (this.eventsFull != null) return this.eventsFull;
    events = deserializeCalendar(this.calFull, this.size);
    this.eventsFull = events;
  } else {
    if (this.eventsCurrentUserRemoved != null) return this.eventsCurrentUserRemoved;
    events = deserializeCalendar(this.calCurrentUserRemoved, this.size);
    this.eventsCurrentUserRemoved = events;
  }
  return events;
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
      eventObj.title = timeslot.title;
      eventObj.start = timeslot.startTime;
      eventObj.end = timeslot.endTime;
      eventObj.color = "#" + rainbow.colourAt(timeslot.busyPeople.length);

      events.push(eventObj);
    }
  }
  return events;
}


// Removes given user's events from the group calendar.
// Used so that the group calendar events can be displayed separately from the individual events.
GroupCalendar.prototype.removeUser = function removeUser(username) {
  this.calCurrentUserRemoved = Utils.clone(this.calFull);
  let timesToRemove = []

  for (var time in this.calCurrentUserRemoved) {
    let calEvent = this.calCurrentUserRemoved[time];
    let busyPeople = calEvent.busyPeople;
    if ($.inArray(username, busyPeople) != -1) {
      if (busyPeople.length == 1) {
        timesToRemove.push(time);
      } else {
        busyPeople = busyPeople.filter(function(name) {
          let a= name != username;
          return a;
        });
        calEvent.busyPeople = busyPeople;
        this.calCurrentUserRemoved[time] = calEvent;
      }
    }
  }

  for (var i in timesToRemove) {
    let time = timesToRemove[i];
    delete this.calCurrentUserRemoved[time];
  }
}

GroupCalendar.prototype.updateFullCal = function updateFullCal(cal) {
  this.calFull = cal;
  this.eventsFull = null;
}

GroupCalendar.prototype.getActiveCal = function getActiveCal() {
  if (this.fullCalActive) return this.calFull;
  return this.calCurrentUserRemoved;
}

GroupCalendar.prototype.setActiveCalFull = function setActiveCalFull() {
  if (!this.fullCalActive) {
    this.fullCalActive = true;
    this.size++; // Include current user in group size
  }
}

GroupCalendar.prototype.setActiveCalPartial = function setActiveCalPartial() {
  if (this.fullCalActive) {
    this.fullCalActive = false;
    this.size--; // Exclude current user from group size
  }
}

module.exports = GroupCalendar;
