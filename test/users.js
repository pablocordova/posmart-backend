var chai = require('chai');
var chaiHttp = require('chai-http');
var app = require('../app');
var expect = chai.expect;

chai.use(chaiHttp);

describe('Users endpoints', function() {
  it('should create new user', function(done) {
    chai.request(app)
      .post('/users')
      .type('form')
      .send({
        'firstname': 'firstnameTester',
        'lastname': 'lastnameTester',
        'username': 'usernameTester',
        'password': '123456'
      })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.message).to.equal('User created');
        done();
      });
  });  
});