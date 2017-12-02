const express = require('express');
const google = require('googleapis');
const moment = require('moment');
const passport = require('passport');
const axios = require('axios');

const router = express.Router();
const config = require('../config/customers');

const Setting = require('../models/setting');

var OAuth2 = google.auth.OAuth2;
const redirect_url = 'http://localhost:3001/setting';
var oauth2Client = new OAuth2(
  '193086894675-510ggki4pbe16ntvmuhqotr3bojhte96.apps.googleusercontent.com',
  'OUG7KOIqd_mV1517jEwAkMku',
  redirect_url
);
const printerID = 'bfeafc3e-9eaf-0709-5f42-20866d29b063';
const printerProxy = 'D0E6B1C4-4B63-489B-96B7-3051A1821BAF';

var url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: 'https://www.googleapis.com/auth/cloudprint'
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

/*
router.post(
  '/print',
  passport.authenticate('jwt', { session: false }),
  haspermission,
  (req, res) => {
*/
router.post(
  '/print/sale',
  async (req, res) => {

    //const saleID = req.body.saleID;
    const tickeProperties = {
      'version': '1.0',
      'print': {
        'vendor_ticket_item': [],
        'color': { 'type': 'STANDARD_MONOCHROME' },
        'copies': { 'copies': 1 }
      }
    };

    // First I'll check if printer is available and with also I'll get the xsrf-token
    const accessToken = await getTokenGoogleUpdated();
    //console.log('printing access token google');
    //console.log(accessToken);
    //return getPrinterInfo(res, accessToken);
    axios.get(
      'https://www.google.com/cloudprint/submit',
      {
        params: {
          printerid : printerID,
          title: 'title printer',
          ticket: tickeProperties,
          content : 'to test jejejje pleaseeee',
          contentType: 'text/plain'
        },
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }

      }

    )
      .then(response => {
        console.log('google cloud print document');
        return res.status(config.STATUS.OK).send({
          result: response.data,
          message: config.RES.OK,
        });
      })
      .catch(err => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          result: err,
          message: config.RES.ERROR,
        });
      });

  }
);

async function getTokenGoogleUpdated() {

  return await Setting.find({})
    .then(async setting => {
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
        return await oauth2Client.refreshAccessToken( async function(err, tokens) {
          // Save new token and new expiration
          //let setting = new Setting();
          setting[0].expirationTokenGoogle = tokens.expiry_date;
          setting[0].tokenGoogle = tokens.access_token;

          await setting[0].save();

          //return getPrinterInfo(res, tokens.access_token);
          return tokens.access_token;
        });

      } else {
        console.log('Using old access token');
        //return getPrinterInfo(res, tokenGoogle);
        return tokenGoogle;
      }

    })
    .catch(err => {
      console.log(err);
    });

}

function getPrinterInfo(res, accessToken) {

  axios.get(
    'https://www.google.com/cloudprint/list',
    {
      params: {
        proxy: printerProxy
      },
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    }
  )
    .then(response => {
      console.log('response of google cloud print');
      return res.status(config.STATUS.OK).send({
        result: response.data,
        message: config.RES.OK,
      });
    })
    .catch(err => {
      return res.status(config.STATUS.SERVER_ERROR).send({
        result: err,
        message: config.RES.ERROR,
      });
    });

}

module.exports = router;