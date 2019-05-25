window.$ = require('jquery');
const Timeslot = require('./Timeslot.js');
const GroupCalendar = require('./GroupCalendar.js');
const Utils = require('../../helpers/utils');
const moment = require('../../node_modules/moment');
const fullCalendar = require('../../node_modules/fullcalendar');
const Rainbow = require('../../node_modules/rainbowvis.js');
require('../../node_modules/bootstrap');

var currentUserName;
var currentUserID;

var showAvailabilityLabels = false;

$(document).ready(function() {

  // Set invitation link
  document.getElementById("link").innerHTML = "www.meetmecal.com/" + groupLink;

  getGroup(groupLink, function(group) { // groupLink defined in fillcal.jade script tag
    let groupCalendar = new GroupCalendar(group._id, JSON.parse(group.calendar), group.size, group.startDate, group.endDate, group.minTime, group.maxTime);
    initCalendars(groupCalendar);
    renderGroupCal([], groupCalendar);
    initAvailabilityKey(groupCalendar.size);

    // Initialize click handlers
    $('#copy-button').on('click', function() {
      copy();
    });
    $('#register-button').on('click', function() {
      registerUser(groupCalendar);
    });
    $('#sign-in-button').on('click', function() {
      registerUser(groupCalendar);
    });
    $('#register-text').on('click', function() {
      switchSignIn();
    });
    $('#sign-in-text').on('click', function() {
      switchRegister();
    });
    $('#show-labels').on('click', function() {
      if($(this).is(':checked')){
        showAvailabilityLabels = true;
        renderGroupCal([], groupCalendar);
      } else {
        showAvailabilityLabels = false;
        renderGroupCal([], groupCalendar);
      }
    });

  });
});

function initCalendars(groupCalendar) {
  var calInd = $('#calendar-ind').fullCalendar({
    defaultView: 'agenda',
    minTime: groupCalendar.minTime,
    maxTime: groupCalendar.maxTime,
    // Calendar height adjusts to min and max time
    contentHeight: 'auto',
    selectable: true,   // Users can highlight a timeslot by clicking and dragging
    editable: true,
    unselectAuto: false, // Clicking elsewhere won't cause current selection to be cleared
    displayEventTime : false,
    eventColor: "#7bce6e",
    allDaySlot: false,
    visibleRange: {
      start: moment(groupCalendar.startDate).startOf("day"),
      end: moment(groupCalendar.endDate).add(1, 'days')
    },

    header: {
      left: '',
      center: '',
      right: '',
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
      saveCalendars(groupCalendar);
    },

    // Clicking on event will trigger event deletion prompt
    eventClick: function(calEvent, jsEvent, view) {
      $(this).css('border-color', 'black');
      setTimeout(deleteEvent, 100, calEvent, this, groupCalendar);
    },

    // Editing size of pre-existing event will update group calendar
    eventResize: function(info) {
      saveCalendars(groupCalendar);
    }
  })

  $('#calendar-group').fullCalendar({
    defaultView: 'agenda',
    minTime: groupCalendar.minTime,
    maxTime: groupCalendar.maxTime,
    contentHeight: 'auto',
    displayEventTime : false,
    allDaySlot: false,
    visibleRange: {
      start: moment(groupCalendar.startDate).startOf("day"),
      end: moment(groupCalendar.endDate).add(1, 'days')
    },

    header: {
      left: '',
      center: '',
      right: '',
    },

    eventRender: function(event, element, view) {
      $(element).css("padding-left", "10px");
    },

    // Hovering on event will show names of busy people
    eventMouseover: function(calEvent, jsEvent, view) {
      if (!isIndividualEvent(calEvent)) {
        let cal = groupCalendar.cal;
        let busyPeople = cal[calEvent.start.format()].busyPeople;
        groupCalendar.getParticipants(function(allParticipants) {
          let freePeople = Utils.difference(allParticipants, busyPeople);
          let unavailable = busyPeople.length.toString() + "/" + allParticipants.length.toString();
          var tooltip =
            `<div class="tooltipevent">
             <div class="tooltip-header">
              <p class = "inline" id = "time">${moment(calEvent.start).format('h:mm')} - ${moment(calEvent.end).format('h:mm')}</p>
              <p class = "inline" id = "per-unavailable">${unavailable} Unavailable</p>
            </div>
            <div class = "tooltip-content">
                <div class="column">
                <p> Unavailable </p>
                <div id = "unavailable">
                </div>
              </div>
              <div class="column">
                <p> Available </p>
                <div id = "available">
                </div>
              </div>
            </div>
          </div>`;

          var $tooltip = $(tooltip).appendTo('body');
          document.getElementById('unavailable').appendChild(Utils.makeUL(busyPeople));
          document.getElementById('available').appendChild(Utils.makeUL(freePeople));

          $(this).mouseover(function(e) {
            $(this).css('z-index', 10000);
            $tooltip.fadeIn('500');
            $tooltip.fadeTo('10', 1.9);
          }).mousemove(function(e) {
            $tooltip.css('top', e.pageY + 10);
            $tooltip.css('left', e.pageX + 20);
          });
        });
      }
    },

    // Remove tooltip when hovering ends
    eventMouseout: function(calEvent, jsEvent) {
      $(this).css('z-index', 8);
      $('.tooltipevent').remove();
    },
  })

  initOauth(groupCalendar);
}

