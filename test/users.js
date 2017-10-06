const chai = require('chai');
const chaiHttp = require('chai-http');
const config = require('../config/users.js');
const app = require('../app');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Create new users', () => {

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
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.status).to.be.equal(config.STATUS.OK);
        expect(res.body.message).to.be.equal(config.RES.CREATED);
        expect(res.body.result.type).to.be.equal('normal');
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
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.status).to.be.equal(config.STATUS.ERROR);
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
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.status).to.be.equal(config.STATUS.ERROR);
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
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.status).to.be.equal(config.STATUS.ERROR);
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
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.status).to.be.equal(config.STATUS.ERROR);
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
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.status).to.be.equal(config.STATUS.ERROR);
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
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.status).to.be.equal(config.STATUS.ERROR);
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
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.status).to.be.equal(config.STATUS.ERROR);
        expect(res.body.message).to.be.equal(config.RES.NOCREATED);
        done();
      });
  });

});