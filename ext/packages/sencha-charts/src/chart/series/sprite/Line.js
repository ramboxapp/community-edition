/**
 * @class Ext.chart.series.sprite.Line
 * @extends Ext.chart.series.sprite.Aggregative
 *
 * Line series sprite.
 */
Ext.define('Ext.chart.series.sprite.Line', {
    alias: 'sprite.lineSeries',
    extend: 'Ext.chart.series.sprite.Aggregative',

    inheritableStatics: {
        def: {
            processors: {
                /**
                 * @cfg {Boolean} [smooth=false]
                 * `true` if the sprite uses line smoothing.
                 * Don't enable this if your data has gaps: NaN, undefined, etc.
                 */
                smooth: 'bool',
                /**
                 * @cfg {Boolean} [fillArea=false]
                 * `true` if the sprite paints the area underneath the line.
                 */
                fillArea: 'bool',
                /**
                 * @cfg {Boolean} [step=false]
                 * `true` if the line uses steps instead of straight lines to connect the dots.
                 * It is ignored if `smooth` is `true`.
                 */
                step: 'bool',
                /**
                 * @cfg {Boolean} [preciseStroke=true]
                 * `true` if the line uses precise stroke.
                 */
                preciseStroke: 'bool',
                /**
                 * @private
                 * The x-axis associated with the Line series.
                 * We need to know the position of the x-axis to fill the area underneath
                 * the stroke properly.
                 */
                xAxis: 'default',
                /**
                 * @cfg {Number} [yCap=Math.pow(2, 20)]
                 * Absolute maximum y-value.
                 * Larger values will be capped to avoid rendering issues.
                 */
                yCap: 'default' // The 'default' processor is used here as we don't want this attribute to animate.
            },

            defaults: {
                smooth: false,
                fillArea: false,
                step: false,
                preciseStroke: true,
                xAxis: null,
                yCap: Math.pow(2, 20),
                yJump: 50
            },

            triggers: {
                dataX: 'dataX,bbox,smooth',
                dataY: 'dataY,bbox,smooth',
                smooth: 'smooth'
            },

            updaters: {
                smooth: function (attr) {
                    var dataX = attr.dataX,
                        dataY = attr.dataY;
                    if (attr.smooth && dataX && dataY && dataX.length > 2 && dataY.length > 2) {
                        this.smoothX = Ext.draw.Draw.spline(dataX);
                        this.smoothY = Ext.draw.Draw.spline(dataY);
                    } else {
                        delete this.smoothX;
                        delete this.smoothY;
                    }
                }
            }
        }
    },

    list: null,

    updatePlainBBox: function (plain) {
        var attr = this.attr,
            ymin = Math.min(0, attr.dataMinY),
            ymax = Math.max(0, attr.dataMaxY);
        plain.x = attr.dataMinX;
        plain.y = ymin;
        plain.width = attr.dataMaxX - attr.dataMinX;
        plain.height = ymax - ymin;
    },

    drawStrip: function (ctx, strip) {
        ctx.moveTo(strip[0], strip[1]);
        for (var i = 2, ln = strip.length; i < ln; i += 2) {
            ctx.lineTo(strip[i], strip[i + 1]);
        }
    },

    drawStraightStroke: function (surface, ctx, start, end, list, xAxis) {
        var me = this,
            attr = me.attr,
            renderer = attr.renderer,
            step = attr.step,
            needMoveTo = true,
            abs = Math.abs,
            lineConfig = {
                type: 'line',
                smooth: false,
                step: step
            },
            strip = [], // Stores last continuous segment of the stroke.
            lineConfig, changes, stripStartX,
            x, y, x0, y0, x1, y1, i;

        for (i = 3; i < list.length; i += 3) {
            x0 = list[i - 3];
            y0 = list[i - 2];
            x = list[i];
            y = list[i + 1];
            x1 = list[i + 3];
            y1 = list[i + 4];

            if (renderer) {
                lineConfig.x = x;
                lineConfig.y = y;
                lineConfig.x0 = x0;
                lineConfig.y0 = y0;
                changes = renderer.call(me, me, lineConfig, me.rendererData, start + i/3);
            }

            if (Ext.isNumber(x + y + x0 + y0)) {
                if (needMoveTo) {
                    ctx.beginPath();
                    ctx.moveTo(x0, y0);
                    strip.push(x0, y0);
                    stripStartX = x0;
                    needMoveTo = false;
                }
            } else {
                continue;
            }

            if (step) {
                ctx.lineTo(x, y0);
                strip.push(x, y0);
            }
            ctx.lineTo(x, y);
            strip.push(x, y);

            if ( changes || !(Ext.isNumber(x1 + y1)) ) {
                ctx.save();
                    Ext.apply(ctx, changes);

                    if (attr.fillArea) {
                        ctx.lineTo(x, xAxis);
                        ctx.lineTo(stripStartX, xAxis);
                        ctx.closePath();
                        ctx.fill();
                    }

                    // Draw the line on top of the filled area.
                    ctx.beginPath();
                    me.drawStrip(ctx, strip);
                    strip = [];
                    ctx.stroke();
                ctx.restore();

                ctx.beginPath();
                needMoveTo = true;
            }
        }
    },

    calculateScale: function (count, end) {
        var power = 0,
            n = count;
        while (n < end && count > 0) {
            power++;
            n += count >> power;
        }
        return Math.pow(2, power > 0 ? power - 1 : power);
    },

    drawSmoothStroke: function (surface, ctx, start, end, list, xAxis) {
        var me = this,
            attr = me.attr,
            step = attr.step,
            matrix = attr.matrix,
            xx = matrix.getXX(),
            yy = matrix.getYY(),
            dx = matrix.getDX(),
            dy = matrix.getDY(),
            smoothX = me.smoothX,
            smoothY = me.smoothY,
            scale = me.calculateScale(attr.dataX.length, end),
            cx1, cy1, cx2, cy2, x, y, x0, y0,
            i, j, changes,
            lineConfig = {
                type: 'line',
                smooth: true,
                step: step
            };

        ctx.beginPath();
        ctx.moveTo(smoothX[start * 3] * xx + dx, smoothY[start * 3] * yy + dy);
        for (i = 0, j = start * 3 + 1; i < list.length - 3; i += 3, j += 3 * scale) {
            cx1 = smoothX[j] * xx + dx;
            cy1 = smoothY[j] * yy + dy;
            cx2 = smoothX[j + 1] * xx + dx;
            cy2 = smoothY[j + 1] * yy + dy;
            x = list[i + 3];
            y = list[i + 4];
            x0 = list[i];
            y0 = list[i + 1];
            if (attr.renderer) {
                lineConfig.x0 = x0;
                lineConfig.y0 = y0;
                lineConfig.cx1 = cx1;
                lineConfig.cy1 = cy1;
                lineConfig.cx2 = cx2;
                lineConfig.cy2 = cy2;
                lineConfig.x = x;
                lineConfig.y = y;
                changes = attr.renderer.call(me, me, lineConfig, me.rendererData, start + i/3 + 1);
                ctx.save();
                Ext.apply(ctx, changes);
                if (attr.fillArea) {
                    ctx.moveTo(x0, y0);
                    ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
                    ctx.lineTo(x, xAxis);
                    ctx.lineTo(x0, xAxis);
                    ctx.lineTo(x0, y0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.beginPath();
                }
                // Draw the line on top of the filled area.
                ctx.moveTo(x0, y0);
                ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
                ctx.stroke();
                ctx.moveTo(x0, y0);
                ctx.closePath();
                ctx.restore();
                ctx.beginPath();
                ctx.moveTo(x, y);
            } else {
                ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
            }
        }
    },

    drawLabel: function (text, dataX, dataY, labelId, rect) {
        var me = this,
            attr = me.attr,
            label = me.getBoundMarker('labels')[0],
            labelTpl = label.getTemplate(),
            labelCfg = me.labelCfg || (me.labelCfg = {}),
            surfaceMatrix = me.surfaceMatrix,
            labelX, labelY,
            labelOverflowPadding = attr.labelOverflowPadding,
            halfHeight, labelBBox,
            changes, hasPendingChanges;

        // The coordinates below (data point converted to surface coordinates)
        // are just for the renderer to give it a notion of where the label will be positioned.
        // The actual position of the label will be different
        // (unless the renderer returns x/y coordinates in the changes object)
        // and depend on several things including the size of the text,
        // which has to be measured after the renderer call,
        // since text can be modified by the renderer.
        labelCfg.x = surfaceMatrix.x(dataX, dataY);
        labelCfg.y = surfaceMatrix.y(dataX, dataY);

        if (attr.flipXY) {
            labelCfg.rotationRads = Math.PI * 0.5;
        } else {
            labelCfg.rotationRads = 0;
        }

        labelCfg.text = text;

        if (labelTpl.attr.renderer) {
            changes = labelTpl.attr.renderer.call(me, text, label, labelCfg, me.rendererData, labelId);
            if (typeof changes === 'string') {
                labelCfg.text = changes;
            } else if (typeof changes === 'object') {
                if ('text' in changes) {
                    labelCfg.text = changes.text;
                }
                hasPendingChanges = true;
            }
        }

        labelBBox = me.getMarkerBBox('labels', labelId, true);
        if (!labelBBox) {
            me.putMarker('labels', labelCfg, labelId);
            labelBBox = me.getMarkerBBox('labels', labelId, true);
        }

        halfHeight = labelBBox.height / 2;
        labelX = dataX;

        switch (labelTpl.attr.display) {
            case 'under':
                labelY = dataY - halfHeight - labelOverflowPadding;
                break;
            case 'rotate':
                labelX += labelOverflowPadding;
                labelY = dataY - labelOverflowPadding;
                labelCfg.rotationRads = -Math.PI / 4;
                break;
            default: // 'over'
                labelY = dataY + halfHeight + labelOverflowPadding;
        }

        labelCfg.x = surfaceMatrix.x(labelX, labelY);
        labelCfg.y = surfaceMatrix.y(labelX, labelY);

        if (hasPendingChanges) {
            Ext.apply(labelCfg, changes);
        }

        me.putMarker('labels', labelCfg, labelId);
    },

    drawMarker: function (x, y, index) {
        var me = this,
            attr = me.attr,
            renderer = attr.renderer,
            surfaceMatrix = me.surfaceMatrix,
            markerCfg = {};

        if (renderer && me.boundMarkers.markers) {
            markerCfg.type = 'marker';
            markerCfg.x = x;
            markerCfg.y = y;
            markerCfg = renderer.call(me, me, markerCfg, me.rendererData, index) || {};
        }
        markerCfg.translationX = surfaceMatrix.x(x, y);
        markerCfg.translationY = surfaceMatrix.y(x, y);
        me.putMarker('markers', markerCfg, index, !renderer);
    },

    drawStroke: function (surface, ctx, start, end, list, xAxis) {
        var me = this,
            isSmooth = me.attr.smooth && me.smoothX && me.smoothY;

        if (isSmooth) {
            me.drawSmoothStroke(surface, ctx, start, end, list, xAxis);
        } else {
            me.drawStraightStroke(surface, ctx, start, end, list, xAxis);
        }
    },

    renderAggregates: function (aggregates, start, end, surface, ctx, clip, rect) {
        var me = this,
            attr = me.attr,
            dataX = attr.dataX,
            dataY = attr.dataY,
            labels = attr.labels,
            xAxis = attr.xAxis,
            yCap = attr.yCap,
            isSmooth = attr.smooth && me.smoothX && me.smoothY,
            drawLabels = labels && me.getBoundMarker('labels'),
            drawMarkers = me.getBoundMarker('markers'),
            matrix = attr.matrix,
            pixel = surface.devicePixelRatio,
            xx = matrix.getXX(),
            yy = matrix.getYY(),
            dx = matrix.getDX(),
            dy = matrix.getDY(),
            list = me.list || (me.list = []),
            minXs = aggregates.minX,
            maxXs = aggregates.maxX,
            minYs = aggregates.minY,
            maxYs = aggregates.maxY,
            idx = aggregates.startIdx,
            isContinuousLine = true,
            xAxisOrigin, isVerticalX,
            x, y, i, index;

        me.rendererData = {store: me.getStore()};
        list.length = 0;

        // Say we have 7 y-items (attr.dataY): [20, 19, 17, 15, 11, 10, 14]
        //         and 7 x-items (attr.dataX): [0,   1,  2,  3,  4,  5,  6].
        // Then aggregates.startIdx is an aggregated index,
        // where every other item is skipped on each aggregation level:
        // [0, 1, 2, 3, 4, 5, 6,
        //  0, 2, 4, 6,
        //  0, 4,
        //  0]
        // aggregates.minY
        // [20, 19, 17, 15, 11, 10, 14,
        //  19, 15, 10, 14,
        //  15, 10,
        //  10]
        // aggregates.maxY
        // [20, 19, 17, 15, 11, 10, 14,
        //  20, 17, 11, 14,
        //  20, 14,
        //  20]
        // aggregates.minX is
        // [0, 1, 2, 3, 4, 5, 6,
        //  1, 3, 5, 6, // TODO: why this order for min?
        //  3, 5,       // TODO: why this inconsistency?
        //  5]
        // aggregates.maxX is
        // [0, 1, 2, 3, 4, 5, 6,
        //  0, 2, 4, 6,
        //  0, 6,
        //  0]

        // Create a list of the form [x0, y0, idx0, x1, y1, idx1, ...],
        // where each x,y pair is a coordinate representing original data point
        // at the idx position.
        for (i = start; i < end; i++) {
            var minX = minXs[i],
                maxX = maxXs[i],
                minY = minYs[i],
                maxY = maxYs[i];

            if (minX < maxX) {
                list.push(minX * xx + dx, minY * yy + dy, idx[i]);
                list.push(maxX * xx + dx, maxY * yy + dy, idx[i]);
            } else if (minX > maxX) {
                list.push(maxX * xx + dx, maxY * yy + dy, idx[i]);
                list.push(minX * xx + dx, minY * yy + dy, idx[i]);
            } else {
                list.push(maxX * xx + dx, maxY * yy + dy, idx[i]);
            }
        }

        if (list.length) {
            for (i = 0; i < list.length; i += 3) {
                x = list[i];
                y = list[i + 1];
                if (Ext.isNumber(x + y)) {
                    if (y > yCap) {
                        y = yCap;
                    } else if (y < -yCap) {
                        y = -yCap;
                    }
                    list[i + 1] = y;
                } else {
                    isContinuousLine = false;
                    continue;
                }
                index = list[i + 2];
                if (drawMarkers) {
                    me.drawMarker(x, y, index);
                }
                if (drawLabels && labels[index]) {
                    me.drawLabel(labels[index], x, y, index, rect);
                }
            }

            me.isContinuousLine = isContinuousLine;
            if (isSmooth && !isContinuousLine) {
                Ext.Error.raise("Line smoothing in only supported for gapless data, " +
                    "where all data points are finite numbers.");
            }

            if (xAxis) {
                isVerticalX = xAxis.getAlignment() === 'vertical';
                if (Ext.isNumber(xAxis.floatingAtCoord)) {
                    xAxisOrigin = (isVerticalX ? rect[2] : rect[3]) - xAxis.floatingAtCoord;
                } else {
                    xAxisOrigin = isVerticalX ? rect[0] : rect[1];
                }
            } else {
                xAxisOrigin = attr.flipXY ? rect[0] : rect[1];
            }

            if (attr.preciseStroke) {
                if (attr.fillArea) {
                    ctx.fill();
                }
                if (attr.transformFillStroke) {
                    attr.inverseMatrix.toContext(ctx);
                }
                me.drawStroke(surface, ctx, start, end, list, xAxisOrigin);
                if (attr.transformFillStroke) {
                    attr.matrix.toContext(ctx);
                }
                ctx.stroke();
            } else {
                me.drawStroke(surface, ctx, start, end, list, xAxisOrigin);

                if (isContinuousLine && isSmooth && attr.fillArea && !attr.renderer) {
                    var lastPointX = dataX[dataX.length - 1] * xx + dx + pixel,
                        lastPointY = dataY[dataY.length - 1] * yy + dy,
                        firstPointX = dataX[0] * xx + dx - pixel,
                        firstPointY = dataY[0] * yy + dy;
                    ctx.lineTo(lastPointX, lastPointY);
                    ctx.lineTo(lastPointX, xAxisOrigin - attr.lineWidth);
                    ctx.lineTo(firstPointX, xAxisOrigin - attr.lineWidth);
                    ctx.lineTo(firstPointX, firstPointY);
                }

                if (attr.transformFillStroke) {
                    attr.matrix.toContext(ctx);
                }
                // Prevent the reverse transform to fix floating point error.
                if (attr.fillArea) {
                    ctx.fillStroke(attr, true);
                } else {
                    ctx.stroke(true);
                }
            }
        }
    }
});