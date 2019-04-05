var mongoose = require('../db');
var Schema = mongoose.Schema;

var groupSchema = new Schema({
	name: String,
	startDate: Date,
	endDate: Date,
	link: String,
});

var Groups = mongoose.model('Group', groupSchema);
module.exports = Groups;
