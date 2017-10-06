const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Users endpoints', () => {
  it('should create new user', done => {
    chai.request(app)
      .post('/users')
      .type('form')
      .send({
        'firstname': 'firstnameTester',
        'lastname': 'lastnameTester',
        'username': 'usernameTester',
        'password': '123456'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.message).to.equal('User created');
        done();
      });
  });  
});