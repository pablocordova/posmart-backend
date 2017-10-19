const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const config = require('../config/login');
const secretKey = process.env.JWT_KEY;
const User = require('../models/user');

router.post('/', function (req, res) {

  if (!req.body.email || !req.body.password) {
    return res.status(config.STATUS.SERVER_ERROR).send({
      message: 'Incorrect credentials'
    });
  }

  User.findOne({ email: req.body.email }, function (err, user) {

    if (!user) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: 'Incorrect credentials'
      });
    }

    if (user) {
      bcrypt.compare(req.body.password, user.password, (err, isMatch) => {

        if (!isMatch) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: 'Incorrect credentials'
          });
        }

        if (isMatch) {
          var payload = { id: user._id };
          var token = jwt.sign(payload, secretKey);

          user.password = undefined;
          res.status(config.STATUS.OK).send({
            token: token,
            username: user.username,
            email: user.email,
            type: user.type,
            _id: user._id
          });
        }
      });
    }
  });

});

module.exports = router;