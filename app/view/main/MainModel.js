
Ext.define('Rambox.view.main.MainModel', {
	 extend: 'Ext.app.ViewModel'

	,alias: 'viewmodel.main'

	,data: {
		 name: 'Rambox'
		,username: localStorage.getItem('profile') ? JSON.parse(localStorage.getItem('profile')).name : ''
		,avatar: localStorage.getItem('profile') ? JSON.parse(localStorage.getItem('profile')).picture : ''
	}
});
