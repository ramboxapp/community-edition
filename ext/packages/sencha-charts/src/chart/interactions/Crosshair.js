/**
 * The Crosshair interaction allows the user to get precise values for a specific point on the chart.
 * The values are obtained by single-touch dragging on the chart.
 *
 *     @example
 *     Ext.create('Ext.Container', {
 *         renderTo: Ext.getBody(),
 *         width: 600,
 *         height: 400,
 *         layout: 'fit',
 *         items: {
 *             xtype: 'cartesian',
 *             innerPadding: 20,
 *             interactions: {
 *                 type: 'crosshair',
 *                 axes: {
 *                     left: {
 *                         label: {
 *                             fillStyle: 'white'
 *                         },
 *                         rect: {
 *                             fillStyle: 'brown',
 *                             radius: 6
 *                         }
 *                     },
 *                     bottom: {
 *                         label: {
 *                             fontSize: '14px',
 *                             fontWeight: 'bold'
 *                         }
 *                     }
 *                 },
 *                 lines: {
 *                     horizontal: {
 *                         strokeStyle: 'brown',
 *                         lineWidth: 2,
 *                         lineDash: [20, 2, 2, 2, 2, 2, 2, 2]
 *                     }
 *                 }
 *             },
 *             store: {
 *                 fields: ['name', 'data'],
 *                 data: [
 *                     {name: 'apple', data: 300},
 *                     {name: 'orange', data: 900},
 *                     {name: 'banana', data: 800},
 *                     {name: 'pear', data: 400},
 *                     {name: 'grape', data: 500}
 *                 ]
 *             },
 *             axes: [{
 *                 type: 'numeric',
 *                 position: 'left',
 *                 fields: ['data'],
 *                 title: {
 *                     text: 'Value',
 *                     fontSize: 15
 *                 },
 *                 grid: true,
 *                 label: {
 *                     rotationRads: -Math.PI / 4
 *                 }
 *             }, {
 *                 type: 'category',
 *                 position: 'bottom',
 *                 fields: ['name'],
 *                 title: {
 *                     text: 'Category',
 *                     fontSize: 15
 *                 }
 *             }],
 *             series: {
 *                 type: 'line',
 *                 style: {
 *                     strokeStyle: 'black'
 *                 },
 *                 xField: 'name',
 *                 yField: 'data',
 *                 marker: {
 *                     type: 'circle',
 *                     radius: 5,
 *                     fillStyle: 'lightblue'
 *                 }
 *             }
 *         }
 *     });
 */

