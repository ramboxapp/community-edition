'use strict';
const electron = require('electron');
const fs = require('fs');
const path = require('path');
const app = electron.app;
const dialog = electron.dialog;

const isDev = !fs.existsSync(path.resolve(path.dirname(process.execPath), '..', 'Update.exe'));

const autoUpdater = electron.autoUpdater;

const feedUrl = `https://getrambox.herokuapp.com/update/${process.platform}/${app.getVersion()}`;

exports.check = win => {
	if ( isDev ) return;

	autoUpdater.on('update-available', function() {
		dialog.showMessageBox({
			 message: 'New version'
			,detail: 'There is a new version available.'
			,buttons: ['Ok']
		});
	});
	
	autoUpdater.on('update-downloaded', function(e, releaseNotes, releaseName, releaseDate, updateURL) {
		var index = dialog.showMessageBox({
			 message: 'A new update is ready to install'
			,detail: 'Version ' + releaseName + ' is downloaded and will be automatically installed on Quit. Do you want to restart now?'
			,buttons: ['Yes', 'No']
		});
		if (index === 0) autoUpdater.quitAndInstall();
	});

	autoUpdater.setFeedURL(feedUrl);
	autoUpdater.checkForUpdates();
};
