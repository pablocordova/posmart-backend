const express = require('express');
const passport = require('passport');

const router = express.Router();
const config = require('../config/general');
const configCustomers = require('../config/customers');
const CustomerSchema = require('../squemas/customer');
const SaleSchema = require('../squemas/sale');

const db = require('../app').db;
let Customer = '';
let Sale = '';

// Middleware to check permissions
let chooseDB = (req, res, next) => {

  // Use its respective database
  let dbAccount = db.useDb(req.user.database);
  Customer = dbAccount.model('Customer', CustomerSchema);
  Sale = dbAccount.model('Sale', SaleSchema);
  next();

};

// Middleware to check role only dashboard
let hasAppRole = (req, res, next) => {

  if (req.user.role != 'app') {
    res.status(config.STATUS.UNAUTHORIZED).send({
      message: config.RES.UNAUTHORIZED
    });
  } else {
    next();
  }

};


router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  hasAppRole,
  chooseDB,
  async (req, res) => {

    if (!req.body.firstname) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.MISSING_PARAMETER,
        result: 'firstname'
      });
    }

    // Check if firstname is duplicated
    const existFirstname = await Customer.find({ firstname: req.body.firstname });
    if (existFirstname.length !== 0) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.ITEM_DUPLICATED,
        result: configCustomers.RES.DUPLICATED_FIRSTNAME
      });
    }

    let customer = new Customer(req.body);

    customer.save()
      .then((customerCreated) => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.CREATED,
          result: customerCreated
        });
      })
      .catch((err) => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR,
          result: err
        });
      });

  }
);

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  hasAppRole,
  chooseDB,
  (req, res) => {

    Customer.find({})
      .then(customers => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: customers
        });
      })
      .catch(err => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR,
          result: err
        });
      });

  }
);

router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  hasAppRole,
  chooseDB,
  (req, res) => {

    Customer.findById(req.params.id)
      .then(customer => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: customer
        });
      })
      .catch(err => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR,
          result: err
        });
      });

  }
);

router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  hasAppRole,
  chooseDB,
  async (req, res) => {

    if (!req.body.firstname) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.MISSING_PARAMETER,
        result: 'firstname'
      });
    }

    // Check if firstname is duplicated
    const existFirstname = await Customer.find({ firstname: req.body.firstname });
    if (existFirstname.length !== 0 && existFirstname._id !== req.params.id) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.ITEM_DUPLICATED,
        result: configCustomers.RES.DUPLICATED_FIRSTNAME
      });
    }


    Customer.findById(req.params.id)
      .then(customer => {

        if (!customer) {
          return res.status(config.STATUS.OK).send({
            message: configCustomers.RES.NOT_FOUND,
            result: req.params.id
          });
        }

        customer.firstname = req.body.firstname;
        customer.lastname = req.body.lastname;
        customer.dni = req.body.dni;
        customer.phone = req.body.phone;
        customer.address = req.body.address;

        customer.save()
          .then((customerUpdated) => {
            return res.status(config.STATUS.OK).send({
              message: config.RES.UPDATED,
              result: customerUpdated
            });
          })
          .catch(err => {
            return res.status(config.STATUS.SERVER_ERROR).send({
              message: config.RES.ERROR,
              result: err
            });
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

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  hasAppRole,
  chooseDB,
  async (req, res) => {

    // First check if customer already has sales
    const sales = await Sale.find({ client: req.params.id });

    if (sales.length > 0) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: configCustomers.RES.CUSTOMER_IN_SALE
      });
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(config.STATUS.OK).send({
        message: configCustomers.RES.NOT_FOUND,
        result: req.params.id
      });
    }

    Customer.findByIdAndRemove(req.params.id)
      .then(customerDeleted => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.DELETED,
          result: customerDeleted
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

module.exports = router;