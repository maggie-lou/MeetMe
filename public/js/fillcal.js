window.$ = require('jquery');
const Timeslot = require('./Timeslot.js');
const moment = require('../../node_modules/moment');
const fullCalendar = require('../../node_modules/fullcalendar');
const Rainbow = require('../../node_modules/rainbowvis.js');
require('../../node_modules/bootstrap');

var currentUserName;
var currentUserID;

var unsavedChanges = false;

$(document).ready(function() {

  // Warn user before leaving page
  window.onbeforeunload = confirmExit;

  getGroup(groupLink, function(group) { // groupLink defined in fillcal.jade script tag
    let groupCalDict = JSON.parse(group.calendar);
    let groupCalEvents = deserializeGroupCalEvents(groupCalDict, group.size);

    initCalendars(group, groupCalEvents, groupCalDict);

    let indCalEvents = parseClientEvents($('#calendar-ind').fullCalendar('clientEvents'));
    renderGroupCal(indCalEvents, groupCalEvents);

    // Initialize click handlers
    $('#btnRegister').on('click', function() {
      let numNewUsers = registerUser(group._id, groupCalEvents, group.size);
      group.size += numNewUsers;
    });
    $('#btnSave').on('click', function() {
      saveCalendars(group._id, groupCalDict, group.size);
    });
    $('#calendar-ind').on('click', function() {
      indCalEvents = parseClientEvents($('#calendar-ind').fullCalendar('clientEvents'));
      renderGroupCal(indCalEvents, groupCalEvents);
    });

  });
});

function initCalendars(group, groupCalEvents, groupCalDict) {
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
    },

    // Editing size of pre-existing event will update group calendar
    eventResize: function(info) {
      let indCalEvents = parseClientEvents($('#calendar-ind').fullCalendar('clientEvents'));
      renderGroupCal(indCalEvents, groupCalEvents);
    }
  })

  $('#calendar-group').fullCalendar({
    defaultView: 'agenda',
    displayEventTime : false,
    visibleRange: {
      start: moment(group.startDate).startOf("day"),
      end: moment(group.endDate).add(1, 'days')
    },

    // Hovering on event will show names of busy people
    eventMouseover: function(calEvent, jsEvent, view) {
      if (!isIndividualEvent(calEvent)) {
        let busyPeople = groupCalDict[calEvent.start.format()].busyPeople;
        var tooltip = '<div class="tooltipevent">' + busyPeople + '</div>';
        var $tooltip = $(tooltip).appendTo('body');

        $(this).mouseover(function(e) {
          $(this).css('z-index', 10000);
          $tooltip.fadeIn('500');
          $tooltip.fadeTo('10', 1.9);
        }).mousemove(function(e) {
          $tooltip.css('top', e.pageY + 10);
          $tooltip.css('left', e.pageX + 20);
        });
      }
    },

    // Remove busy people overview when hovering ends
    eventMouseout: function(calEvent, jsEvent) {
      $(this).css('z-index', 8);
      $('.tooltipevent').remove();
    },
  })

  initOauth(group.startDate, group.endDate, groupCalEvents);
}

function isIndividualEvent(calEvent) {
  return calEvent.color == "tomato";
}

function confirmExit() {
  if (window.unsavedChanges) {
    return "You have unsaved changes on your calendar. If you wish to save them, please select 'Save Calendar' at the left bottom of the page.";
  } else {
    return null; // Only alert user if unsaved changes
  }
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
      window.group = group;
      callback(group);
      return group;
    }
  });
}

// Update the user and group's calendar in the database
function saveCalendars(groupID, groupCalDict, groupSize) {
  let indCalEvents = parseClientEvents($('#calendar-ind').fullCalendar('clientEvents'));
  let indCalDict = serializeCalEvents(indCalEvents);

  let combinedCalDict = combineIndGroupCalendars(indCalDict, groupCalDict);

  $.ajax({
    type: 'PATCH',
    url: '../users/' + window.currentUserID + '/cal',
    data:
    {
      calendar: JSON.stringify(indCalDict),
    },
    success: function(response) {
      window.unsavedChanges = false;
    }
  }).done(function() {
    $.ajax({
      type: 'PATCH',
      url: '../groups/' + groupID + '/cal',
      data:
      {
        calendar: JSON.stringify(combinedCalDict),
      },
      success: function() {
        document.getElementById('savedPopup').style.display = 'block';
        setTimeout(
          function() {
            document.getElementById('savedPopup').style.display = 'none';
          },
          2500
        );

        // Re-render group cal
        let groupCalEvents = deserializeGroupCalEvents(combinedCalDict, groupSize);
        renderGroupCal([], groupCalEvents);
      }
    });
  });
}

// Combine dictionaries representing individual and group calendars into a single group calendar dictionary
function combineIndGroupCalendars(indCalDict, groupCalDict) {
  for (let key in indCalDict) {
    let timeslot;
    if (key in groupCalDict) {
      timeslot = groupCalDict[key];
      timeslot.busyPeople.push(window.currentUserName);
    } else {
      timeslot = indCalDict[key];
    }
    groupCalDict[key] = timeslot;
  }
  return groupCalDict;
}

// Transform FullCalendar events into dictionary, where key is start time and value is calendar event
// Split each event into 30 minute intervals
function serializeCalEvents() {
  let dict = {}
  let indCalEvents = parseClientEvents($('#calendar-ind').fullCalendar('clientEvents'));
  indCalEvents.forEach(function(calEvent) {
    // Split event into 30 minute timeslots
    let currentTime = moment(calEvent.start);
    while (currentTime.isBefore(moment(calEvent.end))) {
      let timeslotStart = currentTime.format();
      let timeslotEnd = currentTime.add(30, 'minutes').format();
      let t = new Timeslot("", timeslotStart, timeslotEnd, [window.currentUserName]);
      dict[timeslotStart] = t;
    }
  });
  return dict;
}

