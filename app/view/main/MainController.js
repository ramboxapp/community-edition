Ext.define('Rambox.view.main.MainController', {
	 extend: 'Ext.app.ViewController'

	,requires: [
	]

	,alias: 'controller.main'

	,showSimpleModal: function(record) {
		var me = this;

		var win = Ext.create('Ext.window.Window', {
			 title: 'Add '+record.get('name')
			,modal: true
			,width: 400
			,resizable: false
			,draggable: false
			,bodyPadding: 20
			,items: [
				{
					 xtype: 'form'
					,items: [
						{
							 xtype: 'textfield'
							,fieldLabel: 'Name'
							,value: record.get('name')
							,name: 'serviceName'
						}
						,{
							 xtype: 'fieldset'
							,title: 'Options'
							,margin: '10 0 0 0'
							,items: [
								{
									 xtype: 'checkbox'
									,boxLabel: 'Separate'
									,checked: false
									,name: 'align'
									,uncheckedValue: 'left'
									,inputValue: 'right'
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Show notifications'
									,name: 'notifications'
									,checked: true
									,uncheckedValue: false
									,inputValue: true
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Mute all sounds'
									,name: 'muted'
									,checked: false
									,uncheckedValue: false
									,inputValue: true
								}
							]
						}
					]
				}
			]
			,buttons: [
				{
					 text: 'Cancel'
					,ui: 'decline'
					,handler: function() {
						win.close();
					}
				}
				,'->'
				,{
					 text: 'Add service'
					,handler: function() {
						var formValues = win.down('form').getValues();

						var service = Ext.getStore('Services').add({
							 type: record.get('id')
							,name: formValues.serviceName
							,url: record.get('url')
							,align: formValues.align
							,notifications: formValues.notifications
							,muted: formValues.muted
						})[0];

						me.getView().add({
							 xtype: 'webview'
							,id: 'tab_'+service.get('id')
							,title: service.get('name')
							,icon: 'resources/icons/'+record.get('logo')
							,src: service.get('url')
							,type: service.get('type')
							,align: formValues.align
							,notifications: formValues.notifications
							,muted: formValues.muted
						}).show();

						win.close();
					}
				}
			]
		}).show();
	}

	,showCustomModal: function(record) {
		var me = this;

		var win = Ext.create('Ext.window.Window', {
			 title: 'Add '+record.get('name')
			,modal: true
			,width: 400
			,resizable: false
			,draggable: false
			,bodyPadding: 20
			,items: [
				{
					 xtype: 'form'
					,items: [
						{
							 xtype: 'textfield'
							,fieldLabel: 'Name'
							,value: record.get('name')
							,name: 'serviceName'
						}
						,{
							 xtype: 'container'
							,layout: 'column'
							,items: [{
								 xtype: 'textfield'
								,fieldLabel: record.get('name') + ' team'
								,name: 'url'
							},{
								 xtype: 'displayfield'
								,value: record.get('url').split('___')[1].slice(0, -1) // Get the URL and remove the final slash (/)
								,submitValue: false // Prevent being submitted
							}]
						}
						,{
							 xtype: 'fieldset'
							,title: 'Options'
							,margin: '10 0 0 0'
							,items: [
								{
									 xtype: 'checkbox'
									,boxLabel: 'Separate'
									,checked: false
									,name: 'align'
									,uncheckedValue: 'left'
									,inputValue: 'right'
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Show notifications'
									,name: 'notifications'
									,checked: true
									,uncheckedValue: false
									,inputValue: true
								}
								,{
									 xtype: 'checkbox'
									,boxLabel: 'Mute all sounds'
									,name: 'muted'
									,checked: false
									,uncheckedValue: false
									,inputValue: true
								}
							]
						}
					]
				}
			]
			,buttons: [
				{
					 text: 'Cancel'
					,ui: 'decline'
					,handler: function() {
						win.close();
					}
				}
				,'->'
				,{
					 text: 'Add service'
					,handler: function() {
						var formValues = win.down('form').getValues();

						var service = Ext.getStore('Services').add({
							 type: record.get('id')
							,name: formValues.serviceName
							,url: record.get('url').replace('___', formValues.url)
							,align: formValues.align
							,notifications: formValues.notifications
							,muted: formValues.muted
						})[0];

						me.getView().add({
							 xtype: 'webview'
							,id: 'tab_'+service.get('id')
							,title: service.get('name')
							,icon: 'resources/icons/'+record.get('logo')
							,src: service.get('url')
							,type: service.get('type')
							,align: formValues.align
							,notifications: formValues.notifications
							,muted: formValues.muted
						}).show();

						win.close();
					}
				}
			]
		}).show();
	}

	,onNewServiceSelect: function( view, record, item, index, e ) {
		if ( record.get('url').indexOf('___') >= 0 ) {
			this.showCustomModal(record);
		} else {
			this.showSimpleModal(record);
		}
	}

	,removeService: function( gridView, rowIndex, colIndex, col, e, rec, rowEl ) {
		Ext.Msg.confirm('Please confirm...', 'Are you sure you want to remove '+rec.get('name')+'?', function(btnId) {
			if ( btnId === 'yes' ) {
				gridView.getStore().remove(rec);
				Ext.getCmp('tab_'+rec.get('id')).close();
			}
		});
	}
});
