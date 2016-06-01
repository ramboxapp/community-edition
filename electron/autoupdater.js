'use strict';
const electron = require('electron');
const app = electron.app;
const dialog = electron.dialog;

const autoUpdater = electron.autoUpdater;

const feedUrl = `https://getrambox.herokuapp.com/update/${process.platform}/${process.arch}/${app.getVersion()}`;

autoUpdater.setFeedURL(feedUrl);
autoUpdater.checkForUpdates();

exports.check = win => {
	autoUpdater.on('update-available', function(a, b, c, d) {
		dialog.showMessageBox({
			 message: "There is a new version"
			,buttons: ["OK"]
		});
	});
	/*
	autoUpdater.on('update-not-available', function(a, b, c, d) {

	});
	*/
	autoUpdater.on('update-downloaded', function(e, releaseNotes, releaseName, releaseDate, updateURL) {
		var index = dialog.showMessageBox({
			 message: "New version"
			,detail: "Do you want to install the new version ("+releaseName+")?"
			,buttons: ["Yes", "No"]
		});
		if (index === 0) {
	      autoUpdater.quitAndInstall();
	    }
	});
	/*
	autoUpdater.on("error", function(error){
		dialog.showMessageBox({
			 message: error.toString()
			,buttons: ["OK"]
		});
	});
	*/
};
