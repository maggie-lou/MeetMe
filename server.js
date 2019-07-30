var express = require('express');
var engines = require('consolidate');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Env = require('dotenv');
var fs = require('fs');
var populateData = require('./helpers/populate_data');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Database connection error:'));
//mongoose.set('debug', true);  // Prints out all database calls to console

// Clear database and populate with test data
//populateData.clearDB();
//populateData.populateDatabase();


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
var GroupCalEventController = require('./controllers/GroupCalEventController');
var FeedbackController = require('./controllers/FeedbackController');

app.use('/groups', GroupController);
app.use('/users', UserController);
app.use('/cal', CalController);
app.use('/groupcalevent', GroupCalEventController);
app.use('/feedback', FeedbackController);

app.listen(app.get('port'), function() {
  console.log('Express app listening on port ' + app.get('port'));
});

// Render pages
app.get('/', function (req, res) {
  res.render('creategroup', {});
});

app.get('/feedback', function(req, res, next) {
  res.render('feedback');
});

app.get('/:groupLink', function(req, res, next) {
  res.render('fillcal', { groupLink: req.params.groupLink});
});
