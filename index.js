module.exports = {
	services: {
		chromecast: {
			service: require('./chromecast-service'),
			storeType: 'client'
		}
	},
	adapters: {
		chromecast: require('./chromecast-adapter')
	}
};