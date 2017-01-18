'use strict';
const os = require('os');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const shell = electron.shell;
const appName = app.getName();

function sendAction(action) {
	const win = BrowserWindow.getAllWindows()[0];

	if (process.platform === 'darwin') {
		win.restore();
	}

	win.webContents.send(action);
}

const helpSubmenu = [
	{
		label: `&Visit ${appName} Website`,
		click() {
			shell.openExternal('http://rambox.pro');
		}
	},
	{
		label: `&Facebook`,
		click() {
			shell.openExternal('https://www.facebook.com/ramboxapp');
		}
	},
	{
		label: `&Twitter`,
		click() {
			shell.openExternal('https://www.twitter.com/ramboxapp');
		}
	},
	{
		label: `&GitHub`,
		click() {
			shell.openExternal('https://www.github.com/saenzramiro/rambox');
		}
	},
	{
		type: 'separator'
	},
	{
		label: '&Report an Issue...',
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
		label: `&Ask for Help`,
		click() {
			shell.openExternal('https://gitter.im/saenzramiro/rambox');
		}
	},
	{
		label: `&Tools`,
		submenu: [
			{
				label: `&Clear Cache`,
				click(item, win) {
					win.webContents.session.clearCache(function() {
						win.reload();
					});
				}
			},
			{
				label: `&Clear Local Storage`,
				click(item, win) {
					win.webContents.session.clearStorageData({
						storages: ['localstorage']
					}, function() {
						win.reload();
					});
				}
			}
		]
	},
	{
		type: 'separator'
	},
	{
		label: `&Donate`,
		click() {
			shell.openExternal('https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=WU75QWS7LH2CA');
		}
	}
];

let tpl = [
	{
		label: '&Edit',
		submenu: [
			{
				role: 'undo'
			},
			{
				role: 'redo'
			},
			{
				type: 'separator'
			},
			{
				role: 'cut'
			},
			{
				role: 'copy'
			},
			{
				role: 'paste'
			},
			{
				role: 'pasteandmatchstyle'
			},
			{
				role: 'selectall'
			},
			{
				role: 'delete'
			}
		]
	},
	{
		label: '&View',
		submenu: [
			{
				label: '&Reload',
				accelerator: 'CmdOrCtrl+R',
				click(item, focusedWindow) {
					if (focusedWindow) focusedWindow.reload();
				}
			},
			{
				label: '&Reload current Service',
				accelerator: 'CmdOrCtrl+Shift+R',
				click() {
					sendAction('reloadCurrentService');
				}
			},
			{
				type: 'separator'
			},
			{
				role: 'zoomin'
			},
			{
				role: 'zoomout'
			},
			{
				role: 'resetzoom'
			}
		]
	},
	{
		label: '&Window',
		role: 'window',
		submenu: [
			{
				label: '&Minimize',
				accelerator: 'CmdOrCtrl+M',
				role: 'minimize'
			},
			{
				label: '&Close',
				accelerator: 'CmdOrCtrl+W',
				role: 'close'
			},
			{
				type: 'separator'
			},
			{
				role: 'togglefullscreen'
			},
			{
				label: '&Toggle Developer Tools',
				accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
				click(item, focusedWindow) {
					if (focusedWindow) focusedWindow.webContents.toggleDevTools();
				}
			}
		]
	},
	{
		label: '&Help',
		role: 'help'
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
				role: 'quit'
			}
		]
	});
} else {
	tpl.unshift({
		label: '&File',
		submenu: [
			{
				role: 'quit'
			}
		]
	});
	helpSubmenu.push({
		type: 'separator'
	});
	helpSubmenu.push({
		label: `&Check for updates...`,
		click(item, win) {
			const webContents = win.webContents;
			const send = webContents.send.bind(win.webContents);
			send('autoUpdater:check-update');
		}
	});
	helpSubmenu.push({
		label: `&About ${appName}`,
		click() {
			sendAction('showAbout')
		}
	});
}

tpl[tpl.length - 1].submenu = helpSubmenu;

var menu = electron.Menu.buildFromTemplate(tpl);
module.exports = menu;
