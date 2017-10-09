var config = new Object();

// Validation
config.USERNAME = {
  min: 2,
  max: 50
};

config.PASSWORD = {
  min: 8,
  max: 50
};

config.PASSWORD_LOCAL = 'es-ES';

// Status response
config.STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQ: 400,
  UNAUTHORIZED: 401,
  SERVER_ERROR: 500
};

// Messages response
config.RES = {
  OK: 'OK',
  CREATED: 'User created',
  NOCREATED: 'Error to create user'
};

module.exports = config;