const path = require('path');
const electron = require('electron');
const app = electron.app;
// Module to create tray icon
const Tray = electron.Tray;

const MenuItem = electron.MenuItem;
let tray = null;

exports.create = win => {
	if (process.platform === 'darwin' || tray) {
		return;
	}

	const icon = process.platform === 'linux' || process.platform === 'darwin' ? 'IconTray.png' : 'Icon.ico';
	const iconPath = path.join(__dirname, `../resources/${icon}`);

	let showMB = new MenuItem({
		 label: 'Show Rambox'
		,position: '1'
		,visible: false
		,click(btn) {
			win.show();
			contextMenu.items[0].visible = false;
			contextMenu.items[1].visible = true;
		}
	});

	let hideMB = new MenuItem({
		 label: 'Minimize Rambox'
		,position: '2'
		,click(btn) {
			win.hide();
			contextMenu.items[1].visible = false;
			contextMenu.items[0].visible = true;
		}
	});

	const contextMenu = electron.Menu.buildFromTemplate([
		showMB,
		hideMB,
		{
			label: 'Preferences'
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

	tray = new Tray('../resources/IconTray.png');
	tray.setToolTip('Rambox');
	tray.setContextMenu(contextMenu);
	tray.on('click', function() {
		if ( win.isVisible() ) {
			win.hide();
			contextMenu.items[1].visible = false;
			contextMenu.items[0].visible = true;
		} else {
			win.show();
			contextMenu.items[0].visible = false;
			contextMenu.items[1].visible = true;
		}
	});

	win.on('hide', function() {
		contextMenu.items[1].visible = false;
		contextMenu.items[0].visible = true;
	});
};

exports.setBadge = shouldDisplayUnread => {
	if (process.platform === 'darwin' || !tray) {
		return;
	}

	let icon;
	if (process.platform === 'linux') {
		icon = shouldDisplayUnread ? 'IconTrayUnread.png' : 'IconTray.png';
	} else {
		icon = shouldDisplayUnread ? 'IconTrayUnread.ico' : 'Icon.ico';
	}

	const iconPath = path.join(__dirname, `../resources/${icon}`);
	tray.setImage(iconPath);
};
