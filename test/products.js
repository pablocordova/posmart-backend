const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../app');
const config = require('../config/products');
const Product = require('../models/product');
const User = require('../models/user');

const expect = chai.expect;
chai.use(chaiHttp);

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

let auth = '';
let productId = '';

let product = {
  category: 'Detergentes',
  minimumUnit: 'Unidad',
  name: 'Magia blanca x360gr',
  picture: 'fake/base64Pic=',
};

describe('Product API routes', () => {

  // Clear collections
  before(done => {

    User.remove({}, () => {
      Product.remove({}, () => {
        done();
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

  });

  describe('POST /products', () => {

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

    it('Fail creating one product because doesnt have authorization', done => {

      chai.request(app)
        .post('/products')
        .send(product)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Fail creating one product because duplicated product name', done => {

      chai.request(app)
        .post('/products')
        .set(auth)
        .send(product)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          done();
        });

    });

  });

  describe('GET /products', () => {

    it('Get list of products', done => {

      chai.request(app)
        .get('/products')
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Fail trying to get list of products because not authorization', done => {

      chai.request(app)
        .get('/products')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });

  describe('GET /products/:id', () => {

    it('Get one product by id', done => {

      chai.request(app)
        .get('/products/' + productId)
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result.name).to.exist;
          done();
        });

    });

    it('Fail trying to get one product because not authorization', done => {

      chai.request(app)
        .get('/products/' + productId)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });

  describe('POST /products/price', () => {

    it('Create one price product', done => {

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

    it('Fail creating one price product because not authorization', done => {

      chai.request(app)
        .post('/products/price')
        .type('form')
        .send({
          quantity: '1',
          name: 'unidad',
          items: 1,
          price: 5.8,
          product: productId
        })
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Fail creating one price product because lack some parameter', done => {

      chai.request(app)
        .post('/products/price')
        .type('form')
        .set(auth)
        .send({
          quantity: '1',
          name: 'docena',
          price: 5.8,
          product: productId
        })
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.SERVER_ERROR);
          expect(res.body.message).to.be.equal(config.RES.ERROR);
          done();
        });

    });

    it('Fail creating one price product because empty some parameter', done => {

      chai.request(app)
        .post('/products/price')
        .type('form')
        .set(auth)
        .send({
          quantity: '',
          name: '',
          items: 1,
          price: 5.8,
          product: productId
        })
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.SERVER_ERROR);
          expect(res.body.message).to.be.equal(config.RES.ERROR);
          done();
        });

    });

    it('Fail creating one price product because repeat quantity and name', done => {

      chai.request(app)
        .post('/products/price')
        .type('form')
        .set(auth)
        .send({
          quantity: '1',
          name: 'unidad',
          items: 2,
          price: 6.8,
          product: productId
        })
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.SERVER_ERROR);
          expect(res.body.message).to.be.equal(config.RES.ERROR);
          done();
        });

    });

  });

  describe('GET /products/:id/prices', () => {

    it('Get list of prices product', done => {

      chai.request(app)
        .get('/products/' + productId + '/prices')
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Fail trying to get list of prices product because not authorization', done => {

      chai.request(app)
        .get('/products/' + productId + '/prices')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });

  describe('GET /products/:id/prices/:indexPrice', () => {

    it('Get one price product', done => {

      chai.request(app)
        .get('/products/'+ productId + '/prices/0')
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result.price.name).to.exist;
          done();
        });

    });

    it('Fail trying to get one price product because not authorization', done => {

      chai.request(app)
        .get('/products/'+ productId + '/prices/0')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });

  describe('POST /products/entry', () => {

    it('Create one entry product', done => {

      chai.request(app)
        .post('/products/entry')
        .type('form')
        .set(auth)
        .send({
          quantity: 100,
          unitCost: 12.5,
          product: productId
        })
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.CREATED);
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          expect(res.body.result.entries[0].quantity).to.be.equal(100);
          expect(res.body.result.entries[0].unitCost).to.be.equal(12.5);
          done();
        });

    });

    it('Fail creating one entry product because not authorization', done => {

      chai.request(app)
        .post('/products/entry')
        .type('form')
        .send({
          quantity: 100,
          unitCost: 12.5,
          product: productId
        })
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Fail creating one entry product because lack some parameter', done => {

      chai.request(app)
        .post('/products/entry')
        .type('form')
        .set(auth)
        .send({
          quantity: 100,
          product: productId
        })
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.SERVER_ERROR);
          expect(res.body.message).to.be.equal(config.RES.ERROR);
          done();
        });

    });

    it('Fail creating one entry product because negative numbers', done => {

      chai.request(app)
        .post('/products/entry')
        .type('form')
        .set(auth)
        .send({
          quantity: -1,
          unitCost: -12.5,
          product: productId
        })
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.SERVER_ERROR);
          expect(res.body.message).to.be.equal(config.RES.ERROR);
          done();
        });

    });

  });

  describe('GET /products/:id/entries', () => {

    it('Get list of entries product', done => {

      chai.request(app)
        .get('/products/' + productId + '/entries')
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result[0].entries[0].date).to.exist;
          done();
        });

    });

    it('Fail get list of entries product because not authorization', done => {

      chai.request(app)
        .get('/products/' + productId + '/entries')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });

});