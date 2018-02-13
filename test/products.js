const chai = require('chai');
const chaiHttp = require('chai-http');

const server = require('../app');
const app = server.app;

const config = require('../config/general');
const configProducts = require('../config/products');

const databaseTest = process.env.DATABASE_TEST;
const dbTest = server.db.useDb(databaseTest);

const expect = chai.expect;
chai.use(chaiHttp);

let auth = '';
let authB = '';
let productId = '';

// Constans to initialization

const business = {
  business: 'Example business test',
  email: 'example@example.com',
  password: 'exampleTest123'
};

const user = {
  'username': 'usernameTester1',
  'email': 'email1@email.com',
  'password': '12K45p78',
  'code': 'postest',
  'permissionDiscount': 'Permit'
};

// Variables for tests

let product = {
  category: 'Detergentes',
  minimumUnit: 'Unidad',
  name: 'Magia blanca x360gr',
  picture: 'fake/base64Pic=',
};

let anotherProduct = {
  category: 'Detergentes',
  minimumUnit: 'Unidad',
  name: 'Opan verde x180gr',
  picture: 'fake/base64Pic=123'
};

let productUpdated = {
  category: 'Bebidas',
  minimumUnit: 'Kilogramo',
  name: 'Magia blanca x180gr',
  picture: 'fake/base64Pic=456',
};

const unitCost = {
  'unitCost': 5.1
};

let prices = {
  pricesTmp: [
    {
      quantity: '1',
      name: 'unidad',
      items: 1,
      price: 5.8
    },
    {
      quantity: '12',
      name: 'docena',
      items: 12,
      price: 60
    }
  ]
};


