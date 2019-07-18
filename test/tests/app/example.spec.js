/**
 * This is an example test.
 */

const chai = require('chai');
const expect = chai.expect;
const HamsketTestHelper = require('../../helpers/HamsketTestHelper');

describe('Hamsket window', function() {

	/**
	 * The Hamsket test helper does common stuff.
	 *
	 * @type {module.exports}
	 */
	const hamsketTestHelper = new HamsketTestHelper();

	it('should have "Hamsket" in the title', function () {
		return hamsketTestHelper.app.client.browserWindow.getTitle().then(function(title) {
			expect(title).to.contain('Hamsket');
			return Promise.resolve();
		});
	})
});
