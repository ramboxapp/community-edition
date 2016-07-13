/**
 * Created by vsxed on 7/11/2016.
 */
Ext.define('Rambox.util.Format', {
	 singleton: true

	,formatNumber: function(n) {
		return n.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
	}

	,stripNumber: function(n) {
		return (typeof n == "number") ? n : n.match(/\d+/g) ? parseInt(n.match(/\d+/g).join("")) : 0;
	}
});
