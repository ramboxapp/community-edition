/**
* Singleton class to handle the custom icons for special services.
*/
Ext.define('Hamsket.util.IconLoader', {

	singleton: true,

	constructor(config) {

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
					setTimeout( () =>
						webview.executeJavaScript(
						`(() => {
							let icon = document.querySelector('.c-team_icon');
							if (!icon) {
								const doc = document.querySelector('.p-ia__sidebar_header__button') || document.querySelector('#team-menu-trigger');
								if (doc) {
									doc.click();
									icon = document.querySelector('.c-team_icon');
									doc.click();
								}
							}
							if (!icon) return false;
							const {
								style: {
									backgroundImage: bg
								}
							} = icon;
							return bg.slice(5, -2);
						})();`).then(function (backgroundImage) {
							if (backgroundImage) {
								service.setTitle(`<img src="${backgroundImage}" width="" style="background-color: white;border-radius: 50%;position: absolute;left: 18px;top: 17px;width: 12px;">${Ext.String.htmlEncode(service.title)}`);
								service.fireEvent('iconchange', service, backgroundImage, service.icon);
							}
							return true;
						}
					).finally({}), 1000);
					break;
				default:
					break;
		}
	};
}
});
