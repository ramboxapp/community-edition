Ext.override(Ext, {
	cq1: function(selector) {
		return Ext.ComponentQuery.query(selector)[0];
	}
});
