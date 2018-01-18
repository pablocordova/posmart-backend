const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const validator = require('validator');
const _ = require('lodash');

const router = express.Router();
const config = require('../config/products');
const ProductSchema = require('../squemas/product');
const SaleSchema = require('../squemas/sale');

const db = require('../app').db;
let Product = '';
let Sale = '';

// Middleware to check permissions
let chooseDB = (req, res, next) => {

  // Use its respective database
  let dbAccount = db.useDb(req.user.database);
  Product = dbAccount.model('Product', ProductSchema);
  Sale = dbAccount.model('Sale', SaleSchema);
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

// Middleware to check role only dashboard
let hasDashboardOrAppRole = (req, res, next) => {

  if (req.user.role != 'app' && req.user.role != 'dashboard') {
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
  (req, res) => {

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

  }
);

router.post(
  '/:id/prices',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {

    Product.findById(req.params.id)
      .then(product => {

        let arrayProductPrices = req.body.pricesTmp;
        product.prices = [];
        // Sort prices
        if (arrayProductPrices.length > 0) {
          product.prices =  _.sortBy(arrayProductPrices, 'items');
        }

        return product.save()
          .then((priceCreated) => {
            return res.status(config.STATUS.CREATED).send({
              message: config.RES.CREATED,
              result: priceCreated.prices
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

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  hasDashboardOrAppRole,
  chooseDB,
  (req, res) => {

    Product.find({})
      .sort('name')
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

  }
);

router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {

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

  }
);

router.get(
  '/:id/entries',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
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
  hasDashboardRole,
  chooseDB,
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
  hasDashboardRole,
  chooseDB,
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
  hasDashboardRole,
  chooseDB,
  (req, res) => {
    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: config.MINIMUM_PACKAGES
    });
  }
);

router.get(
  '/all/categories',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {
    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: config.CATEGORIES
    });
  }
);

router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {

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

  }
);

router.put(
  '/:id/enabled',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {

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
  '/:id/cost',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {

    Product.findByIdAndUpdate(
      req.params.id,
      { unitCost: req.body.unitCost },
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
  hasDashboardRole,
  chooseDB,
  (req, res) => {

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
  hasDashboardRole,
  chooseDB,
  async (req, res) => {

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

module.exports = router;