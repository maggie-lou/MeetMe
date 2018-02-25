var express = require('express');
var Users = require('../models/users');

const router = express.Router();


router.post('/', function(req, res) {
	var newUser = new Users({
		username: req.body.username,
		password: req.body.password,
		link: req.body.link,
		calendar: req.body.calendar,
	});

	newUser.save(function(err) {
		if (err) res.status(500).json({ error: err });
		else {
			console.log('Saved User!');
			res.status(200).json(newUser);
		}
	});
});

// Returns a JSON of all entries in the database 
router.get('/', function(req, res) {
	Users.find(function (err, db) {
		if (err) res.status(500).json({ error: err });
		else {
			res.status(200).json(db);
		}
	});
});

router.get('/:id', function(req, res) {
	Users.findOne({ _id: req.params.id }, function(err, user) {
		if (err) res.status(500).json({ error: err });
		else {
			res.status(200).json(user);
		}
	});
});

router.get('/:id/cal', function(req, res) {
	Users.findOne({ _id: req.params.id }, function(err, user) {
		if (err) res.status(500).json({ error: err });
		else {
			res.status(200).json(user.calendar);
		}
	});
});

router.get('/:id/done', function(req, res) {
	/* To be implemented */
	res.status(200).json("Adds individual calendar to group calendar. Returns group calendar.");
});


module.exports = router;
