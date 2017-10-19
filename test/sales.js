const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../app');
const config = require('../config/sales');
const Customer = require('../models/customer');
const Sale = require('../models/sale');
const Product = require('../models/product');
const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

let auth = '';
let customerId = '';
let productId = '';
let saleId = '';

const user = {
  'username': 'usernameTester1',
  'email': 'email1@email.com',
  'password': '12K45p78',
  'type': 'normal',
  'permissions': '{' +
    '"customers": true,' +
    '"products": true,' +
    '"sales": true,' +
    '"settings": true,' +
    '"users": true' +
  '}'
};
const userObj = JSON.parse(JSON.stringify(user));
const loginUser = { 'email': userObj.email, 'password': userObj.password };

const customer = {
  firstname: 'Pablo cesar',
  lastname: 'Cordova morales',
  dni: '06013059',
  phone: '982251795',
  address: 'Jr agusto B. Leguia 233'
};

const product = {
  category: 'Detergentes',
  minimumUnit: 'Unidad',
  name: 'Magia blanca x360gr',
  picture: 'fake/base64Pic=',
};

describe('Sale API routes', () => {

  // Clear collections
  before(done => {

    User.remove({}, () => {
      Sale.remove({}, () => {
        Customer.remove({}, () => {
          Product.remove({}, () => {
            done();
          });
        });
      });
    });

  });

  describe('Initialize data', () => {

    it('Create one user with normal type', done => {

      chai.request(app)
        .post('/users')
        .type('form')
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.CREATED);
          done();
        });

    });

    it('Login and get token necessary for routes', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, res) => {
          auth = { 'Authorization': 'JWT ' + res.body.token, 'Content-Type': 'application/json' };
          done();
        });

    });

    it('Create one customer', done => {

      chai.request(app)
        .post('/customers')
        .set(auth)
        .send(customer)
        .end((err, res) => {
          customerId = res.body.result._id;
          expect(res).to.have.status(config.STATUS.CREATED);
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          done();
        });

    });

    it('Create one product', done => {

      chai.request(app)
        .post('/products')
        .set(auth)
        .send(product)
        .end((err, res) => {
          productId = res.body.result._id;
          expect(res).to.have.status(config.STATUS.CREATED);
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          done();
        });

    });

    it('Create price product: quantity->1, name->unidad', done => {

      chai.request(app)
        .post('/products/price')
        .type('form')
        .set(auth)
        .send({
          quantity: '1',
          name: 'unidad',
          items: 1,
          price: 5.8,
          product: productId
        })
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.CREATED);
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          done();
        });

    });

    it('Create price product: quantity->1, name->docena', done => {

      chai.request(app)
        .post('/products/price')
        .type('form')
        .set(auth)
        .send({
          quantity: '1',
          name: 'docena',
          items: 12,
          price: 61,
          product: productId
        })
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.CREATED);
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          done();
        });

    });

    it('Create entry product: quantity->100, unitCost->12.5', done => {

      chai.request(app)
        .post('/products/entry')
        .type('form')
        .set(auth)
        .send({
          quantity: 100,
          unitCost: 12.5,
          product: productId
        })
        .end((err, resp) => {
          expect(resp).to.be.status(config.STATUS.CREATED);
          expect(resp.body.message).to.be.equal(config.RES.CREATED);
          done();
        });

    });

  });

  describe('POST /sales', () => {

    it('Create one sale', done => {

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
            '", "priceIndex": 1}' +
          ']'
        })
        .end((err, resS) => {
          saleId = resS.body.result._id;
          expect(resS).to.have.status(config.STATUS.CREATED);
          expect(resS.body.message).to.be.equal(config.RES.CREATED);
          chai.request(app)
            .get('/products/' + productId)
            .set(auth)
            .end((err, res) => {
              expect(res).to.have.status(config.STATUS.OK);
              expect(res.body.result.quantity).to.be.equal(72);
              done();
            });
        });

    });

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

  });

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

  describe('GET/sales/:id', () => {

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

});



