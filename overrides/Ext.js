Ext.override(Ext, {
	cq1(selector) {
		return Ext.ComponentQuery.query(selector)[0];
	}
});
