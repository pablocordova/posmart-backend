const config = require('../config/users.js');
const express = require('express');
const validator = require('validator');

const User = require('../models/user');

const router = express.Router();

// Create new user
router.post('/', (req, res) => {

  let user = new User(req.body);
  // Validate params

  const isEmail = validator.isEmail(user.email + '');
  const isLengthUser = validator.isLength(user.username + '', config.USERNAME);
  const isLengthPass = validator.isLength(user.password + '', config.PASSWORD);
  const isAlphanumericPass = validator.isAlphanumeric(user.password + '', config.PASSWORD_LOCAL);

  if (!isEmail || !isLengthUser || !isLengthPass || !isAlphanumericPass) {
    res.send({ status: config.STATUS.ERROR, message: config.RES.NOCREATED });
  } else {
    user.save()
      .then(doc => {
        res.send({ status: config.STATUS.OK, message: config.RES.CREATED, result: doc });
      })
      .catch(err => {
        res.send({ status: config.STATUS.ERROR, message: config.RES.NOCREATED, result: err });
      });
  }
});

module.exports = router;