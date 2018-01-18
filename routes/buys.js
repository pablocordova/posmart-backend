
// Dependencies
const express = require('express');
const moment = require('moment');
const passport = require('passport');
const _ = require('lodash');
const router = express.Router();

const config = require('../config/general');

const BuySchema = require('../squemas/buy');
const ProductSchema = require('../squemas/product');

const db = require('../app').db;

let Buy = '';
let Product = '';

// Middleware to check permissions
let chooseDB = (req, res, next) => {

  // Use its respective database
  let dbAccount = db.useDb(req.user.database);
  Buy = dbAccount.model('Buy', BuySchema);
  Product = dbAccount.model('Product', ProductSchema);
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

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  async (req, res) => {

    let buy = new Buy();
    buy.id = req.body.id;
    buy.date = req.body.date;
    buy.company = req.body.company;
    buy.total = req.body.total;
    buy.products = req.body.products;

    // Update inventory and cost
    for (let product of req.body.products) {
      let quantityToAdd = parseFloat(product.itemsPricesChosen) * parseFloat(product.quantity);
      let costToAdd = _.round(parseFloat(product.total) / quantityToAdd, 10);
      let productFound = await Product.findById(product.idProductChosen);
      productFound.unitCost = productFound.unitCost !== 0 ?
        _.round(
          ((productFound.quantity * productFound.unitCost) + (costToAdd * quantityToAdd)) /
          (productFound.quantity + quantityToAdd), 10
        ) :
        parseFloat(costToAdd);

      productFound.quantity = productFound.quantity + quantityToAdd;

      await productFound.save();
    }

    buy.save()
      .then((buyCreated) => {
        return res.status(config.STATUS.CREATED).send({
          message: config.RES.CREATED,
          result: buyCreated
        });
      })
      .catch((err) => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_CREATE,
          result: err
        });
      });

  }
);

router.get(
  '/search/advanced',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {

    Buy.find({})
      .sort({ date: -1 })
      .then(buys => {

        // Filter by search
        if (req.query.id !== '') {
          buys = buys.filter(buy => {
            return buy.id === req.query.id.trim().toLowerCase();
          });
        }

        if (req.query.day !== '') {
          buys = buys.filter(buy => {
            const day = String(moment.utc(buy.date).format('YYYY-MM-DD'));
            return day === req.query.day;
          });
        }

        if (req.query.company !== '') {
          buys = buys.filter(buy => {
            return buy.company === req.query.company.trim().toLowerCase();
          });
        }

        return res.status(config.STATUS.OK).send({
          result: buys,
          message: config.RES.OK,
        });
      })
      .catch(() => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_DATABASE,
        });
      });

  }
);

router.get(
  '/:id/credits',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  async (req, res) =>
  {

    Buy.findById(req.params.id)
      .then(buy => {
        return res.status(config.STATUS.OK).send({
          result: buy.credits,
          message: config.RES.OK
        });
      })
      .catch(() => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_DATABASE
        });
      });

  }
);

router.patch(
  '/:id/credits',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  async (req, res) =>
  {

    let buy = await Buy.findById(req.params.id);

    let credits = [];
    if (buy.credits) {
      credits = buy.credits;
    }

    let credit = {
      date: req.body.date,
      amount: req.body.amount
    };

    credits.push(credit);

    buy.credits = credits;

    buy.save()
      .then((buyUpdated) => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: buyUpdated
        });
      })
      .catch((err) => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_UPDATE,
          result: err
        });
      });

  }
);

router.patch(
  '/:id/state',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  async (req, res) =>
  {

    Buy.findByIdAndUpdate(
      req.params.id,
      { state: req.body.state },
      { new: true },
      (err, buyUpdated) => {

        if (err) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR_DATABASE,
            result: err
          });
        }

        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: buyUpdated
        });

      }
    );

  }
);

router.patch(
  '/:id/credits/:indexCredit',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  async (req, res) => {

    // First check if products already has sales
    let buy = await Buy.findById(req.params.id);

    // Remove specific array element
    buy.credits.splice(req.params.indexCredit, 1);

    buy.save()
      .then((buyUpdated) => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: buyUpdated
        });
      })
      .catch(() => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_UPDATE
        });
      });

  }
);

module.exports = router;