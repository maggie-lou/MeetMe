var express = require('express');
var router = express.Router();

var CalEvents = require('../models/CalEvent');
var GroupCalEvents = require('../models/GroupCalevent');
var Groups = require('../models/groups');

router.post('/', function(req, res) {
	var calEvent = new CalEvents({
    title: req.body.title,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    busyPeople: req.body.busyPeople,
	});

	calEvent.save(function(err) {
		if (err) {
      console.log(err);
      return;
    } else {
			console.log('Saved Event!');
			res.send(calEvent);
		}
	});
});


router.get('/group/:id', function(req, res, next) {
  console.log("/GET /cal/group/" + req.params.id);

  GroupCalEvents.find({ groupID: req.params.id }, 'calEventID', function(err, calEventIDs) {
    if(err) {
      console.log("Couldn't find group " + req.params.id).
        return;
    }

    calEventIDs = calEventIDs.map( function(json) {
      return json.calEventID;
    });
    CalEvents.find({ "_id" : {$in: calEventIDs } }, function(err, calEvents) {
      res.send(calEvents);
    });
  });
});

module.exports = router;

