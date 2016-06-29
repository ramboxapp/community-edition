Ext.define('Rambox.Application', {
	 extend: 'Ext.app.Application'

	,name: 'Rambox'

	,stores: [
		 'ServicesList'
		,'Services'
	]

	,config: {
		 totalServicesLoaded: 0
		,totalNotifications: 0
	}

	,launch: function () {
		lock = new Auth0Lock('y9am0DVawe2tvlA3ucD7OufpJHZZMjsO', 'rambox.auth0.com');
		auth0 = new Auth0({ domain : 'rambox.auth0.com', clientID: 'y9am0DVawe2tvlA3ucD7OufpJHZZMjsO'})

		// Add shortcuts to switch services using CTRL + Number
		var map = new Ext.util.KeyMap({
			 target: document
			,key: "0123456789"
			,ctrl: true
			,fn: function(key) {
				Ext.cq1('app-main').setActiveTab(key - 48);
			}
		});
	}

	,updateTotalNotifications: function( newValue, oldValue ) {
		newValue = parseInt(newValue);
		if ( newValue > 0 )	{
			document.title = 'Rambox (' + newValue + ')';
		} else {
			document.title = 'Rambox';
		}
	}
});
