const express = require('express');
const passport = require('passport');

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
      res.status(config.STATUS.CREATED).send({
        message: config.RES.CREATED
      });
    })
    .catch(() => {
      res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.NOCREATED
      });
    });
});

router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {

  Product.find({})
    .then(products => {
      res.status(config.STATUS.OK).send({
        result: products,
        message: config.RES.OK,
      });
    })
    .catch(() => {
      res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR,
      });
    });

});

router.get('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {

  Product.findById(req.params.id)
    .then(product => {
      res.status(config.STATUS.OK).send({
        result: product,
        message: config.RES.OK,
      });
    })
    .catch(() => {
      res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR,
      });
    });

});

module.exports = router;