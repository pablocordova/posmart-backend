var config = new Object();

config.RES = {
  CREATED: 'Created successfully',
  CUSTOMER_NOT_EXIST: 'Customer does not exist',
  CUSTOMER_SALES: 'Error trying deleting, customer already has sales',
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