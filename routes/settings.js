const express = require('express');
const google = require('googleapis');
const moment = require('moment');
const passport = require('passport');
let promise = require('bluebird');
const router = express.Router();
const request = require('request');
const _ = require('lodash');

const config = require('../config/settings');
const Customer = require('../models/customer');
const Product = require('../models/product');
const Sale = require('../models/sale');
const User = require('../models/user');
const Setting = require('../models/setting');

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

// My middleware to check permissions
let haspermission = (req, res, next) => {

  if (req.user.permissions.settings) {
    next();
  } else {
    res.status(config.STATUS.UNAUTHORIZED).send({
      message: config.RES.UNAUTHORIZED
    });
  }

};

router.get(
  '/googleurl',
  passport.authenticate('jwt', { session: false }),
  haspermission,
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
  haspermission,
  (req, res) => {
    oauth2Client.getToken(req.body.code, function (err, tokens) {
      oauth2Client.credentials = tokens;
      // If refresh token exits save it

      if (tokens.hasOwnProperty('refresh_token')) {

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
      }
    });
  }
);


router.post(
  '/print/sale',
  passport.authenticate('jwt', { session: false }),
  haspermission,
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
      function optionalCallback(err, httpResponse, body) {
        if (err) {
          console.error('upload failed:', err);
          return res.status(config.STATUS.SERVER_ERROR).send({
            message: config.RES.ERROR,
            result: err
          });
        } else {
          console.log('Upload successful!  Server responded with:', body);
          return res.status(config.STATUS.OK).send({
            message: config.RES.PRINTING,
            printed: body.success
          });
        }
      }
    );

  }
);

async function generateHTMLSale(sale) {
  // Get data seller
  const dataSeller = await User.findById(sale.seller);
  // Get data customer
  const dataClient = await Customer.findById(sale.client);

  let hour = moment(sale.date).format('hh:mm:ss a');
  let day = moment(sale.date).format('DD/MM/YY');

  const separator = '<div>-----------------------------------------------</div>';
  const title = '<h2 style="text-align:center;">COMERCIAL KYN</h2>';
  const address = '<div>Jr Agusto Beleguia 233 El progreso Carabayllo</div>';
  const phone = '<div>Telf: 982251795</div>';
  const seller = '<div>Vendedor: ' + dataSeller.username + '</div>';
  const date = '<div>Fecha: ' + day + ' Hora: ' + hour + '</div>';
  const customer = '<div>Cliente: ' + dataClient.firstname + '</div>';

  let saleProduct = '';

  for (let product of sale.products) {
    // Get data about the product
    const dataProduct = await Product.findById(product.product);
    const items = dataProduct.prices[parseInt(product.price)].items;
    const unitPrice = _.round(product.total/(items * product.quantity), 2);

    saleProduct +=
    '<tr>' +
      '<td>'+ product.quantity + ' ' + product.unit.substring(0, 3) + '</td>' +
      '<td>'+ dataProduct.name + '</td>' +
      '<td>'+ unitPrice+ '</td>' +
      '<td>'+ product.total + '</td>' +
    '</tr>';
  }

  const saleTable =
  '<table>' +
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
    title +
    address +
    phone +
    separator +
    seller +
    date +
    customer +
    separator +
    saleTable +
    total
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

  console.log('Important data to nalize');
  console.log(dateExpiration);
  console.log(dateTodayPlus1Minute);

  // Case date expiration, get new token
  if (dateExpiration < dateTodayPlus1Minute) {
    console.log('Updating access token');
    oauth2Client.credentials['refresh_token'] = refreshTokenGoogle;
    // Is necessary convert callback to promise to make await the answer
    return new promise(resolve => {
      return oauth2Client.refreshAccessToken(
        function(err, tokens) {
          // Save new token and new expiration
          setting[0].expirationTokenGoogle = tokens.expiry_date;
          setting[0].tokenGoogle = tokens.access_token;

          setting[0].save();
          console.log('inside callback hell');
          console.log(tokens.access_token);
          resolve(tokens.access_token);
        }
      );
    });
  } else {
    console.log('Using old access token');
    return tokenGoogle;
  }

}

module.exports = router;