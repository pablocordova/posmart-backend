const express = require('express');
const moment = require('moment');
const passport = require('passport');
const validator = require('validator');
const _ = require('lodash');

const config = require('../config/sales');
const Customer = require('../models/customer');
const Product = require('../models/product');
const router = express.Router();
const Sale = require('../models/sale');

// My middleware to check permissions
let haspermission = (req, res, next) => {

  if (req.user.permissions.sales) {
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

    const clientId = req.body.client;

    let products = JSON.parse(req.body.products);

    // --- Validate all parameters  

    // Check if customer exist
    const costumer = await Customer.findById(clientId);
    if (!costumer) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.NOCLIENT
      });
    }

    // Check if exist at lest 1 product to process
    if (products.length <= 0) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.NOPRODUCTS
      });
    }

    // Check if exist duplicate values, never need to repeat productId an priceIndex together
    let withoutDuplicates = _.uniqBy(products, elem => {
      return [ elem.product, elem.priceIndex ].join();
    });

    if (withoutDuplicates.length != products.length) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.PRODUCTS_DUPLICATED
      });
    }

    let accumulativeTotalPrice = 0;
    let tempProducts = [];

    for (let [ index, product ] of products.entries()) {

      // Check if all parameters exist
      const quantityIsEmpty = typeof product.quantity === 'undefined';
      const priceIndexIsEmpty = typeof product.priceIndex === 'undefined';
      const productIsEmpty = typeof product.product === 'undefined';

      if (quantityIsEmpty || priceIndexIsEmpty || productIsEmpty) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.NOPARAMETER
        });
      }

      // Check if product exist
      const queryProduct = await Product.findById(product.product);
      if (!queryProduct) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.NOPRODUCT + product.product
        });
      }

      // Validate and find price
      const priceIndexIsNumeric = validator.isNumeric(product.priceIndex + '');
      const priceIndexInsideRange = priceIndexIsNumeric ? (
        parseInt(product.priceIndex) >= 0 &&
        parseInt(product.priceIndex) < queryProduct.prices.length
      ) : false;

      if (!priceIndexInsideRange) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.BAD_PRICE_INDEX
        });
      }

      // Check inventory
      const unitsSale = parseInt(product.quantity) * queryProduct.prices[product.priceIndex].items;
      const quantityAfterSale = queryProduct.quantity - unitsSale;
      if (quantityAfterSale < 0) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.NOINVENTORY + queryProduct.name
        });
      }

      const priceProduct = queryProduct.prices[parseInt(product.priceIndex)].price;
      const totalPriceProduct = priceProduct * parseInt(product.quantity);

      products[index]['total'] = totalPriceProduct;
      // Accumulative for the main total
      accumulativeTotalPrice += totalPriceProduct;

      // Case the product already is in the array, only update, else new add
      const indexTemp = _.findIndex(tempProducts, elem => {
        return elem._id = queryProduct._id;
      });

      if (indexTemp >= 0) {
        tempProducts[indexTemp].quantity -= unitsSale;
        // Also check the inventory
        if (tempProducts[indexTemp].quantity < 0) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.NOINVENTORY + queryProduct.name
          });
        }
      } else {
        // Save temporarily inventory and products id
        queryProduct.quantity = quantityAfterSale;
        tempProducts.push(queryProduct);
      }

    }

    // Now, Time to save all!!!

    // Update all products with new inventory(quantity)
    for (let product of tempProducts) {
      await product.save();
    }

    // Save sale
    let sale = new Sale();

    sale.client = clientId;
    sale.date = moment();
    sale.products = products;
    sale.seller = req.user._id;
    sale.subtotal = accumulativeTotalPrice/(1 + config.IGV);
    sale.igv = accumulativeTotalPrice - sale.subtotal;
    sale.total = accumulativeTotalPrice;

    sale.save()
      .then((saleCreated) => {
        return res.status(config.STATUS.CREATED).send({
          message: config.RES.CREATED,
          result: saleCreated
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

router.get('/', passport.authenticate('jwt', { session: false }), haspermission, (req, res) => {

  Sale.find({})
    .then(sales => {
      return res.status(config.STATUS.OK).send({
        result: sales,
        message: config.RES.OK
      });
    })
    .catch(() => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR
      });
    });

});

router.get('/:id', passport.authenticate('jwt', { session: false }), haspermission, (req, res) => {

  Sale.findById(req.params.id)
    .then(sale => {
      return res.status(config.STATUS.OK).send({
        result: sale,
        message: config.RES.OK
      });
    })
    .catch(() => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR
      });
    });

});

module.exports = router;