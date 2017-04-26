var SdqlService = require('./SdqlService');

let sdqlService = new SdqlService();
sdqlService.run('HD', 'NFL', 'season')
	.then(system => {
		return sdqlService.analyze(system, 'ON', false, 'season', {value: -105, type: 'US'});
	})
	.then(analysis => {
		console.log(analysis)
	});
