Ext.define('Rambox.view.preferences.PreferencesController', {
	 extend: 'Ext.app.ViewController'
	,alias: 'controller.preferences-preferences'

	,cancel: function( btn ) {
		var me = this;

		me.getView().close();
	}

	,save: function( btn ) {
		var me = this;

		var values = me.getView().down('form').getForm().getFieldValues();

		// Proxy
		if ( values.proxy && (Ext.isEmpty(values.proxyHost) || Ext.isEmpty(values.proxyPort)) ) return;

		ipc.send('setConfig', values);
		me.getView().close();
	}
});
