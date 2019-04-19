var express = require('express');
var Users = require('../models/users');

const router = express.Router();

// Creates a new user or returns the existing one with the given username
// Returns error is provided password is false
router.post('/', function(req, res) {
  Users.findOne({username: req.body.username}, function(err, existingUser) {
    if (!existingUser) {
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
          res.status(201).json(newUser);
          return;
        }
      });
    } else {
      if (existingUser.password == req.body.password) {
        res.status(200).json(existingUser);
        return;
      } else {
        res.status(403).json("Invalid password");
        return;
      }
    }
  }
  );

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

// Update a user's calendar
router.patch('/:id/cal', function(req, res) {
	Users.findOneAndUpdate({ _id: req.params.id },
    { calendar: req.body.calendar
    }, function(err, user) {
		if (err) {
      console.log(err);
      res.status(500).json({ error: err });
      return;
    }
		else {
      console.log("Successfully updated calendar.");
			res.send(user);
		}
	});
});
module.exports = router;
