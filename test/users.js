const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../app');
const db = require('../app').db;
const config = require('../config/users');
const UserSchema = require('../squemas/user');

const User = db.useDb(process.env.DATABASE_TEST).model('User', UserSchema);

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

const user_updated = {
  'username': 'usernameTester2',
  'email': 'email2@email.com',
  'password': '12K45o78',
  'type': 'normal',
  'permissions': '{' +
    '"customers": false,' +
    '"products": true,' +
    '"sales": true,' +
    '"settings": true,' +
    '"users": true' +
  '}'
};

const userObjUpdated = JSON.parse(JSON.stringify(user_updated));

const userObj = JSON.parse(JSON.stringify(user));
const loginUser = { 'email': userObj.email, 'password': userObj.password };

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

let auth = '';
let userId = '';

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
          userId = res.body.result._id;
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

  describe('Get token for next tests', () => {

    it('Login and get token', done => {
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

  describe('GET /users', () => {

    it('Get list of users', done => {

      chai.request(app)
        .get('/users')
        .type('form')
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Fail trying to get list of users because not authorization', done => {

      chai.request(app)
        .get('/users')
        .type('form')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });

  describe('GET /users/:id', () => {

    it('Get one of user', done => {

      chai.request(app)
        .get('/users/' + userId)
        .type('form')
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Fail trying to get one of user because not authorization', done => {

      chai.request(app)
        .get('/users/' + userId)
        .type('form')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });

  describe('PUT /users/:id', () => {

    it('Update user with normal type', done => {

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(user_updated)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result.username).to.be.equal(userObjUpdated.username);
          expect(res.body.result.email).to.be.equal(userObjUpdated.email);
          done();
        });

    });

    it('Fail updating user because lacking some parameters', done => {

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(userWithoutPermission)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          done();
        });

    });

    it('Fail updating user because empty parameters', done => {

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(userEmpty)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          done();
        });

    });

    it('Fail updating user because username less 2 caracters', done => {

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(userUsernameError)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          done();
        });

    });

    it('Fail updating user because invalid email', done => {

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(userInvalidEmail)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.SERVER_ERROR);
          done();
        });

    });

  });

  describe('PUT /users/:id/enabled', () => {

    it('Update enabled user to false', done => {

      chai.request(app)
        .put('/users/' + userId + '/enabled')
        .type('form')
        .set(auth)
        .send({ enabled: false })
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result.enabled).to.be.equal(false);
          done();
        });

    });

    it('Fail updating enabled user because authorization', done => {

      chai.request(app)
        .put('/users/' + userId + '/enabled')
        .type('form')
        .send({ enabled: false })
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });

  describe('DELETE /users/:id', () => {

    // Pass delete test, was writing in final, because only exits 1 element

    it('Fail delete user, because not have authorization', done => {

      chai.request(app)
        .delete('/users/' + userId)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Delete user', done => {

      chai.request(app)
        .delete('/users/' + userId)
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          done();
        });

    });

  });

});