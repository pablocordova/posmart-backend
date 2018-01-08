const express = require('express');
const passport = require('passport');
//const validator = require('validator');
const _ = require('lodash');

const router = express.Router();
const config = require('../config/buys');
const BuySchema = require('../models/buy');
const ProductSchema = require('../models/product');

const db = require('../app').db;
let Buy = '';
let Product = '';

// My middleware to check permissions
let haspermission = (req, res, next) => {

  let permission = req.user.permissions ? req.user.permissions.customers : true;

  if (permission) {
    // Use its respective database
    let dbAccount = db.useDb(req.user.database);
    Buy = dbAccount.model('Buy', BuySchema);
    Product = dbAccount.model('Product', ProductSchema);
    next();
  } else {
    res.status(config.STATUS.UNAUTHORIZED).send({
      message: config.RES.UNAUTHORIZED
    });
  }

};

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  haspermission,
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
          message: config.RES.ERROR,
          result: err
        });
      });

  }
);

router.post(
  '/:id/credits',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) =>
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
          message: config.RES.ERROR,
          result: err
        });
      });

  }
);

router.post(
  '/search/advanced',
  passport.authenticate('jwt', { session: false }),
  haspermission,
  (req, res) => {

    Buy.find({})
      .sort({ date: -1 })
      .then(buys => {
        return res.status(config.STATUS.OK).send({
          result: buys,
          message: config.RES.OK,
        });
      })
      .catch(() => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR,
        });
      });

  }
);

router.get(
  '/:id/credits',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) =>
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
          message: config.RES.ERROR
        });
      });

  }
);

router.put(
  '/:id/state',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) =>
  {

    Buy.findByIdAndUpdate(
      req.params.id,
      { state: req.body.state },
      { new: true },
      (err, buyUpdated) => {

        if (err) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR,
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

router.delete(
  '/:id/credits/:indexCredit',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) => {

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
          message: config.RES.ERROR
        });
      });

  }
);

module.exports = router;