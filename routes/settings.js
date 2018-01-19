const express = require('express');
const google = require('googleapis');
const moment = require('moment');
const mongoose = require('mongoose');
const passport = require('passport');
let promise = require('bluebird');
const router = express.Router();
const request = require('request');
const _ = require('lodash');

const config = require('../config/settings');
const BusinessSchema = require('../squemas/business');
const CustomerSchema = require('../squemas/customer');
const ProductSchema = require('../squemas/product');
const SaleSchema = require('../squemas/sale');
const UserSchema = require('../squemas/user');
const SettingSchema = require('../squemas/setting');

const db = require('../app').db;
let Customer = '';
let Sale = '';
let Product = '';
let User = '';
let Setting = '';

let dbGeneral = db.useDb(process.env.DATABASE_GENERAL);
let BusinessModel = dbGeneral.model('Business', BusinessSchema);

var OAuth2 = google.auth.OAuth2;
const redirect_url = process.env.GCP_REDIRECT_URL;
var oauth2Client = new OAuth2(
  process.env.GOOGLE_API_CLIENT_ID,
  process.env.GOOGLE_API_CLIENT_SECRET,
  redirect_url
);

// Configuration ticket printer
const printerID = 'bfeafc3e-9eaf-0709-5f42-20866d29b063';

const ticketProperties = {
  'version':'1.0',
  'print':{
    'copies':{
      'copies':1
    },
    'page_orientation':{
      'type':0
    },
    'margins': {
      'top_microns':0,
      'bottom_microns':0,
      'left_microns':0,
      'right_microns':0
    }
  }
};

var url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: config.URL_GCP
});

// Middleware to check permissions
let chooseDB = (req, res, next) => {

  // Use its respective database
  let dbAccount = db.useDb(req.user.database);
  Product = dbAccount.model('Product', ProductSchema);
  Sale = dbAccount.model('Sale', SaleSchema);
  Customer = dbAccount.model('Customer', CustomerSchema);
  User = dbAccount.model('User', UserSchema);
  Setting = dbAccount.model('Setting', SettingSchema);
  next();

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

router.get(
  '/printer',
  passport.authenticate('jwt', { session: false }),
  hasDashboardOrAppRole,
  chooseDB,
  async (req, res) => {

    let query = Setting.find({});
    let setting = await query.exec();

    let data = {
      googleLog: false,
      printerId: '',
      ticketSetting: {
        title: '',
        head1Line: '',
        head2Line: '',
        Foot1Line: '',
        Foot2Line: ''
      }
    };

    if (setting.length > 0) {
      data.googleLog = true;
      data.printerId = setting[0].printerId;
      data.ticketSetting = setting[0].ticketSetting;
    }

    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: data
    });

  }
);

router.get(
  '/pin',
  passport.authenticate('jwt', { session: false }),
  hasDashboardOrAppRole,
  chooseDB,
  async (req, res) => {

    return res.status(config.STATUS.OK).send({
      message: config.RES.OK,
      result: req.user.permissionPin
    });

  }
);


router.get(
  '/googleurl',
  passport.authenticate('jwt', { session: false }),
  hasDashboardOrAppRole,
  chooseDB,
  (req, res) => {
    return res.status(config.STATUS.OK).send({
      result: { googleURLToken: url },
      message: config.RES.OK,
    });

  }
);

router.post(
  '/googletoken',
  passport.authenticate('jwt', { session: false }),
  hasDashboardOrAppRole,
  chooseDB,
  (req, res) => {
    oauth2Client.getToken(req.body.code, function (err, tokens) {
      oauth2Client.credentials = tokens;
      // If refresh token exits save it

      if (tokens.hasOwnProperty('refresh_token')) {

        // First remove all setttings saved, because only must exist 1 setting
        Setting.remove({}, function (err) {
          if (err) return console.log(err);

          let setting = new Setting();
          setting.refreshTokenGoogle = tokens.refresh_token;
          setting.expirationTokenGoogle = tokens.expiry_date;
          setting.tokenGoogle = tokens.access_token;

          setting.save()
            .then((settingCreated) => {
              return res.status(config.STATUS.CREATED).send({
                message: config.RES.CREATED,
                result: settingCreated
              });
            })
            .catch((err) => {
              return res.status(config.STATUS.SERVER_ERROR).send({
                message: config.RES.ERROR,
                result: err
              });
            });

        });
      }
    });
  }
);


router.post(
  '/print/sale',
  passport.authenticate('jwt', { session: false }),
  hasDashboardOrAppRole,
  chooseDB,
  async (req, res) => {

    const saleID = req.body.saleID;

    const accessToken = await getTokenGoogleUpdated();

    let sale = await Sale.findById(saleID);
    const htmlToPrint = await generateHTMLSale(sale);

    var formData = {
      printerid : printerID,
      title: 'pdf print',
      ticket: JSON.stringify(ticketProperties),
      content: htmlToPrint,
      contentType: 'text/html'
    };

    request.post(
      {
        url:'https://www.google.com/cloudprint/submit',
        formData: formData,
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      },
      //function optionalCallback(err, httpResponse, body) {
      function optionalCallback(err) {
        if (err) {
          //console.error('upload failed:', err);
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR,
            result: err
          });
        } else {
          //console.log('Upload successful!  Server responded with:', body);
          return res.status(config.STATUS.OK).send({
            message: config.RES.PRINTING,
            printed: 'OK'
          });
        }
      }
    );

  }
);

