var mongoose = require('mongoose');
var Env = require('dotenv').config();

// Initialize URI to value in .env
var uri = process.env.MONGOLAB_URI;
mongoose.connect(uri, function() {
  console.log("Database connected.");
});

module.exports = mongoose;
