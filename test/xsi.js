var test = require('../node_modules/webrtc-core/test/includes/common_core');
var extend = require('extend');
var chai = require("chai");
chai.use(require("chai-as-promised"));
var should = chai.should();

describe('xsi', function() {

  before(function() {
    test.createModelAndView('xsi', {
        xsi: require('../'),
        request: require('bdsft-sdk-request')
    });
    global.window = undefined;
    config = require('./config/default.json');
    try {
      extend(config, require('./config/test.json'));
    } catch(e) {}
  });

  describe('connect with wrong credentials', function(){
    before(function(){
      xsi.enabled = true;
      client = xsi.connect(config.user, 'wrongpassword');
    });

    it('userProfile', function() {
      return client.userProfile().should.eventually.be.rejected;
    });
  });

  describe('connect', function(){
    before(function(){
      xsi.enabled = true;
      client = xsi.connect(config.user, config.password);
    });

    it('userDirectoryEnterprise', function() {
      return client.userDirectoryEnterprise().should.eventually.have.property('totalAvailableRecords').above(0);
    });

    it('userDirectoryEnterprise with search params', function() {
      return client.userDirectoryEnterprise({impId: '*broadsoftlabs.com*'}).should.eventually.have.property('totalAvailableRecords').above(0);
    });

    it('userDirectoryEnterprise with not matching search params', function() {
      return client.userDirectoryEnterprise({emailAddress: 'notexisting@test.com'}).should.eventually.have.property('totalAvailableRecords').equal('0');
    });

    it('userAccessDevices', function() {
      return client.userAccessDevices().should.eventually.have.length.above('0');
    });

    it('userProfile', function() {
      return client.userProfile().should.eventually.have.deep.property('details.userId', config.user+'@'+xsi.domain);
    });
    it('userProfile with DNS url', function() {
      xsi.xspUrl = 'https://xsp.broadsoftlabs.com';
      return client.userProfile().should.eventually.have.deep.property('details.userId', config.user+'@'+xsi.domain);
    });
  })
});