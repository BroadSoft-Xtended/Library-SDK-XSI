test = require('bdsft-sdk-test').model;
describe('xsi', function() {

  before(function() {
    test.createModelAndView('xsi', {
        xsi: require('../'),
        debug: require('bdsft-sdk-debug'),
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

  describe('connect with login token', function(){
    var token;
    before(function() {
      return xsi.connect(config.user, config.password).loginToken().then(function(result){
        token = result.token;
      });
    });
    it('userProfile', function() {
      return xsi.connect(config.user, null, token).userProfile().should.eventually.have.deep.property('details.userId');
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