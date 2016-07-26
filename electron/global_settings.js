const fs = require('fs');
const settingsPathname = 'rambox_cfg.json';

var globalSettings = {
	settings: {
		always_on_top: 0,
		hide_menu_bar: 0,
		skip_taskbar: 0,
		auto_launch: 1,
		keep_in_taskbar_on_close: 1,
		start_minimized: 0
	},
	init: function(settings) {
		this.settings = settings;
	},
	set: function(name, value) {
		this.settings[name] = value;
	},
	get: function(name) {
		return this.settings[name];
	},
	save: function() {
		try {
			fs.writeFileSync(settingsPathname, JSON.stringify(this.settings));
		} catch (err) {}
	}
};

try {
	//test to see if settings exist
	fs.openSync(settingsPathname, 'r+'); //throws error if file doesn't exist
	globalSettings.init(JSON.parse(fs.readFileSync(settingsPathname)));
} catch (err) {
	globalSettings.save();
}

module.exports = globalSettings;
