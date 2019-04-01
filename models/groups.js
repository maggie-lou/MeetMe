var mongoose = require('../db');


var Schema = mongoose.Schema;

var groupSchema = new Schema({
	name: String,
	startDate: Date,
	endDate: Date,
	link: String,
	calendar: [
		{
			startTime: Date,
			endTime: Date,
			names: [String],
		}
	],
});

var Groups = mongoose.model('groups', groupSchema);
module.exports = Groups;
