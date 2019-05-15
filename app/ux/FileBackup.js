Ext.define('Rambox.ux.FileBackup', {
	singleton: true,
	constructor() {
		const me = this;
		me.callParent(arguments);
		me.remote = require('electron').remote;
		me.path = me.remote.require('path');
		me.fs = me.remote.require('fs');
		me.userPath = me.remote.app.getPath('userData');
		me.defaultFileName = 'rambox-backup.json';
		me.myDefaultPath = me.userPath + me.path.sep + me.defaultFileName;
	},
	backupConfiguration(callback) {
		const me = this;
		let services = [];
		Ext.getStore('Services').each(function(service) {
			const s = Ext.clone(service);
			delete s.data.id;
			delete s.data.zoomLevel;
			services.push(s.data);
		});

		const json_string = JSON.stringify(services, null, 4);
		me.remote.dialog.showSaveDialog({
			defaultPath: me.myDefaultPath
		}, function(filename, bookmark) {
			if (!filename) return;
			me.fs.writeFile(filename, json_string, function(err) {
				if (err) {
					console.log(err);
				}
			});
		});
		if (Ext.isFunction(callback)) callback.bind(me)();
	},
	restoreConfiguration() {
		const me = this;
		me.remote.dialog.showOpenDialog({
			defaultPath: me.myDefaultPath,
			properties: ['openFile']
		}, function(filePaths, bookmarks) {
			if (filePaths && filePaths.length === 1) {
				const filePath = filePaths[0];
				me.fs.readFile(filePath, function (err, data) {
					if (err) {
						console.log(err);
					}
					const services = JSON.parse(data);
					if (services) {
						Ext.cq1('app-main').getController().removeAllServices(true, function() {
							Ext.each(services, function(s) {
								const service = Ext.create('Rambox.model.Service', s);
								service.save();
								Ext.getStore('Services').add(service);
							});
							me.remote.getCurrentWindow().reload();
						});

					}
				});
			}
		});
	}
});
