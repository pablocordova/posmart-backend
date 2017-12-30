const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const config = require('../config/login');
const secretKey = process.env.JWT_KEY;

let UserSchema = require('../models/user');
let BusinessSchema = require('../models/business');

const db = require('../app').db;
let dbGeneral = db.useDb(process.env.DATABASE_GENERAL);
let Business = dbGeneral.model('Business', BusinessSchema);

router.post('/', async function (req, res) {

  if (!req.body.email || !req.body.password) {
    return res.status(config.STATUS.SERVER_ERROR).send({
      message: 'Incorrect credentials'
    });
  }

  let businesses = await Business.find({});
  let databaseName = '';
  let businessName = '';
  let permissionPin = '';

  for (let business of businesses) {
    let strToCompare = business.database.substring(0, 3) + business.database.substring(12, 15);
    if (strToCompare === req.body.code) {
      databaseName = business.database;
      businessName = business.business;
      permissionPin = business.permissionPin;
      break;
    }
  }

  if (databaseName === '') {
    return res.status(config.STATUS.SERVER_ERROR).send({
      message: 'Business not found'
    });
  }

  let dbUser = db.useDb(databaseName);
  let User = dbUser.model('User', UserSchema);

  User.findOne({ email: req.body.email }, function (err, user) {

    if (!user) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: 'User doesnt exits'
      });
    }

    if (user) {
      bcrypt.compare(req.body.password, user.password, (err, isMatch) => {

        if (!isMatch) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: 'Incorrect password'
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

  if (!req.body.email || !req.body.password) {
    return res.status(config.STATUS.SERVER_ERROR).send({
      message: 'Incorrect credentials'
    });
  }

  Business.findOne({ email: req.body.email }, function (err, business) {

    if (!business) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: 'Incorrect credentials'
      });
    }

    if (business) {
      bcrypt.compare(req.body.password, business.password, (err, isMatch) => {

        if (!isMatch) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: 'Incorrect credentials'
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