// Transform dictionary into array of FullCalendar events
function deserializeIndCalEvents(calDict) {
  let events = [];

  for (var key in calDict) {
    // Make Event Object
    var timeslot = calDict[key];

    var eventObj = {};
    eventObj.title = timeslot.title;
    eventObj.start = timeslot.startTime;
    eventObj.end = timeslot.endTime;
    eventObj.color = "tomato";

    events.push(eventObj);
  }

  return events;
}


// Transform dictionary into array of FullCalendar events
function deserializeGroupCalEvents(calDict, groupSize) {
  let events = [];

  if (groupSize > 0) {
    var rainbow = new Rainbow();
    rainbow.setNumberRange(0, groupSize);
    rainbow.setSpectrum('lightskyblue', 'navy');

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

// Registers new user for the current group, based on input fields
// Returns number of new users created
function registerUser(groupID, groupCalEvents, prevGroupSize) {
  var name = document.getElementById('inputUsername').value;
  var password = document.getElementById('inputPassword').value;

  if (inputEmpty(name)) {
    alert("Please enter your name.");
    return 0;
  } else {
    // Check if existing user
    $.post(
      '../users',
      {
        username: name,
        password: password,
        groupID: groupID,
        calendar: "{}",
      }, function(data, status, xhr) {
        $('#register-pane').css({ 'display': 'none' });
        $('#ind-cal-pane').css({ 'display': 'inherit' });

        // Save newly created user data to global variable
        window.currentUserID = data._id;
        window.currentUserName = name;

        let indCalDict = JSON.parse(data.calendar);
        let indCalEvents = deserializeIndCalEvents(indCalDict);
        renderIndCal(indCalEvents, groupCalEvents);

        if (newUserCreated(xhr.status)) {
          $.ajax({
            type: 'PATCH',
            url: '../groups/' + groupID + '/size',
            data:
            {
              size: prevGroupSize + 1
            }
          });
          return 1;
        } else {
          return 0;
        }
      }).fail(function(data, textStatus) {
        if (wrongPassword(data.status)) {
          alert("Wrong Password.");
        }
        return 0;
      });
  }

}

function inputEmpty(username) {
  return username == "";
}

function wrongPassword(statusCode) {
  return statusCode == 403;
}

function newUserCreated(statusCode) {
  return statusCode == 201;
}

// Parse gCal events to FullCalendar events
function parseGCal(startDate, endDate, groupCalEvents) {
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

        eventObj.extra = "Does this break";

        event_list.push(eventObj);
      }
    }

    let indCalEvents = parseClientEvents($('#calendar-ind').fullCalendar('clientEvents'));
    renderGroupCal(indCalEvents, groupCalEvents);
    gapi.auth2.getAuthInstance().signOut();

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
    eventObj.color = "tomato";
    parsedCal.push(eventObj);
  }

  return parsedCal;
}

// Combine individual and group events and render on right calendar
function renderGroupCal(indCalEvents, groupCalEvents) {
  window.unsavedChanges = true;
  // Want the newly created event to show up on the individual calendar, before parseClientEvents tries to grab it to display on group calendar
  setTimeout(renderGroupCalHelper, 300, indCalEvents, groupCalEvents);
}


// Callback function for renderGroupCal
function renderGroupCalHelper(indCalEvents, groupCalEvents) {
  var combinedCal = groupCalEvents.concat(indCalEvents);
  $('#calendar-group').fullCalendar( 'removeEvents');
  $('#calendar-group').fullCalendar( 'renderEvents', combinedCal, true);
}

function renderIndCal(indCalEvents, groupCalEvents) {
  $("#calendar-ind").fullCalendar('render');
  $('#calendar-ind').fullCalendar( 'removeEvents');
  $('#calendar-ind').fullCalendar( 'renderEvents', indCalEvents, true);
  renderGroupCal(indCalEvents, groupCalEvents);
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

	function initOauth(startDate, endDate, groupCalEvents) {
	  gapi.load('client:auth2', function() {
      initClient(startDate, endDate, groupCalEvents);
    });
	}

	/**
	 *  Initializes the API client library and sets up sign-in state
	 *  listeners.
	 */
	function initClient(startDate, endDate, groupCalEvents) {
	  gapi.client.init({
	    discoveryDocs: DISCOVERY_DOCS,
	    clientId: CLIENT_ID,
	    scope: SCOPES
    }).then(function () {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(function(signinStatus) {
        updateSigninStatus(signinStatus, startDate, endDate, groupCalEvents);
      });

      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get(), startDate, endDate, groupCalEvents);
      authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
	  });
	}

	/**
	 *  Called when the signed in status changes, to update the UI
	 *  appropriately. After a sign-in, the API is called.
	 */


function updateSigninStatus(isSignedIn, startDate, endDate, groupCalEvents) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    parseGCal(startDate, endDate, groupCalEvents).then(function(event_list) {
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
    let indCalEvents = parseClientEvents($('#calendar-ind').fullCalendar('clientEvents'));
    let emptyCal = indCalEvents.length == 0;
    let continueOauth = true;
    if (!emptyCal) {
      continueOauth = confirm("If you authorize with Google Calendar, your existing calendar will be over-written. Do you wish to continue?");
    }

    if (continueOauth) {
      gapi.auth2.getAuthInstance().signIn();
    }
	}

	/**
	 *  Sign out the user upon button click.
	 */
	function handleSignoutClick(event) {
	  gapi.auth2.getAuthInstance().signOut();
	}
