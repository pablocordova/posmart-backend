// Get dependencies
require('dotenv').config();
const bluebird = require('bluebird');
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const http = require('http');
const mongoose = require('mongoose');
const passport = require('passport');
const passportJWT = require('passport-jwt');
const User = require('./models/user');

// Get our API routes
const customers = require('./routes/customers');
const login = require('./routes/login');
const products = require('./routes/products');
const sales = require('./routes/sales');
const users = require('./routes/users');

// Strategy for authentification
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
//JWT Config
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = process.env.JWT_KEY;

// Here, passport is defining as a middleware
var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {

  User.findById(jwt_payload.id, function(err, user) {

    if (err) return next(err, false);

    if (user) {
      return next(null, user);
    } else {
      return next(null, false);
    }
  });

});

passport.use(strategy);

var app = express();

/**
 * INITIAL CONFIGURATIONS
 */

// To use helmet
app.use(helmet());

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Connect to db
// Config bluebird as Promise, is faster
mongoose.Promise = bluebird;

// By defaul mongo path for production
let MONGO_PATH = '';

switch (process.env.NODE_ENV) {

  case 'production':
    MONGO_PATH = process.env.MONGO_PATH;
    break;
  case 'development':
    MONGO_PATH = process.env.MONGO_PATH_DEV;
    break;
  case 'test':
    MONGO_PATH = process.env.MONGO_PATH_TEST;
    break;
}

mongoose.connect(MONGO_PATH, { useMongoClient: true }, err => {
  // No console log for test environment, to log better presentation
  if (process.env.NODE_ENV !== 'test') {
    if (!err) console.log('Success connection to Mongo!');
  }
});

/**
 * ROUTES
 */

app.use('/customers', customers);
app.use('/login', login);
app.use('/products', products);
app.use('/sales', sales);
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