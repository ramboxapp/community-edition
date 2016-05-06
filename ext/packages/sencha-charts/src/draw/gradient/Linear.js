/**
 * Linear gradient.
 *
 *     @example
 *     Ext.create({
 *        xtype: 'draw', 
 *        renderTo: document.body,
 *        width: 600,
 *        height: 400,
 *        sprites: [{
 *            type: 'circle',
 *            cx: 100,
 *            cy: 100,
 *            r: 100,
 *            fillStyle: {
 *                type: 'linear',
 *                degrees: 180,
 *                stops: [{
 *                    offset: 0,
 *                    color: '#1F6D91'
 *                }, {
 *                    offset: 1,
 *                    color: '#90BCC9'
 *                }]
 *            }
 *        }]
 *     });
 */
Ext.define('Ext.draw.gradient.Linear', {
    extend: 'Ext.draw.gradient.Gradient',
    requires: ['Ext.draw.Color'],
    type: 'linear',
    config: {
        /**
         * @cfg {Number}
         * The angle of rotation of the gradient in degrees.
         */
        degrees: 0,
        /**
         * @cfg {Number}
         * The angle of rotation of the gradient in radians.
         */
        radians: 0
    },

    applyRadians: function (radians, oldRadians) {
        if (Ext.isNumber(radians)) {
            return radians;
        }
        return oldRadians;
    },

    applyDegrees: function (degrees, oldDegrees) {
        if (Ext.isNumber(degrees)) {
            return degrees;
        }
        return oldDegrees;
    },

    updateRadians: function (radians) {
        this.setDegrees(Ext.draw.Draw.degrees(radians));
    },

    updateDegrees: function (degrees) {
        this.setRadians(Ext.draw.Draw.rad(degrees));
    },

    /**
     * @inheritdoc
     */
    generateGradient: function (ctx, bbox) {
        var angle = this.getRadians(),
            cos = Math.cos(angle),
            sin = Math.sin(angle),
            w = bbox.width,
            h = bbox.height,
            cx = bbox.x + w * 0.5,
            cy = bbox.y + h * 0.5,
            stops = this.getStops(),
            ln = stops.length,
            gradient,
            l, i;

        if (!isNaN(cx) && !isNaN(cy) && h > 0 && w > 0) {
            l = (Math.sqrt(h * h + w * w) * Math.abs(Math.cos(angle - Math.atan(h / w)))) / 2;
            gradient = ctx.createLinearGradient(
                cx + cos * l, cy + sin * l,
                cx - cos * l, cy - sin * l
            );

            for (i = 0; i < ln; i++) {
                gradient.addColorStop(stops[i].offset, stops[i].color);
            }
            return gradient;
        }
        return Ext.draw.Color.NONE;
    }
});