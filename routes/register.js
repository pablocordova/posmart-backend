const express = require('express');
const moment = require('moment');
const validator = require('validator');

const config = require('../config/general');
const configRegister = require('../config/register');

const BusinessSchema = require('../squemas/business');
const CustomerSchema = require('../squemas/customer');

const router = express.Router();

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

var dbGeneral = db.useDb(database);
var Business = dbGeneral.model('Business', BusinessSchema);

var anysize = 5; //the size of string 
var charset = 'abcdefghijklmnopqrstuvwxyz';

// Create new user
router.post('/', async (req, res) => {

  // Check if all parameters exist

  if (!req.body.business) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.MISSING_PARAMETER,
      result: 'business'
    });
  }

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

  // Check if business name have more than 1 character

  if (req.body.business.length <= 1) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.INVALID_SYNTAX,
      result: configRegister.RES.INVALID_BUSINESS_NAME
    });
  }

  // Check if password have more than 1 character

  if (req.body.password.length <= 1) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.INVALID_SYNTAX,
      result: configRegister.RES.INVALID_PASSWORD
    });
  }

  // Check if email have correct format
  if (!validator.isEmail(req.body.email)) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.INVALID_SYNTAX,
      result: configRegister.RES.INVALID_EMAIL
    });
  }

  // Check if a business already have the email

  const existEmail = await Business.find({ email: req.body.email });

  if (existEmail.length !== 0) {
    return res.status(config.STATUS.BAD_REQUEST).send({
      message: config.RES.ITEM_DUPLICATED,
      result: configRegister.RES.ERROR_DUPLICATED_EMAIL
    });
  }

  // To generate random string
  let randomString = '';
  for (var i = 0; i < anysize; i++ ) {
    randomString += charset[Math.floor(Math.random() * charset.length)];
  }

  let business = new Business();
  business.business = req.body.business;
  business.email = req.body.email;
  business.password = req.body.password;

  let databaseCustom = '';
  switch (process.env.NODE_ENV) {
    case 'test':
      databaseCustom = process.env.DATABASE_TEST;
      break;
    case 'development':
      databaseCustom = randomString + String(moment().unix());
      break;
  }

  business.database = databaseCustom;

  // Also create the first default customer
  let dbAccount = db.useDb(business.database);
  let Customer = dbAccount.model('Customer', CustomerSchema);

  let customer = new Customer();
  customer.firstname = 'Cliente';
  customer.save();

  business.save()
    .then((businessCreated) => {
      return res.status(config.STATUS.OK).send({
        message: config.RES.CREATED,
        result: businessCreated
      });
    })
    .catch((err) => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR_DATABASE,
        result: err
      });
    });

});

module.exports = router;