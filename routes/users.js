const config = require('../config/users.js');
const express = require('express');
const router = express.Router();

const User = require('../models/user');

// Create new user
router.post('/', (req, res) => {

  let user = new User(req.body);

  user.save()
    .then(doc => {
      res.send({ status: config.STATUS.OK, message: config.RES.CREATED, result: doc });
    })
    .catch(err => {
      res.send({ status: config.STATUS.ERROR, message: config.RES.NOCREATED, result: err });
    });
});

module.exports = router;