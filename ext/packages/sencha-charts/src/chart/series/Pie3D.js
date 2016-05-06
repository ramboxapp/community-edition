/**
 * @class Ext.chart.series.Pie3D
 * @extends Ext.chart.series.Polar
 * 
 * Creates a 3D Pie Chart.
 *
 * **Note:** Labels, legends, and lines are not currently available when using the
 * 3D Pie chart series.
 * 
 *     @example
 *     Ext.create({
 *        xtype: 'polar', 
 *        renderTo: document.body,
 *        width: 600,
 *        height: 400,
 *        theme: 'green',
 *        interactions: 'rotate',
 *        store: {
 *            fields: ['data3'],
 *            data: [{
 *                'data3': 14
 *            }, {
 *                'data3': 16
 *            }, {
 *                'data3': 14
 *            }, {
 *                'data3': 6
 *            }, {
 *                'data3': 36
 *            }]
 *        },
 *        series: {
 *            type: 'pie3d',
 *            field: 'data3',
 *            donut: 30
 *        }
 *     });
 */
Ext.define('Ext.chart.series.Pie3D', {
    requires: ['Ext.chart.series.sprite.Pie3DPart'],
    extend: 'Ext.chart.series.Polar',
    type: 'pie3d',
    seriesType: 'pie3d',
    alias: 'series.pie3d',
    config: {
        rect: [0, 0, 0, 0],
        thickness: 35,
        distortion: 0.5,

        /**
         * @cfg {String} field (required)
         * @deprecated Use xField instead
         * The store record field name to be used for the pie angles.
         * The values bound to this field name must be positive real numbers.
         */
        field: null,

        /**
         * @private
         * @cfg {String} lengthField
         * Not supported.
         */
        lengthField: false,

        /**
         * @cfg {Boolean/Number} donut
         * Whether to set the pie chart as donut chart.
         * Can be set to a particular percentage to set the radius
         * of the donut chart.
         */
        donut: false,

        rotation: 0
    },

    itemOffset: 5,

    setField: function (f) {
        return this.setXField(f);
    },

    getField: function () {
        return this.getXField();
    },

    applyRotation: function (rotation) {
        var twoPie = Math.PI * 2;
        return (rotation % twoPie + twoPie) % twoPie;
    },

    updateRotation: function (rotation) {
        var sprites = this.getSprites(),
            i, ln;

        for (i = 0, ln = sprites.length; i < ln; i++) {
            sprites[i].setAttributes({
                baseRotation: rotation
            });
        }
    },

    updateColors: function (colors) {
        this.setSubStyle({baseColor: colors});
    },

    // This is a temporary solution until the Series.getStyleByIndex is fixed
    // to give user styles the priority over theme ones. Also, for sprites of
    // this particular series, the fillStyle shouldn't be set directly. Instead,
    // the 'baseColor' attribute should be set, from which the stops of the
    // gradient (used for fillStyle) will be calculated. Themes can't handle
    // situations like that properly.
    getStyleByIndex: function (i) {
        var indexStyle = this.callParent([i]),
            style = this.getStyle(),
            // 'fill' and 'color' are 'fillStyle' aliases
            // (see Ext.draw.sprite.Sprite.inheritableStatics.def.aliases)
            fillStyle = indexStyle.fillStyle || indexStyle.fill || indexStyle.color,
            strokeStyle = style.strokeStyle || style.stroke;

        if (fillStyle) {
            indexStyle.baseColor = fillStyle;
            delete indexStyle.fillStyle;
            delete indexStyle.fill;
            delete indexStyle.color;
        }
        if (strokeStyle) {
            indexStyle.strokeStyle = strokeStyle;
        }

        return indexStyle;
    },
    
    doUpdateStyles: function () {
        var me = this,
            sprites = me.getSprites(),
            itemOffset = me.itemOffset,
            ln = sprites && sprites.length,
            i = 0,
            j = 0,
            style;

        for (; i < ln; i += itemOffset, j++) {
            style = me.getStyleByIndex(j);
            sprites[  i  ].setAttributes(style);
            sprites[i + 1].setAttributes(style);
            sprites[i + 2].setAttributes(style);
            sprites[i + 3].setAttributes(style);
            sprites[i + 4].setAttributes(style);
        }
    },

    processData: function () {
        var me = this,
            chart = me.getChart(),
            animation = chart && chart.getAnimation(),
            store = me.getStore(),
            items = store.getData().items,
            length = items.length,
            field = me.getField(),
            value, sum = 0, ratio,
            summation = [],
            sprites = me.getSprites(),
            itemOffset = me.itemOffset,
            commonAttributes, lastAngle, i;

        for (i = 0; i < length; i++) {
            value = items[i].get(field);
            sum += value;
            summation[i] = sum;
        }
        if (sum === 0) {
            return;
        }
        ratio = 2 * Math.PI / sum;
        for (i = 0; i < length; i++) {
            summation[i] *= ratio;
        }

        for (i = 0; i < sprites.length; i++) {
            sprites[i].fx.setConfig(animation);
        }

        for (i = 0, lastAngle = 0; i < length; i++) {
            commonAttributes = {opacity: 1, startAngle: lastAngle, endAngle: summation[i]};
            sprites[i * itemOffset    ].setAttributes(commonAttributes);
            sprites[i * itemOffset + 1].setAttributes(commonAttributes);
            sprites[i * itemOffset + 2].setAttributes(commonAttributes);
            sprites[i * itemOffset + 3].setAttributes(commonAttributes);
            sprites[i * itemOffset + 4].setAttributes(commonAttributes);
            lastAngle = summation[i];
        }
    },

    // The radius here will normally be set by the PolarChart.performLayout,
    // where it's half the width or height (whichever is smaller) of the chart's rect.
    // But for 3D pie series we have to take the thickness of the pie and the
    // distortion into account to calculate the proper radius.
    // The passed value is never used (or derived from) since the radius config
    // is not really meant to be used directly, as it will be reset by the next layout.
    applyRadius: function () {
        var me = this,
            chart = me.getChart(),
            padding = chart.getInnerPadding(),
            rect = chart.getMainRect() || [0, 0, 1, 1],
            width = rect[2] - padding * 2,
            height = (rect[3] - padding * 2 - me.getThickness() * 2) / me.getDistortion();

        return Math.min(width, height) * 0.5;
    },

    getSprites: function () {
        var me = this,
            chart = me.getChart(),
            surface = me.getSurface(),
            store = me.getStore();
        if (!store) {
            return [];
        }
        var items = store.getData().items,
            itemOffset = me.itemOffset,
            length = items.length,
            animation = me.getAnimation() || chart && chart.getAnimation(),
            rotation = me.getRotation(),
            center = me.getCenter(),
            offsetX = me.getOffsetX(),
            offsetY = me.getOffsetY(),
            radius = me.getRadius(),
            commonAttributes = {
                centerX: center[0] + offsetX,
                centerY: center[1] + offsetY - me.getThickness() / 2,
                endRho: radius,
                startRho: radius * me.getDonut() / 100,
                thickness: me.getThickness(),
                distortion: me.getDistortion()
            }, sliceAttributes, twoPie = Math.PI * 2,
            sprites = me.sprites,
            topSprite, startSprite, endSprite, innerSideSprite, outerSideSprite,
            i;

        for (i = 0; i < length; i++) {
            sliceAttributes = Ext.apply({}, this.getStyleByIndex(i), commonAttributes);
            topSprite = sprites[i * itemOffset];
            if (!topSprite) {
                topSprite = surface.add({
                    type: 'pie3dPart',
                    part: 'top',
                    startAngle: twoPie,
                    endAngle: twoPie
                });
                startSprite = surface.add({
                    type: 'pie3dPart',
                    part: 'start',
                    startAngle: twoPie,
                    endAngle: twoPie
                });
                endSprite = surface.add({
                    type: 'pie3dPart',
                    part: 'end',
                    startAngle: twoPie,
                    endAngle: twoPie
                });
                innerSideSprite = surface.add({
                    type: 'pie3dPart',
                    part: 'inner',
                    startAngle: twoPie,
                    endAngle: twoPie,
                    thickness: 0
                });
                outerSideSprite = surface.add({
                    type: 'pie3dPart',
                    part: 'outer',
                    startAngle: twoPie,
                    endAngle: twoPie,
                    thickness: 0
                });
                topSprite.fx.setDurationOn('baseRotation', 0);
                startSprite.fx.setDurationOn('baseRotation', 0);
                endSprite.fx.setDurationOn('baseRotation', 0);
                innerSideSprite.fx.setDurationOn('baseRotation', 0);
                outerSideSprite.fx.setDurationOn('baseRotation', 0);
                sprites.push(topSprite, startSprite, endSprite, innerSideSprite, outerSideSprite);
            } else {
                startSprite = sprites[i * itemOffset + 1];
                endSprite = sprites[i * itemOffset + 2];
                innerSideSprite = sprites[i * itemOffset + 3];
                outerSideSprite = sprites[i * itemOffset + 4];
                if (animation) {
                    topSprite.fx.setConfig(animation);
                    startSprite.fx.setConfig(animation);
                    endSprite.fx.setConfig(animation);
                    innerSideSprite.fx.setConfig(animation);
                    outerSideSprite.fx.setConfig(animation);
                }
            }
            topSprite.setAttributes(sliceAttributes);
            startSprite.setAttributes(sliceAttributes);
            endSprite.setAttributes(sliceAttributes);
            innerSideSprite.setAttributes(sliceAttributes);
            outerSideSprite.setAttributes(sliceAttributes);
        }

        for (i *= itemOffset, ln = sprites.length; i < ln; i++) {
            sprites[i].fx.setConfig(animation);
            sprites[i].setAttributes({
                opacity: 0,
                startAngle: twoPie,
                endAngle: twoPie,
                baseRotation: rotation
            });
        }

        return sprites;
    }
});
