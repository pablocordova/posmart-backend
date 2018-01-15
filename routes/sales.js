const express = require('express');
const moment = require('moment');
const mongoose = require('mongoose');
const passport = require('passport');
const _ = require('lodash');

const config = require('../config/sales');
const CustomerSchema = require('../squemas/customer');
const ProductSchema = require('../squemas/product');
const router = express.Router();
const SaleSchema = require('../squemas/sale');

const db = require('../app').db;
let Customer = '';
let Sale = '';
let Product = '';

// My middleware to check permissions
let haspermission = (req, res, next) => {

  let permission = req.user.permissions ? req.user.permissions.sales : true;
  if (permission) {
    // Use its respective database
    let dbAccount = db.useDb(req.user.database);
    Product = dbAccount.model('Product', ProductSchema);
    Sale = dbAccount.model('Sale', SaleSchema);
    Customer = dbAccount.model('Customer', CustomerSchema);
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
    const state = req.body.state;

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
      const productIsEmpty = typeof product.product === 'undefined';

      if (quantityIsEmpty || productIsEmpty) {
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
      const unitsSale = parseFloat(product.quantity) * product.unitsInPrice;

      const quantityAfterSale = queryProduct.quantity - unitsSale;
      // For now, restriction about inventory is suspended x 1
      /*
      if (quantityAfterSale < 0) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.NOINVENTORY + queryProduct.name
        });
      }
      */
      const totalPriceProduct = product.total;
      const earning = totalPriceProduct - (queryProduct.unitCost * unitsSale);

      // Generate fields necessaries for sale.products
      products[index]['total'] = _.round(totalPriceProduct, 2);
      products[index]['earning'] = _.round(earning, 2);
      // Accumulative for the main total
      accumulativeTotalPrice += totalPriceProduct;

      // Case the product already is in the array, only update, else new add
      const indexTemp = _.findIndex(tempProducts, elem => {
        return elem._id = queryProduct._id;
      });

      if (indexTemp >= 0) {
        tempProducts[indexTemp].quantity -= unitsSale;
        // Also check the inventory
        // For now, restriction about inventory is suspended x 2
        /*
        if (tempProducts[indexTemp].quantity < 0) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.NOINVENTORY + queryProduct.name
          });
        }
        */
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
    sale.state = state;
    sale.date = moment().subtract(5, 'hours');
    sale.products = products;
    sale.seller = req.user._id;
    sale.subtotal = _.round(accumulativeTotalPrice/(1 + config.IGV), 2);
    sale.igv = _.round(accumulativeTotalPrice - sale.subtotal, 2);
    sale.total = _.round(accumulativeTotalPrice, 2);

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

/**
 * Only temporary to generate enarnings in each sale
 */

router.post(
  '/generate/earnings',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) =>
  {
    let sales = await Sale.find({});

    for (let sale of sales) {
      for (let [ index, product ] of sale.products.entries()) {
        let productQuery = await Product.findById(product.product);
        sale.products[index]['earning'] = product.total -
          (product.unitsInPrice * product.quantity * productQuery.unitCost);
      }
      // save sale updated
      sale.save();
    }

    return res.status(config.STATUS.OK).send({
      message: config.RES.OK
    });

  }
);

router.post(
  '/search/advanced',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) =>
  {

    let sales = await Sale.aggregate(
      {
        $lookup:
          {
            from: 'users',
            localField: 'seller',
            foreignField: '_id',
            as: 'seller'
          }
      },
      {
        $lookup:
          {
            from: 'customers',
            localField: 'client',
            foreignField: '_id',
            as: 'client'
          }
      },
      {
        $unwind: '$seller'
      },
      {
        $unwind: '$client'
      },
      {
        $project: {
          _id: 1,
          total: 1,
          seller: '$seller.username',
          state: 1,
          date: 1,
          client: '$client.firstname',
          credits: 1
        }
      },
      {
        $sort : {
          date : -1
        }
      }
    );

    // Filter

    if (req.body.id !== '') {
      sales = await sales.filter(sale => {
        return String(sale._id).substring(0, 8) === req.body.id;
      });
    }

    if (req.body.day !== '') {
      sales = await sales.filter(sale => {
        const day = String(moment.utc(sale.date).format('YYYY-MM-DD'));
        return day === req.body.day;
      });
    }

    if (req.body.client !== '') {
      sales = await sales.filter(sale => {
        return sale.client.trim().toLowerCase() === req.body.client.trim().toLowerCase();
      });
    }

    if (req.body.seller !== '') {
      sales = await sales.filter(sale => {
        return sale.seller.trim().toLowerCase() === req.body.seller.trim().toLowerCase();
      });
    }

    if (req.body.state !== '' && req.body.state !== 'all') {
      sales = await sales.filter(sale => {
        return sale.state === req.body.state;
      });
    }

    if (req.body.total !== '') {
      sales = await sales.filter(sale => {
        return String(sale.total) === req.body.total;
      });
    }

    // Operaction for more details

    for (let [ indexSale, sale ] of sales.entries()) {
      if (sale.credits) {
        let sumCredits = 0;
        for (let credit of sale.credits) {
          sumCredits += credit.amount;
        }
        sales[indexSale]['paidDebt'] = sumCredits;
        sales[indexSale]['restDebt'] = sale.total - sumCredits;
      }
    }

    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: sales
    });

  }
);

