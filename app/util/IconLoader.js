/**
* Singleton class to handle the custom icons for special services.
*/
Ext.define('Rambox.util.IconLoader', {

	singleton: true,

	constructor: function(config) {

		config = config || {};

		/**
		* Sets the icon for a specific service.
		*
		* @param {*} service				Id of the service
		* @param {*} webview				Webview component of the service
		*/
		this.loadServiceIconUrl = function (service, webview) {
			switch (service.type) {
				case 'slack':
					webview.executeJavaScript("(a=>window.slackDebug.activeTeam.redux.getState().teams[a].icon.image_44)(window.slackDebug.activeTeamId);")
					.then(backgroundImage => {
						if (backgroundImage) {
							service.setTitle('<img src="'+service.icon+'" width="" style="background-color: white;border-radius: 50%;position: absolute;left: 18px;top: 17px;width: 12px;">'+service.title);
							service.fireEvent('iconchange', service, backgroundImage, service.icon);
						}
					}).catch(err => {
						console.log(err);
					})
					break;
				default:
					break;
		}
	};
}
});
