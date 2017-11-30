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

router.get(
  '/printerinfo',
  passport.authenticate('jwt', { session: false }),
  haspermission,
  (req, res) => {

    Setting.find({})
      .then(setting => {
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
          oauth2Client.refreshAccessToken(function(err, tokens) {
            // Save new token and new expiration
            let setting = new Setting();
            setting.expirationTokenGoogle = tokens.expiry_date;
            setting.tokenGoogle = tokens.access_token;

            setting.save();

            return getPrinterInfo(res, tokens.access_token);
          });

        } else {
          console.log('Using old access token');
          return getPrinterInfo(res, tokenGoogle);
        }

      })
      .catch(err => {
        return res.status(config.STATUS.SERVER_ERROR).send({
          result: err,
          message: config.RES.ERROR,
        });
      });

  }
);

function getPrinterInfo(res, accessToken) {

  const googleToken = accessToken;
  axios.get(
    'https://www.google.com/cloudprint/list',
    {
      params: {
        proxy: '9ff10dfa-866d-40a5-afbe-563771671def'
      },
      headers: {
        'Authorization': 'Bearer ' + googleToken
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