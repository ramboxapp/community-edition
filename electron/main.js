'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
// Module for shell
const shell = require('electron').shell;
// Require for menu file
const appMenu = require('./menu');
// Require for tray file
const tray = require('./tray');

const MenuItem = electron.MenuItem;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let isQuitting = false;

function createWindow () {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		 title: 'Rambox'
		,skipTaskbar: true
		,icon: __dirname + '/../resources/Icon.png'
		,webPreferences: {
			 webSecurity: false
			,nodeIntegration: true
			,plugins: true
			,partition: 'persist:rambox'
		}
	});

	// Start maximize
	mainWindow.maximize();

	// and load the index.html of the app.
	mainWindow.loadURL('file://' + __dirname + '/../index.html');

	electron.Menu.setApplicationMenu(appMenu);

	tray.create(mainWindow);

	mainWindow.on('page-title-updated', (e, title) => updateBadge(title));

	// Emitted when the window is closed.
	mainWindow.on('close', function(e) {
		if ( !isQuitting ) {
			e.preventDefault();

			if (process.platform === 'darwin') {
				app.hide();
			} else {
				mainWindow.hide();
			}
		}
	});

	mainWindow.on('closed', function(e) {
		mainWindow = null;
	});
}

function updateBadge(title) {
	const messageCount = (/\(([0-9]+)\)/).exec(title);

	if (process.platform === 'darwin') {
		app.dock.setBadge(messageCount ? messageCount[1] : '');
	} else {
		tray.setBadge(messageCount);
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function () {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

app.on('before-quit', function () {
	isQuitting = true;
});
