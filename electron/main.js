'use strict';

const {app, protocol, BrowserWindow, dialog, shell, Menu, ipcMain, nativeImage, session} = require('electron');
// Menu
const appMenu = require('./menu');
// Tray
const tray = require('./tray');
// AutoLaunch
var AutoLaunch = require('auto-launch');
// Configuration
const Config = require('electron-config');
// Development
const isDev = require('electron-is-dev');
// Updater
const updater = require('./updater');
// File System
var fs = require("fs");
const path = require('path');

// Initial Config
const config = new Config({
	 defaults: {
		 always_on_top: false
		,hide_menu_bar: false
		,skip_taskbar: true
		,auto_launch: !isDev
		,keep_in_taskbar_on_close: true
		,start_minimized: false
		,systemtray_indicator: true
		,master_password: false
		,proxy: false
		,proxyHost: ''
		,proxyPort: ''

		,x: undefined
		,y: undefined
		,width: 1000
		,height: 800
		,maximized: false
	}
});

// Configure AutoLaunch
const appLauncher = new AutoLaunch({
	 name: 'Rambox'
	,isHiddenOnLaunch: config.get('start_minimized')
});
config.get('auto_launch') && !isDev ? appLauncher.enable() : appLauncher.disable();

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
	// Create the browser window using the state information
	mainWindow = new BrowserWindow({
		 title: 'Rambox'
		,icon: __dirname + '/../resources/Icon.ico'
		,backgroundColor: '#FFF'
		,x: config.get('x')
		,y: config.get('y')
		,width: config.get('width')
		,height: config.get('height')
		,alwaysOnTop: config.get('always_on_top')
		,autoHideMenuBar: config.get('hide_menu_bar')
		,skipTaskbar: !config.get('skip_taskbar')
		,show: !config.get('start_minimized')
		,webPreferences: {
			 webSecurity: false
			,nodeIntegration: true
			,plugins: true
			,partition: 'persist:rambox'
		}
	});

	if ( !config.get('start_minimized') && config.get('maximized') ) mainWindow.maximize();

	process.setMaxListeners(10000);

	// Open the DevTools.
	if ( isDev ) mainWindow.webContents.openDevTools();

	// and load the index.html of the app.
	mainWindow.loadURL('file://' + __dirname + '/../index.html');

	Menu.setApplicationMenu(appMenu);

	tray.create(mainWindow, config);

	if ( fs.existsSync(path.resolve(path.dirname(process.execPath), '..', 'Update.exe')) ) updater.initialize(mainWindow);

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

	// BrowserWindow events
	mainWindow.on('page-title-updated', (e, title) => updateBadge(title));
	mainWindow.on('maximize', function(e) { config.set('maximized', true); });
	mainWindow.on('unmaximize', function(e) { config.set('maximized', false); });
	mainWindow.on('resize', function(e) { if (!mainWindow.isMaximized()) config.set(mainWindow.getBounds()); });
	mainWindow.on('move', function(e) { if (!mainWindow.isMaximized()) config.set(mainWindow.getBounds()); });
	mainWindow.on('app-command', (e, cmd) => {
		// Navigate the window back when the user hits their mouse back button
		if ( cmd === 'browser-backward' ) mainWindow.webContents.executeJavaScript('Ext.cq1("app-main").getActiveTab().goBack();');
		// Navigate the window forward when the user hits their mouse forward button
		if ( cmd === 'browser-forward' ) mainWindow.webContents.executeJavaScript('Ext.cq1("app-main").getActiveTab().goForward();');
	});
	mainWindow.on('focus', (e) => {
		// Make focus on current service when user use Alt + Tab to activate Rambox
		mainWindow.webContents.executeJavaScript('Ext.cq1("app-main").fireEvent("tabchange", Ext.cq1("app-main"), Ext.cq1("app-main").getActiveTab());');
	});
	// Emitted when the window is closed.
	mainWindow.on('close', function(e) {
		if ( !isQuitting ) {
			e.preventDefault();

			if (process.platform === 'darwin') {
				app.hide();
			} else {
				config.get('keep_in_taskbar_on_close') ? mainWindow.minimize() : mainWindow.hide();
			}
		}
	});
	mainWindow.on('closed', function(e) {
		mainWindow = null;
	});
}

