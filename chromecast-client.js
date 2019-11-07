var plugin = require('jaxcore-plugin');
var Client = plugin.Client;
var castStore = plugin.createStore('Cast Store');
var MediaPlayer = require('castv2-player').MediaPlayer();

// var _instance = 0;

function ChromeCastClient(config, device) {
	this.constructor();
	this.setStore(castStore);
	this.setStates({
		id: {
			type: 'string',
			defaultValue: ''
		},
		name: {
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
			defaultValue: 2
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
	}, config);
	
	this.id = this.state.id;
	
	this.log = plugin.createLogger('Chromecast:'+device.name);
	this.log('create', this.id);
	
	this.device = device;
	
	// this.device.on(this.device.EVENT_CLIENT_CONNECTED, () => {
	// 	this.log('device EVENT_CLIENT_CONNECTED');
	// 	process.exit();
	// });
	// this.device.on(this.device.EVENT_CLIENT_DISCONNECTED, () => {
	// 	this.log('device EVENT_CLIENT_DISCONNECTED');
	// 	process.exit();
	// });
	
	this.player = new MediaPlayer(device);
	this.log('created MediaPlayer', device.id);
	
	this.player.on(this.player.EVENT_PLAYER_PLAYING, (contentId) => {
		this.log("PLAYING: %s", contentId);
	});
	
	this.player.on(this.player.EVENT_PLAYER_STOPPED, (contentId) => {
		this.log("STOPPED: %s", contentId);
	});
	
	this.player.on(this.player.EVENT_PLAYER_STATUS, (status) => {
		
		
		
		this.log('status =========================');
		
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
			this.log('current time', status.currentTime, status.media.duration, percent);
			this.setState({
				position: status.currentTime,
				positionPercent: percent,
				duration: status.media.duration,
				lastPositionTime: new Date().getTime()
			});
		}
		if (status.volume) {
			this.log('on volume:', status.volume.level, status.volume.muted);
			if ('level' in status.volume) {
				var diff;
				if (this.lastVolumeTime) diff = new Date().getTime() - this.lastVolumeTime.getTime();
				if (this.state.volume === null || (diff && diff > 1000)) {
					let v = Math.round(status.volume.level * 100);
					if (this.state.volume !== v) {
						this.setState({
							volume: v,
							volumePercent: status.volume.level
						});
						this.emit('volume', this.state.volumePercent, this.state.volume);
					}
				}
				
				// this.setState({
				// 	volumePercent: status.volume.level
				// });
				// this.emit('volume', this.state.volumePercent, this.state.volume);
			}
			if ('muted' in status.volume) {
				if (this.state.muted !== status.volume.muted) {
					this.setState({
						muted: status.volume.muted
					});
					this.emit('muted', status.volume.muted);
				}
			}
		}
		// else {
		// 	this.log("EVENT_PLAYER_STATUS: %s", status);
		// }
	});
	
	// this.player.once(this.player.EVENT_PLAYER_STATUS, (status) => {
	// 	this.emit('status', status);
	// 	this.emit('connect');
	//
	// 	// setInterval(() => {
	// 	//
	// 	// 	if (this.state.playing && !this.state.paused) {
	// 	// 		var newPos = this.getPosition();
	// 	// 		this.log('status', 'newPos', newPos);
	// 	// 	}
	// 	//
	// 	// 	// this.player.getStatusPromise().then(function(status) {
	// 	// 	// 	this.log('status', status);
	// 	// 	// });
	// 	// }, 1000);
	// });
	
	this.player.on(this.player.EVENT_CONNECTION, () => {
		this.log('EVENT_CONNECTION');
		// process.exit();
	});
	this.player.on(this.player.EVENT_CLIENT_CONNECTED, () => {
		this.log('player EVENT_CLIENT_CONNECTED');
		if (!this.state.connected) {
			this.setState({
				connected: true
			});
			this.emit('connect');
		}
	});
	this.player.on(this.player.EVENT_CLIENT_DISCONNECTED, () => {
		this.log('player EVENT_CLIENT_DISCONNECTED');
		if (this.state.connected) {
			this.setState({
				connected: false
			});
			this.emit('disconnect');
		}
		process.exit();
	});
}
ChromeCastClient.prototype = new Client();
ChromeCastClient.prototype.constructor = Client;

ChromeCastClient.prototype.connect = function() {
};

ChromeCastClient.prototype.changeVolume = function(diff) {
	this.setVolume(this.state.volume + diff);
};
ChromeCastClient.prototype.volumeUp = function() {
	this.setVolume(this.state.volume+this.state.volumeIncrement);
};
ChromeCastClient.prototype.volumeDown = function() {
	this.setVolume(this.state.volume-this.state.volumeIncrement);
};
ChromeCastClient.prototype.getVolume = function(callback) {
	this.player.getVolumePromise().then((vol) =>{
		this.log('getVolume', vol);
		if (callback) callback(vol);
	});
};
ChromeCastClient.prototype.setVolume = function(v) {
	if (v<this.state.minVolume) v = this.state.minVolume;
	if (v>this.state.maxVolume) v = this.state.maxVolume;
	this.lastVolumeTime = new Date();
	var volumePercent = v / 100;
	this.setState({
		volume: v,
		volumePercent: volumePercent,
	});
	this.emit('volume', volumePercent, v);
	this.player.setVolumePromise(v).then((vol) => {
		this.log('set volume', this.state.volume, vol);
	});
};

ChromeCastClient.prototype.toggleMuted = function() {
	this.setMuted(!this.state.muted);
};
ChromeCastClient.prototype.setMuted = function(m) {
	if (m) {
		this.player.mutePromise().then((muted) => {
			this.log('setMuted true? ', muted);
		});
	}
	else {
		this.player.unmutePromise().then((muted) => {
			this.log('setMuted false? ', muted);
		});
	}
};
ChromeCastClient.prototype.getMuted = function(callback) {
	return this.player.getClientStatus().volume.muted;
};
ChromeCastClient.prototype._playing = function() {
	if (!this.state.playing || this.state.paused) {
		this.setState({
			playing: true,
			paused: false
		});
		this.emit('play', this.state.playing);
		// this.emit('pause', this.state.paused);
	}
};
ChromeCastClient.prototype._paused = function() {
	if (!this.state.paused) {
		this.setState({
			playing: true,
			paused: true
		});
		// this.emit('play', this.state.playing);
		this.emit('pause', this.state.paused);
	}
};
ChromeCastClient.prototype.togglePlayPause = function() {
	if (this.state.playing) {
		if (this.state.paused) {
			this.play();
		}
		else {
			this.pause();
		}
	}
};
ChromeCastClient.prototype.play = function() {
	this.log('play()');
	this.player.playPromise();
};
ChromeCastClient.prototype.pause = function() {
	this.log('pause()');
	this.player.pausePromise();
};
ChromeCastClient.prototype.stop = function() {
	this.player.stopClientPromise();
};

ChromeCastClient.prototype.getPosition = function(s) {
	var diff = (new Date().getTime() - this.state.lastPositionTime) / 1000;
	var newPos = this.state.position + diff;
	return newPos;
};

ChromeCastClient.prototype.seek = function(s) {
	this.player.seekPromise(s).then((r) => {
		this.log('seek r', r);
	});
};

module.exports = ChromeCastClient;