
/**
 * Singleton class for notification dispatching.
 */
Ext.define('Rambox.util.Notifier', {

	singleton: true,

	constructor(config) {

		config = config || {};

		/**
		 * Returns the notification text depending on the service type.
		 *
		 * @param view
		 * @param count
		 * @return {*}
		 */
		function getNotificationText(view, count) {
			let text;
			switch (Ext.getStore('ServicesList').getById(view.type).get('type')) {
				case 'messaging':
					text = 'You have ' + Ext.util.Format.plural(count, 'new message', 'new messages') + '.';
					break;
				case 'email':
					text = 'You have ' + Ext.util.Format.plural(count, 'new email', 'new emails') + '.';
					break;
				default:
					text = 'You have ' + Ext.util.Format.plural(count, 'new activity', 'new activities') + '.';
					break;
			}
			return text;
		}

		/**
		 * Dispatches a notification for a specific service.
		 *
		 * @param view				The view of the service
		 * @param {number} count	The unread count
		 */
		this.dispatchNotification = function(view, count) {
			const text = getNotificationText(view, count);

			const notification = new Notification(view.record.get('name'), {
				body: text,
				icon: view.icon,
				silent: view.record.get('muted')
			});

			notification.onclick = function(e) {
				view.showWindowAndActivateTab(e);
			};
		};
	}
});
