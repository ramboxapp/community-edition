/**
 * This file is loaded in the service web views to provide a Hamsket API.
 */

const { ipcRenderer, remote } = require('electron');
const contextMenu = require('electron-context-menu');

/**
 * Make the Hamsket API available via a global "hamsket" variable.
 *
 * @type {{}}
 */
window.hamsket = {};

window.hamsket.locale = ipcRenderer.sendSync('getConfig').locale;

/**
 * Sets the unread count of the tab.
 *
 * @param {*} count	The unread count
 */
window.hamsket.setUnreadCount = function(count) {
	ipcRenderer.sendToHost('hamsket.setUnreadCount', count);
};

/**
 * Update the badge of the tab.
 * @param {*} direct
 * @param {*} indirect
 */
window.hamsket.updateBadge = function(direct, indirect = 0) {
	ipcRenderer.sendToHost('hamsket.updateBadge', direct, indirect);
};

/**
 * Clears the unread count.
 */
window.hamsket.clearUnreadCount = function() {
	ipcRenderer.sendToHost('hamsket.clearUnreadCount');
}

contextMenu({
	prepend: (defaultActions, params, browserWindow) => {
		let items = [];
		if (params.misspelledWord) {
			const suggestions = params.dictionarySuggestions;
			if (suggestions) {
				suggestions.forEach((suggestion) => {
					items.push({
						label: suggestion,
						visible:
							params.isEditable,
						click: () => {
							browserWindow.replaceMisspelling(suggestion);
						}
					});
				});
			}
		}
		return items;
	},
	window: remote.getCurrentWebContents(),
	showCopyImageAddress: true,
	showSaveImage: false,
	showSaveImageAs: true
});


/**
 * Override to add notification click event to display Hamsket window and activate service tab
 */
const NativeNotification = Notification;
Notification = function(title, options) {
	const notification = new NativeNotification(title, options);

	notification.addEventListener('click', function() {
		ipcRenderer.sendToHost('hamsket.showWindowAndActivateTab');
	});

	return notification;
};

Notification.prototype = NativeNotification.prototype;
Notification.permission = NativeNotification.permission;
Notification.requestPermission = NativeNotification.requestPermission.bind(Notification);

window.close = function() { location.href = location.origin };
