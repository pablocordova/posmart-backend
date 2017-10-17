var config = new Object();

config.IGV = 0.18;

config.RES = {
  BAD_PRICE_INDEX: 'Price index does not exits',
  CREATED: 'Created successfully',
  ERROR: 'Error processing data',
  NOCLIENT: 'Client doesnt exist',
  NOCREATED: 'Error trying to create item',
  NOINVENTORY: 'There are not enough products in: ',
  NOPARAMETER: 'Lack some parameter',
  NOPRODUCT: 'Product does not exits: ',
  NOPRODUCTS: 'There are not at least 1 product',
  OK: 'OK',
  PRODUCTS_DUPLICATED: 'There are one o more products duplicated',
  UNAUTHORIZED: 'You need permissions'
};

config.STATUS = {
  CREATED: 201,
  UNAUTHORIZED: 401,
  OK: 200,
  SERVER_ERROR: 500
};

module.exports = config;