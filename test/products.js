const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../app');
const config = require('../config/products');
const Product = require('../models/product');

const base64Pic = 'fake/base64Pic=';
const expect = chai.expect;
const loginUser = { 'email': 'email1@email.com', 'password': '12K45p78' };

chai.use(chaiHttp);

describe('Create product', () => {

  // Clear Product collections
  before(done => {
    Product.remove({}, () => {
      done();
    });
  });

  it('should create one product', done => {
    chai.request(app)
      .post('/login')
      .type('form')
      .send(loginUser)
      .end((err, resL) => {
        chai.request(app)
          .post('/products')
          .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json'})
          .send({
            category: 'Detergentes',
            minimumUnit: 'Unidad',
            name: 'Magia blanca x360gr',
            picture: base64Pic,
          })
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.message).to.be.equal(config.RES.CREATED);
            done();
          });
      });
  });

  it('should fail creating one product because doesnt have authorization', done => {
    chai.request(app)
      .post('/products')
      .send({
        category: 'Detergentes',
        minimumUnit: 'Unidad',
        name: 'Magia blanca x420gr',
        picture: base64Pic,
      })
      .end((err, res) => {
        expect(res).to.have.status(401);
        done();
      });
  });

  it('should fail creating one product because duplicated product name', done => {
    chai.request(app)
      .post('/login')
      .type('form')
      .send(loginUser)
      .end((err, resL) => {
        chai.request(app)
          .post('/products')
          .set({ 'Authorization': 'JWT ' + resL.body.token, 'Content-Type': 'application/json'})
          .send({
            category: 'Detergentes',
            minimumUnit: 'Unidad',
            name: 'Magia blanca x360gr',
            picture: base64Pic,
          })
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
          });
      });
  });

});