router.post(
  '/join/sales',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) =>
  {

    let sales = [];

    // Get all sales to join
    for (let id of req.body.ids) {
      sales.push(await Sale.findById(id));
    }

    // Generate new sale, unique information will be of first sale
    let sale = sales[0];
    let creditsAccumulative = [];
    let productsAccumulative = [];
    let totalAccumulative = 0;

    for (let sale of sales) {
      // Credits
      if (sale.credits.length > 0) {
        for (let credit of sale.credits) {
          creditsAccumulative.push(credit);
        }
      }
      // Products
      for (let product of sale.products) {
        productsAccumulative.push(product);
      }
      // Total
      totalAccumulative += sale.total;
    }

    sale.credits = creditsAccumulative;
    sale.date = moment().subtract(5, 'hours');
    sale.products = productsAccumulative;
    sale.total = _.round(totalAccumulative, 2);
    sale.subtotal = _.round(totalAccumulative/(1 + config.IGV), 2);
    sale.igv = _.round(totalAccumulative - sale.subtotal, 2);

    // Remove rest of sales except the first
    for (var i = 1; i < req.body.ids.length; i++) {
      await Sale.findByIdAndRemove(req.body.ids[i]);
    }

    sale.save()
      .then((saleUpdated) => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: saleUpdated
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

    let sale = await Sale.findById(req.params.id);

    let credits = [];
    if (sale.credits) {
      credits = sale.credits;
    }

    let credit = {
      date: req.body.date,
      amount: req.body.amount
    };

    credits.push(credit);

    sale.credits = credits;

    sale.save()
      .then((saleUpdated) => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: saleUpdated
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

router.get(
  '/:id/credits',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) =>
  {

    Sale.findById(req.params.id)
      .then(sale => {
        return res.status(config.STATUS.OK).send({
          result: sale.credits,
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

router.get(
  '/bypartialid/:id',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) =>
  {

    // For now, but I need to found a better way
    const wholeSales = await Sale.aggregate({
      $project: {
        id: '$_id'
      }
    });

    let idSaleFound = '';

    for (let sale of wholeSales) {
      if (String(sale.id).substring(0, 8) === req.params.id) {
        idSaleFound = sale.id;
        break;
      }
    }

    Sale.findById(idSaleFound)
      .then(sale => {
        return res.status(config.STATUS.OK).send({
          result: sale,
          message: config.RES.OK
        });
      })
      .catch(() => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: ''
        });
      });

  }
);

router.get(
  '/last/10',
  passport.authenticate('jwt', { session: false }),
  haspermission, (req, res) =>
  {
    Sale.find({}).sort({ 'date': -1 }).limit(10)
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

  }
);

router.get(
  '/processed/:id',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) => {

    let sales = await Sale.aggregate(
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.id)
        }
      },
      {
        $lookup:
          {
            from: 'users',
            localField: 'seller',
            foreignField: '_id',
            as: 'seller'
          }
      },
      {
        $lookup:
          {
            from: 'customers',
            localField: 'client',
            foreignField: '_id',
            as: 'client'
          }
      },
      {
        $unwind: '$products'
      },
      {
        $lookup:
          {
            from: 'products',
            localField: 'products.product',
            foreignField: '_id',
            as: 'products.product'
          }
      },
      {
        $unwind: '$seller'
      },
      {
        $unwind: '$client'
      },
      {
        $unwind: '$products.product'
      },
      {
        $project: {
          _id: 1,
          total: 1,
          seller: '$seller.username',
          date: 1,
          state: 1,
          client: {
            id: '$client._id',
            name: '$client.firstname'
          },
          product: {
            id: '$products.product._id',
            name: '$products.product.name',
            prices: '$products.product.prices',
            quantity: '$products.quantity',
            measure: '$products.unit',
            indexPrice: '$products.price',
            total: '$products.total',
            unitsInPrice: '$products.unitsInPrice'
          }

        }
      },
      {
        $group: {
          _id: '$_id',
          total: {
            $first: '$total'
          },
          seller: {
            $first: '$seller'
          },
          date: {
            $first: '$date'
          },
          client: {
            $first: '$client'
          },
          products: {
            $push: '$product'
          },
          state: {
            $first: '$state'
          }
        }
      }

    );
    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: sales[0]
    });

  }
);

router.put(
  '/:id/state',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) =>
  {

    Sale.findByIdAndUpdate(
      req.params.id,
      { state: req.body.state },
      { new: true },
      (err, saleUpdated) => {

        if (err) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR,
            result: err
          });
        }

        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: saleUpdated
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
    let sale = await Sale.findById(req.params.id);

    // Remove specific array element
    sale.credits.splice(req.params.indexCredit, 1);

    sale.save()
      .then((saleUpdated) => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: saleUpdated
        });
      })
      .catch(() => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR
        });
      });

  }
);

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  haspermission, async (req, res) => {

    // Get sale
    let sale = await Sale.findById(req.params.id);

    for (let product of sale.products) {
      let amountToRecover = _.round(product.quantity * product.unitsInPrice, 3);
      let productToRecoverAmount = await Product.findById(product.product);
      let newQuantity = productToRecoverAmount.quantity + amountToRecover;
      productToRecoverAmount.quantity = newQuantity;
      productToRecoverAmount.save();
    }

    Sale.findByIdAndRemove(req.params.id, (err, sale) => {

      if (err) {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR,
          result: sale
        });
      }

      return res.status(config.STATUS.OK).send({
        message: config.RES.DELETE_OK,
        result: sale
      });

    });

  }
);

module.exports = router;