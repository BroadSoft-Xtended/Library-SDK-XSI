module.exports = require('bdsft-sdk-model')(XSI, {
  config: require('../../js/config')
});

var Utils = require('bdsft-sdk-utils');
var Q = require('q');
var parseString = require('xml2js').parseString;

function XSI(debug, request) {
  var self = {};

  self.xspUrl;

  var nextXspUrl = function() {
    var nextIndex = 0;

    if (self.xspUrl) {
      for (var i = 0; i < self.xspHosts.length; i++) {
        xspHost = self.xspHosts[i];
        if (self.xspUrl.indexOf(xspHost) !== -1) {
          nextIndex = i + 1;
          if (nextIndex >= self.xspHosts.length) {
            nextIndex = 0;
          }
          break;
        }
      }
    }

    return self.protocol + '://' + self.xspHosts[nextIndex] + ':' + self.port;
  };

  var ensureDomain = function(value) {
    if (!value) {
      return value;
    }

    if (value.match(/.*@.*/)) {
      return value;
    }

    return (value + '@' + self.domain);
  };

  self.connect = function(user, password, token) {
    var client = {};

    user = ensureDomain(user);
    var agent;

    var requests = {};

    var parseXml = function(res) {
      var deferred = Q.defer();
      parseString(res, {
        explicitArray: false
      }, function(err, resultJson) {
        debug.log('response json : ' + JSON.stringify(resultJson));
        deferred.resolve(resultJson);
      });
      return deferred.promise;
    };

    var actionRequest = function(opts) {
      if (!self.enabled) {
        return Q.reject('XSI disabled');
      }

      if (!agent) {
        if(client.jsessionid) {
          debug.log('using jsessionid : '+client.jsessionid);
          opts.cookie = 'JSESSIONID='+client.jsessionid;
        } else if (token) {
          debug.log('using token : '+token);
          opts.broadworksSSO = token;
        } else {
          if(!password) {
            var msg = 'using basic without password : '+user;
            debug.error(msg);
            return Q.reject(msg);
          } else {
            debug.log('using basic : '+user);
          }
          opts.basic = {
            user: user,
            password: password
          }
        }
      }

      opts.path = '/com.broadsoft.xsi-actions/v2.0/' + opts.path;
      opts.url = self.xspUrl = client.xspUrl || self.xspUrl || nextXspUrl();
      opts.dataType = 'xml';

      var requestObj = request();
      if (requests[opts.path]) {
        requests[opts.path].abort();
      }
      requests[opts.path] = requestObj;
      agent = agent || requestObj.agent();
      opts.agent = agent;

      return requestObj.send(opts).then(function(res) {
        delete requests[opts.path];
        debug.debug('response xml : ' + res);
        var setCookie = requestObj.response.get('Set-Cookie');
        if(setCookie) {
          debug.debug('setCookie : '+setCookie);
          client.jsessionid = Utils.getCookie(setCookie, 'JSESSIONID') || client.jsessionid;
          debug.debug('jsessionid : '+client.jsessionid);
        }
        client.xspUrl = requestObj.response.request.protocol + '//' + requestObj.response.request.host;
        return parseXml(res);
      }).fail(function(e) {
        debug.error('failed : ' + JSON.stringify(e));
        self.xspUrl = nextXspUrl();
        debug.log('next xsp url : ' + self.xspUrl);
        throw e;
      });
    }

    var userRequest = function(opts) {
      opts.path = 'user/' + user + '/' + opts.path;
      return actionRequest(opts);
    }

    var userDirectories = function(opts) {
      opts.path = 'directories/' + opts.path;
      return userRequest(opts);
    }

    var userProfile = function(opts) {
      opts = opts || {};
      opts.path = 'profile' + (opts.path ? '/' + opts.path : '');
      return userRequest(opts);
    }

    client.userDirectoryEnterprise = function(params) {
      return userDirectories({
        path: 'Enterprise',
        params: params
      }).then(function(res) {
        return res && res.Enterprise;
      });
    };

    client.userProfile = function(params) {
      return userProfile().then(function(res) {
        return res.Profile;
      });
    };

    client.collaborate = function(params) {
      params = params || {};
      params.path = 'services/collaborate';
      return userRequest(params).then(function(res) {
        return res.Collaborate;
      });
    };

    client.loginToken = function(params) {
      return userProfile({
        path: 'logintoken',
        type: 'POST'
      }).then(function(res) {
        return res.LoginToken;
      });
    };

    client.userAccessDevices = function(params) {
      return userProfile({
        path: 'Device',
        data: params
      }).then(function(res) {
        return res.AccessDevices.accessDevice;
      });
    };

    return client;
  }

  return self;
}