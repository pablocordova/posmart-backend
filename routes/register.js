const config = require('../config/register');
const express = require('express');
const moment = require('moment');

const BusinessSchema = require('../models/business');
const CustomerSchema = require('../models/customer');

const router = express.Router();

const db = require('../app').db;
var dbGeneral = db.useDb(process.env.DATABASE_GENERAL);
var Business = dbGeneral.model('Business', BusinessSchema);

var anysize = 5; //the size of string 
var charset = 'abcdefghijklmnopqrstuvwxyz';

// Create new user
router.post('/', (req, res) => {

  if (req.body.password !== req.body.passwordRepeat) {
    return res.status(config.STATUS.SERVER_ERROR).send({
      message: config.RES.NOT_MATCH_PASS
    });
  }

  // To generate random string
  let randomString='';
  for (var i=0; i < anysize; i++ ) {
    randomString += charset[Math.floor(Math.random() * charset.length)];
  }

  let business = new Business();
  business.business = req.body.business;
  business.email = req.body.email;
  business.password = req.body.password;
  business.database = randomString + String(moment().unix());

  // Also crete the first default customer
  let dbAccount = db.useDb(business.database);
  let Customer = dbAccount.model('Customer', CustomerSchema);

  let customer = new Customer();
  customer.firstname = 'Cliente';
  customer.save();

  business.save()
    .then((businessCreated) => {
      return res.status(config.STATUS.CREATED).send({
        message: config.RES.CREATED,
        result: businessCreated
      });
    })
    .catch((err) => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR,
        result: err
      });
    });

});

module.exports = router;