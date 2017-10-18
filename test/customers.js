const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../app');
const config = require('../config/customers');
const Customer = require('../models/customer');
const User = require('../models/user');

const expect = chai.expect;

// Data to use in integrations tests

let auth = '';
let customerId = '';

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

const customer_create_one = {
  firstname: 'Pablo cesar',
  lastname: 'Cordova morales',
  dni: '06013059',
  phone: '982251795',
  address: 'Jr agusto B. Leguia 233'
};

const customer_update_one = {
  firstname: 'Pablo César',
  lastname: 'Córdova Morales',
  dni: '44162124',
  phone: '998823500',
  address: 'Jr agusto B. Leguia 233 Carabayllo'
};

const customer_create_two = {
  firstname: 'Pablo cesar',
  lastname: 'Cordova morales',
  dni: '66666666',
  phone: '982251795',
  address: 'Jr agusto B. Leguia 233'
};

const customer_without_dni = {
  firstname: 'Pablo cesar',
  lastname: 'Cordova morales',
  phone: '982251795',
  address: 'Jr agusto B. Leguia 233'
};

chai.use(chaiHttp);

describe('Customer API routes', () => {

  // Clear collections

  before(done => {

    User.remove({}, () => {
      Customer.remove({}, () => {
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

  describe('POST /customers', () => {

    it('Create one customer', done => {
      chai.request(app)
        .post('/customers')
        .set(auth)
        .send(customer_create_one)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.CREATED);
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          done();
        });
    });

    it('Create second customer', done => {
      chai.request(app)
        .post('/customers')
        .set(auth)
        .send(customer_create_two)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.CREATED);
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          done();
        });
    });

    it('Fail creating one customer because doesnt have authorization', done => {
      chai.request(app)
        .post('/customers')
        .send(customer_create_one)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

    it('Fail creating one customer because duplicated dni', done => {
      chai.request(app)
        .post('/customers')
        .set(auth)
        .send(customer_create_one)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          done();
        });
    });

    it('Fail creating one customer because dni doesnt exist', done => {
      chai.request(app)
        .post('/customers')
        .set(auth)
        .send(customer_without_dni)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          done();
        });
    });

  });

  describe('GET /customers', () => {

    it('return list of customers', done => {
      chai.request(app)
        .get('/customers')
        .set(auth)
        .end((err, res) => {
          customerId = res.body.result[0]._id;
          expect(res).to.have.status(config.STATUS.OK);
          done();
        });
    });

    it('Fail trying to return list of customers, because not authorization', done => {
      chai.request(app)
        .get('/customers')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

  });

  describe('GET /customers/:id', () => {

    it('Return one customer', done => {
      chai.request(app)
        .get('/customers/' + customerId)
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result.dni).to.exist;
          done();
        });
    });

    it('Fail trying to get one customer, because not authorization', done => {
      chai.request(app)
        .get('/customers/' + customerId)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

  });


  describe('PUT /customers/:id', () => {

    it('Update one customer', done => {
      chai.request(app)
        .put('/customers/' + customerId)
        .set(auth)
        .send(customer_update_one)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result.dni).to.be.equal(customer_update_one.dni);
          done();
        });
    });

    it('Fail updating one customer because doesnt have authorization', done => {
      chai.request(app)
        .put('/customers/' + customerId)
        .send(customer_update_one)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

    it('Fail updating one customer because duplicated dni', done => {
      chai.request(app)
        .put('/customers/' + customerId)
        .set(auth)
        .send(customer_create_two)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          done();
        });
    });

    it('Fail updating one customer because some parameter does not exist', done => {
      chai.request(app)
        .put('/customers/' + customerId)
        .set(auth)
        .send(customer_without_dni)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          done();
        });
    });

  });

  describe('DELETE /customers/:id', () => {

    // Pass delete test, was writing in final, because only exits 1 element

    it('Fail delete customer, because not have authorization', done => {
      chai.request(app)
        .delete('/customers/' + customerId)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

    it('Delete customer', done => {
      chai.request(app)
        .delete('/customers/' + customerId)
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          done();
        });
    });

  });

});

