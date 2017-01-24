/**
 * This file is loaded in the service web views to provide a Rambox API.
 */

const { ipcRenderer } = require('electron');

/**
 * Make the Rambox API available via a global "rambox" variable.
 *
 * @type {{}}
 */
window.rambox = {};

/**
 * Sets the unraed count of the tab.
 *
 * @param {*} count	The unread count
 */
window.rambox.setUnreadCount = function(count) {
	ipcRenderer.sendToHost('rambox.setUnreadCount', count);
};

/**
 * Clears the unread count.
 */
window.rambox.clearUnreadCount = function() {
	ipcRenderer.sendToHost('rambox.clearUnreadCount');
}

/**
 * Override to add notification click event to display Rambox window and activate service tab
 */
var NativeNotification = Notification;
Notification = function(title, options) {
	var notification = new NativeNotification(title, options);

	notification.addEventListener('click', function() {
		ipcRenderer.sendToHost('rambox.showWindowAndActivateTab');
	});

	return notification;
}

Notification.prototype = NativeNotification.prototype;
Notification.permission = NativeNotification.permission;
Notification.requestPermission = NativeNotification.requestPermission.bind(Notification);
