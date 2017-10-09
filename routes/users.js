const config = require('../config/users');
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
    res.status(config.STATUS.BAD_REQ).send({ message: config.RES.NOCREATED });
  } else {
    user.save()
      .then(() => {
        return res.status(config.STATUS.CREATED).send({ message: config.RES.CREATED });
      })
      .catch(() => {
        return res.status(config.STATUS.SERVER_ERROR).send({ message: config.RES.NOCREATED });
      });
  }
});

module.exports = router;