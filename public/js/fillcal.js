const Timeslot = require('./Timeslot.js');
const moment = require('../../node_modules/moment');
const fullCalendar = require('../../node_modules/fullcalendar');

const groupID = "";

var userID = "";

var groupCalEvents = [];
var indCalEvents = [];
var combinedCalEvents = [];
$(document).ready(function() {
  // Initialize click handlers
  $('#btnRegister').on('click', registerUser);
  $('#btnSave').on('click', updateIndCal);
  $('#calendar-ind').on('click', renderGroupCal);

  var group = getGroup(groupLink, initCalendars); // groupLink defined in fillcal.jade script tag
});

function initCalendars(group) {
  var calInd = $('#calendar-ind').fullCalendar({
    defaultView: 'agenda',
    selectable: true,   // Users can highlight a timeslot by clicking and dragging
    editable: true,
    unselectAuto: false, // Clicking elsewhere won't cause current selection to be cleared
    displayEventTime : false,
    visibleRange: {
      start: moment(group.startDate).startOf("day"),
      end: moment(group.endDate).add(1, 'days')
    },

    // Newly dragged events will persist
    select: function(start, end, allDay) {
      calInd.fullCalendar('renderEvent',
        {
          title: "",
          start: start,
          end: end,
          allDay: false
        },
        true
      );
    },

    // Clicking on event will trigger event deletion prompt
    eventClick: function(calEvent, jsEvent, view) {
      $(this).css('border-color', 'red');
      setTimeout(deleteEvent, 100, calEvent, this);
    }
  })

  $('#calendar-group').fullCalendar({
    defaultView: 'agenda',
    displayEventTime : false,
    visibleRange: {
      start: moment(group.startDate).startOf("day"),
      end: moment(group.endDate).add(1, 'days')
    },
  })

  initOauth(group.startDate, group.endDate);
}


function deleteEvent(event, cssObject) {
  var confirmed = confirm("Do you want to delete this event?");
  if (confirmed) {
    $('#calendar-ind').fullCalendar('removeEvents', event._id);
  }
  $(cssObject).css('border-color', 'transparent');
}

function getGroup(groupLink, callback) {
  $.ajax({
    type: 'GET',
    url: 'groups/link/' + groupLink,
    dataType: 'JSON',
    error: function(xhr, ajaxOptions, thrownError) {
      if (xhr.status == 400)
        alert("No group with input link.");
    },
    success: function(group) {
      callback(group);
      return group;
    }
  });
}

// Update the user's calendar in the database
function updateIndCal() {
  let calendar = serializeCalEvents();

  $.ajax({
    type: 'PATCH',
    url: '../users/' + window.userID + '/cal',
    data:
    {
      calendar: JSON.stringify(calendar),
    }
  });
}

// Transform FullCalendar events into dictionary
function serializeCalEvents() {
  let dict = {}
  indCalEvents.forEach(function(calEvent) {
    // Split event into 30 minute timeslots
    let currentTime = moment(calEvent.start);
    while (currentTime.isBefore(moment(calEvent.end))) {
      let timeslotStart = currentTime.format();
      let timeslotEnd = currentTime.add(30, 'minutes').format();
      let t = new Timeslot("", timeslotStart, timeslotEnd, ["Current"]);
      dict[timeslotStart] = t;
    }
  });
  return dict;
}

// Transform dictionary into array of FullCaelndar events
function deserializeCalEvents(calDict, callback) {
  let events = [];

  for (var key in calDict) {
    // Make Event Object
    var timeslot = calDict[key];

    var eventObj = {};
    eventObj.title = timeslot.title;
    eventObj.start = timeslot.startTime;
    eventObj.endTime = timeslot.endTime;

    events.push(eventObj);
  }

  // Save globally
  groupCalEvents = events;

  callback();
  return events;
}

// Registers new user for the current group, based on input fields
function registerUser() {
  var name = document.getElementById('inputUsername').value;
  var password = document.getElementById('inputPassword').value;

  if (inputEmpty(name)) {
    alert("Please enter your name.");
  } else {
    // Check if existing user
    $.post(
      '../users',
      {
        username: name,
        password: password,
        groupID: groupID,
        calendar: "{}",
      }, function(data, status) {
        // Save newly created user ID to global variable
        window.userID = data._id;
      });
  }
}

function inputEmpty(username) {
  return username == "";
}

