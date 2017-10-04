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
					webview.executeJavaScript(
						"(()=>{let a=document.querySelector('.team_icon');if(!a){const d=document.querySelector('#team_menu');d&&(d.click(),a=document.querySelector('.team_icon'))}if(!a)return!1;const{style:{backgroundImage:b}}=a,c=document.createEvent('MouseEvents');return c.initEvent('mousedown',!0,!0),document.querySelector('.client_channels_list_container').dispatchEvent(c),b.slice(5,-2)})();",
						false,
						function (backgroundImage) {
							if (backgroundImage) {
								service.setTitle('<img src="'+service.icon+'" width="" style="background-color: white;border-radius: 50%;position: absolute;margin-left: -12px;margin-top: 17px;width: 12px;">'+service.title);
								service.fireEvent('iconchange', service, backgroundImage, service.icon);
							}
						}
					);
					break;
				default:
					break;
		}
	};
}
});
