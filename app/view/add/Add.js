Ext.define('Rambox.view.add.Add',{
	 extend: 'Ext.window.Window'

	,requires: [
		 'Rambox.view.add.AddController'
		,'Rambox.view.add.AddModel'
	]

	,controller: 'add-add'
	,viewModel: {
		type: 'add-add'
	}

	// private
	,record: null
	,service: null
	,edit: false

	// defaults
	,modal: true
	,width: 500
	,autoShow: true
	,resizable: false
	,draggable: false
	,bodyPadding: 20

	,initComponent: function() {
		var me = this;

		me.title = (!me.edit ? 'Add ' : 'Edit ') + me.record.get('name');
		me.icon = me.record.get('type') === 'custom' ? (!me.edit ? 'resources/icons/custom.png' : (me.record.get('logo') === '' ? 'resources/icons/custom.png' : me.record.get('logo'))) : 'resources/icons/'+me.record.get('logo');
		me.items = [
			{
				 xtype: 'form'
				,items: [
					{
						 xtype: 'textfield'
						,fieldLabel: 'Name'
						,value: me.record.get('type') === 'custom' ? (me.edit ? me.record.get('name') : '') : me.record.get('name')
						,name: 'serviceName'
						,allowBlank: true
						,listeners: { specialkey: 'onEnter' }
					}
					,{
						 xtype: 'container'
						,layout: 'column'
						,hidden: me.edit ? me.service.get('url').indexOf('___') === -1 && !me.service.get('custom_domain') : me.record.get('url').indexOf('___') === -1 && !me.record.get('custom_domain')
						,items: [
							{
								 xtype: 'textfield'
								,fieldLabel: 'URL'
								,name: 'url'
								,value: me.edit && me.service.get('url').indexOf('___') >= 0 ? me.record.get('url').replace(me.service.get('url').split('___')[0], '').replace(me.service.get('url').split('___')[1], '') : (me.record.get('url').indexOf('___') === -1 ? me.record.get('url') : '')
								,readOnly: me.edit ? (me.service.get('custom_domain') && me.service.get('url') === me.record.get('url') ? true : me.service.get('url').indexOf('___') === -1 && !me.service.get('custom_domain')) : me.record.get('url').indexOf('___') === -1 && me.record.get('custom_domain')
								,allowBlank: false
								,submitEmptyText: false
								,emptyText: me.record.get('url') === '___' ? 'http://' : ''
								,vtype: me.record.get('url') === '___' ? 'url' : ''
								,width: 275
								,listeners: { specialkey: 'onEnter' }
							}
							,{
								 xtype: 'cycle'
								,showText: true
								,style: 'border-top-left-radius:0;border-bottom-left-radius:0;'
								,hidden: me.edit ? me.service.get('type') === 'custom' || me.service.get('url') === '___' : me.record.get('type') === 'custom' || me.record.get('url') === '___'
								,arrowVisible: me.edit ? (me.service.get('url').indexOf('___') >= 0 && !me.service.get('custom_domain') ? false : me.service.get('custom_domain')) : (me.record.get('url').indexOf('___') >= 0 && !me.record.get('custom_domain') ? false : me.record.get('custom_domain'))
								,menu: {
									items: [
										{
											 text: me.edit ? (me.service.get('url').indexOf('___') === -1 ? 'Official Server' : Ext.String.endsWith(me.service.get('url'), '/') ? me.service.get('url').split('___')[1].slice(0, -1) : me.service.get('url').split('___')[1]) : (me.record.get('url').indexOf('___') === -1 ? 'Official Server' : Ext.String.endsWith(me.record.get('url'), '/') ? me.record.get('url').split('___')[1].slice(0, -1) : me.record.get('url').split('___')[1])
											,checked: me.edit ? (me.service.get('custom_domain') && me.service.get('url') === me.record.get('url') ? true : Ext.String.endsWith(me.record.get('url'), me.service.get('url').split('___')[1])) : true
											,disabled: me.edit ? me.service.get('url') === '___' : me.record.get('url') === '___'
										}
										,{
											 text: 'Custom Server'
											,checked: me.edit ? (me.service.get('custom_domain') && me.service.get('url') === me.record.get('url') ? false : !Ext.String.endsWith(me.record.get('url'), me.service.get('url').split('___')[1])) : false
											,custom: true
											,disabled: me.edit ? !me.service.get('custom_domain') : !me.record.get('custom_domain')
										}
									]
								}
								// Fixes bug EXTJS-20094 for version Ext JS 5
								,arrowHandler: function(cycleBtn, e) {
									if ( !cycleBtn.arrowVisible ) cycleBtn.hideMenu();
								}
								,changeHandler: function(cycleBtn, activeItem) {
									Ext.apply(cycleBtn.previousSibling(), {
										 emptyText: activeItem.custom ? 'http://' : ' '
										,vtype: activeItem.custom ? 'url' : ''
									});
									cycleBtn.previousSibling().applyEmptyText();
									cycleBtn.previousSibling().reset();

									if ( me.edit && cycleBtn.nextSibling().originalValue !== '2' ) {
										me.service.get('custom_domain') && !activeItem.custom ? cycleBtn.previousSibling().reset() : cycleBtn.previousSibling().setValue('');
									} else if ( me.edit && cycleBtn.nextSibling().originalValue === '2' ) {
										me.service.get('custom_domain') && !activeItem.custom ? cycleBtn.previousSibling().setValue( me.service.get('url').indexOf('___') === -1 && me.service.get('custom_domain') ? me.service.get('url') : '') : cycleBtn.previousSibling().reset();
									} else if ( !me.edit && cycleBtn.nextSibling().originalValue === '1' ) {
										activeItem.custom ? cycleBtn.previousSibling().setValue('') : cycleBtn.previousSibling().reset();
									}

									cycleBtn.previousSibling().setReadOnly( activeItem.custom ? false : (me.edit ? me.service.get('url').indexOf('___') === -1 : me.record.get('url').indexOf('___') === -1) );
									cycleBtn.nextSibling().setValue( activeItem.custom ? 2 : 1 );
								}
							}
							,{
								 xtype: 'hiddenfield'
								,name: 'cycleValue'
								,value: me.edit ? (me.service.get('custom_domain') && me.service.get('url') === me.record.get('url') ? 1 : (!Ext.String.endsWith(me.record.get('url'), me.service.get('url').split('___')[1]) ? 2 : 1)) : 1
							}
						]
					}
					,{
						 xtype: 'textfield'
						,fieldLabel: 'Logo'
						,emptyText: 'http://url.com/image.png'
						,name: 'logo'
						,vtype: me.record.get('type') === 'custom' ? 'url' : ''
						,value: me.record.get('type') === 'custom' ? (me.edit ? me.record.get('logo') : '') : me.record.get('logo')
						,allowBlank: true
						,hidden: me.record.get('type') !== 'custom'
						,margin: '5 0 0 0'
						,listeners: { specialkey: 'onEnter' }
					}
					,{
						 xtype: 'fieldset'
						,title: 'Options'
						,margin: '10 0 0 0'
						,items: [
							{
								 xtype: 'checkbox'
								,boxLabel: 'Align to Right'
								,checked: me.edit ? (me.record.get('align') === 'right' ? true : false) : false
								,name: 'align'
								,uncheckedValue: 'left'
								,inputValue: 'right'
							}
							,{
								 xtype: 'checkbox'
								,boxLabel: 'Show notifications'
								,name: 'notifications'
								,checked: me.edit ? me.record.get('notifications') : true
								,uncheckedValue: false
								,inputValue: true
							}
							,{
								 xtype: 'checkbox'
								,boxLabel: 'Mute all sounds'
								,name: 'muted'
								,checked: me.edit ? me.record.get('muted') : false
								,uncheckedValue: false
								,inputValue: true
							}
							,{
								 xtype: 'checkbox'
								,boxLabel: 'Trust invalid authority certificates'
								,name: 'trust'
								,hidden: me.record.get('type') !== 'custom'
								,checked: me.edit ? me.record.get('trust') : true
								,uncheckedValue: false
								,inputValue: true
							}
						]
					},
					{
						xtype: 'fieldset',
						title: 'Unread counter',
						margin: '10 0 0 0',
						items: [
							{
								xtype: 'checkbox',
								boxLabel: 'Display tab unread counter',
								name: 'displayTabUnreadCounter',
								checked: me.edit ? me.record.get('displayTabUnreadCounter') : true,
								uncheckedValue: false,
								inputValue: true
							},
							{
								xtype: 'checkbox',
								boxLabel: 'Include in global unread counter',
								name: 'includeInGlobalUnreadCounter',
								checked: me.edit ? me.record.get('includeInGlobalUnreadCounter') : true,
								uncheckedValue: false,
								inputValue: true
							}
						]
					},
					{
						 xtype: 'fieldset'
						,title: 'Advanced'
						,margin: '10 0 0 0'
						,collapsible: true
						,collapsed: true
						,items: [
							{
								 xtype: 'textarea'
								,fieldLabel: 'Custom Code (<a href="https://github.com/saenzramiro/rambox/wiki/Inject-JavaScript-Code" target="_blank">read more</a>)'
								,allowBlank: true
								,name: 'js_unread'
								,value: me.edit ? me.record.get('js_unread') : ''
								,anchor: '100%'
								,height: 120
							}
						]
					}
					,{
						 xtype: 'container'
						,hidden: (me.edit ? Ext.getStore('ServicesList').getById(me.record.get('type')).get('note') === '' : me.record.get('note') === '')
						,data: { note: (me.edit ? Ext.getStore('ServicesList').getById(me.record.get('type')).get('note') : me.record.get('note')) }
						,margin: '10 0 0 0'
						,style: 'background-color:#93CFE0;color:#053767;border-radius:6px;'
						,tpl: [
							 '<i class="fa fa-info-circle" aria-hidden="true" style="font-size:40px;margin:20px;"></i>'
							,'<span style="font-size: 15px;position: absolute;padding: 10px 10px 10px 0;">{note}</span>'
						]
					}
				]
			}
		];

		me.buttons = [
			{
				 text: 'Cancel'
				,ui: 'decline'
				,handler: 'doCancel'
			}
			,'->'
			,{
				 text: me.title
				,itemId: 'submit'
				,handler: 'doSave'
			}
		];

		this.callParent(this);
	}

	,listeners: {
		show: 'onShow'
	}
});
