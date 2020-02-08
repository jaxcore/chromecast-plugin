const {Service, createLogger} = require('jaxcore');
var ChromeCastClient = require('./chromecast-client');
var ScannerPromise = require('castv2-player').ScannerPromise();

var chromecastServiceInstance;

class ChromeCastService extends Service {
	constructor(config, store) {
		super();
		this.clients = {};
		this.store = store;
		this.log = createLogger('Chromecast Service');
		this.log('create', config);
	}
	
	scan(callback) {
		// 'Family room TV'
		ScannerPromise().then((device) => {
			this.log('found cast', device.id);
			callback(device);
		});
	}
	
	static scan() {
		// 'Family room TV'
		return ScannerPromise();
		// .then((device) => {
		// ScannerPromise().then((device) => {
		// 	this.log('found cast', device.id);
		// 	callback(device);
		// });
	}
	
	create(id, device, serviceStore) {
		let config = {
			id: id,
			// chromecastId: device.id,
			name: device.name
		};
		let client = new ChromeCastClient(serviceStore, config, device);
		this.clients[id] = client;
		return client;
	}
	
	connect(device, callback) {
		this.log('connecting to', device.castName);
		
		// ScannerPromise(device.name).then((dev) => {
		// 	if (device.id === dev.id) {
		// 		if (this.clients[dev.id]) {
		// 			//this.clients[id].destroy();
		// 		}
		// 		log('connecting', dev.id);
		// 		this.clients[dev.id] = new ChromeCastDevice(dev);
		// 		this.clients[dev.id].once('status', (x) => {
		// 			console.log('STATUS', x);
		// 			callback(this.clients[dev.id]);
		// 		});
		// 	}
		// }).catch(function(err) {
		// 	log('connect err', err);
		// });
	}
	
	disconnect(id, callback) {
	}
	
	static id(serviceConfig) {
		let id = 'chromecast:'+serviceConfig.name;
		return id;
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		console.log('ChromeCastService getOrCreateInstance', serviceId, serviceConfig);
		if (!chromecastServiceInstance) {
			ChromeCastService.startService();
		}
		
		if (chromecastServiceInstance.clients[serviceId]) {
			let instance = chromecastServiceInstance.clients[serviceId];
			console.log('RETURNING CHROMECAST CLIENT', instance);
			process.exit();
			return instance;
		}
		else {
			console.log('CREATE CHROMECAST', serviceId, serviceConfig);
			
			let timeout = setTimeout(function() {
				console.log('CREATE TIMEOUT');
				callback({
					timeout: true
				});
			},5000);
			
			let name = serviceConfig.name;
			ScannerPromise(name).then((dev) => {
				if (
					dev.name === serviceConfig.name
				) {
					console.log('found dev', dev);
					clearTimeout(timeout);
					console.log('connecting', dev.id);
					let client = chromecastServiceInstance.create(serviceId, dev, serviceStore);
					
					// this.clients[dev.id].once('status', (x) => {
					// 	this.log('STATUS', x);
					// 	callback(this.clients[dev.id]);
					// });
					
					callback(null, client);
				}
				else {
					console.log('wrong dev', dev, serviceConfig);
					process.exit();
				}
			}).catch(function(err) {
				console.log('connect err', err);
				callback(err);
			});
			
			// timeout
			
			// var instance = chromecastServiceInstance.create(serviceConfig);
			// this.log('CREATED CHROMECAST CLIENT', instance);
			
			// return instance;
			// keyboardInstance = new KodiService(serviceConfig);
		}
	}
	
	static startService() {
		if (!chromecastServiceInstance) {
			console.log('ChromeCastService startService');
			chromecastServiceInstance = new ChromeCastService();
		}
	}
}


module.exports = ChromeCastService;