let mainMasterPasswordWindow;
function createMasterPasswordWindow() {
	mainMasterPasswordWindow = new BrowserWindow({
		 backgroundColor: '#0675A0'
		,frame: false
	});
	mainMasterPasswordWindow.loadURL('file://' + __dirname + '/../masterpassword.html');
	mainMasterPasswordWindow.on('close', function() { mainMasterPasswordWindow = null });
}

function updateBadge(title) {
	var messageCount = title.match(/\d+/g) ? parseInt(title.match(/\d+/g).join("")) : 0;

	tray.setBadge(messageCount, config.get('systemtray_indicator'));

	if (process.platform === 'win32') { // Windows
		if (messageCount === 0) {
			mainWindow.setOverlayIcon(null, "");
			return;
		}

		mainWindow.webContents.send('setBadge', messageCount);
	} else { // macOS
		app.setBadgeCount(messageCount);
	}
}

ipcMain.on('setBadge', function(event, messageCount, value) {
	var img = nativeImage.createFromDataURL(value);
	mainWindow.setOverlayIcon(img, messageCount.toString());
});

ipcMain.on('getConfig', function(event, arg) {
	event.returnValue = config.store;
});

ipcMain.on('setConfig', function(event, values) {
	config.set(values);

	// hide_menu_bar
	mainWindow.setAutoHideMenuBar(values.hide_menu_bar);
	if ( !values.hide_menu_bar ) mainWindow.setMenuBarVisibility(true);
	// skip_taskbar
	mainWindow.setSkipTaskbar(!values.skip_taskbar);
	// always_on_top
	mainWindow.setAlwaysOnTop(values.always_on_top);
	// auto_launch
	values.auto_launch ? appLauncher.enable() : appLauncher.disable();
	// systemtray_indicator
	updateBadge(mainWindow.getTitle());
});

ipcMain.on('validateMasterPassword', function(event, pass) {
	if ( config.get('master_password') === require('crypto').createHash('md5').update(pass).digest('hex') ) {
		createWindow();
		mainMasterPasswordWindow.close();
		event.returnValue = true;
	}
	event.returnValue = false;
});

// Handle Service Notifications
ipcMain.on('setServiceNotifications', function(event, partition, op) {
	session.fromPartition(partition).setPermissionRequestHandler(function(webContents, permission, callback) {
		if (permission === 'notifications') return callback(op);
		callback(true)
	});
});

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
			,message: 'The service with the following URL has an invalid authority certification.\n\n'+url+'\n\nIf is a Custom Service, you have to remove it and add it again, enabling the "Trust invalid authority certificates" in the Options.'
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

// Hangouts
ipcMain.on('image:popup', function(event, url, partition) {
	let tmpWindow = new BrowserWindow({
		 width: mainWindow.getBounds().width
		,height: mainWindow.getBounds().height
		,parent: mainWindow
		,icon: __dirname + '/../resources/Icon.ico'
		,backgroundColor: '#FFF'
		,autoHideMenuBar: true
		,skipTaskbar: true
		,webPreferences: {
			partition: partition
		}
	});

	tmpWindow.maximize();

	tmpWindow.loadURL(url);
});

// Proxy
if ( config.get('proxy') ) app.commandLine.appendSwitch('proxy-server', config.get('proxyHost')+':'+config.get('proxyPort'));

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
	config.get('master_password') ? createMasterPasswordWindow() : createWindow();
});

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
	if (mainWindow === null && mainMasterPasswordWindow === null ) {
		config.get('master_password') ? createMasterPasswordWindow() : createWindow();
	}
});

app.on('before-quit', function () {
	isQuitting = true;
});
