function getDefaultState() {
	return {
	};
}

function chromecastAdapter() {
	const {spin} = this.devices;
	const {chromecast} = this.services;
	const {theme} = this;
	spin.rotateRainbow(2);
	spin.lightsOff();
	
	this.setEvents({
		chromecast: {
			play: function() {
				this.log('play');
				spin.flash(theme.success);
			},
			stop: function() {
				this.log('stop');
				spin.flash(theme.error);
			},
			pause: function() {
				this.log('paused');
				spin.flash(theme.secondary);
			},
			muted: function(muted) {
				this.log('muted', muted);
				if (chromecast.state.muted) {
					spin.scale(chromecast.state.volumePercent, theme.tertiary, theme.tertiary, theme.middle);
				} else {
					spin.scale(chromecast.state.volumePercent, theme.low, theme.high, theme.middle);
				}
			},
			volume: function(volumePercent, volume) {
				this.log('volume', volumePercent, volume);
				if (chromecast.state.muted) {
					spin.scale(chromecast.state.volumePercent, theme.tertiary, theme.tertiary, theme.middle);
				} else {
					spin.scale(chromecast.state.volumePercent, theme.low, theme.high, theme.middle);
				}
			}
		},
		spin: {
			spin: function (diff, spinTime) {
				this.log('spin rotate', diff, spinTime);
				if (chromecast.state.muted) {
					spin.scale(chromecast.state.volumePercent, theme.tertiary, theme.tertiary, theme.middle);
				} else {
					if (spinTime > 200) {
						chromecast.changeVolume(diff);
					} else {
						diff = spin.buffer(diff, 1, 0);
						if (diff !== 0) chromecast.changeVolume(diff * 2);
					}
					//sspin.scale(volumePercent, theme.low, theme.high, theme.middle);
				}
			},
			knob: function (pushed) {
				this.log('knob', pushed);
				if (pushed) chromecast.toggleMuted();
			},
			button: function (pushed) {
				this.log('button', pushed);
				if (pushed) chromecast.togglePlayPause();
			}
		}
	});
}

chromecastAdapter.getServicesConfig = function(adapterConfig) {
	console.log('chromecastAdapter getServicesConfig', adapterConfig);
	
	let servicesConfig = {
		chromecast: {
			name: 'Family room TV'
			// adapterConfig.services.chromecast
		}
	};
	
	return servicesConfig;
};

chromecastAdapter.getDefaultState = getDefaultState;

module.exports = chromecastAdapter;
