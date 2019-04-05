var mongoose = require('../db');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	username: String,
	password: String,
  groupID: {type: Schema.Types.ObjectId, ref: 'Group'},
});

var Users = mongoose.model('User', userSchema);
module.exports = Users;
