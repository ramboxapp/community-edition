/**
 * @class Ext.chart.series.Bar3D
 * @extends Ext.chart.series.Bar
 *
 * Creates a 3D Bar or 3D Column Chart (depending on the value of the
 * {@link Ext.chart.CartesianChart#flipXY flipXY} config).
 *
 *     @example
 *     Ext.create({
 *        xtype: 'cartesian', 
 *        renderTo: Ext.getBody(),
 *        width: 600,
 *        height: 400,
 *        innerPadding: '0 10 0 10',
 *        store: {
 *            fields: ['name', 'apples', 'oranges'],
 *            data: [{
 *                name: 'Eric',
 *                apples: 10,
 *                oranges: 3
 *            }, {
 *                name: 'Mary',
 *                apples: 7,
 *                oranges: 2
 *            }, {
 *                name: 'John',
 *                apples: 5,
 *                oranges: 2
 *            }, {
 *                name: 'Bob',
 *                apples: 2,
 *                oranges: 3
 *            }, {
 *                name: 'Joe',
 *                apples: 19,
 *                oranges: 1
 *            }, {
 *                name: 'Macy',
 *                apples: 13,
 *                oranges: 4
 *            }]
 *        },
 *        axes: [{
 *            type: 'numeric3d',
 *            position: 'left',
 *            fields: ['apples', 'oranges'],
 *            title: {
 *                text: 'Inventory',
 *                fontSize: 15
 *            },
 *            grid: {
 *                odd: {
 *                    fillStyle: 'rgba(255, 255, 255, 0.06)'
 *                },
 *                even: {
 *                    fillStyle: 'rgba(0, 0, 0, 0.03)'
 *                }
 *            }
 *        }, {
 *            type: 'category3d',
 *            position: 'bottom',
 *            title: {
 *                text: 'People',
 *                fontSize: 15
 *            },
 *            fields: 'name'
 *        }],
 *        series: {
 *            type: 'bar3d',
 *            xField: 'name',
 *            yField: ['apples', 'oranges']
 *        }
 *     });
 */
Ext.define('Ext.chart.series.Bar3D', {
    extend: 'Ext.chart.series.Bar',

    requires: [
        'Ext.chart.series.sprite.Bar3D',
        'Ext.chart.series.sprite.Box'
    ],

    alias: 'series.bar3d',
    type: 'bar3d',
    seriesType: 'bar3dSeries',

    config: {
        itemInstancing: {
            type: 'box',
            fx: {
                customDurations: {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    depth: 0
                }
            }
        },
        highlightCfg: {
            opacity: 0.8
        }
    },

    getSprites: function () {
        var sprites = this.callParent(arguments),
            sprite, zIndex, i;

        for (i = 0; i < sprites.length; i++) {
            sprite = sprites[i];
            zIndex = sprite.attr.zIndex;
            if (zIndex < 0) {
                sprite.setAttributes({zIndex: -zIndex});
            }
            if (sprite.setSeries) {
                sprite.setSeries(this);
            }
        }
        return sprites;
    },

    getDepth: function () {
        var sprite = this.getSprites()[0];
        return sprite ? (sprite.depth || 0) : 0;
    },

    getItemForPoint: function (x, y) {
        if (this.getSprites()) {
            var me = this,
                i, sprite,
                itemInstancing = me.getItemInstancing(),
                sprites = me.getSprites(),
                store = me.getStore(),
                hidden = me.getHidden(),
                chart = me.getChart(),
                padding = chart.getInnerPadding(),
                isRtl = chart.getInherited().rtl,
                item, index, yField;

            // Convert the coordinates because the "items" sprites that draw the bars ignore the chart's InnerPadding.
            // See also Ext.chart.series.sprite.Bar.getIndexNearPoint(x,y) regarding the series's vertical coordinate system.
            x = x + (isRtl ? padding.right : -padding.left);
            y = y + padding.bottom;

            for (i = sprites.length - 1; i >= 0; i--) {
                if (!hidden[i]) {
                    sprite = sprites[i];
                    index = sprite.getIndexNearPoint(x, y);
                    if (index !== -1) {
                        yField = me.getYField();
                        item = {
                            series: me,
                            index: index,
                            category: itemInstancing ? 'items' : 'markers',
                            record: store.getData().items[index],
                            // Handle the case where we're stacked but a single segment
                            field: typeof yField === 'string' ? yField : yField[i],
                            sprite: sprite
                        };
                        return item;
                    }
                }
            }
            return null;
        }
    }

});
