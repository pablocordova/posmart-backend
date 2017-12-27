const express = require('express');
const passport = require('passport');
//const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');

const router = express.Router();
const config = require('../config/buys');
const SaleSchema = require('../models/sale');
//const CustomerSchema = require('../models/customer');
//const ProductSchema = require('../models/product');

const db = require('../app').db;
let Sale = '';
//let Product = '';
//let Customer = '';

// My middleware to check permissions
let haspermission = (req, res, next) => {

  let permission = req.user.permissions ? req.user.permissions.customers : true;

  if (permission) {
    // Use its respective database
    let dbAccount = db.useDb(req.user.database);
    Sale = dbAccount.model('Sale', SaleSchema);
    //Product = dbAccount.model('Product', ProductSchema);
    //Customer = dbAccount.model('Customer', CustomerSchema);
    next();
  } else {
    res.status(config.STATUS.UNAUTHORIZED).send({
      message: config.RES.UNAUTHORIZED
    });
  }

};

router.post(
  '/earnings/:type',
  passport.authenticate('jwt', { session: false }),
  haspermission,
  async (req, res) => {

    let type = req.params.type;
    let DateFrom = new Date(req.body.from);
    let DateTo = moment(new Date(req.body.to)).add(1, 'day').toDate();

    let sales = await Sale.aggregate(
      {
        $match:{
          'date': {
            $gte: DateFrom,
            $lte: DateTo
          }
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
        $unwind: '$client'
      },
      {
        $unwind: '$products.product'
      },
      {
        $project: {
          _id: 1,
          total: 1,
          date: 1,
          state: 1,
          client: '$client.firstname',
          clientId: '$client._id',
          product: {
            unitCost: '$products.product.unitCost',
            quantity: '$products.quantity',
            unitsInPrice: '$products.unitsInPrice',
            total: '$products.total'
          }

        }
      },
      {
        $group: {
          _id: '$_id',
          total: {
            $first: '$total'
          },
          date: {
            $first: '$date'
          },
          state: {
            $first: '$state'
          },
          client: {
            $first: '$client'
          },
          clientId: {
            $first: '$clientId'
          },
          products: {
            $addToSet: '$product'
          }
        }
      }

    );

    let earningsBySale = [];

    // Calculate earnings by each sale

    for (let sale of sales) {
      let totalEarning = 0;
      for (let product of sale.products) {
        let totalCost = (product.quantity * product.unitCost * product.unitsInPrice);
        totalEarning += product.total - totalCost;
      }
      earningsBySale.push({
        client: sale.client,
        clientId: sale.clientId,
        date: sale.date,
        state: sale.state,
        total: _.round(totalEarning, 2)
      });
    }

    // Filters
    let earningsBy = [];

    switch (type) {
      case 'client':
        earningsBy = _(earningsBySale).groupBy('clientId')
          .map((objs) => ({
            'client': objs[0]['client'],
            'total': _.round(_.sumBy(objs, 'total'), 2)
          }))
          .value();
        break;
      default:
        earningsBy = earningsBySale;
        break;
    }

    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: earningsBy
    });

  }
);

module.exports = router;