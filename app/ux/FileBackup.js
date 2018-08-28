const remote = require('electron').remote;
const dialog = remote.dialog;
const app = remote.app;
const fs = require('fs');
const path = require('path');
const userPath = app.getPath('userData');
const defaultFileName = 'rambox-backup.json';
const myDefaultPath = userPath + path.sep + defaultFileName;

Ext.define('Rambox.ux.FileBackup', {
	singleton: true,
	backupConfiguration: function (callback) {
		var me = this;
		let services = [];
		Ext.getStore('Services').each(function(service) {
			const s = Ext.clone(service);
			delete s.data.id;
			delete s.data.zoomLevel;
			services.push(s.data);
		});

		const json_string = JSON.stringify(services, null, 4);
		dialog.showSaveDialog({
			defaultPath: myDefaultPath
		}, function(filename, bookmark) {
			if (!filename) return;
			fs.writeFile(filename, json_string, function(err) {
				if (err) {
					console.log(err);
				}
			});
		});
		if (Ext.isFunction(callback)) callback.bind(me)();
	},
	restoreConfiguration: function () {
		var me = this;
		dialog.showOpenDialog({
			defaultPath: myDefaultPath,
			properties: ['openFile']
		}, function(filePaths, bookmarks) {
			if (filePaths.length === 1) {
				const filePath = filePaths[0];
				console.log(filePath);
				fs.readFile(filePath, function (err, data) {
					if (err) {
						console.log(err);
					}
					const services = JSON.parse(data);
					if (services) {
                        console.dir(services);
						Ext.cq1('app-main').getController().removeAllServices(true, function() {
							Ext.each(services, function(s) {
								const service = Ext.create('Rambox.model.Service', s);
								service.save();
								Ext.getStore('Services').add(service);
							});
							remote.getCurrentWindow().reload();
						});

					}
				});
			}
		});
	}
});
