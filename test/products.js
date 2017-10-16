const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../app');
const config = require('../config/products');
const Product = require('../models/product');

const base64Pic = 'fake/base64Pic=';
const expect = chai.expect;
const loginUser = { 'email': 'email1@email.com', 'password': '12K45p78' };

chai.use(chaiHttp);

describe('PRODUCT', () => {

  describe('Create product', () => {

    // Clear Product collections
    before(done => {
      Product.remove({}, () => {
        done();
      });
    });

    it('should create one product', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .post('/products')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json'})
            .send({
              category: 'Detergentes',
              minimumUnit: 'Unidad',
              name: 'Magia blanca x360gr',
              picture: base64Pic,
            })
            .end((err, res) => {
              expect(res).to.have.status(config.STATUS.CREATED);
              expect(res.body.message).to.be.equal(config.RES.CREATED);
              done();
            });
        });
    });

    it('should fail creating one product because doesnt have authorization', done => {
      chai.request(app)
        .post('/products')
        .send({
          category: 'Detergentes',
          minimumUnit: 'Unidad',
          name: 'Magia blanca x420gr',
          picture: base64Pic,
        })
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

    it('should fail creating one product because duplicated product name', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .post('/products')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json'})
            .send({
              category: 'Detergentes',
              minimumUnit: 'Unidad',
              name: 'Magia blanca x360gr',
              picture: base64Pic,
            })
            .end((err, res) => {
              expect(res).to.have.status(config.STATUS.SERVER_ERROR);
              done();
            });
        });
    });

  });

  describe('Get products', () => {

    it('should get all and one product', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .get('/products/' + resP.body.result[0]._id)
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.OK);
                  expect(res.body.result.name).to.exist;
                  done();
                });
            });
        });
    });

    it('should fail trying to get all products, because not authorization', done => {
      chai.request(app)
        .get('/products')
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
            .get('/products')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .get('/products/' + resP.body.result[0]._id)
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
                  done();
                });
            });
        });
    });

  });

  describe('Create price product', () => {

    it('should create one price product', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .post('/products/price')
                .type('form')
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .send({
                  quantity: '1',
                  name: 'unidad',
                  items: 1,
                  price: 5.8,
                  product: resP.body.result[0]._id
                })
                .end((err, res) => {
                  expect(res).to.be.status(config.STATUS.CREATED);
                  expect(res.body.message).to.be.equal(config.RES.CREATED);
                  done();
                });
            });
        });

    });

    it('should fail creating one price product, because not authorization', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .post('/products/price')
                .type('form')
                .send({
                  quantity: '1',
                  name: 'unidad',
                  items: 1,
                  price: 5.8,
                  product: resP.body.result[0]._id
                })
                .end((err, res) => {
                  expect(res).to.be.status(config.STATUS.UNAUTHORIZED);
                  done();
                });
            });
        });

    });

    it('should fail creating one price product, because lack some parameter', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .post('/products/price')
                .type('form')
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .send({
                  quantity: '1',
                  name: 'docena',
                  price: 5.8,
                  product: resP.body.result[0]._id
                })
                .end((err, res) => {
                  expect(res).to.be.status(config.STATUS.SERVER_ERROR);
                  expect(res.body.message).to.be.equal(config.RES.ERROR);
                  done();
                });
            });
        });

    });

    it('should fail creating one price product, because empty some parameter', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .post('/products/price')
                .type('form')
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .send({
                  quantity: '',
                  name: '',
                  items: 1,
                  price: 5.8,
                  product: resP.body.result[0]._id
                })
                .end((err, res) => {
                  expect(res).to.be.status(config.STATUS.SERVER_ERROR);
                  expect(res.body.message).to.be.equal(config.RES.ERROR);
                  done();
                });
            });
        });

    });

    it('should fail creating one price product, because repeat quantity and name', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .post('/products/price')
                .type('form')
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .send({
                  quantity: '1',
                  name: 'unidad',
                  items: 2,
                  price: 6.8,
                  product: resP.body.result[0]._id
                })
                .end((err, res) => {
                  expect(res).to.be.status(config.STATUS.SERVER_ERROR);
                  expect(res.body.message).to.be.equal(config.RES.ERROR);
                  done();
                });
            });
        });

    });

  });

  describe('Get price product', () => {

    it('should get all and one price product', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .get('/products/prices/' + resP.body.result[0]._id)
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .end(() => {
                  expect(resP).to.have.status(config.STATUS.OK);
                  chai.request(app)
                    .get('/products/price/' + resP.body.result[0]._id + '/0')
                    .set({ 'Authorization': 'JWT ' + resL.body.token,
                      'Content-Type': 'application/json' })
                    .end((err, res) => {
                      expect(res).to.have.status(config.STATUS.OK);
                      expect(res.body.result.price.name).to.exist;
                      done();
                    });
                });
            });
        });

    });

    it('should fail trying to get all price products, because not authorization', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .get('/products/prices/' + resP.body.result[0]._id)
                .end((err, resPP) => {
                  expect(resPP).to.have.status(config.STATUS.UNAUTHORIZED);
                  done();
                });
            });
        });

    });

    it('should fail trying to get one product, because not authorization', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .get('/products/prices/' + resP.body.result[0]._id)
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .end(() => {
                  chai.request(app)
                    .get('/products/price/:' + resP.body.result[0]._id + '/0')
                    .end((err, res) => {
                      expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
                      done();
                    });
                });
            });
        });

    });

  });

  describe('Create entry product', () => {

    it('should create new entry product', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .post('/products/entry')
                .type('form')
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .send({
                  quantity: 100,
                  unitCost: 12.5,
                  product: resP.body.result[0]._id
                })
                .end((err, respPE) => {
                  expect(respPE).to.be.status(config.STATUS.CREATED);
                  expect(respPE.body.message).to.be.equal(config.RES.CREATED);
                  chai.request(app)
                    .get('/products/' + resP.body.result[0]._id)
                    .set({ 'Authorization': 'JWT ' + resL.body.token,
                      'Content-Type': 'application/json' })
                    .end((err, res) => {
                      expect(res).to.have.status(config.STATUS.OK);
                      expect(res.body.result.entries[0].quantity).to.be.equal(100);
                      expect(res.body.result.entries[0].unitCost).to.be.equal(12.5);
                      done();
                    });
                });
            });
        });

    });

    it('should fail creating new entry product, because not authorization', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .post('/products/entry')
                .type('form')
                .send({
                  quantity: 1,
                  unitCost: 12.5,
                  product: resP.body.result[0]._id
                })
                .end((err, res) => {
                  expect(res).to.be.status(config.STATUS.UNAUTHORIZED);
                  done();
                });
            });
        });

    });

    it('should fail creating new entry product, because lack some parameter', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .post('/products/entry')
                .type('form')
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .send({
                  quantity: 1,
                  product: resP.body.result[0]._id
                })
                .end((err, res) => {
                  expect(res).to.be.status(config.STATUS.SERVER_ERROR);
                  expect(res.body.message).to.be.equal(config.RES.ERROR);
                  done();
                });
            });
        });

    });

    it('should fail creating new entry product, because negative numbers', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .post('/products/entry')
                .type('form')
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .send({
                  quantity: -1,
                  unitCost: -12.5,
                  product: resP.body.result[0]._id
                })
                .end((err, res) => {
                  expect(res).to.be.status(config.STATUS.SERVER_ERROR);
                  expect(res.body.message).to.be.equal(config.RES.ERROR);
                  done();
                });
            });
        });

    });

  });

  describe('Get entry products', () => {

    it('should get all entry products', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .get('/products/entries/' + resP.body.result[0]._id)
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.OK);
                  expect(res.body.result[0].entries[0].date).to.exist;
                  done();
                });
            });
        });

    });

    it('should fail get all entry products, because not authorization', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .get('/products')
            .type('form')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .end((err, resP) => {
              chai.request(app)
                .get('/products/entries/' + resP.body.result[0]._id)
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
                  done();
                });
            });
        });

    });

  });

});