var mongoose = require('../db');
// var mongoose = require('mongoose');


var Schema = mongoose.Schema;


var userSchema = new Schema({
	username: String,
	password: String,
	link: String,
	calendar: [{
		event: {
			title: String,
			startTime: Date,
			endTime: Date,
		}
	}],
});

var Users = mongoose.model('users', userSchema);
module.exports = Users;
