var express = require('express');
var router = express.Router();

const User = require('../models/user');

// Create new user
router.post('/', (req, res) => {

  var user = new User(req.body);
  user.save()
    .then(doc => {
      res.send({
        status: 200,
        message: 'User created',
        result: doc
      });
    })
    .catch(err => {
      res.send({
        status: 503,
        message: 'Error to create user',
        result: err
      });
    });
});

module.exports = router;