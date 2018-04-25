const path = require('path');
const electron = require('electron');
const app = electron.app;
// Module to create tray icon
const Tray = electron.Tray;

const MenuItem = electron.MenuItem;
var appIcon = null;

exports.create = function(win, config) {
	if (process.platform === 'darwin' || appIcon || config.get('window_display_behavior') === 'show_taskbar' ) return;

	const icon = process.platform === 'linux' || process.platform === 'darwin' ? 'IconTray.png' : 'Icon.ico';
	const iconPath = path.join(__dirname, `../resources/${icon}`);

	const contextMenu = electron.Menu.buildFromTemplate([
		{
			 label: 'Show/Hide Window'
			,click() {
				win.webContents.executeJavaScript('ipc.send("toggleWin", false);');
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

	appIcon = new Tray(iconPath);
	appIcon.setToolTip('Rambox');
	appIcon.setContextMenu(contextMenu);

	switch (process.platform) {
		case 'darwin':
			break;
		case 'linux':
		case 'freebsd':
		case 'sunos':
			// Double click is not supported and Click its only supported when app indicator is not used.
			// Read more here (Platform limitations): https://github.com/electron/electron/blob/master/docs/api/tray.md
			appIcon.on('click', function() {
				win.webContents.executeJavaScript('ipc.send("toggleWin", true);');
			});
			break;
		case 'win32':
			appIcon.on('double-click', function() {
				win.webContents.executeJavaScript('ipc.send("toggleWin", true);');
			});
			break;
		default:
			break;
	}
};

exports.destroy = function() {
	if (appIcon) appIcon.destroy();
	appIcon = null;
};

exports.setBadge = function(messageCount, showUnreadTray) {
	if (process.platform === 'darwin' || !appIcon) return;

	let icon;
	if (process.platform === 'linux') {
		icon = messageCount > 0 && showUnreadTray ? 'IconTrayUnread.png' : 'IconTray.png';
	} else {
		icon = messageCount > 0 && showUnreadTray ? 'IconTrayUnread.ico' : 'Icon.ico';
	}

	const iconPath = path.join(__dirname, `../resources/${icon}`);
	appIcon.setImage(iconPath);
};
