'use strict';
const os = require('os');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const shell = electron.shell;
const appName = app.getName();
// AutoLaunch
var AutoLaunch = require('auto-launch');
// Global Settings
var globalSettings = require('./global_settings.js');

// Configure AutoLaunch
const appLauncher = new AutoLaunch({
	name: 'Rambox'
});
appLauncher.isEnabled().then(function(enabled){
	if(enabled) return;
	return appLauncher.enable();
}).then(function(err){

});

function sendAction(action) {
	const win = BrowserWindow.getAllWindows()[0];

	if (process.platform === 'darwin') {
		win.restore();
	}

	win.webContents.send(action);
}

const helpSubmenu = [
	{
		label: `Visit ${appName} Website`,
		click() {
			shell.openExternal('http://rambox.pro');
		}
	},
	{
		label: `Facebook`,
		click() {
			shell.openExternal('https://www.facebook.com/ramboxapp');
		}
	},
	{
		label: `Twitter`,
		click() {
			shell.openExternal('https://www.twitter.com/ramboxapp');
		}
	},
	{
		label: `GitHub`,
		click() {
			shell.openExternal('https://www.github.com/saenzramiro/rambox');
		}
	},
	{
		type: 'separator'
	},
	{
		label: 'Report an Issue...',
		click() {
			const body = `
<!-- Please describe here your issue and steps to reproduce it. -->



<!-- DON'T REMOVE THE FOLLOWING LINES -->
-
> ${app.getName()} ${app.getVersion()}
> Electron ${process.versions.electron}
> ${process.platform} ${process.arch} ${os.release()}`;

			shell.openExternal(`https://github.com/saenzramiro/rambox/issues/new?body=${encodeURIComponent(body)}`);
		}
	},
	{
		label: `Ask for Help`,
		click() {
			shell.openExternal('https://gitter.im/saenzramiro/rambox');
		}
	},
	{
		type: 'separator'
	},
	{
		label: `Donate`,
		click() {
			shell.openExternal('https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=WU75QWS7LH2CA');
		}
	}
];

let tpl = [
	{
		label: 'Edit',
		submenu: [
			{
				label: 'Undo',
				accelerator: 'CmdOrCtrl+Z',
				role: 'undo'
			},
			{
				label: 'Redo',
				accelerator: 'Shift+CmdOrCtrl+Z',
				role: 'redo'
			},
			{
				type: 'separator'
			},
			{
				label: 'Cut',
				accelerator: 'CmdOrCtrl+X',
				role: 'cut'
			},
			{
				label: 'Copy',
				accelerator: 'CmdOrCtrl+C',
				role: 'copy'
			},
			{
				label: 'Paste',
				accelerator: 'CmdOrCtrl+V',
				role: 'paste'
			},
			{
				label: 'Select All',
				accelerator: 'CmdOrCtrl+A',
				role: 'selectall'
			},
		]
	},
	{
		label: 'View',
		submenu: [
			{
				label: 'Reload',
				accelerator: 'CmdOrCtrl+R',
				click(item, focusedWindow) {
					if (focusedWindow) focusedWindow.reload();
				}
			},
			{
				label: 'Toggle Full Screen',
				accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
				click(item, focusedWindow) {
					if (focusedWindow)
					focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
				}
			},
			{
				label: 'Toggle Developer Tools',
				accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
				click(item, focusedWindow) {
					if (focusedWindow)
					focusedWindow.webContents.toggleDevTools();
				}
			},
		]
	},
	{
		label: 'Window',
		role: 'window',
		submenu: [
			{
				label: 'Minimize',
				accelerator: 'CmdOrCtrl+M',
				role: 'minimize'
			},
			{
				label: 'Close',
				accelerator: 'CmdOrCtrl+W',
				role: 'close'
			},
			{
				type: 'separator'
			},
			{
				label: 'Always on top',
				type: 'checkbox',
				checked: parseInt(globalSettings.get('always_on_top')) ? true : false,
				click: function(item, mainWindow) {
					if ( item.checked ) {
						globalSettings.set('always_on_top', 1);
						if (mainWindow) mainWindow.setAlwaysOnTop(true);
					} else {
						globalSettings.set('always_on_top', 0);
						mainWindow.setAlwaysOnTop(false);
					}
					globalSettings.save();
				}
			}
		]
	},
	{
		label: 'Help',
		role: 'help'
	}
];