router.post(
  '/printer',
  passport.authenticate('jwt', { session: false }),
  hasDashboardOrAppRole,
  chooseDB,
  async (req, res) => {

    let query = Setting.find({});
    let setting = await query.exec();
    setting[0].printerId = req.body.printerId;
    setting[0].ticketSetting = req.body.ticketSetting;
    setting[0].save()
      .then(() => {
        return res.status(config.STATUS.OK).send({
          message: config.RES.SAVED_SUCCESSFULLY
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
  '/pin',
  passport.authenticate('jwt', { session: false }),
  hasDashboardOrAppRole,
  chooseDB,
  (req, res) => {

    // Special case, here I'm going to use database general

    BusinessModel.findByIdAndUpdate(
      mongoose.Types.ObjectId(req.user._id),
      {
        permissionPin: req.body.pin
      },
      { new: true },
      (err, userUpdated) => {
        console.log(userUpdated);
        if (err) {
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR,
            result: err
          });
        }
        userUpdated.password = undefined;
        return res.status(config.STATUS.OK).send({
          message: config.RES.OK,
          result: userUpdated
        });

      }
    );

  }
);


async function generateHTMLSale(sale) {
  // Get data seller
  const dataSeller = await User.findById(sale.seller);
  // Get data customer
  const dataClient = await Customer.findById(sale.client);
  // Get data setting
  let query = Setting.find({});
  const setting = await query.exec();

  let hour = moment(sale.date).format('hh:mm:ss a');
  let day = moment(sale.date).format('DD/MM/YY');

  const separator = '<div>-----------------------------------------------</div>';
  const title = '<h2 style="text-align:center;">' + setting[0].ticketSetting.title + '</h2>';
  const address = '<div>' + setting[0].ticketSetting.head1Line + '</div>';
  const phone = '<div>' + setting[0].ticketSetting.head2Line + '</div>';
  const code = '<div>ID: ' + String(sale._id).substring(0, 8) + '</div>';
  const seller = '<div>Vendedor: ' + dataSeller.username + '</div>';
  const date = '<div>Fecha: ' + day + ' Hora: ' + hour + '</div>';
  const customer = '<div>Cliente: ' + dataClient.firstname + '</div>';
  const footer = '<div>' + setting[0].ticketSetting.Foot1Line + '</div>';
  const footer2 = '<div>' + setting[0].ticketSetting.Foot2Line + '</div>';

  let saleProduct = '';

  for (let product of sale.products) {
    // Get data about the product
    const dataProduct = await Product.findById(product.product);
    //const items = dataProduct.prices[parseInt(product.price)].items;
    const items = product.unitsInPrice;
    const unitPrice = _.round(product.total/product.quantity, 2);

    let itemsInDescription = '';
    if (items != 1) {
      itemsInDescription =
        ' x' +
        String(items) +
        dataProduct.minimumUnit.substring(0, 3).toLowerCase();
    }

    saleProduct +=
    '<tr>' +
      '<td style="text-align:center;">'+
        product.quantity + ' ' + product.unit.substring(0, 3) +
      '</td>' +
      '<td>'+ dataProduct.name + itemsInDescription + '</td>' +
      '<td style="text-align:center;">'+ unitPrice+ '</td>' +
      '<td style="text-align:center;">'+ product.total + '</td>' +
    '</tr>';
  }

  const saleTable =
  '<table style="width:100%;font-size:90%;">' +
    '<tr>' +
      '<th>Cant.</th>' +
      '<th>Descripcion</th>' +
      '<th>P.Unit</th>' +
      '<th>Total</th>' +
    '</tr>' +
    saleProduct +
  '</table>';

  const total = '<h3 style="text-align:right;">TOTAL: S./' + sale.total + '</h3>';

  return (
    '<div style="font-size:80%;">' +
    title +
    address +
    phone +
    separator +
    code +
    seller +
    date +
    customer +
    separator +
    saleTable +
    total +
    footer +
    footer2 +
    '</div>'
  );
}

async function getTokenGoogleUpdated() {

  let query = Setting.find({});
  const setting = await query.exec();

  const refreshTokenGoogle = setting[0].refreshTokenGoogle;
  const expirationTokenGoogle = setting[0].expirationTokenGoogle;
  const tokenGoogle = setting[0].tokenGoogle;

  const dateToday = new Date();
  // 1 minute forward to avoid exact time
  const dateTodayPlus1Minute = moment(dateToday).add(1, 'm').toDate();
  const dateExpiration = new Date(expirationTokenGoogle);

  //console.log('Important data to nalize');
  //console.log(dateExpiration);
  //console.log(dateTodayPlus1Minute);

  // Case date expiration, get new token
  if (dateExpiration < dateTodayPlus1Minute) {
    //console.log('Updating access token');
    oauth2Client.credentials['refresh_token'] = refreshTokenGoogle;
    // Is necessary convert callback to promise to make await the answer
    return new promise(resolve => {
      return oauth2Client.refreshAccessToken(
        function(err, tokens) {
          // Save new token and new expiration
          setting[0].expirationTokenGoogle = tokens.expiry_date;
          setting[0].tokenGoogle = tokens.access_token;

          setting[0].save();
          //console.log('inside callback hell');
          //console.log(tokens.access_token);
          resolve(tokens.access_token);
        }
      );
    });
  } else {
    //console.log('Using old access token');
    return tokenGoogle;
  }

}

module.exports = router;