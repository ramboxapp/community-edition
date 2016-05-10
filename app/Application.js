Ext.define('Rambox.Application', {
	 extend: 'Ext.app.Application'

	,name: 'Rambox'

	,stores: [
		 'ServicesList'
		,'Services'
	]

	,config: {
		totalServicesLoaded: 0
	}

	,launch: function () {
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
});
