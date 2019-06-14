var EventEmitter = require('events');
var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var castStore = plugin.createStore('Cast Store');
var ScannerPromise = require('castv2-player').ScannerPromise();
var MediaPlayer    = require('castv2-player').MediaPlayer();

var logger = function(name) {
	var n = name;
	return function() {
		var d = require('debug')(n);
		var args = Array.prototype.slice.call(arguments);
		args = args.map(function (a) {
			if (typeof a === 'object') {
				return JSON.stringify(a, null, 4);
			}
			return a;
		});
		d.apply(d, args);
	};
};

var log = logger('cast');


// var KodiClient = require('./client');

function ChromeCastDevice(device) {
	this.constructor();
	this.setStore(castStore);
	this.setStates({
		id: {
			type: 'string',
			defaultValue: ''
		},
		connected: {
			type: 'boolean',
			defaultValue: false
		},
		muted: {
			type: 'boolean',
			defaultValue: false
		},
		volume: {
			type: 'int',
			defaultValue: null
		},
		volumePercent: {
			type: 'float',
			defaultValue: 0
		},
		minVolume: {
			type: 'integer',
			defaultValue: 0,
			maximumValue: 100,
			minimumValue: 0
		},
		maxVolume: {
			type: 'integer',
			defaultValue: 100,
			maximumValue: 100,
			minimumValue: 0
		},
		volumeIncrement: {
			type: 'integer',
			defaultValue: 3
		},
		playing: {
			type: 'boolean',
			defaultValue: false
		},
		paused: {
			type: 'boolean',
			defaultValue: false
		},
		position: {
			type: 'float',
			defaultValue: 0
		},
		duration: {
			type: 'float',
			defaultValue: 0
		}
	}, {
		id: device.id
	});
	
	this.device = new MediaPlayer(device);
	log('created device', device.id);
	
	this.device.on(this.device.EVENT_PLAYER_PLAYING, (contentId) => {
		log("PLAYING: %s", contentId);
	});
	
	this.device.on(this.device.EVENT_PLAYER_STOPPED, (contentId) => {
		log("STOPPED: %s", contentId);
	});
	
	this.device.on(this.device.EVENT_PLAYER_STATUS, (status) => {
		log('=========================');
		
		// "playerState": "PAUSED",
		if ('playerState' in status) {
			if (status.playerState === 'PAUSED') {
				this._paused();
			}
			if (status.playerState === 'PLAYING') {
				this._playing();
			}
		}
		if ('currentTime' in status && 'media' in status) {
			var percent = status.currentTime / status.media.duration;
			log('current time', status.currentTime, status.media.duration, percent);
			this.setState({
				position: status.currentTime,
				positionPercent: percent,
				duration: status.media.duration,
				lastPositionTime: new Date().getTime()
			});
		}
		if (status.volume) {
			log('on volume:', status.volume.level, status.volume.muted);
			if ('level' in status.volume) {
				var diff;
				if (this.lastVolumeTime) diff = new Date().getTime() - this.lastVolumeTime.getTime();
				if (this.state.volume === null || (diff && diff > 1000)) {
					this.setState({
						volume: Math.round(status.volume.level * 100),
						volumePercent: status.volume.level
					});
					this.emit('volume', this.state.volumePercent, this.state.volume);
				}
				
				// this.setState({
				// 	volumePercent: status.volume.level
				// });
				// this.emit('volume', this.state.volumePercent, this.state.volume);
			}
			if ('muted' in status.volume) {
				this.setState({
					muted: status.volume.muted
				});
				this.emit('muted', status.volume.muted);
			}
		}
		// else {
		// 	log("EVENT_PLAYER_STATUS: %s", status);
		// }
		
		
	});
	
	
	var count = 0;
	
	this.device.once(this.device.EVENT_PLAYER_STATUS, (status) => {
		this.emit('status');
		
		count++;
		
		if (count > 1) {
			console.log('count', count);
			process.exit();
		}
		setInterval(() => {
			
			if (this.state.playing && !this.state.paused) {
				var newPos = this.getPosition();
				console.log('status', 'newPos', newPos);
			}
			//
			// 	// this.getVolume();
			// 	// this.device._playerActionPromise ("getStatus", player.getStatus.bind(player));
			//
			// 	this.device.getStatusPromise().then(function(s) {
			// 		log('sp === ', s);
			// 	});
			//
			// 	// if (p) {
			// 		//log('p === ', p);
			// 		// p.then(function(stat) {
			// 		// 	log('ppp ------------------------', stat);
			// 		// })
			// 	// }
			//
			// 	// this.device.getStatusPromise().then(function(status) {
			// 	// 	log('------------------------');
			// 	// });
		}, 1000);
	});
}
ChromeCastDevice.prototype = new Client();
ChromeCastDevice.prototype.constructor = Client;

