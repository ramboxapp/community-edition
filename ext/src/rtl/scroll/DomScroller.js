Ext.define('Ext.rtl.scroll.DomScroller', {
    override: 'Ext.scroll.DomScroller',

    privates: {
        convertX: function(x) {
            var element;

            if (this.getRtl()) {
                element = this.getElement();

                if (element) {
                    x = element.rtlNormalizeScrollLeft(x);
                }
            }

            return x;
        },

        getElementScroll: function(element) {
            return this.getRtl() ? element.rtlGetScroll() : element.getScroll();
        }
    }
});
