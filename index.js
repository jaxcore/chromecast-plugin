module.exports = {
	services: {
		chromecast: require('./chromecast-service')
	},
	adapters: {
		chromecast: require('./chromecast-adapter')
	}
};