function isIndividualEvent(calEvent) {
  return calEvent.color == "#7bce6e";
}

function confirmExit() {
  if (window.unsavedChanges) {
    return "You have unsaved changes on your calendar. If you wish to save them, please select 'Save Calendar' at the left bottom of the page.";
  } else {
    return null; // Only alert user if unsaved changes
  }
}


function deleteEvent(event, cssObject, groupCal) {
  var confirmed = confirm("Do you want to delete this event?");
  if (confirmed) {
    $('#calendar-ind').fullCalendar('removeEvents', event._id);
    saveCalendars(groupCal);
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
function saveCalendars(groupCal) {
  let indCalEvents = parseClientEvents($('#calendar-ind').fullCalendar('clientEvents'));
  let indCalDict = serializeCalEvents(indCalEvents);

  let combinedCalDict = combineIndGroupCalendars(indCalDict, groupCal.cal);

  $.ajax({
    type: 'PATCH',
    url: '../users/' + window.currentUserID + '/cal',
    data:
    {
      calendar: JSON.stringify(indCalDict),
    },
    success: function(response) {
    }
  }).done(function() {
    $.ajax({
      type: 'PATCH',
      url: '../groups/' + groupCal.id + '/cal',
      data:
      {
        calendar: JSON.stringify(combinedCalDict),
      },
      success: function() {
        // Show popup - calendars saved
        // document.getElementById('savedPopup').style.display = 'block';
        // setTimeout(
        //   function() {
        //     document.getElementById('savedPopup').style.display = 'none';
        //   },
        //   2500
        // );

        // Render combined group calendar
        groupCal.updateCal(combinedCalDict);
        renderGroupCal([], groupCal);
      }
    });
  });
}

// Combine dictionaries representing individual and group calendars into a single group calendar dictionary
function combineIndGroupCalendars(indCalDict, groupCalDict) {
  let combinedCalDict = Utils.clone(groupCalDict);
  removeUser(window.currentUserName, combinedCalDict);

  for (let key in indCalDict) {
    let timeslot;
    if (key in combinedCalDict) {
      timeslot = combinedCalDict[key];
      timeslot.busyPeople.push(window.currentUserName);
    } else {
      timeslot = indCalDict[key];
    }
    combinedCalDict[key] = timeslot;
  }
  return combinedCalDict;
}

function removeUser(username, groupCalDict) {
  let timesToRemove = []

  for (var time in groupCalDict) {
    let calEvent = groupCalDict[time];
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
        groupCalDict[time] = calEvent;
      }
    }
  }

  for (var i in timesToRemove) {
    let time = timesToRemove[i];
    delete groupCalDict[time];
  }
}

