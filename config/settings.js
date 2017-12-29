var config = new Object();

config.RES = {
  CREATED: 'Created successfully',
  ERROR: 'Error processing data',
  OK: 'OK',
  PRINTING: 'Sent to google print cloud',
  SAVED_SUCCESSFULLY: 'Guardado correctamente'
};

config.STATUS = {
  CREATED: 201,
  UNAUTHORIZED: 401,
  OK: 200,
  SERVER_ERROR: 500
};

config.URL_GCP = 'https://www.googleapis.com/auth/cloudprint';

module.exports = config;