const {app, ipcMain} = require('electron');
const { autoUpdater } = require("electron-updater");
const version = app.getVersion();

const initialize = (window) => {
	const webContents = window.webContents;
	const send = webContents.send.bind(window.webContents);
	autoUpdater.on('checking-for-update', (event) => send('autoUpdater:checking-for-update:'));
	autoUpdater.on('update-downloaded', (event, ...args) => send('autoUpdater:update-downloaded', ...args));
	ipcMain.on('autoUpdater:quit-and-install', (event) => autoUpdater.quitAndInstall());
	ipcMain.on('autoUpdater:check-for-updates', (event) => autoUpdater.checkForUpdates());
};

module.exports = {initialize};
