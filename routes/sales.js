const express = require('express');
const moment = require('moment');
const mongoose = require('mongoose');
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
    const state = req.body.state;

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
      //const unitsSale = parseFloat(product.quantity) *
      //  queryProduct.prices[product.priceIndex].items;
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

      // Generate fields necessaries for sale.products
      products[index]['total'] = _.round(totalPriceProduct, 1);
      //products[index]['price'] = queryProduct.prices[product.priceIndex].price;
      // TODO: DELETE THE NEXT FIELD 'PRICE' IN UNNECESSARY
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
          client: '$client.firstname'
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

    if (req.body.seller !== '') {
      sales = await sales.filter(sale => {
        return sale.seller === req.body.seller;
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

    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: sales
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
      .catch(err => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          message: config.RES.ERROR,
          result: err
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
            $addToSet: '$product'
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

module.exports = router;