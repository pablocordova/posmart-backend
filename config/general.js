var config = new Object();

config.RES = {
  CREATED: 'Created successfully',
  ELEMENT_NOT_EXIST: 'Element does not exist',
  ERROR_CREATE: 'Error creating item',
  ERROR_DATABASE: 'Error with database',
  ERROR_UPDATE: 'Error updating item',
  INPUTS_NO_VALID: 'Inputs no valid',
  OK: 'OK',
  UNAUTHORIZED: 'You do not have permissions'
};

config.STATUS = {
  BAD_REQUEST: 400,
  CONFLICT: 409,
  CREATED: 201,
  OK: 200,
  SERVER_ERROR: 500,
  UNAUTHORIZED: 401
};

module.exports = config;