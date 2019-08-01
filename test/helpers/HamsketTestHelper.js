
const Application = require('spectron').Application;
const electron = require('electron');

/**
 * The HamsketTestHelper contains common stuff for tests.
 */
module.exports = function() {

	const self = this;

	/**
	 * Makes the Hamsket Application available.
	 *
	 * @type {Application}
	 */
	self.app = null;

	/**
	 * Starts Hamsket from '/electron/main.js/'.
	 */
	beforeEach(function() {
		self.app = new Application({
			path: electron,
			args: [__dirname + '/../../electron/main.js']
		});
		return self.app.start();
	});

	/**
	 * Stops Hamsket.
	 */
	afterEach(function() {
		if (self.app && self.app.isRunning()) {
			return self.app.stop()
		}
	});
};
