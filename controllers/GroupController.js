var express = require('express');
const router = express.Router();

var Groups = require('../models/groups');
const Utils = require('../helpers/utils');


router.post('/', function(req, res) {
  saveGroup(
    req.body.name,
    req.body.startDate,
    req.body.endDate,
    Utils.generateUniqueID(),
    function(response) {
      res.send(response);
    }
  );
});

function saveGroup(name, startDate, endDate, link, callback) {
  var newGroup = new Groups({
    name: name,
    startDate: startDate,
    endDate: endDate,
    link: link,
    calendar: "{}",
    size: 0,
  });

  newGroup.save(function(err, saved) {
    if (err) {
      let nonUniqueLinkError = err.name == 'MongoError' && err.code === 11000;
      if (nonUniqueLinkError) {
        console.log("Non unique group link - regenerating link.");
        saveGroup(name, startDate, endDate, Utils.generateUniqueID(), callback);
        return;
      }
      console.log(err);
      callback(err);
    } else {
      console.log('Saved Group!');
      callback(newGroup);
    }
  });
}


// Returns a JSON of all entries in the database
router.get('/', function(req, res) {
	Groups.find(function (err, db) {
		if (err) res.status(500).json({ error: err });
		else {
			res.status(200).json(db);
		}
	});
});


router.get('/create', function(req, res) {
  res.render('creategroup', {});
});



// Returns group given group link
router.get('/link/:link', function(req, res) {
  console.log("/GET group/link/" + req.params.link);
  Groups.findOne({ link: req.params.link }, function(err, group) {
    if(err) res.status(500).json({ error: err});
    if (group) {
			res.send(group);
    } else {
      res.status(400).json("No group in database with input name.");
    }
  });
});


router.get('/id/:id', function(req, res) {
	Groups.findOne({ _id: req.params.id }, function(err, group) {
		if (err) res.status(500).json({ error: err });
		else {
			res.status(200).json(group);
		}
	});
});


router.get('/id/:id/cal', function(req, res) {
	Groups.findOne({ _id: req.params.id }, function(err, group) {
		if (err) res.status(500).json({ error: err });
		else {
			res.status(200).json(group.calendar);
		}
	});
});


// Delete the group with the input name
router.delete('/delete/name/:name', function(req, res) {
  Groups.remove({ name: req.params.id }, function(err) {
    if (err) res.status(500).json({error: "Delete group failed : " + err});
    else {
      console.log("Delete successful");
    }
  });
});

// Delete all groups in database
router.delete('/delete/all', function(req, res) {
  Groups.remove({}, function(err) {
    if (err) res.status(500).json({error: "Delete all groups failed : " + err});
    else {
      console.log("Delete all groups successful");
    }
  });

});

// Update a group's calendar
router.patch('/:id/cal', function(req, res) {
	Groups.findOneAndUpdate({ _id: req.params.id },
    { calendar: req.body.calendar
    }, function(err, group) {
		if (err) {
      console.log(err);
      res.status(500).json({ error: err });
      return;
    }
		else {
      console.log("Successfully updated group calendar for group ID " + req.params.id + ".");
			res.send(group);
		}
	});
});

// Update a group's number of people
router.patch('/:id/size', function(req, res) {
	Groups.findOneAndUpdate({ _id: req.params.id },
    { size: req.body.size
    }, function(err, group) {
		if (err) {
      console.log(err);
      res.status(500).json({ error: err });
      return;
    }
		else {
      console.log("Successfully updated group number of participants to " + req.body.size + ".");
			res.send(group);
		}
	});
});
module.exports = router;
