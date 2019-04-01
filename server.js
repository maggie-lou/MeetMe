var express = require('express');
var engines = require('consolidate');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Env = require('dotenv');
var fs = require('fs');

// var mongoDB = 'mongodb://localhost/db';
// // mongoose.connect(mongoDB);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Database connection error:'));


Env.load();
var app = new express();

// View engine setup
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

  // Static files are accessible from both public and node_modules directories
app.use('/public', express.static(path.join(__dirname, '/public')));
app.use('/node_modules', express.static(path.join(__dirname, '/node_modules')));

var port = process.env.PORT || 3000;
app.set('port', port);

// for parsing application/json
app.use(bodyParser.json());

// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Set Routes
var GroupController = require('./controllers/GroupController');
var UserController = require('./controllers/UserController');
var CalController = require('./controllers/CalController');

app.use('/groups', GroupController);
app.use('/users', UserController);
app.use('/cal', CalController);

app.get('/', function(request, response) {
  response.render('populate_data');
});


app.listen(app.get('port'), function() {
  console.log('Express app listening on port ' + app.get('port'));
});
