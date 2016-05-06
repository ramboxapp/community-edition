/**
 * @class Ext.chart.series.Pie
 * @extends Ext.chart.series.Polar
 *
 * Creates a Pie Chart. A Pie Chart is a useful visualization technique to display quantitative information for different
 * categories that also have a meaning as a whole.
 * As with all other series, the Pie Series must be appended in the *series* Chart array configuration. See the Chart
 * documentation for more information. A typical configuration object for the pie series could be:
 *
 *     @example
 *     Ext.create({
 *        xtype: 'polar', 
 *        renderTo: document.body,
 *        width: 400,
 *        height: 400,
 *        theme: 'green',
 *        interactions: 'rotate',
 *        store: {
 *            fields: ['name', 'data1'],
 *            data: [{
 *                name: 'metric one',
 *                data1: 14
 *            }, {
 *                name: 'metric two',
 *                data1: 16
 *            }, {
 *                name: 'metric three',
 *                data1: 14
 *            }, {
 *                name: 'metric four',
 *                data1: 6
 *            }, {
 *                name: 'metric five',
 *                data1: 36
 *            }]
 *        },
 *        series: {
 *            type: 'pie',
 *            label: {
 *                field: 'name',
 *                display: 'rotate'
 *            },
 *            xField: 'data1',
 *            donut: 30
 *        }
 *     });
 *
 * In this configuration we set `pie` as the type for the series, set an object with specific style properties for highlighting options
 * (triggered when hovering elements). We also set true to `showInLegend` so all the pie slices can be represented by a legend item.
 * We set `data1` as the value of the field to determine the angle span for each pie slice. We also set a label configuration object
 * where we set the field name of the store field to be rendered as text for the label. The labels will also be displayed rotated.
 *
 */
