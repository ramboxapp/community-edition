Ext.define('Rambox.profile.Offline', {
	 extend: 'Ext.app.Profile'
	,isActive: function() {
		return !localStorage.getItem('id_token');
	}

	,launch: function() {
		console.warn('USER NOT LOGGED IN');
	}
});
