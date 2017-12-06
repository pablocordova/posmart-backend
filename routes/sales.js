const express = require('express');
const moment = require('moment');
const passport = require('passport');
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

    //let products = JSON.parse(req.body.products);
    let products = req.body.products;

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
    // I will comment this, because maybe really do exit the same product with same priceIndex
    // But with differents discounts, for now It will be commented

    /*
    let withoutDuplicates = _.uniqBy(products, elem => {
      return [ elem.product, elem.priceIndex ].join();
    });

    if (withoutDuplicates.length != products.length) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.PRODUCTS_DUPLICATED
      });
    }
    */

    let accumulativeTotalPrice = 0;
    let tempProducts = [];

    for (let [ index, product ] of products.entries()) {

      // Check if all parameters exist
      const quantityIsEmpty = typeof product.quantity === 'undefined';
      const priceIndexIsEmpty = typeof product.price === 'undefined';
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

      // Check inventory
      const unitsSale = parseInt(product.quantity) * queryProduct.prices[product.priceIndex].items;
      const quantityAfterSale = queryProduct.quantity - unitsSale;
      if (quantityAfterSale < 0) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.NOINVENTORY + queryProduct.name
        });
      }

      //const priceProduct = queryProduct.prices[parseInt(product.priceIndex)].price;
      const priceProduct = parseFloat(product.price);
      const totalPriceProduct = priceProduct * parseInt(product.quantity);

      // Generate fields necessaries for sale.products
      products[index]['total'] = _.round(totalPriceProduct, 1);
      //products[index]['price'] = queryProduct.prices[product.priceIndex].price;
      products[index]['price'] = parseFloat(product.priceIndex);
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
    sale.subtotal = _.round(accumulativeTotalPrice/(1 + config.IGV), 2);
    sale.igv = _.round(accumulativeTotalPrice - sale.subtotal, 2);
    sale.total = _.round(accumulativeTotalPrice, 1);

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