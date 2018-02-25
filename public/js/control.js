$(document).ready(function() {

	var eventInput;

	// Initialize OAuth
	handleClientLoad();

	// Store today's date
	var date = new Date();
	var d = date.getDate();
	var m = date.getMonth();
	var y = date.getFullYear();

	//Initialize individual calendar
	var calendar_ind = $('#calendar-ind').fullCalendar({
		// Create header - lets you switch calendar views
			// Values separated by comma will be adjacent, separated by a space will have a small gap in between
			// Note that these values are predefined templates, not personal names
		header: {
			left: 'prev,next today', // text containing the current month/week/day
			center: 'title',
			right: 'month, agendaWeek, agendaDay'
		},

		defaultView:'agendaWeek',

		// Lets users highlight a timeslot by clicking and dragging
		selectable: true,
		// Creates a colored box while user is dragging
		selectHelper: true,
		//Whether clicking elsewhere will cause current selection to be cleared
		unselectAuto: false,

		// Runs when user selects a timeslot
		select: function(start, end, allDay) {

			calendar_ind.fullCalendar('renderEvent',
				{
					title: "",
					start: start,
					end: end,
					allDay: false
				},
				true // makes event stay permanently fixed - won't disappear if you go to another calendar page
			);

			calendar_ind.fullCalendar('unselect');

		},

		// Can change duration of event, move it around
		editable: true,

		// Pre-define events on calendar
		events: eventInput,


	});



	var groupEvents;

	// Get group calendar events from database
	$.get('http://localhost:3000/groups/5a5641d6955ee90feb2fd94f/cal', {}, function(data) {
		return data;
	}).then(function(data) {
		groupEvents = data;

    // WORKING ON:
		//Parse group calendar into fullCalendar objects
		groupEvents = parseGroupEvents(groupEvents);

    // Get events newly added to individual calendar
    var groupEvents2 = $('#calendar-ind').fullCalendar('clientEvents');
    console.log(groupEvents2);
    // Combine all total events and render

    // Render group calendar
		var calendar_group = $('#calendar-group').fullCalendar({
			// Create header - lets you switch calendar views
				// Values separated by comma will be adjacent, separated by a space will have a small gap in between
				// Note that these values are predefined templates, not personal names
			header: {
				left: 'prev,next today', // text containing the current month/week/day
				center: 'title',
				right: 'month, agendaWeek, agendaDay'
			},

			defaultView:'agendaWeek',

			// Lets users highlight a timeslot by clicking and dragging
			selectable: true,
			// Creates a colored box while user is dragging
			selectHelper: true,
			//Whether clicking elsewhere will cause current selection to be cleared
			unselectAuto: false,

			// Runs when user selects a timeslot
			select: function(start, end, allDay) {

				calendar_group.fullCalendar('renderEvent',
					{
						title: "",
						start: start,
						end: end,
						allDay: false
					},
					true // makes event stay permanently fixed - won't disappear if you go to another calendar page
				);

				calendar_group.fullCalendar('unselect');

			},

			// Can change duration of event, move it around
			editable: true,

			// Pre-define events on calendar
			events: groupEvents,

		});
	});






	// Client ID and API key from the Developer Console
	var CLIENT_ID = '482233491751-ds1dm3a9mtd69mesprcthn470mjn6tq8.apps.googleusercontent.com';

	// Array of API discovery doc URLs for APIs used by the quickstart
	var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

	// Authorization scopes required by the API; multiple scopes can be
	// included, separated by spaces.
	var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

	var authorizeButton = document.getElementById('authorize-button');
	var signoutButton = document.getElementById('signout-button');

	var parsedtext = "";










	// *****************  FUNCTIONS *************************

	// Parse group calendar database entry into fullCalendar events with shading based on number of people available
	function parseGroupEvents(events_unparsed) {
		var event_list = [];
		for (i = 0; i < events_unparsed.length; i++) {
			var event_unparsed = events_unparsed[i];

			var eventObj = {};
			eventObj.title = "";
			eventObj.start = event_unparsed.startTime;
			eventObj.end = event_unparsed.endTime;
			eventObj.allDay = false;
			eventObj.color = "red";

			event_list.push(eventObj);
		}
		return event_list;
	}



	function combineEvents() {
		// combine events from group events and just added individual events
		// at the end, replace the group database entry's calendar with this combined calendar
	}


	// -------- OAuth Functions ----------------

	/**
	 *  On load, called to load the auth2 library and API client library.
	 */
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
			//if you re-authorize, removes all current events
			$('#calendar-ind').fullCalendar( 'removeEvents');
			$('#calendar-ind').fullCalendar( 'renderEvents', event_list, true);
			$('#calendar-group').fullCalendar( 'removeEvents');
			$('#calendar-group').fullCalendar( 'renderEvents', event_list, true);
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











});
