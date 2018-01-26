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

const businessWrongEmail = {
  email: 'example@example2.com',
  password: 'exampleTest123'
};

const businessWrongPass = {
  email: 'example@example.com',
  password: 'exampleTest1234'
};

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

});
