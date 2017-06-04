let SdqlService = require('../index');
let fs = require('fs');
var chai = require('chai')
	, chaiJsonEqual = require('chai-json-equal')
	, chaiAsPromised = require("chai-as-promised");

chai.use(chaiJsonEqual);
chai.use(chaiAsPromised);
chai.config.truncateThreshold = 0;
chai.should();

describe('Sdql Service', function () {

	describe('#analyze()', function () {
		it('should return a summary by season - ON system DEFAULT odd', function () {
			let sdqlService = new SdqlService();
			let systemData = JSON.parse(fs.readFileSync('./test/data/ats-test-system.json', 'utf8'));
			let expectedSystem = JSON.parse(fs.readFileSync('./test/expected/ats-test-system-ON-DEFAULT.json', 'utf8'));
			return sdqlService.analyze(systemData, 'ON', false, 'season').should.eventually.jsonEqual(expectedSystem);
		});
		it('should return a summary by season - AGAINST system DEFAULT odd', function () {
			let sdqlService = new SdqlService();
			let systemData = JSON.parse(fs.readFileSync('./test/data/ats-test-system.json', 'utf8'));
			let expectedSystem = JSON.parse(fs.readFileSync('./test/expected/ats-test-system-AGAINST-DEFAULT.json', 'utf8'));
			return sdqlService.analyze(systemData, 'AGAINST', false, 'season').should.eventually.jsonEqual(expectedSystem);
		});
		it('should return a summary by season - OVER system DEFAULT odd', function () {
			let sdqlService = new SdqlService();
			let systemData = JSON.parse(fs.readFileSync('./test/data/ats-test-system.json', 'utf8'));
			let expectedSystem = JSON.parse(fs.readFileSync('./test/expected/ats-test-system-OVER-DEFAULT.json', 'utf8'));
			return sdqlService.analyze(systemData, 'OVER', false, 'season').should.eventually.jsonEqual(expectedSystem);
		});
		it('should return a summary by season - UNDER system DEFAULT odd', function () {
			let sdqlService = new SdqlService();
			let systemData = JSON.parse(fs.readFileSync('./test/data/ats-test-system.json', 'utf8'));
			let expectedSystem = JSON.parse(fs.readFileSync('./test/expected/ats-test-system-UNDER-DEFAULT.json', 'utf8'));
			return sdqlService.analyze(systemData, 'UNDER', false, 'season').should.eventually.jsonEqual(expectedSystem);
		});

		it('should return a summary by season - ON system ML odd', function () {
			let sdqlService = new SdqlService();
			let systemData = JSON.parse(fs.readFileSync('./test/data/ml-test-system.json', 'utf8'));
			let expectedSystem = JSON.parse(fs.readFileSync('./test/expected/ml-test-system-ON.json', 'utf8'));
			return sdqlService.analyze(systemData, 'ON', false, 'season').should.eventually.jsonEqual(expectedSystem);
		});
		it('should return a summary by season - AGAINST system ML odd', function () {
			let sdqlService = new SdqlService();
			let systemData = JSON.parse(fs.readFileSync('./test/data/ml-test-system.json', 'utf8'));
			let expectedSystem = JSON.parse(fs.readFileSync('./test/expected/ml-test-system-AGAINST.json', 'utf8'));
			return sdqlService.analyze(systemData, 'AGAINST', false, 'season').should.eventually.jsonEqual(expectedSystem);
		});

		it('should return a summary by season - ON ATS system OVERRIDE US odd', function () {
			let sdqlService = new SdqlService();
			let systemData = JSON.parse(fs.readFileSync('./test/data/ats-test-system.json', 'utf8'));
			let expectedSystem = JSON.parse(fs.readFileSync('./test/expected/ats-test-system-ON-OVERRIDE.json', 'utf8'));
			return sdqlService.analyze(systemData, 'ON', false, 'season', {
				value: -120,
				type: 'US'
			}).should.eventually.jsonEqual(expectedSystem);
		});
		it('should return a summary by season - ON ATS system OVERRIDE DECIMAL odd', function () {
			let sdqlService = new SdqlService();
			let systemData = JSON.parse(fs.readFileSync('./test/data/ats-test-system.json', 'utf8'));
			let expectedSystem = JSON.parse(fs.readFileSync('./test/expected/ats-test-system-ON-OVERRIDE.json', 'utf8'));
			return sdqlService.analyze(systemData, 'ON', false, 'season', {
				value: 1.8333333333333335,
				type: 'DECIMAL'
			}).should.eventually.jsonEqual(expectedSystem);
		});

		it('should return a summary by season - ON ML system OVERRIDE US odd', function () {
			let sdqlService = new SdqlService();
			let systemData = JSON.parse(fs.readFileSync('./test/data/ml-test-system.json', 'utf8'));
			let expectedSystem = JSON.parse(fs.readFileSync('./test/expected/ml-test-system-ON-OVERRIDE.json', 'utf8'));
			return sdqlService.analyze(systemData, 'ON', false, 'season', {
				value: -120,
				type: 'US'
			}).should.eventually.jsonEqual(expectedSystem);
		});
		it('should return a summary by season - ON ML system OVERRIDE ATS odd', function () {
			let sdqlService = new SdqlService();
			let systemData = JSON.parse(fs.readFileSync('./test/data/ml-test-system.json', 'utf8'));
			let expectedSystem = JSON.parse(fs.readFileSync('./test/expected/ml-test-system-ON-OVERRIDE.json', 'utf8'));
			return sdqlService.analyze(systemData, 'ON', false, 'season', {
				value: 1.8333333333333335,
				type: 'DECIMAL'
			}).should.eventually.jsonEqual(expectedSystem);
		});

	})

});
