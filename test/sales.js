const chai = require('chai');
const chaiHttp = require('chai-http');

const server = require('../app');
const app = server.app;

const config = require('../config/general');
//const configSales = require('../config/sales');

const databaseTest = process.env.DATABASE_TEST;
const dbTest = server.db.useDb(databaseTest);

const expect = chai.expect;

chai.use(chaiHttp);

let auth = '';
let authB = '';

let customerId = '';
let productId = '';
let saleId = '';


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

const customer1 = {
  firstname: 'Pablo cesar',
  lastname: 'Cordova morales',
  dni: '06013059',
  phone: '982251795',
  address: 'Jr agusto B. Leguia 233'
};

let product = {
  category: 'Detergentes',
  minimumUnit: 'Unidad',
  name: 'Magia blanca x360gr',
  picture: 'fake/base64Pic=',
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

describe('Sale API routes', () => {

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

  describe('Create one customer', () => {

    it('Create one customer', done => {
      chai.request(app)
        .post('/customers')
        .set(auth)
        .send(customer1)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          expect(res.body.result).to.exist;
          customerId = res.body.result._id;
          done();
        });
    });

  });

  describe('Create product successfully', () => {

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

  });

  describe('Update prices product successfully', () => {

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

  });


  // Finish Initialization

  describe('POST /sales', () => {

    it('Create one sale successfully', done => {

      const productOne = {
        quantity: 4,
        unitsInPrice: 12,
        product: productId,
        total: 239,
        unit: 'docena',
        earning: 1
      };

      const productTwo = {
        quantity: 1,
        unitsInPrice: 1,
        product: productId,
        total: 5.5,
        unit: 'unidad',
        earning: 1
      };

      let dataSale = {
        client: customerId,
        state: 'Pending',
        products: [ productOne, productTwo ]
      };

      chai.request(app)
        .post('/sales')
        .set(auth)
        .send(dataSale)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          expect(res.body.result).to.exist;
          saleId = res.body.result._id;
          done();
        });

    });
    /*
    it('Fail creating one sale because doesnt have authorization', done => {

      chai.request(app)
        .post('/sales')
        .send({
          client: customerId,
          products: '[' +
            '{ "quantity": 4, "product": "' +
            productId +
            '", "priceIndex": 0}' + ',' +
            '{ "quantity": 2, "product": "' +
            productId +
            '", "priceIndex": 1}' +
          ']'
        })
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Fail creating one sale because duplicated name and price product', done => {

      chai.request(app)
        .post('/sales')
        .set(auth)
        .send({
          client: customerId,
          products: '[' +
            '{ "quantity": 4, "product": "' +
            productId +
            '", "priceIndex": 0}' + ',' +
            '{ "quantity": 2, "product": "' +
            productId +
            '", "priceIndex": 0}' +
          ']'
        })
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          done();
        });

    });

    it('Fail creating one sale because lack some parameter', done => {

      chai.request(app)
        .post('/sales')
        .set(auth)
        .send({
          client: customerId,
          products: '[' +
            '{ "product": "' +
            productId +
            '", "priceIndex": 0}' + ',' +
            '{ "quantity": 2, "product": "' +
            productId +
            '", "priceIndex": 1}' +
          ']'
        })
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          done();
        });

    });
    */
  });
/*
  describe('GET /sales', () => {

    it('Get list of sales', done => {

      chai.request(app)
        .get('/sales')
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result[0]._id).to.exist;
          done();
        });

    });

    it('Fail trying to get list of products because not authorization', done => {
      chai.request(app)
        .get('/sales')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

  });

  describe('GET /sales/:id', () => {

    it('Get one sale by id', done => {
      chai.request(app)
        .get('/sales/' + saleId)
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result._id).to.exist;
          done();
        });

    });

    it('Fail trying to get one product, because not authorization', done => {

      chai.request(app)
        .get('/sales/' + saleId)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });
*/
});



