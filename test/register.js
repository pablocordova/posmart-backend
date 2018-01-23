const chai = require('chai');
const chaiHttp = require('chai-http');

const server = require('../app');
const app = server.app;

const config = require('../config/general');
const configRegister = require('../config/register');

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

describe('Register API routes', () => {

  // Clear collections(Drop database)
  before(done => {
    dbTest.dropDatabase();
    done();
  });

  describe('POST /register', () => {

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

    it('Failure due to duplicate email', done => {
      chai.request(app)
        .post('/register')
        .type('form')
        .send(business)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.ITEM_DUPLICATED);
          expect(res.body.result).to.be.equal(configRegister.RES.ERROR_DUPLICATED_EMAIL);
          done();
        });
    });

    it('Failure due to lack business parameter', done => {

      let businessWithoutName = Object.assign({}, business);
      businessWithoutName.business = undefined;
      businessWithoutName = JSON.parse(JSON.stringify(businessWithoutName));

      chai.request(app)
        .post('/register')
        .type('form')
        .send(businessWithoutName)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack email parameter', done => {

      let businessWithoutEmail = Object.assign({}, business);
      businessWithoutEmail.email = undefined;
      businessWithoutEmail = JSON.parse(JSON.stringify(businessWithoutEmail));

      chai.request(app)
        .post('/register')
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
        .post('/register')
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

    it('Failure due to lenght business name less than 2 characters', done => {

      let businessNameWrong = Object.assign({}, business);
      businessNameWrong['business'] = 'a';

      chai.request(app)
        .post('/register')
        .type('form')
        .send(businessNameWrong)
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
        .post('/register')
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

    it ('Failure due to wrong email syntax', done => {

      let businessEmailWrong = Object.assign({}, business);
      businessEmailWrong['email'] = 'novalidemail';

      chai.request(app)
        .post('/register')
        .type('form')
        .send(businessEmailWrong)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.INVALID_SYNTAX);
          expect(res.body.result).to.exist;
          done();
        });

    });

  });


});