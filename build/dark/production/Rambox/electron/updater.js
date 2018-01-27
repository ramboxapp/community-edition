const {app, autoUpdater, ipcMain} = require('electron');
const version = app.getVersion();
const platform = process.platform === 'darwin' ? 'osx' : process.platform;
const url = `https://getrambox.herokuapp.com/update/${platform}/${version}`;

const initialize = (window) => {
	const webContents = window.webContents;
	const send = webContents.send.bind(window.webContents);
	autoUpdater.on('checking-for-update', (event) => send('autoUpdater:checking-for-update:'));
	autoUpdater.on('update-downloaded', (event, ...args) => send('autoUpdater:update-downloaded', ...args));
	ipcMain.on('autoUpdater:quit-and-install', (event) => autoUpdater.quitAndInstall());
	ipcMain.on('autoUpdater:check-for-updates', (event) => autoUpdater.checkForUpdates());
	webContents.on('did-finish-load', () => {
		autoUpdater.setFeedURL(url);
		//autoUpdater.checkForUpdates();
	});
};

module.exports = {initialize};
