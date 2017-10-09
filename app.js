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
const login = require('./routes/login');
const products = require('./routes/products');
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
mongoose.connect(process.env.MONGO_PATH, { useMongoClient: true }, err => {
  if (!err) console.log('Success connection to Mongo!');
});

/**
 * ROUTES
 */

app.use('/login', login);
app.use('/products', products);
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