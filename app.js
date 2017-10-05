// Get dependencies
var bluebird = require('bluebird');
var bodyParser = require('body-parser');
var express = require('express');
var helmet = require('helmet');
var http = require('http');
var mongoose = require('mongoose');
var passport = require('passport');

// Get our API routes
var users = require('./routes/users');

var app = express();

/**
 * INITIAL CONFIGURATIONS
 */

// To use helmet, TODO: research more about this
app.use(helmet());

// To use passport
app.use(passport.initialize());
app.use(passport.session());

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Connect to db
// Config bluebird as Promise, is faster
mongoose.Promise = bluebird;
mongoose.connect(process.env.MONGO_PATH, { useMongoClient: true }, err => {
  if (err) {
    console.log('Error connecting to Mongo: ', err);
  } else {
    console.log('Success connection to Mongo!');
  }
});

/**
 * ROUTES
 */

app.use('/users', users);

/**
 * INTIALIZE SERVER
 */

// Get port from environment and store in Express
const port = process.env.SERVER_PORT;
app.set('port', port);

// Create HTTP sever
const server = http.createServer(app);

// Listen on provided port, on all network interfaces
server.listen(port);

module.exports = app;