var mongoose = require('mongoose');
var Env = require('dotenv');

Env.load();

// Initialize URI to default connection to local database
const uri = process.env.MONGO_URI;
mongoose.connect(uri, function() {
	console.log('mongodb is connected');
  // Clear the database to wipe any previous testing changes
  //    ***FOR TESTING PURPOSES ONLY**
  mongoose.connection.db.dropDatabase();
});

module.exports = mongoose;
