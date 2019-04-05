var aaa = #{params.title};
console.log(aaa);
var groupCalEvents = [];
var indCalEvents = [];
var combinedCalEvents = [];
$(document).ready(function() {
  // Initialize OAuth
  handleClientLoad()

  // Initialize click handlers
  $('#btnGetGroup').on('click', getGroup);
  $('#test').on('click', testFun);
  $('#calendar-ind').on('mouseup', renderGroupCal);

  // Initialize Calendars
  var calInd = $('#calendar-ind').fullCalendar({
    defaultView: 'agendaWeek',
    selectable: true,   // Users can highlight a timeslot by clicking and dragging
    unselectAuto: false, // Clicking elsewhere won't cause current selection to be cleared

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
  })

  $('#calendar-group').fullCalendar({
    defaultView: 'agendaWeek'
  })

});


function testFun() {
  console.log("In Test Function");
}

// Parse gCal events to FullCalendar events
function parseGCal() {
  return gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'timeMin': (new Date()).toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'orderBy': 'startTime',
    //'maxResults': 30,
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

    return event_list;
  });
}

// Get group events from db, based on group name from input form
function getGroup(event) {
  var groupName = $('#inputGroupName').val();
  var parsedCal
  $.ajax({
    type: 'GET',
    url: 'groups/name/' + groupName,
    dataType: 'JSON',
    error: function(xhr, ajaxOptions, thrownError) {
      if (xhr.status == 400)
        alert("No group with input name.");
    },
    success: function(groupCalEvents) {
      parsedCal = parseGroupEvents(groupCalEvents);
      // Save group cal to global variable
      window.groupCalEvents = parsedCal;
      renderGroupCal();
    }
  }).done(function(resp) {
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
  // Ensures fullcal's click handlers run before custom click handlers, to add newly dragged events to the individual calendar before grabbing all the events to render on the group calendar
  setTimeout(renderGroupCalHelper, 1);
}


// Callback function for renderGroupCal
function renderGroupCalHelper() {
  window.indCalEvents = parseClientEvents($('#calendar-ind').fullCalendar('clientEvents'));
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

	function handleClientLoad() {
	  gapi.load('client:auth2', initClient);
	}

	/**
	 *  Initializes the API client library and sets up sign-in state
	 *  listeners.
	 */
	function initClient() {
	  gapi.client.init({
	    discoveryDocs: DISCOVERY_DOCS,
	    clientId: CLIENT_ID,
	    scope: SCOPES
	  }).then(function () {
	    // Listen for sign-in state changes.
	    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

	    // Handle the initial sign-in state.
	    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
		authorizeButton.onclick = handleAuthClick;
	    signoutButton.onclick = handleSignoutClick;
	  });
	}

	/**
	 *  Called when the signed in status changes, to update the UI
	 *  appropriately. After a sign-in, the API is called.
	 */


	function updateSigninStatus(isSignedIn) {
	  if (isSignedIn) {
	    authorizeButton.style.display = 'none';
	    signoutButton.style.display = 'block';
		parseGCal().then(function(event_list) {
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











