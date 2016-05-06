/**
 * @class Ext.chart.series.sprite.Bar3D
 * @extends Ext.chart.series.sprite.Bar
 *
 * Draws a sprite used in {@link Ext.chart.series.Bar3D} series.
 */
Ext.define('Ext.chart.series.sprite.Bar3D', {
    extend: 'Ext.chart.series.sprite.Bar',
    alias: 'sprite.bar3dSeries',

    requires: ['Ext.draw.gradient.Linear'],

    inheritableStatics: {
        def: {
            processors: {
                depthWidthRatio: 'number',
                /**
                 * @cfg {Number} [saturationFactor=1]
                 * The factor applied to the saturation of the bars.
                 */
                saturationFactor: 'number',
                /**
                 * @cfg {Number} [brightnessFactor=1]
                 * The factor applied to the brightness of the bars.
                 */
                brightnessFactor: 'number'
            },

            defaults: {
                depthWidthRatio: 1/3,
                saturationFactor: 1,
                brightnessFactor: 1,
                transformFillStroke: true
            },

            triggers: {
                groupCount: 'panzoom'
            },

            updaters: {
                panzoom: function (attr) {
                    var me = this,
                        dx = attr.visibleMaxX - attr.visibleMinX,
                        dy = attr.visibleMaxY - attr.visibleMinY,
                        innerWidth = attr.flipXY ? attr.innerHeight : attr.innerWidth,
                        innerHeight = !attr.flipXY ? attr.innerHeight : attr.innerWidth,
                        surface = me.getSurface(),
                        isRtl = surface ? surface.getInherited().rtl : false;

                    if (isRtl && !attr.flipXY) {
                        attr.translationX = innerWidth + attr.visibleMinX * innerWidth / dx;
                    } else {
                        attr.translationX = -attr.visibleMinX * innerWidth / dx;
                    }
                    attr.translationY = -attr.visibleMinY * (innerHeight - me.depth) / dy;
                    attr.scalingX = (isRtl && !attr.flipXY ? -1 : 1) * innerWidth / dx;
                    attr.scalingY = (innerHeight - me.depth) / dy;
                    attr.scalingCenterX = 0;
                    attr.scalingCenterY = 0;
                    me.applyTransformations(true);
                }
            }
        }
    },

    config: {
        showStroke: false,
        series: null
    },

    depth: 0,

    drawBar: function (ctx, surface, clip, left, top, right, bottom, index) {
        var me = this,
            attr = me.attr,
            itemCfg = {},
            renderer = attr.renderer,
            changes, depth, series;

        itemCfg.x = (left + right) * 0.5;
        itemCfg.y = top;
        itemCfg.width = (right - left) * 0.75;
        itemCfg.height = bottom - top;
        itemCfg.depth = depth = itemCfg.width * attr.depthWidthRatio;
        itemCfg.orientation = attr.flipXY ? 'horizontal' : 'vertical';
        itemCfg.saturationFactor = attr.saturationFactor;
        itemCfg.brightnessFactor = attr.brightnessFactor;

        if (depth !== me.depth) {
            me.depth = depth;
            series = me.getSeries();
            series.fireEvent('depthchange', series, depth);
        }

        if (renderer) {
            changes = renderer.call(me, me, itemCfg, {store: me.getStore()}, index);
            Ext.apply(itemCfg, changes);
        }
        me.putMarker('items', itemCfg, index, !renderer);
    }

});