ChromeCastDevice.prototype.volumeUp = function() {
	this.setVolume(this.state.volume+this.state.volumeIncrement);
};
ChromeCastDevice.prototype.volumeDown = function() {
	this.setVolume(this.state.volume-this.state.volumeIncrement);
};
ChromeCastDevice.prototype.getVolume = function(callback) {
	this.device.getVolumePromise().then(function(vol) {
		console.log('getVolume', vol);
		if (callback) callback(vol);
	});
};
ChromeCastDevice.prototype.setVolume = function(v) {
	if (v<this.state.minVolume) v = this.state.minVolume;
	if (v>this.state.maxVolume) v = this.state.maxVolume;
	this.lastVolumeTime = new Date();
	var volumePercent = v / 100;
	this.setState({
		volume: v,
		volumePercent: volumePercent,
	});
	this.emit('volume', volumePercent, v);
	this.device.setVolumePromise(v).then((vol) => {
		console.log('set volume', this.state.volume);
	});
};

ChromeCastDevice.prototype.toggleMuted = function() {
	this.setMuted(!this.state.muted);
};
ChromeCastDevice.prototype.setMuted = function(m) {
	if (m) {
		this.device.mutePromise().then(function (muted) {
			console.log('setMuted true? ', muted);
		});
	}
	else {
		this.device.unmutePromise().then(function (muted) {
			console.log('setMuted false? ', muted);
		});
	}
};
ChromeCastDevice.prototype.getMuted = function(callback) {
	return this.device.getClientStatus().volume.muted;
};
ChromeCastDevice.prototype._playing = function() {
	if (!this.state.playing || this.state.paused) {
		this.setState({
			playing: true,
			paused: false
		});
		this.emit('playing', this.state.playing);
		this.emit('paused', this.state.paused);
	}
};
ChromeCastDevice.prototype._paused = function() {
	if (!this.state.paused) {
		this.setState({
			playing: true,
			paused: true
		});
		this.emit('playing', this.state.playing);
		this.emit('paused', this.state.paused);
	}
};
ChromeCastDevice.prototype.togglePlayPause = function() {
	if (this.state.playing) {
		if (this.state.paused) {
			this.play();
		}
		else {
			this.pause();
		}
	}
};
ChromeCastDevice.prototype.play = function() {
	log('play()');
	this.device.playPromise();
};
ChromeCastDevice.prototype.pause = function() {
	log('pause()');
	this.device.pausePromise();
};
ChromeCastDevice.prototype.stop = function() {
	this.device.stopClientPromise();
};

ChromeCastDevice.prototype.getPosition = function(s) {
	var diff = (new Date().getTime() - this.state.lastPositionTime) / 1000;
	var newPos = this.state.position + diff;
	return newPos;
};

ChromeCastDevice.prototype.seek = function(s) {
	this.device.seekPromise(s).then(function(r) {
		log('seek r', r);
	});
};


function ChromeCastService() {
	this.constructor();
	this.clients = {};
}

ChromeCastService.prototype = new EventEmitter();
ChromeCastService.prototype.constructor = EventEmitter;

ChromeCastService.prototype.scan = function (callback) {
	// 'Family room TV'
	ScannerPromise().then(function (device) {
		log('found cast', device.id);
		callback(device);
	});
};

ChromeCastService.prototype.connect = function (device, callback) {
	log('connecting', device.name);
	ScannerPromise(device.name).then((dev) => {
		if (device.id === dev.id) {
			if (this.clients[dev.id]) {
				//this.clients[id].destroy();
			}
			log('connecting', dev.id);
			this.clients[dev.id] = new ChromeCastDevice(dev);
			this.clients[dev.id].once('status', () => {
				callback(this.clients[dev.id]);
			});
		}
	}).catch(function(err) {
		log('connect err', err);
	})
};

ChromeCastService.prototype.disconnect = function (id, callback) {

};

module.exports = new ChromeCastService();
