const chai = require('chai');
const chaiHttp = require('chai-http');

const server = require('../app');
const app = server.app;

const config = require('../config/general');
const configLogin = require('../config/login');

const databaseTest = process.env.DATABASE_TEST;
const dbTest = server.db.useDb(databaseTest);

const expect = chai.expect;

chai.use(chaiHttp);

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

const userWrongCode = {
  'email': 'email1@email.com',
  'password': '12K45p78',
  'code': 'postest2',
};

const userWrongEmail = {
  'email': 'email2@email.com',
  'password': '12K45p78',
  'code': 'postest',
};

const userWrongPass = {
  'email': 'email1@email.com',
  'password': '12K45p789',
  'code': 'postest',
};

const businessWrongEmail = {
  email: 'example@example2.com',
  password: 'exampleTest123'
};

const businessWrongPass = {
  email: 'example@example.com',
  password: 'exampleTest1234'
};

let auth = '';

describe('Login API routes', () => {

  // Clear collections

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

  describe('Create user who will be logged in.', () => {

    it('Create user for sale app successfully', done => {
      chai.request(app)
        .post('/users')
        .type('form')
        .set(auth)
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          done();
        });
    });

  });

  describe('POST /login/busines', () => {

    it('Login in dashboard successfully', done => {
      chai.request(app)
        .post('/login/business')
        .type('form')
        .send(business)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.token).to.exist;
          expect(res.body._id).to.exist;
          done();
        });
    });

    it('Failure due to lack email parameter', done => {

      let businessWithoutEmail = Object.assign({}, business);
      businessWithoutEmail.email = undefined;
      businessWithoutEmail = JSON.parse(JSON.stringify(businessWithoutEmail));

      chai.request(app)
        .post('/login/business')
        .type('form')
        .send(businessWithoutEmail)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack password parameter', done => {

      let businessWithoutPassword = Object.assign({}, business);
      businessWithoutPassword.password = undefined;
      businessWithoutPassword = JSON.parse(JSON.stringify(businessWithoutPassword));

      chai.request(app)
        .post('/login/business')
        .type('form')
        .send(businessWithoutPassword)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it ('Failure due to wrong email syntax', done => {

      let emailWrong = Object.assign({}, business);
      emailWrong.email = 'mail25email.com';
      emailWrong = JSON.parse(JSON.stringify(emailWrong));

      chai.request(app)
        .post('/login/business')
        .type('form')
        .send(emailWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to lenght password less than 2 characters', done => {

      let businessPasswordWrong = Object.assign({}, business);
      businessPasswordWrong['password'] = 'a';

      chai.request(app)
        .post('/login/business')
        .type('form')
        .send(businessPasswordWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to email does not exist', done => {
      chai.request(app)
        .post('/login/business')
        .type('form')
        .send(businessWrongEmail)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configLogin.RES.NOT_USER);
          done();
        });
    });

    it('Failure due to wrong password', done => {
      chai.request(app)
        .post('/login/business')
        .type('form')
        .send(businessWrongPass)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configLogin.RES.WRONG_PASS);
          done();
        });
    });

  });

  // To login in app sale

  describe('POST /login', () => {

    it('Login in app sale successfully', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.token).to.exist;
          done();
        });
    });

    it('Failure due to lack email parameter', done => {

      let userWithoutEmail = Object.assign({}, user);
      userWithoutEmail.email = undefined;
      userWithoutEmail = JSON.parse(JSON.stringify(userWithoutEmail));

      chai.request(app)
        .post('/login')
        .type('form')
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
        .post('/login')
        .type('form')
        .send(userWithoutPassword)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack code parameter', done => {

      let userWithoutCode= Object.assign({}, user);
      userWithoutCode.code = undefined;
      userWithoutCode = JSON.parse(JSON.stringify(userWithoutCode));

      chai.request(app)
        .post('/login')
        .type('form')
        .send(userWithoutCode)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it ('Failure due to wrong email syntax', done => {

      let emailWrong = Object.assign({}, user);
      emailWrong.email = 'mail25email.com';
      emailWrong = JSON.parse(JSON.stringify(emailWrong));

      chai.request(app)
        .post('/login')
        .type('form')
        .send(emailWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

    it('Failure due to code does not exist', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(userWrongCode)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configLogin.RES.NOT_BUSINESS);
          done();
        });
    });

    it('Failure due to email does not exist', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(userWrongEmail)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configLogin.RES.NOT_USER);
          done();
        });
    });

    it('Failure due to wrong password', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(userWrongPass)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configLogin.RES.WRONG_PASS);
          done();
        });
    });

  });

});
