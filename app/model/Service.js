Ext.define('Hamsket.model.Service', {
	 extend: 'Ext.data.Model'

	,identifier: 'sequential'
	,proxy: {
		 type: 'localstorage'
		,id: 'services'
	}

	,fields: [{
		 name: 'id'
		,type: 'int'
	},{
		 name: 'position'
		,type: 'int'
	},{
		 name: 'type'
		,type: 'string'
	},{
		 name: 'logo'
		,type: 'string'
	},{
		 name: 'name'
		,type: 'string'
	},{
		 name: 'url'
		,type: 'string'
	},{
		 name: 'align'
		,type: 'string'
		,defaultValue: 'left'
	},{
		 name: 'notifications'
		,type: 'boolean'
		,defaultValue: true
	},{
		 name: 'muted'
		,type: 'boolean'
		,defaultValue: false
	},{
		 name: 'tabname'
		,type: 'boolean'
		,defaultValue: true
	},{
		 name: 'displayTabUnreadCounter'
		,type: 'boolean'
		,defaultValue: true
	},{
		 name: 'includeInGlobalUnreadCounter'
		,type: 'boolean'
		,defaultValue: true
	},{
		 name: 'trust'
		,type: 'boolean'
		,defaultValue: false
	},{
		 name: 'enabled'
		,type: 'boolean'
		,defaultValue: true
	},{
		 name: 'custom_js'
		,type: 'string'
		,defaultValue: ''
	},{
		 name: 'custom_css'
		,type: 'string'
		,defaultValue: ''
	},{
		 name: 'js_unread'
		,type: 'string'
		,defaultValue: ''
	},{
		name: 'custom_css_complex'
		,type: 'boolean'
		,defaultValue: false
	},{
		name: 'passive_event_listeners'
		,type: 'boolean'
		,defaultValue: true
	},{
		name: 'slowed_timers'
		,type: 'boolean'
		,defaultValue: true
	},{
		name: 'userAgent'
		,type: 'string'
		,defaultValue: ''
	},{
		name: 'os_override'
		,type: 'string'
		,defaultValue: ''
	},{
		name: 'chrome_version'
		,type: 'string'
		,defaultValue: ''
	},{
		 name: 'zoomLevel'
		,type: 'number'
		,defaultValue: 0
	}]
});
