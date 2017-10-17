const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../app');
const config = require('../config/sales');
const Sale = require('../models/sale');

const expect = chai.expect;
const loginUser = { 'email': 'email1@email.com', 'password': '12K45p78' };

chai.use(chaiHttp);

describe('SALE', () => {

  describe('Create sale', () => {

    // Clear Sale collections
    before(done => {
      Sale.remove({}, () => {
        done();
      });
    });

    it('should create one sale', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/customers')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resC) => {
              chai.request(app)
                .get('/products')
                .set({
                  'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json'
                })
                .end((err, resP) => {
                  chai.request(app)
                    .post('/sales')
                    .set({
                      'Authorization': 'JWT ' + resL.body.token,
                      'Content-Type': 'application/json'
                    })
                    .send({
                      client: resC.body.result[0]._id,
                      products: '[' +
                        '{ "quantity": 4, "product": "' +
                        resP.body.result[0]._id +
                        '", "priceIndex": 0}' + ',' +
                        '{ "quantity": 2, "product": "' +
                        resP.body.result[0]._id +
                        '", "priceIndex": 1}' +
                      ']'
                    })
                    .end((err, resS) => {
                      expect(resS).to.have.status(config.STATUS.CREATED);
                      expect(resS.body.message).to.be.equal(config.RES.CREATED);
                      chai.request(app)
                        .get('/products/' + resP.body.result[0]._id)
                        .set({
                          'Authorization': 'JWT ' + resL.body.token,
                          'Content-Type': 'application/json'
                        })
                        .end((err, res) => {
                          expect(res).to.have.status(config.STATUS.OK);
                          expect(res.body.result.quantity).to.be.equal(72);
                          done();
                        });
                    });
                });
            });
        });

    });

    it('should fail creating one sale because doesnt have authorization', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/customers')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resC) => {
              chai.request(app)
                .get('/products')
                .set({
                  'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json'
                })
                .end((err, resP) => {
                  chai.request(app)
                    .post('/sales')
                    .send({
                      client: resC.body.result[0]._id,
                      products: '[' +
                        '{ "quantity": 4, "product": "' +
                        resP.body.result[0]._id +
                        '", "priceIndex": 0}' + ',' +
                        '{ "quantity": 2, "product": "' +
                        resP.body.result[0]._id +
                        '", "priceIndex": 1}' +
                      ']'
                    })
                    .end((err, res) => {
                      expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
                      done();
                    });
                });
            });
        });

    });

    it('should fail creating one sale because duplicated name and price product', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/customers')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resC) => {
              chai.request(app)
                .get('/products')
                .set({
                  'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json'
                })
                .end((err, resP) => {
                  chai.request(app)
                    .post('/sales')
                    .set({
                      'Authorization': 'JWT ' + resL.body.token,
                      'Content-Type': 'application/json'
                    })
                    .send({
                      client: resC.body.result[0]._id,
                      products: '[' +
                        '{ "quantity": 4, "product": "' +
                        resP.body.result[0]._id +
                        '", "priceIndex": 0}' + ',' +
                        '{ "quantity": 2, "product": "' +
                        resP.body.result[0]._id +
                        '", "priceIndex": 0}' +
                      ']'
                    })
                    .end((err, res) => {
                      expect(res).to.have.status(config.STATUS.SERVER_ERROR);
                      done();
                    });
                });
            });
        });

    });

    it('should fail creating one sale because lack some parameter', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/customers')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resC) => {
              chai.request(app)
                .get('/products')
                .set({
                  'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json'
                })
                .end((err, resP) => {
                  chai.request(app)
                    .post('/sales')
                    .set({
                      'Authorization': 'JWT ' + resL.body.token,
                      'Content-Type': 'application/json'
                    })
                    .send({
                      client: resC.body.result[0]._id,
                      products: '[' +
                        '{ "product": "' +
                        resP.body.result[0]._id +
                        '", "priceIndex": 0}' + ',' +
                        '{ "quantity": 2, "product": "' +
                        resP.body.result[0]._id +
                        '", "priceIndex": 1}' +
                      ']'
                    })
                    .end((err, res) => {
                      expect(res).to.have.status(config.STATUS.SERVER_ERROR);
                      done();
                    });
                });
            });
        });

    });

  });

  describe('Get sale', () => {

    it('should get all and one sale', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/sales')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resS) => {
              expect(resS).to.have.status(config.STATUS.OK);
              expect(resS.body.result[0]._id).to.exist;
              chai.request(app)
                .get('/sales/' + resS.body.result[0]._id)
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.OK);
                  expect(res.body.result._id).to.exist;
                  done();
                });
            });
        });
    });

    it('should fail trying to get all products, because not authorization', done => {
      chai.request(app)
        .get('/sales')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

    it('should fail trying to get one product, because not authorization', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/sales')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resS) => {
              chai.request(app)
                .get('/sales/' + resS.body.result[0]._id)
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
                  done();
                });
            });
        });
    });

  });

});