// Transform FullCalendar events into dictionary, where key is start time and value is calendar event
// Split each event into 30 minute intervals
function serializeCalEvents(events) {
  let dict = {}
  events.forEach(function(calEvent) {
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
    eventObj.color = "#7bce6e";

    events.push(eventObj);
  }

  return events;
}

// Signs in or registers user, based on username and optional password.
function registerUser(groupCal) {
  var name = document.getElementById('inputUsername').value;
  var password = document.getElementById('inputPassword').value;

  if (inputEmpty(name)) {
    alert("Please enter your name.");
  } else {
    $.post(
      '../users',
      {
        username: name,
        password: password,
        groupID: groupCal.id,
        calendar: "{}",
      }, function(data, status, xhr) {
        $('#register-pane').css({ 'display': 'none' });
        $('#ind-cal-pane').css({ 'display': 'inherit' });

        // Save newly created user data to global variable
        window.currentUserID = data._id;
        window.currentUserName = name;

        let indCalDict = JSON.parse(data.calendar);
        let indCalEvents = deserializeIndCalEvents(indCalDict);
        renderIndCal(indCalEvents);

        if (newUserCreated(xhr.status)) {
          $.ajax({
            type: 'PATCH',
            url: '../groups/' + groupCal.id + '/size',
            data:
            {
              size: groupCal.size + 1
            }
          });
          initAvailabilityKey(groupCal.size + 1);
          groupCal.size = groupCal.size + 1;
        }
      }).fail(function(data, textStatus) {
        if (wrongPassword(data.status)) {
          alert("Wrong Password.");
        }
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

function copy() {
  var tempInput = document.createElement('input');
  document.body.appendChild(tempInput);
  tempInput.value = document.getElementById('link').innerHTML;
  tempInput.select();
  document.execCommand('copy');
  tempInput.remove();
}

function switchRegister() {
  document.getElementById('register').style.display = 'block';
  document.getElementById('register-text').style.display = 'block';
  document.getElementById('register-button').style.display = 'block';

  document.getElementById('sign-in').style.display = 'none';
  document.getElementById('sign-in-text').style.display = 'none';
  document.getElementById('sign-in-button').style.display = 'none';
}

function switchSignIn() {
  document.getElementById('register').style.display = 'none';
  document.getElementById('register-text').style.display = 'none';
  document.getElementById('register-button').style.display = 'none';

  document.getElementById('sign-in').style.display = 'block';
  document.getElementById('sign-in-text').style.display = 'block';
  document.getElementById('sign-in-button').style.display = 'block';
}

function initAvailabilityKey(groupSize) {
  if (groupSize > 0) {
    $("#availability-key").empty();
    var rainbow = new Rainbow();
    rainbow.setNumberRange(0, groupSize);
    rainbow.setSpectrum('#9eeaff', '#1c7c96');
    $("#availability-key").append("<td bgcolor= 'white' class = 'key-cell' >&nbsp</td>");
    for (i=1; i<=groupSize; i++) {
      $("#availability-key").append("<td bgcolor='#" + rainbow.colourAt(i) + "' class = 'key-cell' >&nbsp</td>");
    }
    document.getElementById("all-available").innerHTML = `${groupSize}/${groupSize} Available`;
    document.getElementById("no-available").innerHTML = `0/${groupSize} Available`;
  }

}

// Parse gCal events to FullCalendar events
function parseGCal(groupCal) {
  return gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'timeMin': groupCal.startDate,
    'timeMax': groupCal.endDate,
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
    eventObj.color = "#7bce6e";
    parsedCal.push(eventObj);
  }

  return parsedCal;
}

// Combine individual and group events and render on right calendar
function renderGroupCal(indCalEvents, groupCal) {
  // Want the newly created event to show up on the individual calendar, before parseClientEvents tries to grab it to display on group calendar
  setTimeout(renderGroupCalHelper, 300, indCalEvents, groupCal);
}


// Callback function for renderGroupCal
function renderGroupCalHelper(indCalEvents, groupCal) {
  let groupCalEvents = Utils.clone(groupCal.getEvents());
  var combinedCal = groupCalEvents.concat(indCalEvents);

  if (!showAvailabilityLabels) {
    combinedCal = combinedCal.map(event => {
      event.title = "";
      return event;
    });
  }

  $('#calendar-group').fullCalendar( 'removeEvents');
  $('#calendar-group').fullCalendar( 'renderEvents', combinedCal, true);
}

function renderIndCal(indCalEvents, groupCal) {
  $("#calendar-ind").fullCalendar('render');
  $('#calendar-ind').fullCalendar( 'removeEvents');
  $('#calendar-ind').fullCalendar( 'renderEvents', indCalEvents, true);
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

	function initOauth(groupCal) {
	  gapi.load('client:auth2', function() {
      initClient(groupCal);
    });
	}

	/**
	 *  Initializes the API client library and sets up sign-in state
	 *  listeners.
	 */
	function initClient(groupCal) {
	  gapi.client.init({
	    discoveryDocs: DISCOVERY_DOCS,
	    clientId: CLIENT_ID,
	    scope: SCOPES
    }).then(function () {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(function(signinStatus) {
        updateSigninStatus(signinStatus, groupCal);
      });

      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get(), groupCal);
      authorizeButton.onclick = handleAuthClick;
	  });
	}

	/**
	 *  Called when the signed in status changes, to update the UI
	 *  appropriately. After a sign-in, the API is called.
	 */


function updateSigninStatus(isSignedIn, groupCal) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    parseGCal(groupCal).then(function(event_list) {
      $('#calendar-ind').fullCalendar( 'removeEvents');
      $('#calendar-ind').fullCalendar( 'renderEvents', event_list, true);
      saveCalendars(groupCal);
    });
    return true;
  } else {
    authorizeButton.style.display = 'block';
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
