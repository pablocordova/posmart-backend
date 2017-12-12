const express = require('express');
const moment = require('moment');
const mongoose = require('mongoose');
const passport = require('passport');
const validator = require('validator');
const _ = require('lodash');

const router = express.Router();
const config = require('../config/products');
const Product = require('../models/product');
const Sale = require('../models/sale');

// My middleware to check permissions
let hasPermission = (req, res, next) => {

  if (req.user.permissions.products) {
    next();
  } else {
    res.status(config.STATUS.UNAUTHORIZED).send({
      message: config.RES.UNAUTHORIZED
    });
  }

};

router.post('/', passport.authenticate('jwt', { session: false }), hasPermission, (req, res) => {

  let product = new Product();
  product.name = req.body.name;
  product.minimumUnit = req.body.minimumUnit;
  product.category = req.body.category;
  product.picture = req.body.picture;

  product.save()
    .then((productCreated) => {
      return res.status(config.STATUS.CREATED).send({
        message: config.RES.CREATED,
        result: productCreated
      });
    })
    .catch((err) => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.NOCREATED,
        result: err
      });
    });

});

router.post(
  '/entry',
  passport.authenticate('jwt', { session: false }),
  hasPermission,
  (req, res) => {

    const quantityIsEmpty = validator.isEmpty(req.body.quantity + '');
    const unitCostIsEmpty = validator.isEmpty(req.body.unitCost + '');
    const productIsEmpty = validator.isEmpty(req.body.product + '');
    const quantityIsNumeric = validator.isDecimal(req.body.quantity + '');
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

        // Add to the general quantity and general unitCost

        const quantity = parseFloat(req.body.quantity);
        const unitCost = parseFloat(req.body.unitCost);

        product.unitCost = product.unitCost !== 0 ?
          _.round(
            ((product.quantity * product.unitCost) + (unitCost * quantity)) /
            (product.quantity + quantity), 2
          ) :
          parseFloat(unitCost);

        product.quantity += quantity;

        product.save()
          .then((productUpdated) => {
            return res.status(config.STATUS.CREATED).send({
              message: config.RES.CREATED,
              result: productUpdated
            });
          })
          .catch((err) => {
            return res.status(config.STATUS.SERVER_ERROR).send({
              message: config.RES.ERROR,
              result: err
            });
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
  '/price',
  passport.authenticate('jwt', { session: false }),
  hasPermission,
  (req, res) => {

    const quantityIsEmpty = validator.isEmpty(req.body.quantity + '');
    const nameIsEmpty = validator.isEmpty(req.body.name + '');
    const itemsIsNumeric = validator.isDecimal(req.body.items + '');
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
          if (price.quantity === req.body.quantity && price.name === req.body.name) {
            return res.status(config.STATUS.SERVER_ERROR).send({
              message: config.RES.ERROR
            });
          }
        }

        product.prices.push(req.body);
        product.save()
          .then((priceCreated) => {
            return res.status(config.STATUS.CREATED).send({
              message: config.RES.CREATED,
              result: priceCreated.price
            });
          })
          .catch((err) => {
            return res.status(config.STATUS.SERVER_ERROR).send({
              message: config.RES.ERROR,
              result: err
            });
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

router.get('/', passport.authenticate('jwt', { session: false }), hasPermission, (req, res) => {

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

router.get('/:id', passport.authenticate('jwt', { session: false }), hasPermission, (req, res) => {

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
  '/:id/entries',
  passport.authenticate('jwt', { session: false }),
  hasPermission,
  async (req, res) => {

    const productEntries = await Product.aggregate(
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.id)
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
  '/:id/prices/:indexPrice',
  passport.authenticate('jwt', { session: false }),
  hasPermission,
  async (req, res) => {

    let productPrice = await Product.aggregate(
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.id)
        }
      },
      {
        $project: {
          price: { $arrayElemAt: [ '$prices', parseInt(req.params.indexPrice) ] }
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
  '/:id/prices',
  passport.authenticate('jwt', { session: false }),
  hasPermission,
  async (req, res) => {

    const productPrices = await Product.aggregate(
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.id)
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

router.get(
  '/all/min_units',
  passport.authenticate('jwt', { session: false }),
  hasPermission, (req, res) => {
    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: config.MINIMUM_PACKAGES
    });
  }
);

router.get(
  '/all/categories',
  passport.authenticate('jwt', { session: false }),
  hasPermission, (req, res) => {
    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: config.CATEGORIES
    });
  }
);

router.put('/:id', passport.authenticate('jwt', { session: false }), hasPermission, (req, res) => {

  Product.findById(req.params.id)
    .then((product) => {

      product.name = req.body.name;
      product.minimumUnit = req.body.minimumUnit;
      product.category = req.body.category;
      product.picture = req.body.picture;

      product.save()
        .then((productUpdated) => {
          return res.status(config.STATUS.OK).send({
            message: config.RES.OK,
            result: productUpdated
          });
        })
        .catch((err) => {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR,
            result: err
          });
        });

    })
    .catch((err) => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR,
        result: err
      });
    });

});

router.put(
  '/:id/enabled',
  passport.authenticate('jwt', { session: false }),
  hasPermission, (req, res) => {

    Product.findByIdAndUpdate(
      req.params.id,
      { enabled: req.body.enabled },
      { new: true },
      (err, productUpdated) => {

        if (err) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR,
            result: err
          });
        }

        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: productUpdated
        });

      }
    );

  }
);

router.put(
  '/:id/prices/:indexPrice',
  passport.authenticate('jwt', { session: false }),
  hasPermission, (req, res) => {

    const quantityIsEmpty = validator.isEmpty(req.body.quantity + '');
    const nameIsEmpty = validator.isEmpty(req.body.name + '');
    const itemsIsNumeric = validator.isNumeric(req.body.items + '');
    const priceIsDecimal = validator.isDecimal(req.body.price + '');

    if ( quantityIsEmpty || nameIsEmpty || !itemsIsNumeric || !priceIsDecimal) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR
      });
    }

    let setData = { $set: {} };
    setData.$set['prices.' + req.params.indexPrice] = {
      quantity : req.body.quantity,
      name : req.body.name,
      items : req.body.items,
      price : req.body.price
    };

    Product.findByIdAndUpdate(
      req.params.id,
      setData,
      { new: true },
      (err, productUpdated) => {
        if (err) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR,
            result: err
          });
        }

        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: productUpdated
        });

      }
    );

  }
);

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  hasPermission, async (req, res) => {

    // First check if products already has sales
    const sales = await Sale.aggregate(
      {
        $match: {
          'products.product': mongoose.Types.ObjectId(req.params.id),
        }
      }
    );

    if (sales.length > 0) {
      return res.status(config.STATUS.OK).send({
        message: config.RES.PRODUCT_SALES,
        result: 'ERROR'
      });
    }

    Product.findByIdAndRemove(req.params.id, (err, product) => {

      if (err) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR,
          result: product
        });
      }

      return res.status(config.STATUS.OK).send({
        message: config.RES.DELETE_OK,
        result: product
      });

    });

  }
);

router.delete(
  '/:id/prices/:indexPrice',
  passport.authenticate('jwt', { session: false }),
  hasPermission, async (req, res) => {

    // First check if products already has sales
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.PRODUCT_MISSED
      });
    }

    // Validation
    if (req.params.indexPrice < 0 || req.params.indexPrice >= product.prices.length) {
      return res.status(config.STATUS.SERVER_ERROR).send({
        message: config.RES.ERROR
      });
    }

    // Remove specific array element
    product.prices.splice(req.params.indexPrice, 1);

    product.save()
      .then((productUpdated) => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: productUpdated
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