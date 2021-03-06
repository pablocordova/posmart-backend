const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const router = express.Router();

const config = require('../config/general');
const configLogin = require('../config/login');

const secretKey = process.env.JWT_KEY;

let UserSchema = require('../squemas/user');
let BusinessSchema = require('../squemas/business');

const db = require('../app').db;

let database = '';

switch (process.env.NODE_ENV) {
  case 'test':
    database = process.env.DATABASE_TEST;
    break;
  case 'development':
    database = process.env.DATABASE_GENERAL;
    break;
}

let dbGeneral = db.useDb(database);
let Business = dbGeneral.model('Business', BusinessSchema);

router.post('/', async function (req, res) {

  if (!req.body.email) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.MISSING_PARAMETER,
      result: 'email'
    });
  }

  if (!req.body.password) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.MISSING_PARAMETER,
      result: 'password'
    });
  }

  if (!req.body.code) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.MISSING_PARAMETER,
      result: 'code'
    });
  }

  // Check if email have correct format
  if (!validator.isEmail(req.body.email)) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.INVALID_SYNTAX,
      result: configLogin.RES.INVALID_EMAIL
    });
  }

  let businesses = await Business.find({});
  let databaseName = '';
  let businessName = '';
  let permissionPin = '';

  for (let business of businesses) {
    let strToCompare = business.database.substring(0, 3) + business.database.substring(12, 15);
    // Only for test case
    if (process.env.NODE_ENV === 'test') {
      strToCompare = process.env.DATABASE_TEST;
    }

    if (strToCompare === req.body.code) {
      databaseName = business.database;
      businessName = business.business;
      permissionPin = business.permissionPin;
      break;
    }
  }

  if (databaseName === '') {
    return res.status(config.STATUS.OK).send({
      message: configLogin.RES.NOT_BUSINESS
    });
  }

  let databaseCustom = '';
  switch (process.env.NODE_ENV) {
    case 'test':
      databaseCustom = process.env.DATABASE_TEST;
      break;
    case 'development':
      databaseCustom = databaseName;
      break;
  }

  let dbUser = db.useDb(databaseCustom);
  let User = dbUser.model('User', UserSchema);

  User.findOne({ email: req.body.email }, function (err, user) {

    if (!user) {
      return res.status(config.STATUS.OK).send({
        message: configLogin.RES.NOT_USER
      });
    }

    if (user) {
      bcrypt.compare(req.body.password, user.password, (err, isMatch) => {

        if (!isMatch) {
          return res.status(config.STATUS.OK).send({
            message: configLogin.RES.WRONG_PASS
          });
        }

        if (isMatch) {
          var payload = { id: user._id, type: 'app', database: databaseName };
          var token = jwt.sign(payload, secretKey);

          user.password = undefined;
          return res.status(config.STATUS.OK).send({
            token: token,
            username: user.username,
            email: user.email,
            businessName: businessName,
            permissionDiscount: user.permissionDiscount,
            permissionPin: permissionPin,
            _id: user._id
          });
        }
      });
    }
  });

});

router.post('/business', function (req, res) {

  if (!req.body.email) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.MISSING_PARAMETER,
      result: 'email'
    });
  }

  if (!req.body.password) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.MISSING_PARAMETER,
      result: 'password'
    });
  }

  // Check if password have more than 1 character
  if (req.body.password.length <= 1) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.INVALID_SYNTAX,
      result: configLogin.RES.INVALID_PASSWORD
    });
  }

  // Check if email have correct format
  if (!validator.isEmail(req.body.email)) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.INVALID_SYNTAX,
      result: configLogin.RES.INVALID_EMAIL
    });
  }

  Business.findOne({ email: req.body.email }, function (err, business) {

    if (!business) {
      return res.status(config.STATUS.OK).send({
        message: configLogin.RES.NOT_USER
      });
    }

    if (business) {
      bcrypt.compare(req.body.password, business.password, (err, isMatch) => {

        if (!isMatch) {
          return res.status(config.STATUS.OK).send({
            message: configLogin.RES.WRONG_PASS
          });
        }

        if (isMatch) {
          var payload = { id: business._id, type: 'dashboard' };
          var token = jwt.sign(payload, secretKey);

          business.password = undefined;
          return res.status(config.STATUS.OK).send({
            token: token,
            username: business.business,
            email: business.email,
            businessName: business.business,
            _id: business._id
          });
        }
      });
    }
  });

});

module.exports = router;