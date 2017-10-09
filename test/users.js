const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../app');
const config = require('../config/users');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Create new users', () => {

  // Database need to be clean because usename and email are uniques
  it('should create with normal type', done => {
    chai.request(app)
      .post('/users')
      .type('form')
      .send({
        'username': 'usernameTester1',
        'email': 'email1@email.com',
        'password': '12K45p78',
        'type': 'normal'
      })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        expect(res.body.message).to.be.equal(config.RES.CREATED);
        done();
      });
  });

});

describe('Fail creating new users', () => {

  it('should fail lacking some parameters', done => {
    chai.request(app)
      .post('/users')
      .type('form')
      .send({
        'username': 'usernameTester2',
        'password': '12K45p78',
        'type': 'normal'
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body.message).to.be.equal(config.RES.NOCREATED);
        done();
      });
  });

  it('should fail empty paramters', done => {
    chai.request(app)
      .post('/users')
      .type('form')
      .send({
        'username': '',
        'email': '',
        'password': '',
        'type': ''
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body.message).to.be.equal(config.RES.NOCREATED);
        done();
      });
  });

  it('should fail username less 2 caracters', done => {
    chai.request(app)
      .post('/users')
      .type('form')
      .send({
        'username': 'u',
        'email': 'email1@email.com',
        'password': '12K45p78',
        'type': 'normal'
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body.message).to.be.equal(config.RES.NOCREATED);
        done();
      });
  });

  it('should fail repeating username', done => {
    chai.request(app)
      .post('/users')
      .type('form')
      .send({
        'username': 'usernameTester1',
        'email': 'email1@email.com',
        'password': '12K45p78',
        'type': 'normal'
      })
      .end((err, res) => {
        expect(res).to.have.status(500);
        expect(res).to.be.json;
        expect(res.body.message).to.be.equal(config.RES.NOCREATED);
        done();
      });
  });

  it('should fail repeating email', done => {
    chai.request(app)
      .post('/users')
      .type('form')
      .send({
        'username': 'usernameTester5',
        'email': 'email1@email.com',
        'password': '12K45p78',
        'type': 'normal'
      })
      .end((err, res) => {
        expect(res).to.have.status(500);
        expect(res).to.be.json;
        expect(res.body.message).to.be.equal(config.RES.NOCREATED);
        done();
      });
  });

  it('should fail invalid email', done => {
    chai.request(app)
      .post('/users')
      .type('form')
      .send({
        'username': 'usernameTester3',
        'email': 'email1email.com',
        'password': '12K45p78',
        'type': 'normal'
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body.message).to.be.equal(config.RES.NOCREATED);
        done();
      });
  });

  it('should fail invalid password', done => {
    chai.request(app)
      .post('/users')
      .type('form')
      .send({
        'username': 'usernameTester4',
        'email': 'email1e@mail.com',
        'password': 'fjr5thg',
        'type': 'normal'
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body.message).to.be.equal(config.RES.NOCREATED);
        done();
      });
  });

});

// To log in, the test is described here because here is created an account
describe('Log in', () => {

  it('should log in the platform', done => {
    chai.request(app)
      .post('/login')
      .type('form')
      .send({
        'email': 'email1@email.com',
        'password': '12K45p78'
      })
      .end((err, res) => {
        expect(res).to.be.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.property('token');
        done();
      });
  });
});

describe('Fail Log in', () => {

  it('should Fail log in due lack some parameters', done => {
    chai.request(app)
      .post('/login')
      .type('form')
      .send({
        'password': '12K45p78'
      })
      .end((err, res) => {
        expect(res).to.be.status(401);
        done();
      });
  });

  it('should Fail log in due empty parameters', done => {
    chai.request(app)
      .post('/login')
      .type('form')
      .send({
        'email': '',
        'password': ''
      })
      .end((err, res) => {
        expect(res).to.be.status(401);
        done();
      });
  });

  it('should Fail log in due incorrect credentials', done => {
    chai.request(app)
      .post('/login')
      .type('form')
      .send({
        'email': 'email1@email.come',
        'password': '12K45p78'
      })
      .end((err, res) => {
        expect(res).to.be.status(401);
        done();
      });
  });
});