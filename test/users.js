const chai = require('chai');
const chaiHttp = require('chai-http');

const server = require('../app');
const app = server.app;

const config = require('../config/general');
const configUsers = require('../config/users');

const databaseTest = process.env.DATABASE_TEST;
const dbTest = server.db.useDb(databaseTest);

const expect = chai.expect;

chai.use(chaiHttp);

// Variables

const business = {
  business: 'Example business test',
  email: 'example@example.com',
  password: 'exampleTest123'
};

const user = {
  'username': 'usernameTester1',
  'email': 'email1@email.com',
  'password': '12K45p78',
  'permissionDiscount': 'Permit'
};

// Password can't update, characteristic not implemented

const userUpdate = {
  'username': 'username2Tester2',
  'email': 'email2@email2.com',
  'permissionDiscount': 'PermitPIN'
};

// To check when user id not exist

const userUpdateToNoUser = {
  'username': 'usernameToNoUser',
  'email': 'email@emailtoNoUser.com',
  'permissionDiscount': 'PermitPIN'
};

// Authorization token to use webserver API
let auth = '';
let userId = '';

describe('User API routes', () => {

  // Clear collections(Drop database)
  before(done => {
    dbTest.dropDatabase();
    done();
  });

  // First in necessary create a business and login with it

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

  // Login in dashboard aplication

  describe('Login with business created', () => {

    it('Get token to use it in next tests', done => {
      chai.request(app)
        .post('/login/business')
        .type('form')
        .send(business)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.token).to.exist;
          expect(res.body._id).to.exist;
          auth = { 'Authorization': 'JWT ' + res.body.token, 'Content-Type': 'application/json' };
          done();
        });
    });

  });

  describe('POST /users', () => {

    it('Create user successfully', done => {

      chai.request(app)
        .post('/users')
        .type('form')
        .set(auth)
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          expect(res.body.result._id).to.exist;
          userId = res.body.result._id;
          done();
        });

    });

    it('Failure due to not authorization', done => {

      chai.request(app)
        .post('/users')
        .type('form')
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Failure due to lack username parameter', done => {

      let userWithoutUsername = Object.assign({}, user);
      userWithoutUsername.username = undefined;
      userWithoutUsername = JSON.parse(JSON.stringify(userWithoutUsername));

      chai.request(app)
        .post('/users')
        .type('form')
        .set(auth)
        .send(userWithoutUsername)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack email parameter', done => {

      let userWithoutEmail = Object.assign({}, user);
      userWithoutEmail.email = undefined;
      userWithoutEmail = JSON.parse(JSON.stringify(userWithoutEmail));

      chai.request(app)
        .post('/users')
        .type('form')
        .set(auth)
        .send(userWithoutEmail)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack password parameter', done => {

      let userWithoutPassword = Object.assign({}, user);
      userWithoutPassword.password = undefined;
      userWithoutPassword = JSON.parse(JSON.stringify(userWithoutPassword));

      chai.request(app)
        .post('/users')
        .type('form')
        .set(auth)
        .send(userWithoutPassword)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack permissionDiscount parameter', done => {

      let userWithoutPermissionDiscount = Object.assign({}, user);
      userWithoutPermissionDiscount.permissionDiscount = undefined;
      userWithoutPermissionDiscount = JSON.parse(JSON.stringify(userWithoutPermissionDiscount));

      chai.request(app)
        .post('/users')
        .type('form')
        .set(auth)
        .set(auth)
        .send(userWithoutPermissionDiscount)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lenght username name less than 2 characters', done => {

      // Change email and username, to no duplicate it
      let usernameWrong = Object.assign({}, user);
      usernameWrong.username = 'u';
      usernameWrong.email = 'mail2@email.com';
      usernameWrong = JSON.parse(JSON.stringify(usernameWrong));

      chai.request(app)
        .post('/users')
        .type('form')
        .set(auth)
        .send(usernameWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to lenght password less than 8 characters', done => {

      let passwordWrong = Object.assign({}, user);
      passwordWrong.username = 'usernameTester2';
      passwordWrong.email = 'mail2@email.com';
      passwordWrong.password = '12K45p7';
      passwordWrong = JSON.parse(JSON.stringify(passwordWrong));

      chai.request(app)
        .post('/users')
        .type('form')
        .set(auth)
        .send(passwordWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it ('Failure due to wrong email syntax', done => {

      let emailWrong = Object.assign({}, user);
      emailWrong.username = 'usernameTester2';
      emailWrong.email = 'mail25email.com';
      emailWrong = JSON.parse(JSON.stringify(emailWrong));

      chai.request(app)
        .post('/users')
        .type('form')
        .set(auth)
        .send(emailWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to duplicate username', done => {

      // Change email, to no duplicate it
      let userWithOtherEmail = Object.assign({}, user);
      userWithOtherEmail.email = 'mail2@email.com';
      userWithOtherEmail = JSON.parse(JSON.stringify(userWithOtherEmail));

      chai.request(app)
        .post('/users')
        .type('form')
        .set(auth)
        .send(userWithOtherEmail)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.ITEM_DUPLICATED);
          expect(res.body.result).to.be.equal(configUsers.RES.ERROR_DUPLICATED_USERNAME);
          done();
        });
    });

    it('Failure due to duplicate email', done => {

      // Change username, to no duplicate it
      let userWithOtherUsername = Object.assign({}, user);
      userWithOtherUsername.username = 'usernameTester2';
      userWithOtherUsername = JSON.parse(JSON.stringify(userWithOtherUsername));

      chai.request(app)
        .post('/users')
        .type('form')
        .set(auth)
        .send(userWithOtherUsername)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.ITEM_DUPLICATED);
          expect(res.body.result).to.be.equal(configUsers.RES.ERROR_DUPLICATED_EMAIL);
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
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.OK);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to not authorization', done => {

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

    it('Get one user', done => {

      chai.request(app)
        .get('/users/' + userId)
        .type('form')
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
        .get('/users/' + userId)
        .type('form')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });

  describe('PUT /users/:id', () => {

    it('Update user', done => {

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(userUpdate)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.UPDATED);
          expect(res.body.result.username).to.be.equal(userUpdate.username);
          expect(res.body.result.email).to.be.equal(userUpdate.email);
          expect(res.body.result.permissionDiscount).to.be.equal(userUpdate.permissionDiscount);
          done();
        });

    });

    it('Failure due to user not found', done => {

      chai.request(app)
        .put('/users/9a65a1d2977af10c88d49826')
        .type('form')
        .set(auth)
        .send(userUpdateToNoUser)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configUsers.RES.NOT_FOUND);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to not authorization', done => {

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Failure due to lack username parameter', done => {

      let userWithoutUsername = Object.assign({}, userUpdate);
      userWithoutUsername.username = undefined;
      userWithoutUsername = JSON.parse(JSON.stringify(userWithoutUsername));

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(userWithoutUsername)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack email parameter', done => {

      let userWithoutEmail = Object.assign({}, userUpdate);
      userWithoutEmail.email = undefined;
      userWithoutEmail = JSON.parse(JSON.stringify(userWithoutEmail));

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(userWithoutEmail)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack permissionDiscount parameter', done => {

      let userWithoutPermissionDiscount = Object.assign({}, userUpdate);
      userWithoutPermissionDiscount.permissionDiscount = undefined;
      userWithoutPermissionDiscount = JSON.parse(JSON.stringify(userWithoutPermissionDiscount));

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(userWithoutPermissionDiscount)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lenght username name less than 2 characters', done => {

      // Change email and username, to no duplicate it
      let usernameWrong = Object.assign({}, userUpdate);
      usernameWrong.username = 'u';
      usernameWrong.email = 'mail3@email3.com';
      usernameWrong = JSON.parse(JSON.stringify(usernameWrong));

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(usernameWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it ('Failure due to wrong email syntax', done => {

      let emailWrong = Object.assign({}, userUpdate);
      emailWrong.username = 'usernameTester3';
      emailWrong.email = 'mail25email.com';
      emailWrong = JSON.parse(JSON.stringify(emailWrong));

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(emailWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to duplicate username', done => {

      // Change email, to no duplicate it
      let userWithOtherEmail = Object.assign({}, userUpdate);
      userWithOtherEmail.email = 'mail2@email.com';
      userWithOtherEmail = JSON.parse(JSON.stringify(userWithOtherEmail));

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(userWithOtherEmail)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.ITEM_DUPLICATED);
          expect(res.body.result).to.be.equal(configUsers.RES.ERROR_DUPLICATED_USERNAME);
          done();
        });
    });

    it('Failure due to duplicate email', done => {

      // Change username, to no duplicate it
      let userWithOtherUsername = Object.assign({}, userUpdate);
      userWithOtherUsername.username = 'usernameTester2';
      userWithOtherUsername = JSON.parse(JSON.stringify(userWithOtherUsername));

      chai.request(app)
        .put('/users/' + userId)
        .type('form')
        .set(auth)
        .send(userWithOtherUsername)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.ITEM_DUPLICATED);
          expect(res.body.result).to.be.equal(configUsers.RES.ERROR_DUPLICATED_EMAIL);
          done();
        });
    });

  });

  describe('DELETE /users/:id', () => {

    it('Failure due to not authorization', done => {

      chai.request(app)
        .delete('/users/' + userId)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Failure due to user not found', done => {

      chai.request(app)
        .delete('/users/9a65a1d2977af10c88d49826')
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configUsers.RES.NOT_FOUND);
          expect(res.body.result).to.exist;
          done();
        });

    });

    // It was written to the last, because of only exits 1 element

    it('Delete user', done => {

      chai.request(app)
        .delete('/users/' + userId)
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