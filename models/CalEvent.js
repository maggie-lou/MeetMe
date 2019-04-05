var mongoose = require('../db');
var Schema = mongoose.Schema;

var calEventSchema = new Schema({
	title: String,
	startTime: Date,
  endTime: Date,
  busyPeople: [String],
});

module.exports = mongoose.model('CalEvent', calEventSchema);
