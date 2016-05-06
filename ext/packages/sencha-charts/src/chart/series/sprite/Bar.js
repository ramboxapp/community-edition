/**
 * @class Ext.chart.series.sprite.Bar
 * @extends Ext.chart.series.sprite.StackedCartesian
 *
 * Draws a sprite used in the bar series.
 */
Ext.define('Ext.chart.series.sprite.Bar', {
    alias: 'sprite.barSeries',
    extend: 'Ext.chart.series.sprite.StackedCartesian',

    inheritableStatics: {
        def: {
            processors: {
                /**
                 * @cfg {Number} [minBarWidth=2] The minimum bar width.
                 */
                minBarWidth: 'number',

                /**
                 * @cfg {Number} [maxBarWidth=100] The maximum bar width.
                 */
                maxBarWidth: 'number',

                /**
                 * @cfg {Number} [minGapWidth=5] The minimum gap between bars.
                 */
                minGapWidth: 'number',

                /**
                 * @cfg {Number} [radius=0] The degree of rounding for rounded bars.
                 */
                radius: 'number',

                /**
                 * @cfg {Number} [inGroupGapWidth=3] The gap between grouped bars.
                 */
                inGroupGapWidth: 'number'
            },
            defaults: {
                minBarWidth: 2,
                maxBarWidth: 100,
                minGapWidth: 5,
                inGroupGapWidth: 3,
                radius: 0
            }
        }
    },

    drawLabel: function (text, dataX, dataStartY, dataY, labelId) {
        var me = this,
            attr = me.attr,
            label = me.getBoundMarker('labels')[0],
            labelTpl = label.getTemplate(),
            labelCfg = me.labelCfg || (me.labelCfg = {}),
            surfaceMatrix = me.surfaceMatrix,
            labelOverflowPadding = attr.labelOverflowPadding,
            labelDisplay = labelTpl.attr.display,
            labelOrientation = labelTpl.attr.orientation,
            labelY, halfWidth, labelBBox,
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

        // Set defaults
        if (!attr.flipXY) {
            labelCfg.rotationRads = -Math.PI * 0.5;
        } else {
            labelCfg.rotationRads = 0;
        }
        labelCfg.calloutVertical = !attr.flipXY;

        // Check if we have a specific orientation specified, if so, set
        // the appropriate values.
        switch (labelOrientation) {
            case 'horizontal': 
                labelCfg.rotationRads = 0;              
                labelCfg.calloutVertical = false;
                break;
            case 'vertical': 
                labelCfg.rotationRads = -Math.PI * 0.5; 
                labelCfg.calloutVertical = true;
                break;
        }

        labelCfg.text = text;

        if (labelTpl.attr.renderer) {
            changes = labelTpl.attr.renderer.call(this, text, label, labelCfg, {store: this.getStore()}, labelId);
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

        halfWidth = (labelBBox.width / 2 + labelOverflowPadding);
        if (dataStartY > dataY) {
            halfWidth = -halfWidth;
        }

        if ((labelOrientation === 'horizontal' && attr.flipXY) || (labelOrientation === 'vertical' && !attr.flipXY) || !labelOrientation) {
            labelY = (labelDisplay === 'insideStart') ? dataStartY + halfWidth : dataY - halfWidth;
        } else {
            labelY = (labelDisplay === 'insideStart') ? dataStartY + labelOverflowPadding * 2 : dataY - labelOverflowPadding * 2;
        }
        labelCfg.x = surfaceMatrix.x(dataX, labelY);
        labelCfg.y = surfaceMatrix.y(dataX, labelY);

        labelY = (labelDisplay === 'insideStart') ? dataStartY - halfWidth : dataY + halfWidth;
        labelCfg.calloutPlaceX = surfaceMatrix.x(dataX, labelY);
        labelCfg.calloutPlaceY = surfaceMatrix.y(dataX, labelY);

        labelY = (labelDisplay === 'insideStart') ? dataStartY : dataY;
        labelCfg.calloutStartX = surfaceMatrix.x(dataX, labelY);
        labelCfg.calloutStartY = surfaceMatrix.y(dataX, labelY);
        if (dataStartY > dataY) {
            halfWidth = -halfWidth;
        }
        if (Math.abs(dataY - dataStartY) <= halfWidth * 2 || labelDisplay === 'outside') {
            labelCfg.callout = 1;
        } else {
            labelCfg.callout = 0;
        }

        if (hasPendingChanges) {
            Ext.apply(labelCfg, changes);
        }

        me.putMarker('labels', labelCfg, labelId);
    },

    drawBar: function (ctx, surface, clip, left, top, right, bottom, index) {
        var me = this,
            itemCfg = {},
            renderer = me.attr.renderer,
            changes;

        itemCfg.x = left;
        itemCfg.y = top;
        itemCfg.width = right - left;
        itemCfg.height = bottom - top;
        itemCfg.radius = me.attr.radius;

        if (renderer) {
            changes = renderer.call(me, me, itemCfg, {store: me.getStore()}, index);
            Ext.apply(itemCfg, changes);
        }
        me.putMarker('items', itemCfg, index, !renderer);
    },

    /**
     * @inheritdoc
     */
    renderClipped: function (surface, ctx, clip, rect) {
        if (this.cleanRedraw) {
            return;
        }
        var me = this,
            attr = me.attr,
            dataX = attr.dataX,
            dataY = attr.dataY,
            dataText = attr.labels,
            dataStartY = attr.dataStartY,
            groupCount = attr.groupCount,
            groupOffset = attr.groupOffset - (groupCount - 1) * 0.5,
            inGroupGapWidth = attr.inGroupGapWidth,
            lineWidth = ctx.lineWidth,
            matrix = attr.matrix,
            xx = matrix.elements[0],
            yy = matrix.elements[3],
            dx = matrix.elements[4],
            dy = surface.roundPixel(matrix.elements[5]) - 1,
            maxBarWidth = (xx < 0 ? -1 : 1) * xx - attr.minGapWidth,
            minBarWidth = ( Math.min(maxBarWidth, attr.maxBarWidth) - inGroupGapWidth * (groupCount - 1) ) / groupCount,
            barWidth = surface.roundPixel( Math.max(attr.minBarWidth, minBarWidth) ),
            surfaceMatrix = me.surfaceMatrix,
            left, right, bottom, top, i, center,
            halfLineWidth = 0.5 * attr.lineWidth,
            min = Math.min(clip[0], clip[2]),
            max = Math.max(clip[0], clip[2]),
            start = Math.max(0, Math.floor(min)),
            end = Math.min(dataX.length - 1, Math.ceil(max)),
            drawMarkers = dataText && me.getBoundMarker('labels'),
            yLow, yHi;

        for (i = start; i <= end; i++) {
            yLow = dataStartY ? dataStartY[i] : 0;
            yHi = dataY[i];
            center = dataX[i] * xx + dx + groupOffset * (barWidth + inGroupGapWidth);
            left = surface.roundPixel(center - barWidth / 2) + halfLineWidth;
            top = surface.roundPixel(yHi * yy + dy + lineWidth);
            right = surface.roundPixel(center + barWidth / 2) - halfLineWidth;
            bottom = surface.roundPixel(yLow * yy + dy + lineWidth);

            me.drawBar(ctx, surface, clip, left, top - halfLineWidth, right, bottom - halfLineWidth, i);

            // We want 0 values to be passed to the renderer
            if (drawMarkers && dataText[i] != null) {
                me.drawLabel(dataText[i], center, bottom, top, i);
            }
            me.putMarker('markers', {
                translationX: surfaceMatrix.x(center, top),
                translationY: surfaceMatrix.y(center, top)
            }, i, true);
        }
    },

    /**
     * @inheritdoc
     */
    getIndexNearPoint: function (x, y) {
        var sprite = this,
            attr = sprite.attr,
            dataX = attr.dataX,
            surface = sprite.getSurface(),
            surfaceRect = surface.getRect() || [0,0,0,0],
            surfaceHeight = surfaceRect[3],
            hitX, hitY,
            i, bbox,
            index = -1;

        // The "items" sprites that draw the bars work in a reverse vertical coordinate system
        // starting with 0 at the bottom and increasing the Y coordinate toward the top.
        // See also Ext.chart.series.Bar.getItemForPoint(x,y) regarding the chart's innerPadding.
        if (attr.flipXY) {
            hitX = surfaceHeight - y;
            if (surface.getInherited().rtl) {
                hitY = surfaceRect[2] - x;
            } else {
                hitY = x;
            }
        } else {
            hitX = x;
            hitY = surfaceHeight - y;
        }

        for (i = 0; i < dataX.length; i++) {
            bbox = sprite.getMarkerBBox('items', i);
            if (Ext.draw.Draw.isPointInBBox(hitX, hitY, bbox)) {
                index = i;
                break;
            }
        }
        return index;
    }

});
