/**
 * This is an example test.
 */

var chai = require('chai');
var expect = chai.expect;
var RamboxTestHelper = require('../../helpers/RamboxTestHelper');

describe('Rambox window', function() {

	/**
	 * The Rambox test helper does common stuff.
	 *
	 * @type {module.exports}
	 */
	var ramboxTestHelper = new RamboxTestHelper();

	it('should have "Rambox" in the title', function () {
		return ramboxTestHelper.app.client.browserWindow.getTitle().then(function(title) {
			expect(title).to.contain('HumanistenBox');
			return Promise.resolve();
		});
	})
});
