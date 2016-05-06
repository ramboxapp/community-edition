/**
 * @class Ext.draw.sprite.Ellipse
 * @extends Ext.draw.sprite.Path
 * 
 * A sprite that represents an ellipse.
 *
 *     @example
 *     Ext.create({
 *        xtype: 'draw', 
 *        renderTo: document.body,
 *        width: 600,
 *        height: 400,
 *        sprites: [{
 *            type: 'ellipse',
 *            cx: 100,
 *            cy: 100,
 *            rx: 80,
 *            ry: 50,
 *            fillStyle: '#1F6D91'
 *        }]
 *     });
 */
Ext.define("Ext.draw.sprite.Ellipse", {
    extend: "Ext.draw.sprite.Path",
    alias: 'sprite.ellipse',
    type: 'ellipse',
    inheritableStatics: {
        def: {
            processors: {
                /**
                 * @cfg {Number} [cx=0] The center coordinate of the sprite on the x-axis.
                 */
                cx: "number",
                
                /**
                 * @cfg {Number} [cy=0] The center coordinate of the sprite on the y-axis.
                 */
                cy: "number",
                
                /**
                 * @cfg {Number} [rx=1] The radius of the sprite on the x-axis.
                 */
                rx: "number",

                /**
                 * @cfg {Number} [ry=1] The radius of the sprite on the y-axis.
                 */
                ry: "number",

                /**
                 * @cfg {Number} [axisRotation=0] The rotation of the sprite about its axis.
                 */
                axisRotation: "number"
            },
            aliases: {
                radius: "r",
                x: "cx",
                y: "cy",
                centerX: "cx",
                centerY: "cy",
                radiusX: "rx",
                radiusY: "ry"
            },
            defaults: {
                cx: 0,
                cy: 0,
                rx: 1,
                ry: 1,
                axisRotation: 0
            },
            triggers: {
                cx: 'path',
                cy: 'path',
                rx: 'path',
                ry: 'path',
                axisRotation: 'path'
            }
        }
    },

    updatePlainBBox: function (plain) {
        var attr = this.attr,
            cx = attr.cx,
            cy = attr.cy,
            rx = attr.rx,
            ry = attr.ry;
        plain.x = cx - rx;
        plain.y = cy - ry;
        plain.width = rx + rx;
        plain.height = ry + ry;
    },

    updateTransformedBBox: function (transform) {
        var attr = this.attr,
            cx = attr.cx,
            cy = attr.cy,
            rx = attr.rx,
            ry = attr.ry,
            rxy = ry / rx,
            matrix = attr.matrix.clone(),
            xx, xy, yx, yy, dx, dy, w, h;
        matrix.append(1, 0, 0, rxy, 0, cy * (1 - rxy));
        xx = matrix.getXX();
        yx = matrix.getYX();
        dx = matrix.getDX();
        xy = matrix.getXY();
        yy = matrix.getYY();
        dy = matrix.getDY();
        w = Math.sqrt(xx * xx + yx * yx) * rx;
        h = Math.sqrt(xy * xy + yy * yy) * rx;
        transform.x = cx * xx + cy * yx + dx - w;
        transform.y = cx * xy + cy * yy + dy - h;
        transform.width = w + w;
        transform.height = h + h;
    },

    updatePath: function (path, attr) {
        path.ellipse(attr.cx, attr.cy, attr.rx, attr.ry, attr.axisRotation, 0, Math.PI * 2, false);
    }
});