Ext.define('Ext.rtl.scroll.TouchScroller', {
    override: 'Ext.scroll.TouchScroller',

    _rtlCls: Ext.baseCSSPrefix + 'rtl',

    updateRtl: function(rtl) {
        var indicators, xIndicator, yIndicator, rtlCls;

        if (rtl) {
            indicators = this.getIndicators();

            if (indicators) {
                rtlCls = this._rtlCls;
                xIndicator = indicators.x;
                yIndicator = indicators.y;

                if (xIndicator) {
                    xIndicator.element.addCls(rtlCls);
                }

                if (yIndicator) {
                    yIndicator.element.addCls(rtlCls);
                }
            }

        }
    },

    privates: {
        convertX: function(x) {
            // rtl gets set by based on the owner component's inheritedState
            if (x && this.getRtl()) {
                x = -x;
            }
            return x;
        },

        convertEasingConfig: function(config) {
            var minMomentumValue = config.minMomentumValue,
                maxMomentumValue = config.maxMomentumValue;

            if (this.getRtl()) {
                config.minMomentumValue = maxMomentumValue;
                config.maxMomentumValue = -minMomentumValue;
            }
        }
    }
});
