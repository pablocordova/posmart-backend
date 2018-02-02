const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const _ = require('lodash');
const router = express.Router();

const config = require('../config/general');
const configProducts = require('../config/products');

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

// Middleware to check if have app or dashboard role
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
  async (req, res) => {

    // Check if all parameters exist

    if (!req.body.category) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.MISSING_PARAMETER,
        result: 'category'
      });
    }

    if (!req.body.minimumUnit) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.MISSING_PARAMETER,
        result: 'minimumUnit'
      });
    }

    if (!req.body.name) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.MISSING_PARAMETER,
        result: 'name'
      });
    }

    if (configProducts.CATEGORIES.indexOf(req.body.category) === -1) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.INVALID_SYNTAX,
        result: 'category'
      });
    }

    if (configProducts.MINIMUM_PACKAGES.indexOf(req.body.minimumUnit) === -1) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.INVALID_SYNTAX,
        result: 'minimumUnit'
      });
    }

    // Check if a product naMe already exist
    const existName = await Product.find({ name: req.body.name });

    if (existName.length !== 0) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.ITEM_DUPLICATED,
        result: configProducts.RES.DUPLICATED_PRODUCT_NAME
      });
    }

    let product = new Product();
    product.name = req.body.name;
    product.minimumUnit = req.body.minimumUnit;
    product.category = req.body.category;
    product.picture = req.body.picture;

    product.save()
      .then((productCreated) => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.CREATED,
          result: productCreated
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
  '/',
  passport.authenticate('jwt', { session: false }),
  hasDashboardOrAppRole,
  chooseDB,
  (req, res) => {

    Product.find({})
      .sort('name')
      .then(products => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: products
        });
      })
      .catch((err) => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_DATABASE,
          result: err
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
          message: config.RES.OK,
          result: product
        });
      })
      .catch(err => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_DATABASE,
          result: err
        });
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
      result: configProducts.MINIMUM_PACKAGES
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
      result: configProducts.CATEGORIES
    });
  }
);

router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  async (req, res) => {

    // Check if all parameters exist

    if (!req.body.category) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.MISSING_PARAMETER,
        result: 'category'
      });
    }

    if (!req.body.minimumUnit) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.MISSING_PARAMETER,
        result: 'minimumUnit'
      });
    }

    if (!req.body.name) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.MISSING_PARAMETER,
        result: 'name'
      });
    }

    if (configProducts.CATEGORIES.indexOf(req.body.category) === -1) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.INVALID_SYNTAX,
        result: 'category'
      });
    }

    if (configProducts.MINIMUM_PACKAGES.indexOf(req.body.minimumUnit) === -1) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.INVALID_SYNTAX,
        result: 'minimumUnit'
      });
    }

    // Check if a product naMe already exist
    const existName = await Product.find({ name: req.body.name });

    if (existName.length !== 0 && existName._id !== req.params.id) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.ITEM_DUPLICATED,
        result: configProducts.RES.DUPLICATED_PRODUCT_NAME
      });
    }

    Product.findById(req.params.id)
      .then(product => {

        product.name = req.body.name;
        product.minimumUnit = req.body.minimumUnit;
        product.category = req.body.category;
        product.picture = req.body.picture;

        product.save()
          .then(productUpdated => {
            return res.status(config.STATUS.OK).send({
              message: config.RES.UPDATED,
              result: productUpdated
            });
          })
          .catch(err => {
            return res.status(config.STATUS.SERVER_ERROR).send({
              message: config.RES.ERROR_DATABASE,
              result: err
            });
          });

      })
      .catch((err) => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_DATABASE,
          result: err
        });
      });

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
            message: config.RES.ERROR_DATABASE,
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
  '/:id/prices',
  passport.authenticate('jwt', { session: false }),
  hasDashboardRole,
  chooseDB,
  (req, res) => {

    // Check if all parameters exist

    if (!req.body.pricesTmp) {
      return res.status(config.STATUS.BAD_REQUEST).send({
        message: config.RES.MISSING_PARAMETER,
        result: 'array prices'
      });
    }

    for (let price of req.body.pricesTmp) {
      if (!price.quantity) {
        return res.status(config.STATUS.BAD_REQUEST).send({
          message: config.RES.MISSING_PARAMETER,
          result: 'quantity'
        });
      }

      if (!price.name) {
        return res.status(config.STATUS.BAD_REQUEST).send({
          message: config.RES.MISSING_PARAMETER,
          result: 'name'
        });
      }

      if (!price.items) {
        return res.status(config.STATUS.BAD_REQUEST).send({
          message: config.RES.MISSING_PARAMETER,
          result: 'items'
        });
      }

      if (!price.price) {
        return res.status(config.STATUS.BAD_REQUEST).send({
          message: config.RES.MISSING_PARAMETER,
          result: 'price'
        });
      }

    }

    Product.findById(req.params.id)
      .then(product => {

        if (!product) {
          return res.status(config.STATUS.OK).send({
            message: configProducts.RES.NOT_FOUND,
            result: req.params.id
          });
        }

        let arrayProductPrices = req.body.pricesTmp;
        product.prices = [];
        // Sort prices
        if (arrayProductPrices.length > 0) {
          product.prices =  _.sortBy(arrayProductPrices, 'items');
        }

        return product.save()
          .then(priceCreated => {
            return res.status(config.STATUS.OK).send({
              message: config.RES.UPDATED,
              result: priceCreated.prices
            });
          })
          .catch(err => {
            return res.status(config.STATUS.SERVER_ERROR).send({
              message: config.RES.ERROR_DATABASE,
              result: String(err)
            });
          });
      })
      .catch(err => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_DATABASE,
          result: String(err)
        });
      });
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
        message: configProducts.RES.PRODUCT_IN_SALE,
        result: req.params.id
      });
    }

    Product.findByIdAndRemove(req.params.id)
      .then(product => {

        if (!product) {
          return res.status(config.STATUS.OK).send({
            message: configProducts.RES.NOT_FOUND,
            result: req.params.id
          });
        }

        return res.status(config.STATUS.OK).send({
          message: config.RES.DELETED,
          result: product
        });
      })
      .catch(err => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR_DATABASE,
          result: err
        });
      });

  }
);

module.exports = router;