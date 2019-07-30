var mongoose = require('../db');
var Schema = mongoose.Schema;

var feedbackSchema = new Schema({
	text: String,
});

var Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
