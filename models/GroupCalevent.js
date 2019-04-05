var mongoose = require('../db');
var Schema = mongoose.Schema;

var schema = new Schema({
  groupID: {type: Schema.Types.ObjectId, ref: 'Group'},
  calEventID: {type: Schema.Types.ObjectId, ref: 'CalEvent'},
});

module.exports = mongoose.model('GroupCalevent', schema);
