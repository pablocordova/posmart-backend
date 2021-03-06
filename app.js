// To use .env
require('dotenv').config();

// Get dependencies
const bluebird = require('bluebird');
const bodyParser = require('body-parser');
const express = require('express');
const helmet = require('helmet');
const http = require('http');
const mongoose = require('mongoose');
const passport = require('passport');
const passportJWT = require('passport-jwt');

// Schemas
const UserSchema = require('./squemas/user');
const BusinessSchema = require('./squemas/business');

// Config bluebird as Promise, is faster compared with native promise
mongoose.Promise = bluebird;

// Connect to db with "createConnection" because I'll use dynamic databases
let db = mongoose.createConnection(process.env.MONGO_PATH);
// export db, beccause the next routes will use this connection
module.exports.db = db;

// Get our API routes
const buys = require('./routes/buys');
const login = require('./routes/login');
const register = require('./routes/register');
const customers = require('./routes/customers');
const products = require('./routes/products');
const sales = require('./routes/sales');
const settings = require('./routes/settings');
const users = require('./routes/users');
const reports = require('./routes/reports');

let databaseGeneral = '';

switch (process.env.NODE_ENV) {
  case 'test':
    databaseGeneral = process.env.DATABASE_TEST;
    break;
  case 'development':
    databaseGeneral = process.env.DATABASE_GENERAL;
    break;
}

let dbGeneral = db.useDb(databaseGeneral);
// Create Business model, to work with dashboard
const Business = dbGeneral.model('Business', BusinessSchema);

// Strategy for authentification
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
//JWT Config
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = process.env.JWT_KEY;

// Here, passport is defining as a middleware
// I decode the JWT and make operations in accordance with "type" field
// OBSERVATION: the fields added('database' and 'role') not appears in console, but It is sent.

var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  switch (jwt_payload.type) {
    // Case the user is logged from APP
    case 'app': {
      // Get which database use the user
      let database = jwt_payload.database;
      // Create user model of specific user
      // User create constantly because it depend on what user in consuming the data
      const dbUser = db.useDb(database);
      const User = dbUser.model('User', UserSchema);

      User.findById(jwt_payload.id, function(err, user) {
        // Case the user doesn't exits, return not autorizate
        if (err) return next(null, false);

        if (user) {
          // Case user exits, add database field, it database field will be used by routes
          user['database'] = database;
          // Add user role to know what routes is permit use.
          user['role'] = 'app';
          return next(null, user);
        } else {
          return next(null, false);
        }
      });
      break;
    }
    // Case the user is logged from Dashboard
    case 'dashboard':
      Business.findById(jwt_payload.id, function(err, user) {
        // Case the user doesn't exits, return not autorizate
        if (err) return next(null, false);

        if (user) {
          user['role'] = 'dashboard';
          return next(null, user);
        } else {
          return next(null, false);
        }
      });
      break;
    default:
      // Case another, not authorized
      return next(null, false);
  }

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

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers',
    'X-Requested-With,X-HTTP-Method-Override, Content-Type, Accept, Authorization, Origin');
  next();
});

/**
 * ROUTES
 */

app.use('/buys', buys);
app.use('/customers', customers);
app.use('/login', login);
app.use('/register', register);
app.use('/products', products);
app.use('/sales', sales);
app.use('/settings', settings);
app.use('/users', users);
app.use('/reports', reports);

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

module.exports.app = app;