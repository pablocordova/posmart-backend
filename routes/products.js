const express = require('express');
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

module.exports = router;