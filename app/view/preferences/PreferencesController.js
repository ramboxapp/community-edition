Ext.define('Rambox.view.preferences.PreferencesController', {
	 extend: 'Ext.app.ViewController'
	,alias: 'controller.preferences-preferences'

	,cancel: function( btn ) {
		var me = this;

		me.getView().close();
	}

	,save: function( btn ) {
		var me = this;

		ipc.send('setConfig', me.getView().down('form').getForm().getFieldValues());
		me.getView().close();
	}
});
