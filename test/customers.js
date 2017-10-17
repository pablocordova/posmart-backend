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



});

