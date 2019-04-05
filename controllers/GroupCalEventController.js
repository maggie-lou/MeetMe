var express = require('express');
var GroupCalEvent = require('../models/GroupCalevent');
const router = express.Router();


router.post('/', function(req, res) {
	var newGroupCalEvent = new GroupCalEvent({
    groupID: req.body.groupID,
    calEventID: req.body.calEventID,
	});

	newGroupCalEvent.save(function(err, saved) {
		if (err) res.status(500).json({ error: err });
		else {
			console.log('Saved GroupCalEvent!');
			res.send(saved);
		}
	});
});

module.exports = router;
