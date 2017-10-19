const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../app');
const config = require('../config/users');
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

const userWithoutPermission = {
  'username': 'usernameTester1',
  'email': 'email1@email.com',
  'password': '12K45p78',
  'type': 'normal'
};

const userEmpty = {
  'username': '',
  'email': '',
  'password': '',
  'type': 'normal',
  'permissions': '{' +
    '"customers": true,' +
    '"products": true,' +
    '"sales": true,' +
    '"settings": true,' +
    '"users": true' +
  '}'
};

const userUsernameError = {
  'username': 'u',
  'email': 'email2@email.com',
  'password': '12K45p73',
  'type': 'normal',
  'permissions': '{' +
    '"customers": true,' +
    '"products": true,' +
    '"sales": true,' +
    '"settings": true,' +
    '"users": true' +
  '}'
};

const userRepeatUsername = {
  'username': 'usernameTester1',
  'email': 'email3@email.com',
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

const userRepeatEmail = {
  'username': 'usernameTester3',
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

const userInvalidEmail = {
  'username': 'usernameTester4',
  'email': 'email4email.com',
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

const userInvalidPassword = {
  'username': 'usernameTester5',
  'email': '5@email.com',
  'password': '12K45p7',
  'type': 'normal',
  'permissions': '{' +
    '"customers": true,' +
    '"products": true,' +
    '"sales": true,' +
    '"settings": true,' +
    '"users": true' +
  '}'
};

describe('User API routes', () => {

  // Clear collection
  before(done => {
    User.remove({}, () => {
      done();
    });
  });

  describe('POST /users', () => {

    it('Create user with normal type', done => {

      chai.request(app)
        .post('/users')
        .type('form')
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.CREATED);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          done();
        });

    });

    it('Fail creating user because lacking some parameters', done => {

      chai.request(app)
        .post('/users')
        .type('form')
        .send(userWithoutPermission)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.NOCREATED);
          done();
        });

    });

    it('Fail creating user because empty parameters', done => {

      chai.request(app)
        .post('/users')
        .type('form')
        .send(userEmpty)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.NOCREATED);
          done();
        });

    });

    it('Fail creating user because username less 2 caracters', done => {

      chai.request(app)
        .post('/users')
        .type('form')
        .send(userUsernameError)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.NOCREATED);
          done();
        });

    });

    it('Fail creating user because repeating username', done => {

      chai.request(app)
        .post('/users')
        .type('form')
        .send(userRepeatUsername)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.NOCREATED);
          done();
        });

    });

    it('Fail creating user because repeating email', done => {

      chai.request(app)
        .post('/users')
        .type('form')
        .send(userRepeatEmail)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.NOCREATED);
          done();
        });

    });

    it('Fail creating user because invalid email', done => {

      chai.request(app)
        .post('/users')
        .type('form')
        .send(userInvalidEmail)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.NOCREATED);
          done();
        });

    });

    it('Fail creating user because invalid password, less 8 characters', done => {

      chai.request(app)
        .post('/users')
        .type('form')
        .send(userInvalidPassword)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.NOCREATED);
          done();
        });

    });

  });

});