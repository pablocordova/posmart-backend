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
  ERROR: 503
};

// Messages response
config.RES = {
  CREATED: 'User created',
  NOCREATED: 'Error to create user'
};

module.exports = config;