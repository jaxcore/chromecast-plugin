module.exports = {
	services: {
		chromecast: require('./chromecast-service')
	},
	stores: {
		chromecast: 'client'
	},
	adapters: {
		chromecast: require('./chromecast-adapter')
	}
};