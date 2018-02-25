var mongoose = require('../db');
// var mongoose = require('mongoose');


var Schema = mongoose.Schema;

// const boardsSchema = new Schema({
//   name: String,
//   columns: [String],
// });

var groupSchema = new Schema({
	title: String,
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
