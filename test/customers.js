const chai = require('chai');
const chaiHttp = require('chai-http');

const server = require('../app');
const app = server.app;

const config = require('../config/general');
const configCustomers = require('../config/customers');

const databaseTest = process.env.DATABASE_TEST;
const dbTest = server.db.useDb(databaseTest);

const expect = chai.expect;

// Authorization token to use APP
let auth = '';
// Autorization token to use dashboard
let authB = '';
let customerId = '';

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

const customer1ToUpdate = {
  firstname: 'Pablo cesar luis',
  lastname: 'Cordova morales bermudez',
  dni: '06013050',
  phone: '982251794',
  address: 'Jr agusto B. Leguia 203'
};

const customerToUpdateNotExist = {
  firstname: 'Pablo juan',
  lastname: 'Chavez Aguilar',
  dni: '06013058',
  phone: '982251795',
  address: 'Jr agusto B. Leguia 103'
};

const customer2 = {
  firstname: 'Carlos cesar',
  lastname: 'Guitierrez morales',
  dni: '44162120',
  phone: '998823500',
  address: 'Jr agusto B. Leguia 234'
};

chai.use(chaiHttp);

describe('Customer API routes', () => {

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

  describe('POST /customers', () => {

    it('Create one customer', done => {
      chai.request(app)
        .post('/customers')
        .set(auth)
        .send(customer1)
        .end((err, res) => {
          customerId = res.body.result._id;
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          done();
        });
    });

    it('Create second customer to other tests', done => {
      chai.request(app)
        .post('/customers')
        .set(auth)
        .send(customer2)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          done();
        });
    });

    it('Failure due to not authorization', done => {
      chai.request(app)
        .post('/customers')
        .type('form')
        .send(customer1)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

    it('Failure due to lack firstname parameter', done => {

      let customerWithoutFirstname = Object.assign({}, customer1);
      customerWithoutFirstname.firstname = undefined;
      customerWithoutFirstname = JSON.parse(JSON.stringify(customerWithoutFirstname));

      chai.request(app)
        .post('/customers')
        .type('form')
        .set(auth)
        .send(customerWithoutFirstname)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to duplicate firstname', done => {

      chai.request(app)
        .post('/customers')
        .type('form')
        .set(auth)
        .send(customer1)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.ITEM_DUPLICATED);
          expect(res.body.result).to.be.equal(configCustomers.RES.DUPLICATED_FIRSTNAME);
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
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.OK);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to not authorization', done => {
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
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.OK);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to not authorization', done => {
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
        .send(customer1ToUpdate)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.UPDATED);
          expect(res.body.result.firstname).to.be.equal(customer1ToUpdate.firstname);
          expect(res.body.result.lastname).to.be.equal(customer1ToUpdate.lastname);
          expect(res.body.result.dni).to.be.equal(customer1ToUpdate.dni);
          expect(res.body.result.phone).to.be.equal(customer1ToUpdate.phone);
          expect(res.body.result.address).to.be.equal(customer1ToUpdate.address);
          done();
        });
    });

    it('Failure due to not authorization', done => {
      chai.request(app)
        .put('/customers/' + customerId)
        .send(customer1ToUpdate)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

    it('Failure due to duplicated firstname in another customer', done => {
      chai.request(app)
        .put('/customers/' + customerId)
        .type('form')
        .set(auth)
        .send(customer2)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.ITEM_DUPLICATED);
          expect(res.body.result).to.be.equal(configCustomers.RES.DUPLICATED_FIRSTNAME);
          done();
        });
    });

    it('Failure due to lack firstname parameter', done => {

      let customerWithoutFirstname = Object.assign({}, customer1ToUpdate);
      customerWithoutFirstname.firstname = undefined;
      customerWithoutFirstname = JSON.parse(JSON.stringify(customerWithoutFirstname));

      chai.request(app)
        .put('/customers/' + customerId)
        .type('form')
        .set(auth)
        .send(customerWithoutFirstname)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to customer not found', done => {

      chai.request(app)
        .put('/customers/9a65a1d2977af10188d49826')
        .type('form')
        .set(auth)
        .send(customerToUpdateNotExist)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configCustomers.RES.NOT_FOUND);
          expect(res.body.result).to.exist;
          done();
        });

    });

  });

  describe('DELETE /customers/:id', () => {

    it('Failure due to not authorization', done => {
      chai.request(app)
        .delete('/customers/' + customerId)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

    it('Failure due to customer not found', done => {

      chai.request(app)
        .delete('/customers/9a65a1d2977af10c81d49826')
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configCustomers.RES.NOT_FOUND);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Delete customer successfully', done => {
      chai.request(app)
        .delete('/customers/' + customerId)
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.DELETED);
          done();
        });
    });

  });

});

