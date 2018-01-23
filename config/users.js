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

config.RES = {
  ERROR_DUPLICATED_USERNAME: 'Username already exist',
  ERROR_DUPLICATED_EMAIL: 'Email already exist',
  INVALID_EMAIL: 'Invalid email',
  INVALID_USERNAME: 'Invalid username',
  INVALID_PASSWORD: 'Invalid password',
  NOT_FOUND: 'User not found',
  USER_WITH_SALE: 'User already has sale'
};

module.exports = config;