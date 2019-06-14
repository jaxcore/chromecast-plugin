var Spin = require('jaxcore-spin');
var castService = require('./service');

castService.scan(function(device) {
	console.log('device:', device);
	
	if (device.name !== 'Family room TV') return;
	
	castService.connect(device, function(cast) {
		console.log('cast:', cast.state);
		
		cast.setState({volumeIncrement:4});
		
		Spin.connect(function (spin) {
			console.log('spin connected', spin.id);
			
			spin.on('spin', function (direction, position) {
				console.log('spin', direction, position);
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
	});
});
