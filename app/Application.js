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

	}
});
