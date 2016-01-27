module.exports = {
	model: require('./lib/models/xsi'),
	xsi: require('./lib/models/xsi').create([
		require('bdsft-sdk-debug').model.create({name: 'xsi'}), 
		require('bdsft-sdk-request').model.create([
			require('bdsft-sdk-debug').model.create({name: 'request'})
		])
	])
};