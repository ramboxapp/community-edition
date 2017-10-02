/**
 * Singleton class to handle the global unread counter.
 */
Ext.define('Rambox.util.IconLoader', {

	singleton: true,

	constructor: function(config) {

		config = config || {};

		/**
		 * Sets the icon for a specific service.
		 *
		 * @param {*} id				Id of the service
		 */
        this.loadServiceIconUrl = function (service, webview) {
            switch (service.type) {
                case 'slack':
                    webview.executeJavaScript("(()=>{let a=document.querySelector('.team_icon');if(!a){const d=document.querySelector('#team_menu');d&&(d.click(),a=document.querySelector('.team_icon'))}if(!a)return!1;const{style:{backgroundImage:b}}=a,c=document.createEvent('MouseEvents');return c.initEvent('mousedown',!0,!0),document.querySelector('.client_channels_list_container').dispatchEvent(c),b.slice(5,-2)})();",
                        false,
                        function (backgroundImage) {
                            if (backgroundImage) {
                                service.fireEvent('iconchange', service, backgroundImage, service.icon);
                            }
                        }
                    );
                    break;
            }
		};
	}
});