describe('Product API routes', () => {

  // Clear collections(Drop database)
  before(done => {
    dbTest.dropDatabase();
    done();
  });

  // Initialization

  describe('Create a business', () => {

    it('Create business successfully', done => {
      chai.request(app)
        .post('/register')
        .type('form')
        .send(business)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          expect(res.body.result).to.exist;
          done();
        });
    });

  });

  describe('Login with business created', () => {

    it('Get token to use it to create a user', done => {
      chai.request(app)
        .post('/login/business')
        .type('form')
        .send(business)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.token).to.exist;
          expect(res.body._id).to.exist;
          authB = { 'Authorization': 'JWT ' + res.body.token, 'Content-Type': 'application/json' };
          done();
        });
    });

  });

  describe('Create user who will be logged in.', () => {

    it('Create user for sale app successfully', done => {
      chai.request(app)
        .post('/users')
        .type('form')
        .set(authB)
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          done();
        });
    });

  });

  describe('Login with user created', () => {

    it('Get token to use it in next tests', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.token).to.exist;
          auth = { 'Authorization': 'JWT ' + res.body.token, 'Content-Type': 'application/json' };
          done();
        });
    });

  });

  // Finish Initilization

  // GENERAL PRODUCT

  describe('POST /products', () => {

    it('Create product successfully', done => {

      chai.request(app)
        .post('/products')
        .set(authB)
        .send(product)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          expect(res.body.result).to.exist;
          productId = res.body.result._id;
          done();
        });

    });

    it('Failure due to not authorization', done => {

      chai.request(app)
        .post('/products')
        .send(product)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Failure due to lack category parameter', done => {

      let productWithoutCategory = Object.assign({}, product);
      productWithoutCategory.category = undefined;
      productWithoutCategory = JSON.parse(JSON.stringify(productWithoutCategory));

      chai.request(app)
        .post('/products')
        .type('form')
        .set(authB)
        .send(productWithoutCategory)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack minimumUnit parameter', done => {

      let productWithoutMinimumUnit= Object.assign({}, product);
      productWithoutMinimumUnit.minimumUnit = undefined;
      productWithoutMinimumUnit = JSON.parse(JSON.stringify(productWithoutMinimumUnit));

      chai.request(app)
        .post('/products')
        .type('form')
        .set(authB)
        .send(productWithoutMinimumUnit)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack name parameter', done => {

      let productWithoutName = Object.assign({}, product);
      productWithoutName.name = undefined;
      productWithoutName = JSON.parse(JSON.stringify(productWithoutName));

      chai.request(app)
        .post('/products')
        .type('form')
        .set(authB)
        .send(productWithoutName)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it ('Failure due to wrong category syntax', done => {

      let categoryWrong = Object.assign({}, anotherProduct);
      categoryWrong.category = 'category not exist';
      categoryWrong = JSON.parse(JSON.stringify(categoryWrong));

      chai.request(app)
        .post('/products')
        .type('form')
        .set(authB)
        .send(categoryWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it ('Failure due to wrong minimumUnit syntax', done => {

      let minimumUnitWrong = Object.assign({}, anotherProduct);
      minimumUnitWrong.minimumUnit = 'minimumUnit not exist';
      minimumUnitWrong = JSON.parse(JSON.stringify(minimumUnitWrong));

      chai.request(app)
        .post('/products')
        .type('form')
        .set(authB)
        .send(minimumUnitWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to duplicated product name', done => {

      chai.request(app)
        .post('/products')
        .set(authB)
        .send(product)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.ITEM_DUPLICATED);
          expect(res.body.result).to.be.equal(configProducts.RES.DUPLICATED_PRODUCT_NAME);
          done();
        });

    });

  });

  describe('GET /products', () => {

    it('Get list of products by business', done => {

      chai.request(app)
        .get('/products')
        .set(authB)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.OK);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Get list of products by app', done => {

      chai.request(app)
        .get('/products')
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.OK);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to not authorization', done => {

      chai.request(app)
        .get('/products')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });

  describe('GET /products/:id', () => {

    it('Get product by id successfully', done => {

      chai.request(app)
        .get('/products/' + productId)
        .set(authB)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.OK);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to not authorization', done => {

      chai.request(app)
        .get('/products/' + productId)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });

  describe('PUT /products/:id', () => {

    it('Update one product', done => {

      chai.request(app)
        .put('/products/' + productId)
        .set(authB)
        .send(productUpdated)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.UPDATED);
          expect(res.body.result.category).to.be.equal(productUpdated.category);
          expect(res.body.result.minimumUnit).to.be.equal(productUpdated.minimumUnit);
          expect(res.body.result.name).to.be.equal(productUpdated.name);
          expect(res.body.result.picture).to.be.equal(productUpdated.picture);
          done();
        });

    });

    it('Failure due to not authorization', done => {

      chai.request(app)
        .put('/products/' + productId)
        .send(productUpdated)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Failure due to lack category parameter', done => {

      let productWithoutCategory = Object.assign({}, productUpdated);
      productWithoutCategory.category = undefined;
      productWithoutCategory = JSON.parse(JSON.stringify(productWithoutCategory));

      chai.request(app)
        .post('/products')
        .type('form')
        .set(authB)
        .send(productWithoutCategory)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack minimumUnit parameter', done => {

      let productWithoutMinimumUnit= Object.assign({}, productUpdated);
      productWithoutMinimumUnit.minimumUnit = undefined;
      productWithoutMinimumUnit = JSON.parse(JSON.stringify(productWithoutMinimumUnit));

      chai.request(app)
        .post('/products')
        .type('form')
        .set(authB)
        .send(productWithoutMinimumUnit)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack name parameter', done => {

      let productWithoutName = Object.assign({}, productUpdated);
      productWithoutName.name = undefined;
      productWithoutName = JSON.parse(JSON.stringify(productWithoutName));

      chai.request(app)
        .post('/products')
        .type('form')
        .set(authB)
        .send(productWithoutName)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it ('Failure due to wrong category syntax', done => {

      let categoryWrong = Object.assign({}, anotherProduct);
      categoryWrong.category = 'category not exist';
      categoryWrong = JSON.parse(JSON.stringify(categoryWrong));

      chai.request(app)
        .post('/products')
        .type('form')
        .set(authB)
        .send(categoryWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it ('Failure due to wrong minimumUnit syntax', done => {

      let minimumUnitWrong = Object.assign({}, anotherProduct);
      minimumUnitWrong.minimumUnit = 'minimumUnit not exist';
      minimumUnitWrong = JSON.parse(JSON.stringify(minimumUnitWrong));

      chai.request(app)
        .post('/products')
        .type('form')
        .set(authB)
        .send(minimumUnitWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to duplicated product name', done => {

      chai.request(app)
        .post('/products')
        .set(authB)
        .send(productUpdated)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.ITEM_DUPLICATED);
          expect(res.body.result).to.be.equal(configProducts.RES.DUPLICATED_PRODUCT_NAME);
          done();
        });

    });

  });

  describe('PUT /:id/cost', () => {

    it('Update cost product', done => {

      chai.request(app)
        .put('/products/' + productId + '/cost')
        .set(authB)
        .send(unitCost)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.UPDATED);
          expect(res.body.result.unitCost).to.be.equal(unitCost.unitCost);
          done();
        });

    });

    it('Failure due to not authorization', done => {

      chai.request(app)
        .put('/products/' + productId + '/cost')
        .send(unitCost)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Failure due to lack unitCost parameter', done => {

      chai.request(app)
        .put('/products/' + productId + '/cost')
        .type('form')
        .set(authB)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

  });

  // PRICE PRODUCT

  describe('PUT /products/:id/prices', () => {

    it('Update prices product successfully', done => {

      chai.request(app)
        .put('/products/' + productId + '/prices')
        .type('form')
        .set(authB)
        .send(prices)
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.UPDATED);
          expect(res.body.result).to.exist;
          // Data come with '_id' parameter, and I use map operation to remove it.
          const pricesUpdated = res.body.result.map(priceMap => {
            return {
              quantity: priceMap.quantity,
              name: priceMap.name,
              items: priceMap.items,
              price: priceMap.price
            };
          });
          expect(pricesUpdated).to.deep.equal(prices.pricesTmp);
          done();
        });

    });

    it('Failure due to not authorization', done => {

      chai.request(app)
        .put('/products/' + productId + '/prices')
        .type('form')
        .send(prices)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Failure due to lack quantity parameter', done => {

      let priceWithoutQuantity = JSON.parse(JSON.stringify(prices));
      priceWithoutQuantity.pricesTmp[0].quantity = undefined;
      priceWithoutQuantity = JSON.parse(JSON.stringify(priceWithoutQuantity));

      chai.request(app)
        .put('/products/' + productId + '/prices')
        .type('form')
        .set(authB)
        .send(priceWithoutQuantity)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack name parameter', done => {

      let priceWithoutName = JSON.parse(JSON.stringify(prices));
      priceWithoutName.pricesTmp[0].name = undefined;
      priceWithoutName = JSON.parse(JSON.stringify(priceWithoutName));

      chai.request(app)
        .put('/products/' + productId + '/prices')
        .type('form')
        .set(authB)
        .send(priceWithoutName)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack items parameter', done => {

      let priceWithoutItems = JSON.parse(JSON.stringify(prices));
      priceWithoutItems.pricesTmp[0].items = undefined;
      priceWithoutItems = JSON.parse(JSON.stringify(priceWithoutItems));

      chai.request(app)
        .put('/products/' + productId + '/prices')
        .type('form')
        .set(authB)
        .send(priceWithoutItems)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack price parameter', done => {

      let priceWithoutPrice = JSON.parse(JSON.stringify(prices));
      priceWithoutPrice.pricesTmp[0].price = undefined;
      priceWithoutPrice = JSON.parse(JSON.stringify(priceWithoutPrice));

      chai.request(app)
        .put('/products/' + productId + '/prices')
        .type('form')
        .set(authB)
        .send(priceWithoutPrice)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to product not found', done => {

      chai.request(app)
        .put('/products/9a65a1d2977af10c88d49826/prices')
        .set(authB)
        .send(prices)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configProducts.RES.NOT_FOUND);
          expect(res.body.result).to.exist;
          done();
        });

    });

  });

  describe('GET /products/:id/prices', () => {

    it('Get list of prices product successfully', done => {

      chai.request(app)
        .get('/products/' + productId + '/prices')
        .set(authB)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.OK);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to not authorization', done => {

      chai.request(app)
        .get('/products/' + productId + '/prices')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });

  // Here all the routes of elimination for not to causes conflicts

  describe('DELETE /products/:id', () => {

    it('Failure due to not authorization', done => {

      chai.request(app)
        .delete('/products/' + productId)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Delete product successfully', done => {

      chai.request(app)
        .delete('/products/' + productId)
        .set(authB)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.DELETED);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to product not found', done => {

      chai.request(app)
        .delete('/products/9a65a1d2977af10c88d49826')
        .set(authB)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configProducts.RES.NOT_FOUND);
          expect(res.body.result).to.exist;
          done();
        });

    });

  });

});