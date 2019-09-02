Ext.define('Hamsket.model.ServiceList', {
	 extend: 'Ext.data.Model'

	,fields: [{
		 name: 'id'
		,type: 'string'
	},{
		 name: 'logo'
		,type: 'string'
	},{
		 name: 'name'
		,type: 'string'
	},{
		 name: 'description'
		,type: 'string'
		,defaultValue: locale['services[27]']
	},{
		 name: 'url'
		,type: 'string'
	},{
		 name: 'type'
		,type: 'string'
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
		 name: 'titleBlink'
		,type: 'boolean'
		,defaultValue: false
	},{
		 name: 'allow_popups'
		,type: 'boolean'
		,defaultValue: false
	},{
		 name: 'manual_notifications'
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
		 name: 'note'
		,type: 'string'
		,defaultValue: ''
	},{
		 name: 'custom_domain'
		,type: 'boolean'
		,defaultValue: false
	}]
});
