var express = require('express');
var Feedback = require('../models/feedback');

const router = express.Router();

router.post('/', function(req, res) {
  var comment = new Feedback({
    text: req.body.text,
  });
  comment.save(function(err) {
    if (err) {
      res.status(500);
      return;
    }

    res.status(200);
    return;
  });
});
module.exports = router;
