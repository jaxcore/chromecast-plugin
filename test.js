const Jaxcore = require('jaxcore');
const cyber = require('jaxcore/themes/cyber');
const jaxcore = new Jaxcore();
jaxcore.addTheme('cyber', cyber);
jaxcore.setDefaultTheme('cyber');

// DEVICES

const Spin = require('jaxcore-spin');
jaxcore.addDevice('spin', Spin);

// PLUGINS

const chromecastPlugin = require('./index');
jaxcore.addPlugin(chromecastPlugin);

jaxcore.on('device-connected', function(type, spin) {
	jaxcore.createAdapter(spin, 'chromecast', {
		services: {
			chromecast: {
				name: 'Family room TV'
			}
		}
	});
});

jaxcore.startDevice('spin');
