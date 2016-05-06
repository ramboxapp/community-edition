'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
// Module to create tray icon
const Tray = electron.Tray;
// Module for shell
const shell = require('electron').shell;

const MenuItem = electron.MenuItem;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let isQuitting = false;
let tray = null;

let showMB = new MenuItem({
	 label: 'Show Rambox'
	,position: '1'
	,visible: false
	,click(btn) {
		mainWindow.show();
		contextMenu.items[0].visible = false;
		contextMenu.items[1].visible = true;
	}
});

let hideMB = new MenuItem({
	 label: 'Minimize Rambox'
	,position: '2'
	,click(btn) {
		mainWindow.hide();
		contextMenu.items[1].visible = false;
		contextMenu.items[0].visible = true;
	}
});

const contextMenu = electron.Menu.buildFromTemplate([
	showMB,
	hideMB,
	{
		label: 'Preferences'
	},
	{
		 label: 'Open Developer Console'
		,click() {
			mainWindow.webContents.openDevTools();
		}
	},
	{
		type: 'separator'
	},
	{
		 label: 'Quit'
		,click() {
			app.quit();
		}
	}
]);

function createWindow () {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		 title: 'Rambox'
		,skipTaskbar: false
		,icon: __dirname + '/resources/logo_256.png'
		,autoHideMenuBar: true
		,webPreferences: {
			 webSecurity: false
			,partition: 'trusted*'
			,nodeIntegration: true
			,plugins: true
			,partition: 'persist:rambox'
		}
	});

	// Start maximize
	mainWindow.maximize();

	// and load the index.html of the app.
	mainWindow.loadURL('file://' + __dirname + '/index.html');

	tray = new Tray(__dirname + '/resources/logo_256.png');
	tray.setToolTip('Rambox');
	tray.setContextMenu(contextMenu);
	tray.on('click', function() {
		if ( mainWindow.isVisible() ) {
			mainWindow.hide();
			contextMenu.items[1].visible = false;
			contextMenu.items[0].visible = true;
		} else {
			mainWindow.show();
			contextMenu.items[0].visible = false;
			contextMenu.items[1].visible = true;
		}
	});

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
