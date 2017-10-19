const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../app');
const config = require('../config/login');
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
const credential = { 'email': userObj.email, 'password': userObj.password };
const credentialWithoutEmail = { 'password': userObj.password };
const credentialEmpty = { 'email': '', 'password': '' };
const credentialIncorrect = { 'email': 'email1@email.com', 'password': '12K66p78' };

describe('Login API routes', () => {

  // Clear collections

  before(done => {

    User.remove({}, () => {
      done();
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

  });

  // To log in, the test is described here because here is created an account
  describe('POST /login', () => {

    it('Log in the platform', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(credential)
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body).to.have.property('token');
          done();
        });

    });

    it('Fail log in because lack some parameters', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(credentialWithoutEmail)
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.SERVER_ERROR);
          done();
        });

    });

    it('Fail log in because empty parameters', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(credentialEmpty)
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.SERVER_ERROR);
          done();
        });

    });

    it('Fail log in because incorrect credentials', done => {

      chai.request(app)
        .post('/login')
        .type('form')
        .send(credentialIncorrect)
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.SERVER_ERROR);
          done();
        });

    });

  });

});
