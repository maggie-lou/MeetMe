var mongoose = require('../db');
var Schema = mongoose.Schema;

var groupSchema = new Schema({
	name: String,
  size: Number,
	startDate: Date,
	endDate: Date,
  minTime: String,
  maxTime: String,
	link: { type: String, unique: true },
  calendar: String,
  description: String,
});

var Groups = mongoose.model('Group', groupSchema);
module.exports = Groups;
