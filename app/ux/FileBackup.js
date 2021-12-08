Ext.define('Hamsket.ux.FileBackup', {
	singleton: true,
	constructor() {
		const me = this;
		me.callParent(arguments);
		me.remote = require('@electron/remote');
		me.path = me.remote.require('path');
		me.fs = me.remote.require('fs');
		me.userPath = me.remote.app.getPath('userData');
		me.defaultFileName = 'hamsket-backup.json';
		me.myDefaultPath = me.userPath + me.path.sep + me.defaultFileName;
	},
	backupConfiguration(callback) {
		const me = this;
		let services = [];
		const service_store = Ext.getStore('Services');
		service_store.sync();
		service_store.each(function(service) {
			const s = Ext.clone(service);
			delete s.data.id;
			delete s.data.zoomLevel;
			services.push(s.data);
		});

		const json_string = JSON.stringify(services, null, 4);
		me.remote.dialog.showSaveDialog({
			defaultPath: me.myDefaultPath
		}).then((result) => {
			if (!result.filePath) return;
			me.fs.writeFile(result.filePath, json_string, function(err) {
				if (err) {
					console.log(err);
				}
			});
		}).catch((err) => {
  		console.log(err);
		});
		if (Ext.isFunction(callback)) callback.bind(me)();
	},
	restoreConfiguration() {
		const me = this;
		const service_store = Ext.getStore('Services');
		me.remote.dialog.showOpenDialog({
			defaultPath: me.myDefaultPath,
			properties: ['openFile']
		}).then((result) => {
			if (result.filePaths && result.filePaths.length === 1) {
				const filePath = result.filePaths[0];
				me.fs.readFile(filePath, function (err, data) {
					if (err) {
						console.log(err);
					}
					const services = JSON.parse(data);
					if (services) {
						Ext.cq1('app-main').getController().removeAllServices(true, function() {
							Ext.each(services, function(s) {
								const service = Ext.create('Hamsket.model.Service', s);
								service_store.add(service);
							});
							service_store.sync();
							me.remote.getCurrentWindow().reload();
						});

					}
				});
			}
		}).catch((err) => {
  		console.log(err);
		});
	}
});
