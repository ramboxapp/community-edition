const path = require('path');
const electron = require('electron');
const app = electron.app;
// Module to create tray icon
const Tray = electron.Tray;

const MenuItem = electron.MenuItem;
var appIcon = null;

exports.create = win => {
	if (process.platform === 'darwin' || appIcon) {
		return;
	}

	const icon = process.platform === 'linux' || process.platform === 'darwin' ? 'IconTray.png' : 'Icon.ico';
	const iconPath = path.join(__dirname, `../resources/${icon}`);

	const toggleWin = () => {
		if (win.isVisible()) {
			win.hide();
		} else {
			win.show();
		}
	};

	const contextMenu = electron.Menu.buildFromTemplate([
		{
			 label: 'Show/Hide Window'
			,click() {
				toggleWin();
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
	appIcon.on('double-click', () => {
		win.show();
	});
};

exports.setBadge = shouldDisplayUnread => {
	if (process.platform === 'darwin' || !appIcon) {
		return;
	}

	let icon;
	if (process.platform === 'linux') {
		icon = shouldDisplayUnread ? 'IconTrayUnread.png' : 'IconTray.png';
	} else {
		icon = shouldDisplayUnread ? 'IconTrayUnread.ico' : 'Icon.ico';
	}

	const iconPath = path.join(__dirname, `../resources/${icon}`);
	appIcon.setImage(iconPath);
};
