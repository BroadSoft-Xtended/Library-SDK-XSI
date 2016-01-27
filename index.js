module.exports = {
	model: require('./lib/models/xsi'),
	xsi: require('./lib/models/xsi').create({
		debug: require('bdsft-sdk-debug').model.create({name: 'xsi'}), 
		request: require('bdsft-sdk-request').model.create({
			debug: require('bdsft-sdk-debug').model.create({name: 'request'})
		})
	})
};