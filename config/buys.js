var config = new Object();

config.RES = {
  CREATED: 'Created successfully',
  ERROR: 'Error processing data',
  NOCREATED: 'Error trying to create customer',
  OK: 'OK',
  UPDATED: 'Customer was updated'
};

config.STATUS = {
  CREATED: 201,
  UNAUTHORIZED: 401,
  OK: 200,
  SERVER_ERROR: 500
};

module.exports = config;