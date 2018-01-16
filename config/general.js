var config = new Object();

config.RES = {
  CREATED: 'Created successfully',
  ERROR: 'Error processing data',
  ERROR_CREATE: 'Error creating item',
  ERROR_DATABASE: 'Error with database',
  ERROR_UPDATE: 'Error updating item',
  NOCREATED: 'Error trying to create customer',
  OK: 'OK',
  UNAUTHORIZED: 'You do not have permissions',
  UPDATED: 'Customer was updated'
};

config.STATUS = {
  CREATED: 201,
  OK: 200,
  SERVER_ERROR: 500,
  UNAUTHORIZED: 401
};

module.exports = config;