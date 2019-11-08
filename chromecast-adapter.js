const Adapter = require('jaxcore-plugin').Adapter;

class ChromecastAdapter extends Adapter {
	static getDefaultState() {
		return {};
	}
	
	constructor(config, theme, devices, services) {
		super(config, theme, devices, services);
		const {spin} = devices;
		const {chromecast} = services;
		spin.rotateRainbow(2);
		spin.lightsOff();
		
		this.addEvents(chromecast, {
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
		});
		
		this.addEvents(spin, {
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
		});
	}
	
	static getServicesConfig(adapterConfig) {
		return {
			chromecast: adapterConfig.settings.services.chromecast
		};
	};
}

module.exports = ChromecastAdapter;