// Parse gCal events to FullCalendar events
function parseGCal(startDate, endDate) {
  return gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'timeMin': startDate,
    'timeMax': endDate,
    'showDeleted': false,
    'singleEvents': true,
    'orderBy': 'startTime',
    'maxResults': 50,
  }).then(function(response) {
    var events = response.result.items;

    var event_list = [];
    if (events.length > 0) {
      for (i = 0; i < events.length; i++) {
        // Make Event Object
        var event = events[i];

        var eventObj = {};
        eventObj.title = event.summary;
          // All-day events from Gcal
        if (event.start.dateTime == null) {
          eventObj.allDay = true;
          eventObj.start = event.start.date;
          eventObj.end = event.end.date;
        } else {
          eventObj.allDay = false;
          eventObj.start = event.start.dateTime;
          eventObj.end = event.end.dateTime;
        }

        event_list.push(eventObj);
      }
    }

    renderGroupCal();

    return event_list;
  });
}

// Parse group calendar data from database to fillcal events
function parseGroupEvents(events) {
    var parsedCal = [];

    for (i = 0; i < events.length; i++) {
      // Make Event Object
      var eventObj = {};
      eventObj.title = '';
        // All-day events from Gcal
      if (events[i].startTime == null) {
        eventObj.allDay = true;
      } else {
        eventObj.allDay = false;
      }

      eventObj.start = events[i].startTime;
      eventObj.end = events[i].endTime;

      parsedCal.push(eventObj);
    }

    return parsedCal;

}

// Parse events from clientEvents function to fillcal events
function parseClientEvents(events) {
  var parsedCal = [];

  for (i = 0; i < events.length; i++) {
    // Make Event Object
    var eventObj = {};
    eventObj.title = '';

    if (events[i].allDay == true) {
      eventObj.allDay = true;
    } else {
      eventObj.allDay = false;
    }

    eventObj.start = events[i].start._i;
    eventObj.end = events[i].end._i;
    parsedCal.push(eventObj);
  }

  return parsedCal;

}
// Combine individual and group events and render on right calendar
function renderGroupCal() {
  // Want the newly created event to show up on the individual calendar, before parseClientEvents tries to grab it to display on group calendar
  setTimeout(renderGroupCalHelper, 300);
}


// Callback function for renderGroupCal
function renderGroupCalHelper() {
  indCalEvents = parseClientEvents($('#calendar-ind').fullCalendar('clientEvents'));
  var combinedCal = groupCalEvents.concat(indCalEvents);
  $('#calendar-group').fullCalendar( 'removeEvents');
  $('#calendar-group').fullCalendar( 'renderEvents', combinedCal, true);
}


/**************** OAUTH *****************************/

	// Client ID and API key from the Developer Console
	var CLIENT_ID = '482233491751-ds1dm3a9mtd69mesprcthn470mjn6tq8.apps.googleusercontent.com';

	// Array of API discovery doc URLs for APIs used by the quickstart
	var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

	// Authorization scopes required by the API; multiple scopes can be
	// included, separated by spaces.
	var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

	var authorizeButton = document.getElementById('authorize-button');
	var signoutButton = document.getElementById('signout-button');

	function initOauth(startDate, endDate) {
	  gapi.load('client:auth2', function() {
      initClient(startDate, endDate);
    });
	}

	/**
	 *  Initializes the API client library and sets up sign-in state
	 *  listeners.
	 */
	function initClient(startDate, endDate) {
	  gapi.client.init({
	    discoveryDocs: DISCOVERY_DOCS,
	    clientId: CLIENT_ID,
	    scope: SCOPES
    }).then(function () {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(function(signinStatus) {
        updateSigninStatus(signinStatus, startDate, endDate);
      });

      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get(), startDate, endDate);
      authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
	  });
	}

	/**
	 *  Called when the signed in status changes, to update the UI
	 *  appropriately. After a sign-in, the API is called.
	 */


function updateSigninStatus(isSignedIn, startDate, endDate) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    parseGCal(startDate, endDate).then(function(event_list) {
      // Save gCal events to global var
      window.indCalEvents = event_list;
      //if you re-authorize, removes all current events
      $('#calendar-ind').fullCalendar( 'removeEvents');
      $('#calendar-ind').fullCalendar( 'renderEvents', event_list, true);
    });
    return true;
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
    return false;
  }
}

	/**
	 *  Sign in the user upon button click.
	 */
	function handleAuthClick(event) {
	  gapi.auth2.getAuthInstance().signIn();
	}

	/**
	 *  Sign out the user upon button click.
	 */
	function handleSignoutClick(event) {
	  gapi.auth2.getAuthInstance().signOut();
	}
