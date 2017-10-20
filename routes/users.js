const config = require('../config/users');
const express = require('express');
const passport = require('passport');
const validator = require('validator');

const User = require('../models/user');

const router = express.Router();


// My middleware to check permissions
let hasPermission = (req, res, next) => {

  if (req.user.permissions.users) {
    next();
  } else {
    res.status(config.STATUS.UNAUTHORIZED).send({
      message: config.RES.UNAUTHORIZED
    });
  }

};

// Create new user
router.post('/', (req, res) => {

  // Check because maybe the user has any permission
  if (req.body.permissions) req.body.permissions = JSON.parse(req.body.permissions);

  let user = new User(req.body);
  // Validate params
  const isEmail = validator.isEmail(user.email + '');
  const isLengthUser = validator.isLength(user.username + '', config.USERNAME);
  const isLengthPass = validator.isLength(user.password + '', config.PASSWORD);
  const isAlphanumericPass = validator.isAlphanumeric(user.password + '', config.PASSWORD_LOCAL);

  if (!isEmail || !isLengthUser || !isLengthPass || !isAlphanumericPass) {
    return res.status(config.STATUS.SERVER_ERROR).send({ message: config.RES.NOCREATED });
  } else {
    user.save()
      .then((userCreated) => {
        userCreated.password = undefined;
        return res.status(config.STATUS.CREATED).send({
          message: config.RES.CREATED,
          result: userCreated
        });
      })
      .catch((err) => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.NOCREATED,
          result: err
        });
      });
  }

});

router.get('/', passport.authenticate('jwt', { session: false }), hasPermission, (req, res) => {

  User.find({})
    .then(users => {
      return res.status(config.STATUS.OK).send({
        message: config.RES.OK,
        result: users
      });
    })
    .catch(err => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR,
        result: err
      });
    });

});

router.get('/:id', passport.authenticate('jwt', { session: false }), hasPermission, (req, res) => {

  User.findById(req.params.id)
    .then(user => {
      return res.status(config.STATUS.OK).send({
        message: config.RES.OK,
        result: user
      });
    })
    .catch(err => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR,
        result: err
      });
    });

});

router.put('/:id', passport.authenticate('jwt', { session: false }), hasPermission, (req, res) => {

  // Check because maybe the user has any permission
  if (req.body.permissions) req.body.permissions = JSON.parse(req.body.permissions);

  // Validate params
  const isEmail = validator.isEmail(req.body.email + '');
  const isLengthUser = validator.isLength(req.body.username + '', config.USERNAME);

  if (!isEmail || !isLengthUser) {
    return res.status(config.STATUS.SERVER_ERROR).send({
      message: config.RES.ERROR
    });
  } else {
    User.findById(req.params.id, (err, user) => {

      if (err) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR
        });
      }

      user.email = req.body.email;
      user.username = req.body.username;
      user.permissions = req.body.permissions;

      user.save()
        .then((userUpdated) => {
          userUpdated.password = undefined;
          return res.status(config.STATUS.OK).send({
            message: config.RES.OK,
            result: userUpdated
          });
        })
        .catch((err) => {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR,
            result: err
          });
        });

    });

  }

});

router.put(
  '/:id/enabled',
  passport.authenticate('jwt', { session: false }),
  hasPermission, (req, res) => {

    User.findById(req.params.id, (err, user) => {

      if (err) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: err
        });
      }

      user.enabled = req.body.enabled;

      user.save()
        .then((userUpdated) => {
          userUpdated.password = undefined;
          return res.status(config.STATUS.OK).send({
            message: config.RES.OK,
            result: userUpdated
          });
        })
        .catch((err) => {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR,
            result: err
          });
        });

    });

  }

);

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  hasPermission, async (req, res) => {

    // First check if user already has sales sells
    const user = await User.find({ seller: req.params.id });

    if (user.length > 0) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.USER_SALES
      });
    }

    User.findByIdAndRemove(req.params.id, (err, user) => {

      if (err) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR
        });
      }

      return res.status(config.STATUS.OK).send({
        message: user
      });

    });

  }

);

module.exports = router;