Ext.define('Ext.chart.series.Pie', {
    extend: 'Ext.chart.series.Polar',
    requires: [
        'Ext.chart.series.sprite.PieSlice'
    ],
    type: 'pie',
    alias: 'series.pie',
    seriesType: 'pieslice',

    config: {
        /**
         * @cfg {String} labelField
         * @deprecated Use {@link Ext.chart.series.Pie#label} instead.
         * The store record field name to be used for the pie slice labels.
         */
        labelField: false,

        /**
         * @cfg {String} lengthField
         * The store record field name to be used for the pie slice lengths.
         * The values bound to this field name must be positive real numbers.
         */
        lengthField: false,

        /**
         * @cfg {Number} donut Specifies the radius of the donut hole, as a percentage of the chart's radius.
         * Defaults to 0 (no donut hole).
         */
        donut: 0,

        /**
         * @cfg {String} field
         * @deprecated Use xField directly
         */
        field: null,

        /**
         * @cfg {Number} rotation The starting angle of the pie slices.
         */
        rotation: 0,

        /**
         * @cfg {Boolean} clockwise
         * Whether the pie slices are displayed clockwise. Default's true.
         */
        clockwise: true,

        /**
         * @cfg {Number} [totalAngle=2*PI] The total angle of the pie series.
         */
        totalAngle: 2 * Math.PI,

        /**
         * @cfg {Array} hidden Determines which pie slices are hidden.
         */
        hidden: [],

        /**
         * @cfg {Number} Allows adjustment of the radius by a specific percentage.
         */
        radiusFactor: 100,

        /**
         * @cfg {Object} highlightCfg Default highlight config for the pie series.
         * Slides highlighted pie sector outward.
         */
        highlightCfg: {
            margin: 20
        },

        style: {}
    },

    directions: ['X'],

    setField: function (f) {
        return this.setXField(f);
    },

    getField: function () {
        return this.getXField();
    },

    applyLabel: function (newLabel, oldLabel) {
        if (Ext.isObject(newLabel) && !Ext.isString(newLabel.orientation)) {
            // Override default label orientation from '' to 'vertical'.
            Ext.apply(newLabel = Ext.Object.chain(newLabel), {orientation: 'vertical'});
        }
        if (!oldLabel) {
            oldLabel = new Ext.chart.Markers({zIndex: 10});
            oldLabel.setTemplate(new Ext.chart.label.Label(newLabel));
        } else {
            oldLabel.getTemplate().setAttributes(newLabel);
        }
        return oldLabel;
    },

    updateLabelData: function () {
        var me = this,
            store = me.getStore(),
            items = store.getData().items,
            sprites = me.getSprites(),
            labelField = me.getLabel().getTemplate().getField(),
            hidden = me.getHidden(),
            i, ln, labels, sprite;
        if (sprites.length > 0 && labelField) {
            labels = [];
            for (i = 0, ln = items.length; i < ln; i++) {
                labels.push(items[i].get(labelField));
            }
            for (i = 0, ln = sprites.length; i < ln; i++) {
                sprite = sprites[i];
                sprite.setAttributes({label: labels[i]});
                sprite.putMarker('labels', {hidden: hidden[i]}, sprite.attr.attributeId);
            }
        }
    },

    coordinateX: function () {
        var me = this,
            store = me.getStore(),
            records = store.getData().items,
            recordCount = records.length,
            xField = me.getXField(),
            yField = me.getYField(),
            x, sumX = 0, unit,
            y, maxY = 0,
            hidden = me.getHidden(),
            summation = [], i,
            lastAngle = 0,
            totalAngle = me.getTotalAngle(),
            clockwise = me.getClockwise() ? 1 : -1,
            sprites = me.getSprites();

        if (!sprites) {
            return;
        }

        for (i = 0; i < recordCount; i++) {
            x = Math.abs(Number(records[i].get(xField))) || 0;
            y = yField && Math.abs(Number(records[i].get(yField))) || 0;
            if (!hidden[i]) {
                sumX += x;
                if (y > maxY) {
                    maxY = y;
                }
            }
            summation[i] = sumX;
            if (i >= hidden.length) {
                hidden[i] = false;
            }
        }
        hidden.length = recordCount;
        me.maxY = maxY;

        if (sumX !== 0) {
            unit = totalAngle / sumX;
        }
        for (i = 0; i < recordCount; i++) {
            sprites[i].setAttributes({
                startAngle: lastAngle,
                endAngle: lastAngle = (unit ? clockwise * summation[i] * unit : 0),
                globalAlpha: 1
            });
        }
        if (recordCount < me.sprites.length) {
            for (i = recordCount; i < me.sprites.length; i++) {
                me.sprites[i].destroy();
            }
            me.sprites.length = recordCount;
        }
        for (i = recordCount; i < me.sprites.length; i++) {
            sprites[i].setAttributes({
                startAngle: totalAngle,
                endAngle: totalAngle,
                globalAlpha: 0
            });
        }
        me.getChart().refreshLegendStore();
    },

    updateCenter: function (center) {
        this.setStyle({
            translationX: center[0] + this.getOffsetX(),
            translationY: center[1] + this.getOffsetY()
        });
        this.doUpdateStyles();
    },

    updateRadius: function (radius) {
        this.setStyle({
            startRho: radius * this.getDonut() * 0.01,
            endRho: radius * this.getRadiusFactor() * 0.01
        });
        this.doUpdateStyles();
    },

    getStyleByIndex: function (i) {
        var me = this,
            store = me.getStore(),
            item = store.getAt(i),
            yField = me.getYField(),
            radius = me.getRadius(),
            style = {},
            startRho, endRho, y;

        if (item) {
            y = yField && Math.abs(Number(item.get(yField))) || 0;
            startRho = radius * me.getDonut() * 0.01;
            endRho = radius * me.getRadiusFactor() * 0.01;
            style = me.callParent([i]);
            style.startRho = startRho;
            style.endRho = me.maxY ? (startRho + (endRho - startRho) * y / me.maxY) : endRho;
        }

        return style;
    },

    updateDonut: function (donut) {
        var radius = this.getRadius();
        this.setStyle({
            startRho: radius * donut * 0.01,
            endRho: radius * this.getRadiusFactor() * 0.01
        });
        this.doUpdateStyles();
    },

    rotationOffset: -0.5 * Math.PI,

    updateRotation: function (rotation) {
        this.setStyle({
            // Subtract 90 degrees from rotation, so that `rotation` config's default
            // zero value makes first pie sector start at noon, rather than 3 o'clock.
            rotationRads: rotation + this.rotationOffset
        });
        this.doUpdateStyles();
    },

    updateTotalAngle: function (totalAngle) {
        this.processData();
    },

    getSprites: function () {
        var me = this,
            chart = me.getChart(),
            store = me.getStore();
        if (!chart || !store) {
            return [];
        }
        me.getColors();
        me.getSubStyle();
        var items = store.getData().items,
            length = items.length,
            animation = me.getAnimation() || chart && chart.getAnimation(),
            sprites = me.sprites, sprite,
            spriteIndex = 0, rendererData,
            i, spriteCreated = false,
            label = me.getLabel(),
            labelTpl = label.getTemplate();

        rendererData = {
            store: store,
            field: me.getField(),
            series: me
        };

        for (i = 0; i < length; i++) {
            sprite = sprites[i];
            if (!sprite) {
                sprite = me.createSprite();
                if (me.getHighlight()) {
                    sprite.config.highlight = me.getHighlight();
                    sprite.addModifier('highlight', true);
                }
                if (labelTpl.getField()) {
                    labelTpl.setAttributes({
                        labelOverflowPadding: me.getLabelOverflowPadding()
                    });
                    labelTpl.fx.setCustomDurations({'callout': 200});
                    sprite.bindMarker('labels', label);
                }
                sprite.setAttributes(me.getStyleByIndex(i));
                sprite.rendererData = rendererData;
                sprite.rendererIndex = spriteIndex++;
                spriteCreated = true;
            }
            sprite.fx.setConfig(animation);
        }
        if (spriteCreated) {
            me.doUpdateStyles();
        }
        return me.sprites;
    },

    betweenAngle: function (x, a, b) {
        var pp = Math.PI * 2,
            offset = this.rotationOffset;
        if (!this.getClockwise()) {
            x *= -1;
            a *= -1;
            b *= -1;
            a -= offset;
            b -= offset;
        } else {
            a += offset;
            b += offset;
        }
        b -= a;
        x -= a;
        x %= pp;
        b %= pp;
        x += pp;
        b += pp;
        x %= pp;
        b %= pp;
        return x < b;
    },

    /**
     * Returns the pie slice for a given angle
     * @param {Number} angle The angle to search for the slice
     * @return {Object} An object containing the reocord, sprite, scope etc.
     */
    getItemForAngle: function (angle) {
        var me = this,
            sprites = me.getSprites(),
            attr;

        angle %= Math.PI * 2;

        while (angle < 0) {
            angle += Math.PI * 2;
        }

        if (sprites) {
            var store  = me.getStore(),
                items  = store.getData().items,
                hidden = me.getHidden(),
                i      = 0,
                ln     = store.getCount();

            for (; i < ln; i++) {
                if(!hidden[i]) {
                    // Fortunately, item's id equals its index in the instances list.
                    attr = sprites[i].attr;

                    if (attr.startAngle <= angle &&  attr.endAngle >= angle) {
                        return {
                            series: me,
                            sprite: sprites[i],
                            index: i,
                            record: items[i],
                            field: me.getXField()
                        };
                    }
                }
            }
        }

        return null;
    },

    getItemForPoint: function (x, y) {
        var me = this,
            sprites = me.getSprites();
        if (sprites) {
            var center = me.getCenter(),
                offsetX = me.getOffsetX(),
                offsetY = me.getOffsetY(),
                originalX = x - center[0] + offsetX,
                originalY = y - center[1] + offsetY,
                store = me.getStore(),
                donut = me.getDonut(),
                records = store.getData().items,
                direction = Math.atan2(originalY, originalX) - me.getRotation(),
                radius = Math.sqrt(originalX * originalX + originalY * originalY),
                startRadius = me.getRadius() * donut * 0.01,
                hidden = me.getHidden(),
                i, ln, attr;

            for (i = 0, ln = records.length; i < ln; i++) {
                if (!hidden[i]) {
                    // Fortunately, item's id equals its index in the instances list.
                    attr = sprites[i].attr;
                    if (radius >= startRadius + attr.margin && radius <= attr.endRho + attr.margin) {
                        if (me.betweenAngle(direction, attr.startAngle, attr.endAngle)) {
                            return {
                                series: me,
                                sprite: sprites[i],
                                index: i,
                                record: records[i],
                                field: me.getXField()
                            };
                        }
                    }
                }
            }
            return null;
        }
    },

    provideLegendInfo: function (target) {
        var me = this,
            store = me.getStore();
        if (store) {
            var items = store.getData().items,
                labelField = me.getLabel().getTemplate().getField(),
                field = me.getField(),
                hidden = me.getHidden(),
                i, style, fill;

            for (i = 0; i < items.length; i++) {
                style = me.getStyleByIndex(i);
                fill = style.fillStyle;
                if (Ext.isObject(fill)) {
                    fill = fill.stops && fill.stops[0].color;
                }
                target.push({
                    name: labelField ? String(items[i].get(labelField))  : field + ' ' + i,
                    mark: fill || style.strokeStyle || 'black',
                    disabled: hidden[i],
                    series: me.getId(),
                    index: i
                });
            }
        }
    }
});

/*
    Moved TODO comments to bottom:
    TODO: `contrast` is not supported. Should be in the series.label config.
    TODO: We set `contrast` to `true` to flip the color of the label if it is to similar 
    to the background color. Finally, we set the font family
    TODO: and size through the `font` parameter.    
*/
