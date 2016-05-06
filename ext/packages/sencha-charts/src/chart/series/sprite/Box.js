/**
 * @class Ext.chart.series.sprite.Box
 * @extends Ext.draw.sprite.Sprite
 *
 * A sprite that represents a 3D bar or column.
 * Used as an item template by the {@link Ext.chart.series.sprite.Bar3D} marker holder.
 *
 */
Ext.define('Ext.chart.series.sprite.Box', {
    extend: 'Ext.draw.sprite.Sprite',
    alias: 'sprite.box',
    type: 'box',

    inheritableStatics: {
        def: {
            processors: {
                /**
                 * @cfg {Number} [x=0]
                 * The position of the sprite on the x-axis.
                 * Corresponds to the center of the front face of the box.
                 */
                x: 'number',
                /**
                 * @cfg {Number} [y=0]
                 * The position of the sprite on the y-axis.
                 * Corresponds to the top of the front face of the box.
                 */
                y: 'number',
                /**
                 * @cfg {Number} [width=8] The width of the box.
                 */
                width: 'number',
                /**
                 * @cfg {Number} [height=8] The height of the box.
                 */
                height: 'number',
                /**
                 * @cfg {Number} [depth=8] The depth of the box.
                 */
                depth: 'number',
                /**
                 * @cfg {String} [orientation='vertical'] The orientation of the box.
                 */
                orientation: 'enums(vertical,horizontal)',
                /**
                 * @cfg {Boolean} [showStroke=false]
                 * Whether to render the stroke or not.
                 */
                showStroke: 'bool',
                /**
                 * @cfg {Number} [saturationFactor=1]
                 * The factor applied to the saturation of the box.
                 */
                saturationFactor: 'number',
                /**
                 * @cfg {Number} [brightnessFactor=1]
                 * The factor applied to the brightness of the box.
                 */
                brightnessFactor: 'number'
            },
            triggers: {
                x: 'bbox',
                y: 'bbox',
                width: 'bbox',
                height: 'bbox',
                depth: 'bbox',
                orientation: 'bbox'
            },
            defaults: {
                x: 0,
                y: 0,
                width: 8,
                height: 8,
                depth: 8,
                orientation: 'vertical',
                showStroke: false,
                saturationFactor: 1,
                brightnessFactor: 1,
                lineJoin: 'bevel'
            }
        }
    },

    constructor: function (config) {
        this.callParent([config]);

        this.topGradient = new Ext.draw.gradient.Linear({});
        this.rightGradient = new Ext.draw.gradient.Linear({});
        this.frontGradient = new Ext.draw.gradient.Linear({});
    },

    updatePlainBBox: function (plain) {
        var attr = this.attr,
            x = attr.x,
            y = attr.y,
            width = attr.width,
            height = attr.height,
            depth = attr.depth;

        plain.x = x - width * 0.5;
        plain.width = width + depth;

        if (height > 0) {
            plain.y = y;
            plain.height = height + depth;
        } else {
            plain.y = y + depth;
            plain.height = height - depth;
        }
    },

    render: function (surface, ctx) {
        var me = this,
            attr = me.attr,
            center = attr.x,
            top = attr.y,
            bottom = top + attr.height,
            isNegative = top < bottom,
            halfWidth = attr.width * 0.5,
            depth = attr.depth,
            isHorizontal = attr.orientation === 'horizontal',
            isTransparent = attr.globalAlpha < 1,
            fillStyle = attr.fillStyle,
            color = Ext.draw.Color.create(
                fillStyle.isGradient ?
                fillStyle.getStops()[0].color :
                fillStyle
            ),
            saturationFactor = attr.saturationFactor,
            brightnessFactor = attr.brightnessFactor,
            hsv = color.getHSV(),
            bbox = {},
            temp;

        if (!attr.showStroke) {
            ctx.strokeStyle = Ext.draw.Color.RGBA_NONE;
        }

        if (isNegative) {
            temp = top;
            top = bottom;
            bottom = temp;
        }

        // Refresh gradients based on sprite's fillStyle attribute.

        me.topGradient.setDegrees(isHorizontal ? 0 : 80);
        me.topGradient.setStops([
            {
                offset: 0,
                color: Ext.draw.Color.fromHSV(
                    hsv[0],
                    Ext.Number.constrain(hsv[1] * saturationFactor, 0, 1),
                    Ext.Number.constrain(0.6 * brightnessFactor, 0, 1)
                )
            },
            {
                offset: 1,
                color: Ext.draw.Color.fromHSV(
                    hsv[0],
                    Ext.Number.constrain(hsv[1] * saturationFactor, 0, 1),
                    Ext.Number.constrain(0.39 * brightnessFactor, 0, 1)
                )
            }
        ]);

        me.rightGradient.setDegrees(isHorizontal ? 45 : 90);
        me.rightGradient.setStops([
            {
                offset: 0,
                color: Ext.draw.Color.fromHSV(
                    hsv[0],
                    Ext.Number.constrain(hsv[1] * saturationFactor, 0, 1),
                    Ext.Number.constrain(0.36 * brightnessFactor, 0, 1)
                )
            },
            {
                offset: 1,
                color: Ext.draw.Color.fromHSV(
                    hsv[0],
                    Ext.Number.constrain(hsv[1] * 1.4 * saturationFactor, 0, 1),
                    Ext.Number.constrain(0.18 * brightnessFactor, 0, 1)
                )
            }
        ]);

        if (isHorizontal) {
            me.frontGradient.setDegrees(0); // 0° angle looks like 90° angle because the chart is flipped
        } else {
            me.frontGradient.setRadians(Math.atan2(top - bottom, halfWidth * 2));
        }

        me.frontGradient.setStops([
            {
                offset: 0,
                color: Ext.draw.Color.fromHSV(
                    hsv[0],
                    Ext.Number.constrain(hsv[1] * 0.9 * saturationFactor, 0, 1),
                    Ext.Number.constrain(0.6 * brightnessFactor, 0, 1)
                )
            },
            {
                offset: 1,
                color: Ext.draw.Color.fromHSV(
                    hsv[0],
                    Ext.Number.constrain(hsv[1] * 1.1 * saturationFactor, 0, 1),
                    Ext.Number.constrain(0.27 * brightnessFactor, 0, 1)
                )
            }
        ]);

        if (isTransparent || isNegative) {
            // Bottom side.

            ctx.beginPath();
            ctx.moveTo(center - halfWidth, bottom);
            ctx.lineTo(center - halfWidth + depth, bottom + depth);
            ctx.lineTo(center + halfWidth + depth, bottom + depth);
            ctx.lineTo(center + halfWidth, bottom);
            ctx.lineTo(center - halfWidth, bottom);

            bbox.x = center - halfWidth;
            bbox.y = top;
            bbox.width = halfWidth + depth;
            bbox.height = depth;

            ctx.fillStyle = (isHorizontal ? me.rightGradient : me.topGradient).generateGradient(ctx, bbox);

            ctx.fillStroke(attr);
        }

        if (isTransparent) {
            // Left side.

            ctx.beginPath();
            ctx.moveTo(center - halfWidth, top);
            ctx.lineTo(center - halfWidth + depth, top + depth);
            ctx.lineTo(center - halfWidth + depth, bottom + depth);
            ctx.lineTo(center - halfWidth, bottom);
            ctx.lineTo(center - halfWidth, top);

            bbox.x = center + halfWidth;
            bbox.y = bottom;
            bbox.width = depth;
            bbox.height = top + depth - bottom;

            ctx.fillStyle = (isHorizontal ? me.topGradient : me.rightGradient).generateGradient(ctx, bbox);

            ctx.fillStroke(attr);
        }

        // Top side.

        ctx.beginPath();
        ctx.moveTo(center - halfWidth, top);
        ctx.lineTo(center - halfWidth + depth, top + depth);
        ctx.lineTo(center + halfWidth + depth, top + depth);
        ctx.lineTo(center + halfWidth, top);
        ctx.lineTo(center - halfWidth, top);

        bbox.x = center - halfWidth;
        bbox.y = top;
        bbox.width = halfWidth + depth;
        bbox.height = depth;

        ctx.fillStyle = (isHorizontal ? me.rightGradient : me.topGradient).generateGradient(ctx, bbox);

        ctx.fillStroke(attr);

        // Right side.

        ctx.beginPath();
        ctx.moveTo(center + halfWidth, top);
        ctx.lineTo(center + halfWidth + depth, top + depth);
        ctx.lineTo(center + halfWidth + depth, bottom + depth);
        ctx.lineTo(center + halfWidth, bottom);
        ctx.lineTo(center + halfWidth, top);

        bbox.x = center + halfWidth;
        bbox.y = bottom;
        bbox.width = depth;
        bbox.height = top + depth - bottom;

        ctx.fillStyle = (isHorizontal ? me.topGradient : me.rightGradient).generateGradient(ctx, bbox);

        ctx.fillStroke(attr);

        // Front side.

        ctx.beginPath();
        ctx.moveTo(center - halfWidth, bottom);
        ctx.lineTo(center - halfWidth, top);
        ctx.lineTo(center + halfWidth, top);
        ctx.lineTo(center + halfWidth, bottom);
        ctx.lineTo(center - halfWidth, bottom);

        bbox.x = center - halfWidth;
        bbox.y = bottom;
        bbox.width = halfWidth * 2;
        bbox.height = top - bottom;

        ctx.fillStyle = me.frontGradient.generateGradient(ctx, bbox);

        ctx.fillStroke(attr);
    }

});