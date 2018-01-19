var config = new Object();

config.TYPE_USERS = [
  'DASHBOARD',
  'APP'
];

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

module.exports = config;