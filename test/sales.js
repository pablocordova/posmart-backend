const chai = require('chai');
const chaiHttp = require('chai-http');
const _ = require('lodash');
const moment = require('moment');

const server = require('../app');
const app = server.app;

const config = require('../config/general');
const configSales = require('../config/sales');

const databaseTest = process.env.DATABASE_TEST;
const dbTest = server.db.useDb(databaseTest);

const expect = chai.expect;

chai.use(chaiHttp);

let auth = '';
let authB = '';

let customerId = '';
let productId = '';
let saleId = '';
let saleId2 = '';


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

const unitCost = {
  'unitCost': 5.1
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
      total: 245,
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

const credit = {
  date: moment().toDate(),
  amount: 99.5
};

const dataSearch = {
  id: '',
  day: '',
  client: '',
  seller: '',
  state: '',
  total: ''
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

  describe('Update cost product successfully', () => {

    it('Update cost product successfully', done => {

      chai.request(app)
        .put('/products/' + productId + '/cost')
        .set(authB)
        .send(unitCost)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.UPDATED);
          expect(res.body.result.unitCost).to.be.equal(unitCost.unitCost);
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

          const specEarning0 =
            dataSale.products[0].total -
            (unitCost.unitCost * dataSale.products[0].quantity * dataSale.products[0].unitsInPrice);

          expect(result.products[0].earning).to.be.equal(_.round(specEarning0, 2));

          expect(result.products[1].quantity).to.be.equal(dataSale.products[1].quantity);
          expect(result.products[1].unitsInPrice).to.be.equal(dataSale.products[1].unitsInPrice);
          expect(result.products[1].product).to.be.equal(dataSale.products[1].product);
          expect(result.products[1].total).to.be.equal(dataSale.products[1].total);
          expect(result.products[1].unit).to.be.equal(dataSale.products[1].unit);

          const specEarning1 =
            dataSale.products[1].total -
            (unitCost.unitCost * dataSale.products[1].quantity * dataSale.products[1].unitsInPrice);

          expect(result.products[1].earning).to.be.equal(_.round(specEarning1, 2));

          expect(result.total).to.be.equal(
            dataSale.products[0].total + dataSale.products[1].total
          );

          saleId = res.body.result._id;

          done();
        });

    });

    it('Create another sale successfully(For join test)', done => {

      chai.request(app)
        .post('/sales')
        .set(auth)
        .send(dataSale)
        .end((err, res) => {
          // Not is necessary check all again, because It already was tested before.
          saleId2 = res.body.result._id;
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

  describe('POST /:id/credits', () => {

    it('Create one credit successfully', done => {
      chai.request(app)
        .post( '/sales/'+ saleId + '/credits')
        .set(authB)
        .send(credit)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.CREATED);
          expect(res.body.result).to.exist;
          expect(res.body.result.credits).to.exist;

          // Check date, it is necessary gives a format first.
          const dateSpec = moment(credit.date).format();
          const dateRes = moment(res.body.result.credits[0].date).format();
          expect(dateRes).to.be.equal(dateSpec);

          expect(res.body.result.credits[0].amount).to.be.equal(credit.amount);
          done();
        });
    });

    it('Failure due to not authorization', done => {
      chai.request(app)
        .post( '/sales/'+ saleId + '/credits')
        .send(credit)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

    it('Failure due to lack date parameter', done => {

      let creditWithoutDate = Object.assign({}, credit);
      creditWithoutDate.date = undefined;
      creditWithoutDate = JSON.parse(JSON.stringify(creditWithoutDate));

      chai.request(app)
        .post( '/sales/'+ saleId + '/credits')
        .type('form')
        .set(authB)
        .send(creditWithoutDate)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due to lack amount parameter', done => {

      let creditWithoutAmount = Object.assign({}, credit);
      creditWithoutAmount.amount = undefined;
      creditWithoutAmount = JSON.parse(JSON.stringify(creditWithoutAmount));

      chai.request(app)
        .post( '/sales/'+ saleId + '/credits')
        .type('form')
        .set(authB)
        .send(creditWithoutAmount)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.BAD_REQUEST);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.MISSING_PARAMETER);
          expect(res.body.result).to.exist;
          done();
        });
    });

    it('Failure due not exist sale id', done => {
      chai.request(app)
        .post( '/sales/9a65a1d2977af10c88d49826/credits')
        .type('form')
        .set(authB)
        .send(credit)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configSales.RES.NOT_FOUND);
          expect(res.body.result).to.exist;
          done();
        });
    });

  });

  describe('GET /sales', () => {

    it('Get list of sales', done => {
      chai.request(app)
        .get('/sales')
        .set(authB)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.OK);
          expect(res.body.result).to.exist;
          expect(res.body.result).to.be.an('array');
          done();
        });
    });

    it('Failure due to not authorization', done => {
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
        .set(authB)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res.body.result._id).to.exist;
          done();
        });
    });

    it('Failure due to not authorization', done => {
      chai.request(app)
        .get('/sales/' + saleId)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.UNAUTHORIZED);
          done();
        });
    });

    it('Failure due not exist sale id', done => {
      chai.request(app)
        .get( '/sales/9a65a1d2977af10c88d49826')
        .type('form')
        .set(authB)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(configSales.RES.NOT_FOUND);
          expect(res.body.result).to.exist;
          done();
        });
    });

  });

  describe('GET /search/advanced', () => {

    it('Get search advanced', done => {
      chai.request(app)
        .get('/sales/search/advanced')
        .query(dataSearch)
        .set(authB)
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.OK);
          expect(res.body.result).to.exist;
          expect(res.body.result).to.be.an('array');
          done();
        });
    });

  });

  describe('PUT /sales/join', () => {

    it('Join two sales in one(the first)', done => {

      chai.request(app)
        .put('/sales/join')
        .set(authB)
        .send({
          ids: [ saleId, saleId2 ]
        })
        .end((err, res) => {
          expect(res).to.have.status(config.STATUS.OK);
          expect(res).to.be.json;
          expect(res.body.message).to.be.equal(config.RES.UPDATED);
          expect(res.body.result).to.exist;
          expect(res.body.result.total).to.be.equal(
            (dataSale.products[0].total * 2) + (dataSale.products[1].total * 2)
          );
          expect(res.body.result.state).to.be.equal(dataSale.state);
          expect(res.body.result.client).to.be.equal(dataSale.client);
          expect(res.body.result.products).to.have.lengthOf(dataSale.products.length * 2);
          done();
        });

    });

  });

});



