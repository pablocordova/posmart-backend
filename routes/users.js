const config = require('../config/users');
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const validator = require('validator');

const UserSchema = require('../models/user');
const SaleSchema = require('../models/sale');

const router = express.Router();

const db = require('../app').db;
let User = '';
let Sale = '';

// My middleware to check permissions
let hasPermission = (req, res, next) => {

  let permission = req.user.permissions ? req.user.permissions.users : true;

  if (permission) {
    // Use its respective database
    let dbAccount = db.useDb(req.user.database);
    User = dbAccount.model('User', UserSchema);
    Sale = dbAccount.model('Sale', SaleSchema);
    next();
  } else {
    res.status(config.STATUS.UNAUTHORIZED).send({
      message: config.RES.UNAUTHORIZED
    });
  }

};

// Create new user
router.post('/', passport.authenticate('jwt', { session: false }), hasPermission, (req, res) => {

  // Check because maybe the user has any permission
  //if (req.body.permissions) req.body.permissions = JSON.parse(req.body.permissions);

  let user = new User(req.body);
  // Validate params
  const isEmail = validator.isEmail(user.email + '');
  const isLengthUser = validator.isLength(user.username + '', config.USERNAME);
  const isLengthPass = validator.isLength(user.password + '', config.PASSWORD);
  const isAlphanumericPass = validator.isAlphanumeric(user.password + '', config.PASSWORD_LOCAL);

  if (!isEmail || !isLengthUser || !isLengthPass || !isAlphanumericPass) {
    return res.status(config.STATUS.SERVER_ERROR).send({ message: config.RES.INVALID_PARAMS });
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
  //if (req.body.permissions) req.body.permissions = JSON.parse(req.body.permissions);

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

      User.findByIdAndUpdate(
        user._id,
        {
          email: req.body.email,
          username: req.body.username,
          permissions: req.body.permissions,
          permissionDiscount: req.body.permissionDiscount
        },
        { new: true },
        (err, userUpdated) => {

          if (err) {
            return res.status(config.STATUS.SERVER_ERROR).send({
              message: config.RES.ERROR,
              result: err
            });
          }
          userUpdated.password = undefined;
          return res.status(config.STATUS.OK).send({
            message: config.RES.OK,
            result: userUpdated
          });

        }
      );

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
    const sale = await Sale.find({ seller: mongoose.Types.ObjectId(req.params.id) });

    if (sale.length > 0) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.USER_SALES
      });
    }

    User.findByIdAndRemove(req.params.id, (err, user) => {

      if (err) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR,
          result: user
        });
      }

      return res.status(config.STATUS.OK).send({
        message: config.RES.DELETE_OK,
        result: user
      });

    });

  }

);

module.exports = router;