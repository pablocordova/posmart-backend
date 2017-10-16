const express = require('express');
const moment = require('moment');
const mongoose = require('mongoose');
const passport = require('passport');
const validator = require('validator');

const router = express.Router();
const config = require('../config/products');
const Product = require('../models/product');

router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {

  let product = new Product();
  product.name = req.body.name;
  product.minimumUnit = req.body.minimumUnit;
  product.category = req.body.category;
  product.picture = req.body.picture;

  product.save()
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

router.post('/entry', passport.authenticate('jwt', { session: false }), (req, res) => {

  const quantityIsEmpty = validator.isEmpty(req.body.quantity + '');
  const unitCostIsEmpty = validator.isEmpty(req.body.unitCost + '');
  const productIsEmpty = validator.isEmpty(req.body.product + '');
  const quantityIsNumeric = validator.isNumeric(req.body.quantity + '');
  const unitCostIsDecimal = validator.isDecimal(req.body.unitCost + '');
  const arePositives = req.body.quantity >= 0 && req.body.unitCost >= 0;

  if ( quantityIsEmpty || unitCostIsEmpty || productIsEmpty || !quantityIsNumeric ||
    !unitCostIsDecimal || !arePositives) {
    return res.status(config.STATUS.SERVER_ERROR).send({
      message: config.RES.ERROR
    });
  }

  Product.findById(req.body.product)
    .then(product => {

      req.body.date = moment();
      product.entries.push(req.body);
      product.save()
        .then(() => {
          return res.status(config.STATUS.CREATED).send({
            message: config.RES.CREATED
          });
        })
        .catch(() => {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR
          });
        });
    })
    .catch(() => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR
      });
    });

});

router.post('/price', passport.authenticate('jwt', { session: false }), (req, res) => {

  const quantityIsEmpty = validator.isEmpty(req.body.quantity + '');
  const nameIsEmpty = validator.isEmpty(req.body.name + '');
  const itemsIsNumeric = validator.isNumeric(req.body.items + '');
  const priceIsDecimal = validator.isDecimal(req.body.price + '');

  if ( quantityIsEmpty || nameIsEmpty || !itemsIsNumeric || !priceIsDecimal) {
    return res.status(config.STATUS.SERVER_ERROR).send({
      message: config.RES.ERROR
    });
  }

  Product.findById(req.body.product)
    .then(product => {

      // check case it is repeat data, TODO: research how to do this in the schema
      for (let price of product.prices) {
        if (price.quantity === req.body.quantity || price.name === req.body.name) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR
          });
        }
      }

      product.prices.push(req.body);
      product.save()
        .then(() => {
          return res.status(config.STATUS.CREATED).send({
            message: config.RES.CREATED
          });
        })
        .catch(() => {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR
          });
        });
    })
    .catch(() => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR
      });
    });

});

router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {

  Product.find({})
    .then(products => {
      return res.status(config.STATUS.OK).send({
        result: products,
        message: config.RES.OK,
      });
    })
    .catch(() => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR,
      });
    });

});

router.get('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {

  Product.findById(req.params.id)
    .then(product => {
      return res.status(config.STATUS.OK).send({
        result: product,
        message: config.RES.OK,
      });
    })
    .catch(() => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR,
      });
    });

});

router.get(
  '/entries/:productId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {

    const productEntries = await Product.aggregate(
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.productId)
        }
      },
      {
        $project: {
          entries: '$entries'
        }
      }
    );

    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: productEntries
    });

  }

);

router.get(
  '/price/:productId/:priceIndex',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {

    let productPrice = await Product.aggregate(
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.productId)
        }
      },
      {
        $project: {
          price: { $arrayElemAt: [ '$prices', parseInt(req.params.priceIndex) ] }
        }
      }
    );

    // Only get object and not array
    productPrice = productPrice.pop();

    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: productPrice
    });

  }

);

router.get(
  '/prices/:productId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {

    const productPrices = await Product.aggregate(
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.productId)
        }
      },
      {
        $project: {
          prices: '$prices'
        }
      }
    );

    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: productPrices
    });

  }
);

module.exports = router;