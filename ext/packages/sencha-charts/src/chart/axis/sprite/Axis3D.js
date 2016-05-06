/**
 * @private
 * @class Ext.chart.axis.sprite.Axis3D
 * @extends Ext.chart.axis.sprite.Axis
 *
 * The {@link Ext.chart.axis.Axis3D 3D axis} sprite.
 * Only 3D cartesian axes are rendered with this sprite.
 */

Ext.define('Ext.chart.axis.sprite.Axis3D', {
    extend: 'Ext.chart.axis.sprite.Axis',
    alias: 'sprite.axis3d',
    type: 'axis3d',

    inheritableStatics: {
        def: {
            processors: {
                depth: 'number'
            },

            defaults: {
                depth: 0
            },

            triggers: {
                depth: 'layout'
            }
        }
    },

    config: {
        fx: {
            customDurations: {
                depth: 0
            }
        }
    },

    doLayout: function () {
        var me = this,
            chart = me.getAxis().getChart();
        if (chart.isInitializing) {
            return;
        }
        var attr = me.attr,
            layout = me.getLayout(),
            depth = layout.isDiscrete ? 0 : attr.depth,
            isRtl = chart.getInherited().rtl,
            min = attr.dataMin + (attr.dataMax - attr.dataMin) * attr.visibleMin,
            max = attr.dataMin + (attr.dataMax - attr.dataMin) * attr.visibleMax,
            context = {
                attr: attr,
                segmenter: me.getSegmenter(),
                renderer: me.doDefaultRender
            };

        if (attr.position === 'left' || attr.position === 'right') {
            attr.translationX = 0;
            attr.translationY = max * (attr.length - depth) / (max - min) + depth;
            attr.scalingX = 1;
            attr.scalingY = (-attr.length + depth) / (max - min);
            attr.scalingCenterY = 0;
            attr.scalingCenterX = 0;
            me.applyTransformations(true);
        } else if (attr.position === 'top' || attr.position === 'bottom') {
            if (isRtl) {
                attr.translationX = attr.length + min * attr.length / (max - min) + 1;
            } else {
                attr.translationX = -min * attr.length / (max - min);
            }
            attr.translationY = 0;
            attr.scalingX = (isRtl ? -1 : 1) * (attr.length - depth) / (max - min);
            attr.scalingY = 1;
            attr.scalingCenterY = 0;
            attr.scalingCenterX = 0;
            me.applyTransformations(true);
        }

        if (layout) {
            layout.calculateLayout(context);
            me.setLayoutContext(context);
        }
    },

    renderAxisLine: function (surface, ctx, layout, clipRect) {
        var me = this,
            attr = me.attr,
            halfLineWidth = attr.lineWidth * 0.5,
            layout = me.getLayout(),
            depth = layout.isDiscrete ? 0 : attr.depth,
            docked = attr.position,
            position, gaugeAngles;

        if (attr.axisLine && attr.length) {
            switch (docked) {
                case 'left':
                    position = surface.roundPixel(clipRect[2]) - halfLineWidth;
                    ctx.moveTo(position, -attr.endGap + depth);
                    ctx.lineTo(position, attr.length + attr.startGap);
                    break;
                case 'right':
                    ctx.moveTo(halfLineWidth, -attr.endGap);
                    ctx.lineTo(halfLineWidth, attr.length + attr.startGap);
                    break;
                case 'bottom':
                    ctx.moveTo(-attr.startGap, halfLineWidth);
                    ctx.lineTo(attr.length - depth + attr.endGap, halfLineWidth);
                    break;
                case 'top':
                    position = surface.roundPixel(clipRect[3]) - halfLineWidth;
                    ctx.moveTo(-attr.startGap, position);
                    ctx.lineTo(attr.length + attr.endGap, position);
                    break;
                case 'angular':
                    ctx.moveTo(attr.centerX + attr.length, attr.centerY);
                    ctx.arc(attr.centerX, attr.centerY, attr.length, 0, Math.PI * 2, true);
                    break;
                case 'gauge':
                    gaugeAngles = me.getGaugeAngles();
                    ctx.moveTo(attr.centerX + Math.cos(gaugeAngles.start) * attr.length,
                        attr.centerY + Math.sin(gaugeAngles.start) * attr.length);
                    ctx.arc(attr.centerX, attr.centerY, attr.length, gaugeAngles.start, gaugeAngles.end, true);
                    break;
            }
        }
    }

});