const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const secretKey = process.env.JWT_KEY;
const User = require('../models/user');

router.post('/', function (req, res) {

  if (!req.body.email || !req.body.password) {
    return res.status(401).send({
      message: 'Incorrect credentials'
    });
  }

  User.findOne({ email: req.body.email }, function (err, user) {

    if (!user) {
      return res.status(401).send({
        message: 'Incorrect credentials'
      });
    }

    if (user) {
      bcrypt.compare(req.body.password, user.password, (err, isMatch) => {

        if (!isMatch) {
          return res.status(401).send({
            message: 'Incorrect credentials'
          });
        }

        if (isMatch) {
          var payload = {id: user._id};
          var token = jwt.sign(payload, secretKey);

          user.password = undefined;
          res.status(200).send({
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