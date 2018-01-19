const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const validator = require('validator');

const config = require('../config/general');
const configUsers = require('../config/users');

const UserSchema = require('../squemas/user');
const SaleSchema = require('../squemas/sale');

const router = express.Router();

const db = require('../app').db;
let User = '';
let Sale = '';

// Middleware to check permissions
let chooseDB = (req, res, next) => {

  // Use its respective database
  let dbAccount = db.useDb(req.user.database);
  User = dbAccount.model('User', UserSchema);
  Sale = dbAccount.model('Sale', SaleSchema);
  next();

};

// Middleware to check role only dashboard
let hasDashboardRole = (req, res, next) => {

  if (req.user.role != 'dashboard') {
    res.status(config.STATUS.UNAUTHORIZED).send({
      message: config.RES.UNAUTHORIZED
    });
  } else {
    next();
  }

};

// Create new user
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {

    let user = new User(req.body);
    // Validate params
    const isEmail = validator.isEmail(user.email + '');
    const isLengthUser = validator.isLength(user.username + '', configUsers.USERNAME);
    const isLengthPass = validator.isLength(user.password + '', configUsers.PASSWORD);
    const isAlphanumericPass = validator.isAlphanumeric(
      user.password + '', configUsers.PASSWORD_LOCAL
    );

    if (!isEmail || !isLengthUser || !isLengthPass || !isAlphanumericPass) {
      return res.status(config.STATUS.SERVER_ERROR).send({ message: config.RES.INPUTS_NO_VALID });
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
            message: config.RES.ERROR_DATABASE,
            result: err
          });
        });
    }

  }
);

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {

    User.find({})
      .then(users => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: users
        });
      })
      .catch(err => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_DATABASE,
          result: err
        });
      });

  }
);

router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {

    User.findById(req.params.id)
      .then(user => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: user
        });
      })
      .catch(err => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_DATABASE,
          result: err
        });
      });

  }
);

router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {

    // Validate params
    const isEmail = validator.isEmail(req.body.email + '');
    const isLengthUser = validator.isLength(req.body.username + '', configUsers.USERNAME);

    if (!isEmail || !isLengthUser) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.INPUTS_NO_VALID
      });
    } else {
      User.findById(req.params.id, (err, user) => {

        if (err) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR_DATABASE
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
                message: config.RES.ERROR_DATABASE,
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

  }
);

router.put(
  '/:id/enabled',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {

    User.findById(req.params.id, (err, user) => {

      if (err) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_DATABASE,
          result: err
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
            message: config.RES.ERROR_DATABASE,
            result: err
          });
        });

    });

  }

);

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  async (req, res) => {

    // First check if user already has sales sells
    const sale = await Sale.find({ seller: mongoose.Types.ObjectId(req.params.id) });

    if (sale.length > 0) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.INPUTS_NO_VALID
      });
    }

    User.findByIdAndRemove(req.params.id, (err, user) => {

      if (err) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_DATABASE,
          result: user
        });
      }

      return res.status(config.STATUS.OK).send({
        message: config.RES.OK,
        result: user
      });

    });

  }

);

module.exports = router;