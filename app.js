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
const UserSchema = require('./models/user');
const BusinessSchema = require('./models/business');

// Connect to db
// Config bluebird as Promise, is faster
mongoose.Promise = bluebird;

let db = mongoose.createConnection(process.env.MONGO_PATH);
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

let dbGeneral = db.useDb(process.env.DATABASE_GENERAL);

const Business = dbGeneral.model('Business', BusinessSchema);

// Strategy for authentification
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
//JWT Config
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
jwtOptions.secretOrKey = process.env.JWT_KEY;

// Here, passport is defining as a middleware
var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  switch (jwt_payload.type) {
    case 'app': {
      let database = jwt_payload.database;
      let dbUser = db.useDb(database);
      const User = dbUser.model('User', UserSchema);
      User.findById(jwt_payload.id, function(err, nuser) {
        let user = {
          _id: nuser._id,
          email: nuser.email,
          username: nuser.username,
          database: database,
          permissions: nuser.permissions
        };
        if (err) return next(err, false);
        user['database'] = database;
        if (user) {
          return next(null, user);
        } else {
          return next(null, false);
        }
      });
      break;
    }
    case 'dashboard':
      Business.findById(jwt_payload.id, function(err, user) {

        if (err) return next(err, false);

        if (user) {
          return next(null, user);
        } else {
          return next(null, false);
        }
      });
      break;
    default:
      break;
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
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
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