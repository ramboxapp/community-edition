'use strict';
const os = require('os');
const electron = require('electron');
const { systemPreferences } = require('electron')
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

module.exports = function(config) {
	const locale = require('../resources/languages/'+config.get('locale'));
	const helpSubmenu = [
		{
			label: `&`+locale['menu.help[0]'],
			click() {
				shell.openExternal('https://rambox.pro');
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
				shell.openExternal('https://github.com/ramboxapp/community-edition');
			}
		},
		{
			type: 'separator'
		},
		{
			label: '&'+locale['menu.help[1]'],
			click() {
				const body = `
	<!-- Please describe here your issue and steps to reproduce it. -->



	<!-- DON'T REMOVE THE FOLLOWING LINES -->
	-
	> ${app.getName()} ${app.getVersion()}
	> Electron ${process.versions.electron}
	> ${process.platform} ${process.arch} ${os.release()}`;

				shell.openExternal(`https://github.com/ramboxapp/community-edition/issues/new?body=${encodeURIComponent(body)}`);
			}
		},
		{
			label: `&Tools`,
			submenu: [
				{
					label: `&Clear Cache`,
					click(item, win) {
						win.webContents.session.clearCache()
						.then(() => {
							win.reload();
						}).catch(err => {
							console.log(err)
						})
					}
				},
				{
					label: `&Clear Local Storage`,
					click(item, win) {
						win.webContents.session.clearStorageData({
							storages: ['localstorage']
						}).then(() => {
							win.reload();
						}).catch(err => {
							console.log(err)
						})
					}
				}
			]
		},
		{
			type: 'separator'
		},
		{
			label: `&`+locale['menu.help[3]'],
			click() {
				shell.openExternal('https://rambox.app/donate.html');
			}
		}
	];

	let tpl = [
		{
			label: '&'+locale['menu.edit[0]'],
			submenu: [
				{
					 role: 'undo'
					,label: locale['menu.edit[1]']
				},
				{
					 role: 'redo'
					,label: locale['menu.edit[2]']
				},
				{
					type: 'separator'
				},
				{
					 role: 'cut'
					,label: locale['menu.edit[3]']
				},
				{
					 role: 'copy'
					,label: locale['menu.edit[4]']
				},
				{
					 role: 'paste'
					,label: locale['menu.edit[5]']
				},
				{
					role: 'pasteandmatchstyle'
				},
				{
					 role: 'selectall'
					,label: locale['menu.edit[6]']
				},
				{
					role: 'delete'
				}
			]
		},
		{
			label: '&'+locale['menu.view[0]'],
			submenu: [
				{
					label: '&'+locale['menu.view[1]'],
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
					label: '&Toggle Status Bar',
					click() {
						sendAction('toggleStatusBar');
					}
				},
				{
					type: 'separator'
				},
				{
					label: 'Zoom In',
					accelerator: 'Ctrl+Plus',
					click(item, win) { win.webContents.send('zoomin-webview')}
				},
				{
					label: 'Zoom Out',
					accelerator: 'Ctrl+-',
					click(item, win) { win.webContents.send('zoomout-webview')}
				},
				{
					label: 'Reset Zoom',
					accelerator: 'Ctrl+0',
					click(item, win) { win.webContents.send('resetzoom-webview')}
				}
			]
		},
		{
			label: '&'+locale['menu.window[0]'],
			role: 'window',
			submenu: [
				{
					label: '&'+locale['menu.window[1]'],
					accelerator: 'CmdOrCtrl+M',
					role: 'minimize'
				},
				{
					label: '&'+locale['menu.window[2]'],
					accelerator: 'CmdOrCtrl+W',
					role: 'close'
				},
				{
					type: 'separator'
				},
				{
					 role: 'togglefullscreen'
					,label: locale['menu.view[2]']
				},
				{
					label: '&'+locale['menu.view[3]'],
					accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
					click(item, focusedWindow) {
						if (focusedWindow) focusedWindow.webContents.toggleDevTools();
					}
				}
			]
		},
		{
			label: '&'+locale['menu.help[4]'],
			role: 'help'
		}
	];

	if ( process.platform === 'darwin' ) {
		tpl.unshift({
			label: appName,
			submenu: [
				{
					label: locale['preferences[0]'],
					click() {
						sendAction('showPreferences')
					}
				},
				{
					label: locale['menu.help[5]'],
					visible: process.argv.indexOf('--without-update') === -1,
					click(item, win) {
						const webContents = win.webContents;
						const send = webContents.send.bind(win.webContents);
						send('autoUpdater:check-update');
					}
				},
				{
					label: locale['menu.help[6]'],
					click() {
						sendAction('showAbout')
					}
				},
				{
					type: 'separator'
				},
				{
					label: locale['menu.osx[0]'],
					role: 'services',
					submenu: []
				},
				{
					type: 'separator'
				},
				{
					label: locale['menu.osx[1]'],
					accelerator: 'Command+H',
					role: 'hide'
				},
				{
					label: locale['menu.osx[2]'],
					accelerator: 'Command+Alt+H',
					role: 'hideothers'
				},
				{
					label: locale['menu.osx[3]'],
					role: 'unhide'
				},
				{
					type: 'separator'
				},
				{
					role: 'quit',
					label: locale['tray[1]']
				}
			]
		});
		helpSubmenu.push({
			type: 'separator'
		});
		helpSubmenu.push({
			label: 'Grant Microphone and Camera permissions',
			visible: systemPreferences.getMediaAccessStatus('microphone') !== 'granted' || systemPreferences.getMediaAccessStatus('camera') !== 'granted',
			click(item, win) {
				const webContents = win.webContents;
				const send = webContents.send.bind(win.webContents);
				send('grantPermissions');
			}
		});
	} else {
		tpl.unshift({
			label: '&'+locale['menu.file[0]'],
			submenu: [
				{
					label: locale['preferences[0]'],
					click() {
						sendAction('showPreferences')
					}
				},
				{
					type: 'separator'
				},
				{
					role: 'quit',
					label: locale['menu.file[1]']
				}
			]
		});
		helpSubmenu.push({
			type: 'separator'
		});
		helpSubmenu.push({
			label: `&`+locale['menu.help[5]'],
			visible: process.argv.indexOf('--without-update') === -1,
			click(item, win) {
				const webContents = win.webContents;
				const send = webContents.send.bind(win.webContents);
				send('autoUpdater:check-update');
			}
		});
		helpSubmenu.push({
			label: `&`+locale['menu.help[6]'],
			click() {
				sendAction('showAbout')
			}
		});
	}

	tpl[tpl.length - 1].submenu = helpSubmenu;

	return electron.Menu.buildFromTemplate(tpl);
};
