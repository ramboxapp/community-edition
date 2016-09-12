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

		// Master Password
		if ( values.master_password && (Ext.isEmpty(values.master_password1) || Ext.isEmpty(values.master_password2)) ) return;
		if ( values.master_password && (values.master_password1 !== values.master_password2) ) return;
		if ( values.master_password ) values.master_password = Rambox.util.MD5.encypt(values.master_password1);
		delete values.master_password1;
		delete values.master_password2;

		// Proxy
		if ( values.proxy && (Ext.isEmpty(values.proxyHost) || Ext.isEmpty(values.proxyPort)) ) return;

		ipc.send('setConfig', values);
		me.getView().close();
	}
});
