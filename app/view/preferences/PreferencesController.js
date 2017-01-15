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

		// master password activated and only one of the fields "password" or "password confirmation" filled
		if (values.master_password === true &&
			(Ext.isEmpty(values.master_password1) === false && Ext.isEmpty(values.master_password2) === true ||
			Ext.isEmpty(values.master_password1) === true && Ext.isEmpty(values.master_password2) === false)) return;

		// password and confirmation don't match
		if (values.master_password === true && (values.master_password1 !== values.master_password2)) return;

		// master password activated and changed
		if (values.master_password === true &&
			Ext.isEmpty(values.master_password1) === false &&
			Ext.isEmpty(values.master_password2) === false) {

			values.master_password = Rambox.util.MD5.encypt(values.master_password1);
			delete values.master_password1;
			delete values.master_password2;
		}

		// prevent overwriting password when unchanged
		if (values.master_password === true) {
			delete values.master_password;
		}

		// Proxy
		if ( values.proxy && (Ext.isEmpty(values.proxyHost) || Ext.isEmpty(values.proxyPort)) ) return;

		ipc.send('setConfig', values);
		me.getView().close();
	}
});
