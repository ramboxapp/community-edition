// A simple test to verify a visible window is opened with a title
var Application = require('spectron').Application
var assert = require('assert')

var app = new Application({
	path: 'dist/Rambox-linux-x64/Rambox'
})

app.start().then(function () {
	// Check if the window is visible
	return app.browserWindow.isVisible()
}).then(function (isVisible) {
	// Verify the window is visible
	assert.equal(isVisible, true)
}).then(function () {
	// Get the window's title
	return app.client.getTitle()
}).then(function (title) {
	// Verify the window's title
	assert.equal(title, 'Ramboxx')
}).then(function () {
	// Stop the application
	return app.stop()
}).catch(function (error) {
	// Log any failures
	console.error('Test failed', error.message)
	return app.stop()
})
