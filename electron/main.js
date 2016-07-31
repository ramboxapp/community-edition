'use strict';

const {app, protocol, BrowserWindow, dialog, shell, Menu, ipcMain} = require('electron');
// Menu
const appMenu = require('./menu');
// Tray
const tray = require('./tray');
// Window State Plugin
const windowStateKeeper = require('electron-window-state');
// Global Settings
var globalSettings = require('./global_settings.js');

const isDev = require('electron-is-dev');
const updater = require('./updater');

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
		,maximize: false
	});

	// Create the browser window using the state information
	mainWindow = new BrowserWindow({
		 title: 'Rambox'
		,icon: __dirname + '/../resources/Icon.png'
		,x: mainWindowState.x
		,y: mainWindowState.y
		,width: mainWindowState.width
		,height: mainWindowState.height
		,backgroundColor: '#2E658E'
		,alwaysOnTop: parseInt(globalSettings.get('always_on_top')) ? true : false
		,autoHideMenuBar: parseInt(globalSettings.get('hide_menu_bar')) ? true : false
		,skipTaskbar: parseInt(globalSettings.get('skip_taskbar')) ? true : false
		,show: parseInt(globalSettings.get('start_minimized')) ? false : true
		,webPreferences: {
			 webSecurity: false
			,nodeIntegration: true
			,plugins: true
			,partition: 'persist:rambox'
		}
	});

	if ( !parseInt(globalSettings.get('start_minimized')) && mainWindowState.isMaximized ) mainWindow.maximize();

	// Let us register listeners on the window, so we can update the state
	// automatically (the listeners will be removed when the window is closed)
	// and restore the maximized or full screen state
	mainWindowState.manage(mainWindow);

	process.setMaxListeners(10000);

	// and load the index.html of the app.
	mainWindow.loadURL('file://' + __dirname + '/../index.html');

	Menu.setApplicationMenu(appMenu);

	tray.create(mainWindow, mainWindowState);

	if ( !isDev && process.platform === 'win32' ) updater.initialize(mainWindow);

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
				parseInt(globalSettings.get('keep_in_taskbar_on_close')) ? mainWindow.minimize() : mainWindow.hide();
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

const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
	// Someone tried to run a second instance, we should focus our window.
	if (mainWindow) {
		if (mainWindow.isMinimized()) mainWindow.restore();
		mainWindow.focus();
	}
});

if (shouldQuit) {
	app.quit();
	return;
}

var allowedURLCertificates = [];
ipcMain.on('allowCertificate', (event, url) => {
	allowedURLCertificates.push(require('url').parse(url).host);
});
app.on('certificate-error', function(event, webContents, url, error, certificate, callback) {
	if ( allowedURLCertificates.indexOf(require('url').parse(url).host) >= 0 ) {
		event.preventDefault();
		callback(true);
	} else {
		callback(false);
		dialog.showMessageBox(mainWindow, {
			 title: 'Certification Error'
			,message: 'The service with the following URL has an invalid authority certification.\n\n'+url+'\n\nYou have to remove the service and add it again, enabling the "Trust invalid authority certificates" in the Options.'
			,buttons: ['OK']
			,type: 'error'
		}, function() {

		});
	}
});


// Code for downloading images as temporal files
// Credit: Ghetto Skype (https://github.com/stanfieldr/ghetto-skype)
const tmp = require('tmp');
const mime = require('mime');
var imageCache = {};
ipcMain.on('image:download', function(event, url, partition) {
	let file = imageCache[url];
	if (file) {
		if (file.complete) {
			shell.openItem(file.path);
		}

		// Pending downloads intentionally do not proceed
		return;
	}

	let tmpWindow = new BrowserWindow({
		 show: false
		,webPreferences: {
			partition: partition
		}
	});

	tmpWindow.webContents.session.once('will-download', (event, downloadItem) => {
		imageCache[url] = file = {
			 path: tmp.tmpNameSync() + '.' + mime.extension(downloadItem.getMimeType())
			,complete: false
		};

		downloadItem.setSavePath(file.path);
		downloadItem.once('done', () => {
			tmpWindow.destroy();
			tmpWindow = null;
			shell.openItem(file.path);
			file.complete = true;
		});
	});

	tmpWindow.webContents.downloadURL(url);
});

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
