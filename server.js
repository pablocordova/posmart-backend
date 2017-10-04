// Get dependencies
//const constants = require('./settings');
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const http = require('http');
const mongoose = require('mongoose');
const passport = require('passport');
// Get our API routes
const api = require('./routes/api');
const app = express();

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
mongoose.connect(process.env.MONGO_PATH);

/**
 * ROUTES
 */

app.use('/', api);


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