let preferences = [
	{
		label: 'Auto-hide Menu bar',
		visible: process.platform === 'win32',
		type: 'checkbox',
		checked: parseInt(globalSettings.get('hide_menu_bar')) ? true : false,
		click: function(item, mainWindow) {
			if ( item.checked ) {
				electron.dialog.showMessageBox(mainWindow, {
					 title: 'Don\'t need to see the menu bar all the time?'
					,message: 'To temporarily show the menu bar, just press the Alt key.'
					,buttons: ['OK']
					,type: 'info'
				}, function() {
					mainWindow.focus();
				});
				globalSettings.set('hide_menu_bar', 1);
				if (mainWindow) mainWindow.setAutoHideMenuBar(true);
			} else {
				globalSettings.set('hide_menu_bar', 0);
				mainWindow.setAutoHideMenuBar(false);
			}
			globalSettings.save();
		}
	},
	{
		label: 'Show in Taskbar',
		type: 'checkbox',
		checked: parseInt(globalSettings.get('skip_taskbar')) ? false : true,
		click: function(item, mainWindow) {
			if ( item.checked ) {
				globalSettings.set('skip_taskbar', 0);
				globalSettings.set('keep_in_taskbar_on_close', 1);
				menu.items[0].submenu.items[process.platform === 'darwin' ? 2 : 0].submenu.items[2].enabled = true;
				menu.items[0].submenu.items[process.platform === 'darwin' ? 2 : 0].submenu.items[2].checked = true;
				if (mainWindow) mainWindow.setSkipTaskbar(false);
			} else {
				globalSettings.set('skip_taskbar', 1);
				globalSettings.set('keep_in_taskbar_on_close', 0);
				menu.items[0].submenu.items[process.platform === 'darwin' ? 2 : 0].submenu.items[2].enabled = false;
				menu.items[0].submenu.items[process.platform === 'darwin' ? 2 : 0].submenu.items[2].checked = false;
				mainWindow.setSkipTaskbar(true);
			}
			globalSettings.save();
		}
	},
	{
		label: 'Keep Rambox in the taskbar when close it',
		type: 'checkbox',
		enabled: parseInt(globalSettings.get('skip_taskbar')) ? false : true,
		checked: parseInt(globalSettings.get('keep_in_taskbar_on_close')) ? true : false,
		click: function(item) {
			if ( item.checked ) {
				globalSettings.set('keep_in_taskbar_on_close', 1);
			} else {
				globalSettings.set('keep_in_taskbar_on_close', 0);
			}
			globalSettings.save();
		}
	},
	{
		label: 'Always on top',
		type: 'checkbox',
		checked: parseInt(globalSettings.get('always_on_top')) ? true : false,
		click: function(item, mainWindow) {
			if ( item.checked ) {
				globalSettings.set('always_on_top', 1);
				if (mainWindow) mainWindow.setAlwaysOnTop(true);
			} else {
				globalSettings.set('always_on_top', 0);
				mainWindow.setAlwaysOnTop(false);
			}
			globalSettings.save();
		}
	},
	{
		label: 'Start minimized',
		type: 'checkbox',
		checked: parseInt(globalSettings.get('start_minimized')) ? true : false,
		click: function(item) {
			if ( item.checked ) {
				globalSettings.set('start_minimized', 1);
			} else {
				globalSettings.set('start_minimized', 0);
			}
			globalSettings.save();
		}
	},
	{
		label: 'Start automatically on system startup',
		type: 'checkbox',
		checked: parseInt(globalSettings.get('auto_launch')) ? true : false,
		click: function(item) {
			if ( item.checked ) {
				appLauncher.enable();
				globalSettings.set('auto_launch', 1);
			} else {
				appLauncher.disable();
				globalSettings.set('auto_launch', 0);
			}
			globalSettings.save();
		}
	}
];

if (process.platform === 'darwin') {
	tpl.unshift({
		label: appName,
		submenu: [
			{
				label: `Check for updates...`,
				click(item, win) {
					const webContents = win.webContents;
					const send = webContents.send.bind(win.webContents);
					send('autoUpdater:check-update');
				}
			},
			{
				label: `About ${appName}`,
				click() {
					sendAction('showAbout')
				}
			},
			{
				type: 'separator'
			},
			{
				label: 'Preferences',
				submenu: preferences
			},
			{
				type: 'separator'
			},
			{
				label: 'Services',
				role: 'services',
				submenu: []
			},
			{
				type: 'separator'
			},
			{
				label: `Hide ${appName}`,
				accelerator: 'Command+H',
				role: 'hide'
			},
			{
				label: 'Hide Others',
				accelerator: 'Command+Alt+H',
				role: 'hideothers'
			},
			{
				label: 'Show All',
				role: 'unhide'
			},
			{
				type: 'separator'
			},
			{
				label: `Quit ${appName}`,
				accelerator: 'Cmd+Q',
				click() {
					app.quit();
				}
			}
		]
	});
} else {
	tpl.unshift({
		label: 'File',
		submenu: [
			{
				label: 'Preferences',
				submenu: preferences
			},
			{
				type: 'separator'
			},
			{
				label: `Quit ${appName}`,
				accelerator: 'Cmd+Q',
				click() {
					app.quit();
				}
			}
		]
	});
	helpSubmenu.push({
		type: 'separator'
	});
	helpSubmenu.push({
		label: `Check for updates...`,
		click(item, win) {
			const webContents = win.webContents;
			const send = webContents.send.bind(win.webContents);
			if ( process.platform === 'win32' ) {
				electron.autoUpdater.checkForUpdates();
				electron.autoUpdater.once('update-available', (event) => send('autoUpdater:update-available'));
				electron.autoUpdater.once('update-not-available', (event) => send('autoUpdater:update-not-available'));
			} else {
				send('autoUpdater:check-update');
			}
		}
	});
	helpSubmenu.push({
		label: `About ${appName}`,
		click() {
			sendAction('showAbout')
		}
	});
}

tpl[tpl.length - 1].submenu = helpSubmenu;

var menu = electron.Menu.buildFromTemplate(tpl);
module.exports = menu;
