// Get dependencies
require('dotenv').config();
const bluebird = require('bluebird');
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const http = require('http');
const mongoose = require('mongoose');
const passport = require('passport');

var app = express();

/**
 * INITIAL CONFIGURATIONS
 */

// To use helmet
app.use(helmet());

// To use passport, TODO research about use passport

app.use(passport.initialize());
app.use(passport.session());

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Connect to db
// Config bluebird as Promise, is faster
mongoose.Promise = bluebird;
mongoose.connect(process.env.MONGO_PATH, { useMongoClient: true }, err => {
  if (!err) console.log('Success connection to Mongo!');
});

/**
 * ROUTES
 */

// Get our API routes
const users = require('./routes/users');
const login = require('./routes/login');

app.use('/users', users);
app.use('/login', login);

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