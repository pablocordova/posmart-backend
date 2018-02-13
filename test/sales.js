const chai = require('chai');
const chaiHttp = require('chai-http');

const server = require('../app');
const app = server.app;

const config = require('../config/general');
//const configSales = require('../config/sales');

const databaseTest = process.env.DATABASE_TEST;
const dbTest = server.db.useDb(databaseTest);

const expect = chai.expect;

chai.use(chaiHttp);

let auth = '';
let authB = '';

let customerId = '';
let productId = '';
let saleId = '';


// Constans to initialization

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

const customer1 = {
  firstname: 'Pablo cesar',
  lastname: 'Cordova morales',
  dni: '06013059',
  phone: '982251795',
  address: 'Jr agusto B. Leguia 233'
};

let product = {
  category: 'Detergentes',
  minimumUnit: 'Unidad',
  name: 'Magia blanca x360gr',
  picture: 'fake/base64Pic=',
};

let prices = {
  pricesTmp: [
    {
      quantity: '1',
      name: 'unidad',
      items: 1,
      price: 5.8
    },
    {
      quantity: '12',
      name: 'docena',
      items: 12,
      price: 60
    }
  ]
};

let dataSale = {
  client: '', // It'll be fill out dynamically, customerId
  state: 'Pending',
  products: [
    {
      quantity: 4,
      unitsInPrice: 12,
      product: '',  // It'll be fill out dynamically, productId
      total: 239,
      unit: 'docena'
    },
    {
      quantity: 1,
      unitsInPrice: 1,
      product: '',  // It'll be fill out dynamically, productId
      total: 5.5,
      unit: 'unidad'
    }
  ]
};

describe('Sale API routes', () => {

  // Clear collections(Drop database)
  before(done => {
    dbTest.dropDatabase();
    done();
  });

  // Initialization

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

    it('Get token to use it to create a user', done => {
      chai.request(app)
        .post('/login/business')
        .type('form')
        .send(business)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.token).to.exist;
          expect(res.body._id).to.exist;
          authB = { 'Authorization': 'JWT ' + res.body.token, 'Content-Type': 'application/json' };
          done();
        });
    });

  });

  describe('Create user who will be logged in.', () => {

    it('Create user for sale app successfully', done => {
      chai.request(app)
        .post('/users')
        .type('form')
        .set(authB)
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          done();
        });
    });

  });

  describe('Login with user created', () => {

    it('Get token to use it in next tests', done => {
      chai.request(app)
        .post('/login')
        .type('form')
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.token).to.exist;
          auth = { 'Authorization': 'JWT ' + res.body.token, 'Content-Type': 'application/json' };
          done();
        });
    });

  });

  describe('Create one customer', () => {

    it('Create one customer', done => {
      chai.request(app)
        .post('/customers')
        .set(auth)
        .send(customer1)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          expect(res.body.result).to.exist;
          customerId = res.body.result._id;
          dataSale.client = customerId;
          done();
        });
    });

  });

  describe('Create product successfully', () => {

    it('Create product successfully', done => {

      chai.request(app)
        .post('/products')
        .set(authB)
        .send(product)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          expect(res.body.result).to.exist;
          productId = res.body.result._id;
          for (let i = 0; i < dataSale.products.length; i++) {
            dataSale.products[i].product = productId;
          }
          done();
        });

    });

  });

  describe('Update prices product successfully', () => {

    it('Update prices product successfully', done => {

      chai.request(app)
        .put('/products/' + productId + '/prices')
        .type('form')
        .set(authB)
        .send(prices)
        .end((err, res) => {
          expect(res).to.be.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.UPDATED);
          expect(res.body.result).to.exist;
          // Data come with '_id' parameter, and I use map operation to remove it.
          const pricesUpdated = res.body.result.map(priceMap => {
            return {
              quantity: priceMap.quantity,
              name: priceMap.name,
              items: priceMap.items,
              price: priceMap.price
            };
          });
          expect(pricesUpdated).to.deep.equal(prices.pricesTmp);
          done();
        });

    });

  });


  // Finish Initialization

  describe('POST /sales', () => {

    it('Create one sale successfully', done => {

      chai.request(app)
        .post('/sales')
        .set(auth)
        .send(dataSale)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          expect(res.body.result).to.exist;
          expect(res.body.result.client).to.be.equal(dataSale.client);
          expect(res.body.result.state).to.be.equal(dataSale.state);

          const result = res.body.result;

          expect(result.products[0].quantity).to.be.equal(dataSale.products[0].quantity);
          expect(result.products[0].unitsInPrice).to.be.equal(dataSale.products[0].unitsInPrice);
          expect(result.products[0].product).to.be.equal(dataSale.products[0].product);
          expect(result.products[0].total).to.be.equal(dataSale.products[0].total);
          expect(result.products[0].unit).to.be.equal(dataSale.products[0].unit);

          expect(result.products[1].quantity).to.be.equal(dataSale.products[1].quantity);
          expect(result.products[1].unitsInPrice).to.be.equal(dataSale.products[1].unitsInPrice);
          expect(result.products[1].product).to.be.equal(dataSale.products[1].product);
          expect(result.products[1].total).to.be.equal(dataSale.products[1].total);
          expect(result.products[1].unit).to.be.equal(dataSale.products[1].unit);

          expect(result.total).to.be.equal(
            dataSale.products[0].total + dataSale.products[1].total
          );

          saleId = res.body.result._id;
          done();
        });

    });

    it('Failure due to not authorization', done => {

      chai.request(app)
        .post('/sales')
        .send(dataSale)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

    it('Failure due to lack client parameter', done => {

      let saleWithoutClient = Object.assign({}, dataSale);
      saleWithoutClient.client = undefined;
      saleWithoutClient = JSON.parse(JSON.stringify(saleWithoutClient));

      chai.request(app)
        .post('/sales')
        .type('form')
        .set(auth)
        .send(saleWithoutClient)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack state parameter', done => {

      let saleWithoutState = Object.assign({}, dataSale);
      saleWithoutState.state = undefined;
      saleWithoutState = JSON.parse(JSON.stringify(saleWithoutState));

      chai.request(app)
        .post('/sales')
        .type('form')
        .set(auth)
        .send(saleWithoutState)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack products parameter', done => {

      let saleWithoutProducts = Object.assign({}, dataSale);
      saleWithoutProducts.products = undefined;
      saleWithoutProducts = JSON.parse(JSON.stringify(saleWithoutProducts));

      chai.request(app)
        .post('/sales')
        .type('form')
        .set(auth)
        .send(saleWithoutProducts)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });


  });
/*
  describe('GET /sales', () => {

    it('Get list of sales', done => {

      chai.request(app)
        .get('/sales')
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result[0]._id).to.exist;
          done();
        });

    });

    it('Fail trying to get list of products because not authorization', done => {
      chai.request(app)
        .get('/sales')
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

  });

  describe('GET /sales/:id', () => {

    it('Get one sale by id', done => {
      chai.request(app)
        .get('/sales/' + saleId)
        .set(auth)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result._id).to.exist;
          done();
        });

    });

    it('Fail trying to get one product, because not authorization', done => {

      chai.request(app)
        .get('/sales/' + saleId)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });

    });

  });
*/
});



