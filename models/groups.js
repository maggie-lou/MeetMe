var mongoose = require('../db');
var Schema = mongoose.Schema;

var groupSchema = new Schema({
	name: String,
  size: Number,
	startDate: Date,
	endDate: Date,
	link: { type: String, unique: true },
  calendar: String,
});

var Groups = mongoose.model('Group', groupSchema);
module.exports = Groups;
