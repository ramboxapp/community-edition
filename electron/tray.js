const path = require('path');
const electron = require('electron');
const app = electron.app;
// Module to create tray icon
const Tray = electron.Tray;

const MenuItem = electron.MenuItem;
var appIcon = null;

exports.create = function(win, config) {
	if (process.platform === 'darwin' || appIcon) {
		return;
	}

	const icon = process.platform === 'linux' || process.platform === 'darwin' ? 'IconTray.png' : 'Icon.ico';
	const iconPath = path.join(__dirname, `../resources/${icon}`);

	const toggleWin = () => {
		if ( !config.get('keep_in_taskbar_on_close') ) {
			if ( win.isVisible() ) {
				win.hide();
			} else {
				config.get('maximized') ? win.maximize() : win.show();
			}
		} else {
			if ( win.isVisible() && !win.isMinimized() ) {
				win.minimize();
			} else {
				config.get('maximized') ? win.maximize() : win.show();
			}
		}
	};

	const contextMenu = electron.Menu.buildFromTemplate([
		{
			 label: 'Show/Hide Window'
			,click: toggleWin
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
	appIcon.on('double-click', () => {
		win.isVisible() && config.get('maximized') ? win.maximize() : win.show();
	});
};

exports.setBadge = function(messageCount, showUnreadTray) {
	if (process.platform === 'darwin' || !appIcon) return;

	let icon;
	if (process.platform === 'linux') {
		icon = messageCount && showUnreadTray ? 'IconTrayUnread.png' : 'IconTray.png';
	} else {
		icon = messageCount && showUnreadTray ? 'IconTrayUnread.ico' : 'Icon.ico';
	}

	const iconPath = path.join(__dirname, `../resources/${icon}`);
	appIcon.setImage(iconPath);
};
