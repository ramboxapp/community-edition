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
