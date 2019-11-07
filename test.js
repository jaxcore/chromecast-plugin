var Spin = require('jaxcore-spin');
var castService = require('./service');

castService.scan(function(device) {
	console.log('device:', device);

	if (device.name !== 'Family room TV') {
		console.log('found other');
		return;
	}
	
	console.log('connecting to ...');
	castService.on('connected', function() {
		console.log('x');
		process.exit();
	});
	
	var onConnect = function(cast) {
		
		console.log('cast service:', cast);
		// process.exit();
		
		cast.setState({volumeIncrement:4});
		
		Spin.connectBLE(function (spin) {
			console.log('spin connected', spin.id);
			
			spin.flash([0,255,0]);
			
			cast.on('volume', function(volumePercent) {
				console.log('VOLUME', volumePercent);
				spin.scale(volumePercent, [0,0,255], [255,0,0], [255,255,255]);
			});
			
			cast.on('muted', function(muted) {
				console.log('MUTED', muted);
				if (muted) {
					spin.dial(cast.state.volumePercent, [255,255,0], [0,0,0], [255,255,255]);
					// spin.lightsOn([255,255,0]);
				}
				else {
					// spin.lightsOff();
					spin.scale(cast.state.volumePercent, [0,0,255], [255,0,0], [255,255,255]);
				}
			});
			
			cast.on('play', function(playing) {
				console.log('PLAY', playing);
				if (playing) spin.flash([0,255,0]);
			});
			
			cast.on('pause', function(paused) {
				console.log('PAUSE', paused);
				if (paused) spin.flash([0,255,255]);
				else spin.flash([0,255,0]);
			});
			
			spin.on('spin', function (direction, position) {
				console.log('spin', direction, position);
				if (cast.state.muted) {
					// spin.flash([255,255,0]);
					spin.dial(cast.state.volumePercent, [255,255,0], [0,0,0], [255,255,255]);
					return;
				}
				if (cast.state.paused) {
					spin.flash([0,255,255]);
					return;
				}
				if (spin.state.buttonPushed) {
					if (spin.buffer(direction)) {
						if (!cast.didSeek && !cast._seekPosition) {
							cast._seekPosition = cast.getPosition();
							cast._seekPositionDiff = 0;
						}
						cast.didSeek = true;
						cast._seekPositionDiff += direction * 2;
						console.log('SEEK', cast._seekPositionDiff);
					}
				}
				else {
					if (spin.buffer(direction, 3, 1)) {
						if (direction === 1) cast.volumeUp();
						else cast.volumeDown();
					}
				}
			});
			
			spin.on('button', function (pushed) {
				console.log('button', pushed);
				
				if (!pushed) {
					if (cast.didSeek) {
						// seek on button release
						console.log('SEEK TO', cast._seekPosition, cast._seekPositionDiff);
						cast.seek(cast._seekPosition + cast._seekPositionDiff);
						cast.didSeek = false;
						cast._seekPosition = null;
						cast._seekPositionDiff = null;
					}
					else {
						// if didn't seek, then mute
						cast.toggleMuted();
					}
				}
			});
			
			spin.on('knob', function (pushed) {
				console.log('knob', pushed);
				if (!pushed) {
					// play/pause on knob release
					cast.togglePlayPause();
				}
			});
			
			
		});
	};
	
	castService.connect(device, onConnect);
	
	// setTimeout(onConnect, 3000);
});
