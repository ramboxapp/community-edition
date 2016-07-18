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
// Window State Plugin
const windowStateKeeper = require('electron-window-state');


const MenuItem = electron.MenuItem;

// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
	// squirrel event handled and app will exit in 1000ms, so don't do anything else
	return;
}

function handleSquirrelEvent() {
	if (process.argv.length === 1) {
		return false;
	}

	const ChildProcess = require('child_process');
	const path = require('path');

	const appFolder = path.resolve(process.execPath, '..');
	const rootAtomFolder = path.resolve(appFolder, '..');
	const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
	const exeName = path.basename(process.execPath);

	const spawn = function(command, args) {
		let spawnedProcess, error;

		try {
			spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
		} catch (error) {}

		return spawnedProcess;
	};

	const spawnUpdate = function(args) {
		return spawn(updateDotExe, args);
	};

	const squirrelEvent = process.argv[1];
	switch (squirrelEvent) {
		case '--squirrel-install':
		case '--squirrel-updated':
		// Optionally do things such as:
		// - Add your .exe to the PATH
		// - Write to the registry for things like file associations and
		//   explorer context menus

		// Install desktop and start menu shortcuts
		spawnUpdate(['--createShortcut', exeName]);

		setTimeout(app.quit, 1000);
		return true;

		case '--squirrel-uninstall':
		// Undo anything you did in the --squirrel-install and
		// --squirrel-updated handlers

		// Remove desktop and start menu shortcuts
		spawnUpdate(['--removeShortcut', exeName]);

		setTimeout(app.quit, 1000);
		return true;

		case '--squirrel-obsolete':
		// This is called on the outgoing version of your app before
		// we update to the new version - it's the opposite of
		// --squirrel-updated

		app.quit();
		return true;
	}
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let isQuitting = false;

function createWindow () {
	// Load the previous state with fallback to defaults
	let mainWindowState = windowStateKeeper({
		 defaultWidth: 1000
		,defaultHeight: 800
		,maximize: true
	});
	// Create the browser window using the state information
	mainWindow = new BrowserWindow({
		 title: 'Rambox'
		,skipTaskbar: false
		,icon: __dirname + '/../resources/Icon.png'
		,x: mainWindowState.x
		,y: mainWindowState.y
		,width: mainWindowState.width
		,height: mainWindowState.height
		,webPreferences: {
			 webSecurity: false
			,nodeIntegration: true
			,plugins: true
			,partition: 'persist:rambox'
		}
	});

	// Let us register listeners on the window, so we can update the state
	// automatically (the listeners will be removed when the window is closed)
	// and restore the maximized or full screen state
	mainWindowState.manage(mainWindow);

	process.setMaxListeners(10000);

	// and load the index.html of the app.
	mainWindow.loadURL('file://' + __dirname + '/../index.html');

	electron.Menu.setApplicationMenu(appMenu);

	tray.create(mainWindow);

	mainWindow.on('page-title-updated', (e, title) => updateBadge(title));

	// Open links in default browser
	mainWindow.webContents.on('new-window', function(e, url, frameName, disposition, options) {
		if ( disposition !== 'foreground-tab' ) return;
		const protocol = require('url').parse(url).protocol;
		if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') {
			e.preventDefault();
			shell.openExternal(url);
		}
	});

	mainWindow.webContents.on('will-navigate', function(event, url) {
		event.preventDefault();
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

function updateBadge(title) {
	var messageCount = title.match(/\d+/g) ? parseInt(title.match(/\d+/g).join("")) : 0;

	if (process.platform === 'win32') {
		tray.setBadge(messageCount);
	}

	app.setBadgeCount(messageCount);
}

// Allow Custom sites with self certificates
app.commandLine.appendSwitch('ignore-certificate-errors');

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
