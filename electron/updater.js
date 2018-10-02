const {app, ipcMain} = require('electron');
const { autoUpdater } = require("electron-updater");
const path = require('path');

// autoUpdater.logger = require("electron-log");
// autoUpdater.logger.transports.file.level = "debug";
// autoUpdater.currentVersion = '0.6.0';
// autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');

const initialize = (window) => {
	const webContents = window.webContents;
	const send = webContents.send.bind(window.webContents);
	autoUpdater.on('checking-for-update', (event) => send('autoUpdater:checking-for-update'));
	autoUpdater.on('update-downloaded', (event, ...args) => send('autoUpdater:update-downloaded', ...args));
	ipcMain.on('autoUpdater:quit-and-install', (event) => autoUpdater.quitAndInstall());
	ipcMain.on('autoUpdater:check-for-updates', (event) => autoUpdater.checkForUpdates());
};

module.exports = {initialize};
