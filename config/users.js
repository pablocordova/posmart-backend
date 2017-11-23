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
  NOCREATED: 'Error to create user',
  INVALID_PARAMS: 'Invalid params',
  USER_SALES: 'Error al borrar, usuario ya tiene ventas',
  UNAUTHORIZED: 'You need permissions',
  DELETE_OK: 'Usuario borrado correctamente!'
};

module.exports = config;