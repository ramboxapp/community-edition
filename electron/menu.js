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
			}
		]
	},
	{
		label: 'Help',
		role: 'help'
	}
];

if (process.platform === 'darwin') {
	tpl.unshift({
		label: appName,
		submenu: [
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
		label: `About ${appName}`,
		click() {
			sendAction('showAbout')
		}
	});
}

tpl[tpl.length - 1].submenu = helpSubmenu;

module.exports = electron.Menu.buildFromTemplate(tpl);