Ext.define('Ext.chart.interactions.Crosshair', {

    extend: 'Ext.chart.interactions.Abstract',
    requires: [
        'Ext.chart.grid.HorizontalGrid',
        'Ext.chart.grid.VerticalGrid',
        'Ext.chart.CartesianChart',
        'Ext.chart.axis.layout.Discrete'
    ],

    type: 'crosshair',
    alias: 'interaction.crosshair',

    config: {
        /**
         * @cfg {Object} axes
         * Specifies label text and label rect configs on per axis basis or as a single config for all axes.
         *
         *     {
         *         type: 'crosshair',
         *         axes: {
         *             label: { fillStyle: 'white' },
         *             rect: { fillStyle: 'maroon'}
         *         }
         *     }
         *
         * In case per axis configuration is used, an object with keys corresponding
         * to the {@link Ext.chart.axis.Axis#position position} must be provided.
         *
         *     {
         *         type: 'crosshair',
         *         axes: {
         *             left: {
         *                 label: { fillStyle: 'white' },
         *                 rect: {
         *                     fillStyle: 'maroon',
         *                     radius: 4
         *                 }
         *             },
         *             bottom: {
         *                 label: {
         *                     fontSize: '14px',
         *                     fontWeight: 'bold'
         *                 },
         *                 rect: { fillStyle: 'white' }
         *             }
         *         }
         *
         * If the `axes` config is not specified, the following defaults will be used:
         * - `label` will use values from the {@link Ext.chart.axis.Axis#label label} config.
         * - `rect` will use the 'white' fillStyle.
         */
        axes: {
            top: {label: {}, rect: {}},
            right: {label: {}, rect: {}},
            bottom: {label: {}, rect: {}},
            left: {label: {}, rect: {}}
        },

        /**
         * @cfg {Object} lines
         * Specifies attributes of horizontal and vertical lines that make up the crosshair.
         * If this config is missing, black dashed lines will be used.
         *
         *     {
         *         horizontal: {
         *             strokeStyle: 'red',
         *             lineDash: [] // solid line
         *         },
         *         vertical: {
         *             lineWidth: 2,
         *             lineDash: [15, 5, 5, 5]
         *         }
         *     }
         */
        lines: {
            horizontal: {
                strokeStyle: 'black',
                lineDash: [5, 5]
            },
            vertical: {
                strokeStyle: 'black',
                lineDash: [5, 5]
            }
        },

        /**
         * @cfg {String} gesture
         * Specifies which gesture should be used for starting/maintaining/ending the interaction.
         */
        gesture: 'drag'
    },

    applyAxes: function (axesConfig, oldAxesConfig) {
        return Ext.merge(oldAxesConfig || {}, axesConfig);
    },

    applyLines: function (linesConfig, oldLinesConfig) {
        return Ext.merge(oldLinesConfig || {}, linesConfig);
    },

    updateChart: function (chart) {
        if (!(chart instanceof Ext.chart.CartesianChart)) {
            throw 'Crosshair interaction can only be used on cartesian charts.';
        }
        this.callParent(arguments);
    },

    getGestures: function () {
        var me = this,
            gestures = {};
        gestures[me.getGesture()] = 'onGesture';
        gestures[me.getGesture() + 'start'] = 'onGestureStart';
        gestures[me.getGesture() + 'end'] = 'onGestureEnd';
        return gestures;
    },

    onGestureStart: function (e) {
        var me = this,
            chart = me.getChart(),
            axesTheme = chart.getTheme().getAxis(), axisTheme,
            surface = chart.getSurface('overlay'),
            rect = chart.getInnerRect(),
            chartWidth = rect[2],
            chartHeight = rect[3],
            xy = chart.getEventXY(e),
            x = xy[0],
            y = xy[1],
            axes = chart.getAxes(),
            axesConfig = me.getAxes(),
            linesConfig = me.getLines(),
            axis, axisSurface, axisRect, axisWidth, axisHeight, axisPosition, axisAlignment,
            axisLabel, axisLabelConfig, crosshairLabelConfig, tickPadding,
            axisSprite, attr, axisThickness, lineWidth, halfLineWidth,
            title, titleBBox, titlePadding,
            horizontalLineCfg, verticalLineCfg,
            i;

        if (x > 0 && x < chartWidth && y > 0 && y < chartHeight) {
            me.lockEvents(me.getGesture());
            horizontalLineCfg = Ext.apply({
                xclass: 'Ext.chart.grid.HorizontalGrid',
                x: 0,
                y: y,
                width: chartWidth
            }, linesConfig.horizontal);
            verticalLineCfg = Ext.apply({
                xclass: 'Ext.chart.grid.VerticalGrid',
                x: x,
                y: 0,
                height: chartHeight
            }, linesConfig.vertical);
            me.axesLabels = me.axesLabels || {};
            for (i = 0; i < axes.length; i++) {
                axis = axes[i];
                axisSurface = axis.getSurface();
                axisRect = axisSurface.getRect();
                axisSprite = axis.getSprites()[0];
                axisWidth = axisRect[2];
                axisHeight = axisRect[3];
                axisPosition = axis.getPosition();
                axisAlignment = axis.getAlignment();
                title = axis.getTitle(),
                titleBBox = title && title.attr.text !== '' && title.getBBox(),
                attr = axisSprite.attr;
                axisThickness = axisSprite.thickness;
                lineWidth = attr.axisLine ? attr.lineWidth : 0;
                halfLineWidth = lineWidth / 2;
                tickPadding = Math.max(attr.majorTickSize, attr.minorTickSize) + lineWidth;

                axisLabel = me.axesLabels[axisPosition] = axisSurface.add({type: 'composite'});

                axisLabel.labelRect = axisLabel.add(Ext.apply({
                    type: 'rect',
                    fillStyle: 'white',
                    x: axisPosition === 'right' ? lineWidth : 0,
                    y: axisPosition === 'bottom' ? lineWidth : 0,
                    width: axisWidth - lineWidth - (axisAlignment === 'vertical' && titleBBox ? titleBBox.width : 0),
                    height: axisHeight - lineWidth - (axisAlignment === 'horizontal' && titleBBox ? titleBBox.height : 0),
                    translationX: axisPosition === 'left' && titleBBox ? titleBBox.width : 0,
                    translationY: axisPosition === 'top' && titleBBox ? titleBBox.height : 0
                }, axesConfig.rect || axesConfig[axisPosition].rect));

                if (axisAlignment === 'vertical' && !verticalLineCfg.strokeStyle) {
                    verticalLineCfg.strokeStyle = attr.strokeStyle;
                }
                if (axisAlignment === 'horizontal' && !horizontalLineCfg.strokeStyle) {
                    horizontalLineCfg.strokeStyle = attr.strokeStyle;
                }

                axisTheme = Ext.merge({}, axesTheme.defaults, axesTheme[axisPosition]);
                axisLabelConfig = Ext.apply({}, axis.config.label, axisTheme.label);
                crosshairLabelConfig = axesConfig.label || axesConfig[axisPosition].label;
                axisLabel.labelText = axisLabel.add(Ext.apply(axisLabelConfig, crosshairLabelConfig, {
                    type: 'text',
                    x: (function () {
                        switch (axisPosition) {
                            case 'left':
                                titlePadding = titleBBox ? titleBBox.x + titleBBox.width : 0;
                                return titlePadding + (axisWidth - titlePadding - tickPadding) / 2 - halfLineWidth;
                            case 'right':
                                titlePadding = titleBBox ? axisWidth - titleBBox.x : 0;
                                return tickPadding + (axisWidth - tickPadding - titlePadding) / 2 + halfLineWidth;
                            default:
                                return 0;
                        }
                    })(),
                    y: (function () {
                        switch (axisPosition) {
                            case 'top':
                                titlePadding = titleBBox ? titleBBox.y + titleBBox.height: 0;
                                return titlePadding + (axisHeight - titlePadding - tickPadding) / 2 - halfLineWidth;
                            case 'bottom':
                                titlePadding = titleBBox ? axisHeight - titleBBox.y : 0;
                                return tickPadding + (axisHeight - tickPadding - titlePadding) / 2 + halfLineWidth;
                            default:
                                return 0;
                        }
                    })()
                }));
            }
            me.horizontalLine = surface.add(horizontalLineCfg);
            me.verticalLine = surface.add(verticalLineCfg);
            return false;
        }

    },

    onGesture: function (e) {
        var me = this;
        if (me.getLocks()[me.getGesture()] !== me) {
            return;
        }
        var chart = me.getChart(),
            surface = chart.getSurface('overlay'),
            rect = Ext.Array.slice(chart.getInnerRect()),
            padding = chart.getInnerPadding(),
            px = padding.left,
            py = padding.top,
            chartWidth = rect[2],
            chartHeight = rect[3],
            xy = chart.getEventXY(e),
            x = xy[0],
            y = xy[1],
            axes = chart.getAxes(),
            axis, axisPosition, axisAlignment, axisSurface, axisSprite, axisMatrix,
            axisLayoutContext, axisSegmenter,
            axisLabel, labelBBox, textPadding,
            xx, yy, dx, dy,
            xValue, yValue,
            text,
            i;

        if (x < 0) {
            x = 0;
        } else if (x > chartWidth) {
            x = chartWidth;
        }
        if (y < 0) {
            y = 0;
        } else if (y > chartHeight) {
            y = chartHeight;
        }
        x += px;
        y += py;

        for (i = 0; i < axes.length; i++) {
            axis = axes[i];
            axisPosition = axis.getPosition();
            axisAlignment = axis.getAlignment();
            axisSurface = axis.getSurface();
            axisSprite = axis.getSprites()[0];
            axisMatrix = axisSprite.attr.matrix;
            textPadding = axisSprite.attr.textPadding * 2;
            axisLabel = me.axesLabels[axisPosition];
            axisLayoutContext = axisSprite.getLayoutContext();
            axisSegmenter = axis.getSegmenter();

            if (axisLabel) {
                if (axisAlignment === 'vertical') {
                    yy = axisMatrix.getYY();
                    dy = axisMatrix.getDY();
                    yValue = (y - dy - py) / yy;
                    if (axis.getLayout() instanceof Ext.chart.axis.layout.Discrete) {
                        y = Math.round(yValue) * yy + dy + py;
                        yValue = axisSegmenter.from(Math.round(yValue));
                        yValue = axisSprite.attr.data[yValue];
                    } else {
                        yValue = axisSegmenter.from(yValue);
                    }
                    text = axisSegmenter.renderer(yValue, axisLayoutContext);

                    axisLabel.setAttributes({translationY: y - py});
                    axisLabel.labelText.setAttributes({text: text});
                    labelBBox = axisLabel.labelText.getBBox();
                    axisLabel.labelRect.setAttributes({
                        height: labelBBox.height + textPadding,
                        y: -(labelBBox.height + textPadding) / 2
                    });
                    axisSurface.renderFrame();
                } else {
                    xx = axisMatrix.getXX();
                    dx = axisMatrix.getDX();
                    xValue = (x - dx - px) / xx;
                    if (axis.getLayout() instanceof Ext.chart.axis.layout.Discrete) {
                        x = Math.round(xValue) * xx + dx + px;
                        xValue = axisSegmenter.from(Math.round(xValue));
                        xValue = axisSprite.attr.data[xValue];
                    } else {
                        xValue = axisSegmenter.from(xValue);
                    }
                    text = axisSegmenter.renderer(xValue, axisLayoutContext);

                    axisLabel.setAttributes({translationX: x - px});
                    axisLabel.labelText.setAttributes({text: text});
                    labelBBox = axisLabel.labelText.getBBox();
                    axisLabel.labelRect.setAttributes({
                        width: labelBBox.width + textPadding,
                        x: -(labelBBox.width + textPadding) / 2
                    });
                    axisSurface.renderFrame();
                }
            }
        }
        me.horizontalLine.setAttributes({y: y, strokeStyle: axisSprite.attr.strokeStyle});
        me.verticalLine.setAttributes({x: x, strokeStyle: axisSprite.attr.strokeStyle});
        surface.renderFrame();
        return false;
    },

    onGestureEnd: function (e) {
        var me = this,
            chart = me.getChart(),
            surface =  chart.getSurface('overlay'),
            axes = chart.getAxes(),
            axis, axisPosition, axisSurface, axisLabel,
            i;

        surface.remove(me.verticalLine);
        surface.remove(me.horizontalLine);

        for (i = 0; i < axes.length; i++) {
            axis = axes[i];
            axisPosition = axis.getPosition();
            axisSurface = axis.getSurface();
            axisLabel = me.axesLabels[axisPosition];
            if (axisLabel) {
                delete me.axesLabels[axisPosition];
                axisSurface.remove(axisLabel);
            }
            axisSurface.renderFrame();
        }

        surface.renderFrame();
        me.unlockEvents(me.getGesture());
    }

});
