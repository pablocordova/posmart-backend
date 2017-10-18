const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../app');
const config = require('../config/customers');
const Customer = require('../models/customer');

const expect = chai.expect;
const loginUser = { 'email': 'email1@email.com', 'password': '12K45p78' };

chai.use(chaiHttp);

describe('CUSTOMER', () => {

  describe('Create customer', () => {

    before(done => {
      Customer.remove({}, () => {
        done();
      });
    });

    it('should create one customer', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .post('/customers')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .send({
              firstname: 'Pablo cesar',
              lastname: 'Cordova morales',
              dni: '06013059',
              phone: '982251795',
              address: 'Jr agusto B. Leguia 233'
            })
            .end((err, res) => {
              expect(res).to.have.status(config.STATUS.CREATED);
              expect(res.body.message).to.be.equal(config.RES.CREATED);
              done();
            });
        });
    });

    it('should create second customer', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .post('/customers')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .send({
              firstname: 'Pablo cesar',
              lastname: 'Cordova morales',
              dni: '66666666',
              phone: '982251795',
              address: 'Jr agusto B. Leguia 233'
            })
            .end((err, res) => {
              expect(res).to.have.status(config.STATUS.CREATED);
              expect(res.body.message).to.be.equal(config.RES.CREATED);
              done();
            });
        });
    });

    it('should fail creating one customer because doesnt have authorization', done => {
      chai.request(app)
        .post('/customers')
        .send({
          firstname: 'Pablo cesar',
          lastname: 'Cordova morales',
          dni: '06013059',
          phone: '982251795',
          address: 'Jr agusto B. Leguia 233'
        })
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

    it('should fail creating one customer because duplicated dni', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .post('/customers')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .send({
              firstname: 'Pablo cesar',
              lastname: 'Cordova morales',
              dni: '06013059',
              phone: '982251795',
              address: 'Jr agusto B. Leguia 233'
            })
            .end((err, res) => {
              expect(res).to.have.status(config.STATUS.SERVER_ERROR);
              done();
            });
        });
    });

    it('should fail creating one customer because dni doesnt exist', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(loginUser)
        .end((err, resL) => {
          chai.request(app)
            .post('/customers')
            .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json' })
            .send({
              firstname: 'Pablo cesar',
              lastname: 'Cordova morales',
              phone: '982251795',
              address: 'Jr agusto B. Leguia 233'
            })
            .end((err, res) => {
              expect(res).to.have.status(config.STATUS.SERVER_ERROR);
              done();
            });
        });
    });

  });

  describe('Get customers', () => {

    it('should get all and one customer', done => {
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
                .get('/customers/' + resC.body.result[0]._id)
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.OK);
                  expect(res.body.result.dni).to.exist;
                  done();
                });
            });
        });
    });

    it('should fail trying to get all customers, because not authorization', done => {
      chai.request(app)
        .get('/customers')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

    it('should fail trying to get one customer, because not authorization', done => {
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
                .get('/customers/' + resC.body.result[0]._id)
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
                  done();
                });
            });
        });
    });

  });

  describe('Update customer', () => {

    it('should update one customer', done => {
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
                .put('/customers/' + resC.body.result[0]._id)
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .send({
                  firstname: 'Pablo César',
                  lastname: 'Córdova Morales',
                  dni: '44162124',
                  phone: '998823500',
                  address: 'Jr agusto B. Leguia 233 Carabayllo'
                })
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.OK);
                  expect(res.body.result.dni).to.be.equal('44162124');
                  done();
                });
            });
        });
    });

    it('should fail updating one customer because doesnt have authorization', done => {
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
                .put('/customers/' + resC.body.result[0]._id)
                .send({
                  firstname: 'Pablo César',
                  lastname: 'Córdova Morales',
                  dni: '44162124',
                  phone: '998823500',
                  address: 'Jr agusto B. Leguia 233 Carabayllo'
                })
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
                  done();
                });
            });
        });
    });

    it('should fail updating one customer because duplicated dni', done => {
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
                .put('/customers/' + resC.body.result[0]._id)
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .send({
                  firstname: 'Pablo César',
                  lastname: 'Córdova Morales',
                  dni: '66666666',
                  phone: '998823500',
                  address: 'Jr agusto B. Leguia 233 Carabayllo'
                })
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.SERVER_ERROR);
                  done();
                });
            });
        });
    });

    it('should fail updating one customer because some parameter does not exist', done => {
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
                .put('/customers/' + resC.body.result[0]._id)
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .send({
                  firstname: 'Pablo César',
                  lastname: 'Córdova Morales',
                  phone: '998823500',
                  address: 'Jr agusto B. Leguia 233 Carabayllo'
                })
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.SERVER_ERROR);
                  done();
                });
            });
        });
    });

  });

  describe('Delete customer', () => {

    // Pass delete test, was writing in final, because only exits 1 element

    it('should fail to consume delete endpoint because not have authorization', done => {
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
                .delete('/customers/' + resC.body.result[0]._id)
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
                  done();
                });
            });
        });
    });

    it('should delete the first customer created before', done => {
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
                .delete('/customers/' + resC.body.result[0]._id)
                .set({ 'Authorization': 'JWT ' + resL.body.token,
                  'Content-Type': 'application/json' })
                .end((err, res) => {
                  expect(res).to.have.status(config.STATUS.OK);
                  done();
                });
            });
        });
    });

  });

});

