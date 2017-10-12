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
  return res.status(200).send({
    message: 'OK'
  });
});

module.exports = router;