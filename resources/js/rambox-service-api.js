/**
 * This file is loaded in the service web views to provide a Rambox API.
 */

const { ipcRenderer } = require('electron');
const { MenuItem } = require('electron').remote;
const { ContextMenuBuilder, ContextMenuListener } = require('electron-contextmenu-wrapper');

/**
 * Make the Rambox API available via a global "rambox" variable.
 *
 * @type {{}}
 */
window.rambox = {};

window.rambox.locale = ipcRenderer.sendSync('getConfig').locale;

/**
 * Sets the unread count of the tab.
 *
 * @param {*} count	The unread count
 */
window.rambox.setUnreadCount = function(count) {
	ipcRenderer.sendToHost('rambox.setUnreadCount', count);
};

/**
 * Update the badge of the tab.
 * @param {*} direct
 * @param {*} indirect
 */
window.rambox.updateBadge = function(direct, indirect = 0) {
	ipcRenderer.sendToHost('rambox.updateBadge', direct, indirect);
};

/**
 * Clears the unread count.
 */
window.rambox.clearUnreadCount = function() {
	ipcRenderer.sendToHost('rambox.clearUnreadCount');
}

window.rambox.contextMenuBuilder = new ContextMenuBuilder();
window.rambox.contextMenuListener = new ContextMenuListener(function(event, info) { 
	window.rambox.contextMenuBuilder.showPopupMenu(info);
});


/**
 * Override to add notification click event to display Rambox window and activate service tab
 */
const NativeNotification = Notification;
Notification = function(title, options) {
	const notification = new NativeNotification(title, options);

	notification.addEventListener('click', function() {
		ipcRenderer.sendToHost('rambox.showWindowAndActivateTab');
	});

	return notification;
};

Notification.prototype = NativeNotification.prototype;
Notification.permission = NativeNotification.permission;
Notification.requestPermission = NativeNotification.requestPermission.bind(Notification);

window.close = function() { location.href = location.origin };
