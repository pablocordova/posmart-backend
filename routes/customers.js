const express = require('express');
const passport = require('passport');
const validator = require('validator');

const router = express.Router();
const config = require('../config/customers');
const Customer = require('../models/customer');
const Sale = require('../models/sale');

// My middleware to check permissions
let haspermission = (req, res, next) => {

  if (req.user.permissions.customers) {
    next();
  } else {
    res.status(config.STATUS.UNAUTHORIZED).send({
      message: config.RES.UNAUTHORIZED
    });
  }

};

router.post('/', passport.authenticate('jwt', { session: false }), haspermission, (req, res) => {

  const dniIsEmpty = validator.isEmpty(req.body.dni + '');
  const firstnameIsEmpty = validator.isEmpty(req.body.firstname + '');

  if ( dniIsEmpty || firstnameIsEmpty) {
    return res.status(config.STATUS.SERVER_ERROR).send({
      message: config.RES.ERROR
    });
  }

  let customer = new Customer();
  customer.firstname = req.body.firstname;
  customer.lastname = req.body.lastname;
  customer.dni = req.body.dni;
  customer.phone = req.body.phone;
  customer.address = req.body.address;

  customer.save()
    .then(() => {
      return res.status(config.STATUS.CREATED).send({
        message: config.RES.CREATED
      });
    })
    .catch(() => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.NOCREATED
      });
    });

});

router.get('/', passport.authenticate('jwt', { session: false }), haspermission, (req, res) => {

  Customer.find({})
    .then(customers => {
      return res.status(config.STATUS.OK).send({
        result: customers,
        message: config.RES.OK,
      });
    })
    .catch(() => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR,
      });
    });

});

router.get('/:id', passport.authenticate('jwt', { session: false }), haspermission, (req, res) => {

  Customer.findById(req.params.id)
    .then(customer => {
      return res.status(config.STATUS.OK).send({
        result: customer,
        message: config.RES.OK,
      });
    })
    .catch(() => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR,
      });
    });

});

router.put('/:id', passport.authenticate('jwt', { session: false }), haspermission, (req, res) => {

  const dniIsEmpty = validator.isEmpty(req.body.dni + '');
  const firstnameIsEmpty = validator.isEmpty(req.body.firstname + '');

  if ( dniIsEmpty || firstnameIsEmpty) {
    return res.status(config.STATUS.SERVER_ERROR).send({
      message: config.RES.ERROR
    });
  }

  Customer.findById(req.params.id, (err, customer) => {

    if (err) {
      return res.status(config.STATUS.ERROR).send({
        message: config.RES.SERVER_ERROR
      });
    }

    if (!res) {
      return res.status(config.STATUS.ERROR).send({
        message: config.RES.CUSTOMER_NOT_EXIST
      });
    }

    customer.firstname = req.body.firstname;
    customer.lastname = req.body.lastname;
    customer.dni = req.body.dni;
    customer.phone = req.body.dni;
    customer.address = req.body.address;

    customer.save()
      .then((customerUpdated) => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.UPDATED,
          result: customerUpdated
        });
      })
      .catch(() => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR
        });
      });

  });

});

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) => {

    // First check if customer already has sales
    const sales = await Sale.find({ client: req.params.id });

    if (sales.length > 0) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.CUSTOMER_SALES
      });
    }

    Customer.findByIdAndRemove(req.params.id, (err, customer) => {

      if (err) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR
        });
      }

      return res.status(config.STATUS.OK).send({
        message: customer
      });

    });


  }
);

module.exports = router;