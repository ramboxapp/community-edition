/**
 * This is an example test.
 */

const chai = require('chai');
const expect = chai.expect;
const RamboxTestHelper = require('../../helpers/RamboxTestHelper');

describe('Rambox window', function() {

	/**
	 * The Rambox test helper does common stuff.
	 *
	 * @type {module.exports}
	 */
	const ramboxTestHelper = new RamboxTestHelper();

	it('should have "Rambox-OS" in the title', function () {
		return ramboxTestHelper.app.client.browserWindow.getTitle().then(function(title) {
			expect(title).to.contain('Rambox-OS');
			return Promise.resolve();
		});
	})
});
