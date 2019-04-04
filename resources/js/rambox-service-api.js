/**
 * This file is loaded in the service web views to provide a Rambox API.
 */

const { ipcRenderer } = require('electron');
const { ContextMenuBuilder, ContextMenuListener } = require('electron-contextmenu-wrapper');

/**
 * Make the Rambox API available via a global "rambox" variable.
 *
 * @type {{}}
 */
window.rambox = {};

/**
 * Sets the unread count of the tab.
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

	//It seems that gmail is checking if such event handler func are available. Just remplacing them by a void function that is always returning true is making the thing right!
	notification.addEventListener = function() {return true};
	notification.attachEvent = function() {return true};
	notification.addListener = function() {return true};

	return notification;
}

Notification.prototype = NativeNotification.prototype;
Notification.permission = NativeNotification.permission;
Notification.requestPermission = NativeNotification.requestPermission.bind(Notification);

window.rambox.contextMenuBuilder = new ContextMenuBuilder();
window.rambox.contextMenuListener = new ContextMenuListener(function(event, info) {
	window.rambox.contextMenuBuilder.showPopupMenu(info);
});
