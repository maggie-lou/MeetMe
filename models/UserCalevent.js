var mongoose = require('../db');
var Schema = mongoose.Schema;

var schema = new Schema({
  userID: {type: Schema.Types.ObjectId, ref: 'User'},
  calEventID: {type: Schema.Types.ObjectId, ref: 'CalEvent'},
});

module.exports = mongoose.model('UserCalevent', schema);
