/**
 * @class Ext.chart.grid.VerticalGrid3D
 * @extends Ext.chart.grid.VerticalGrid
 * 
 * Vertical 3D Grid sprite. Used in 3D Cartesian Charts.
 */
Ext.define('Ext.chart.grid.VerticalGrid3D', {
    extend: 'Ext.chart.grid.VerticalGrid',
    alias: 'grid.vertical3d',

    inheritableStatics: {
        def: {
            processors: {
                depth: 'number'
            },

            defaults: {
                depth: 0
            }
        }
    },

    render_: function (surface, ctx, clipRect) {
        var attr = this.attr,
            x = surface.roundPixel(attr.x),
            halfLineWidth = ctx.lineWidth * 0.5;

        ctx.beginPath();
        ctx.rect(x - halfLineWidth, clipRect[1] - surface.matrix.getDY(), attr.width, clipRect[3]);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x - halfLineWidth, clipRect[1] - surface.matrix.getDY());
        ctx.lineTo(x - halfLineWidth, clipRect[1] + clipRect[3] - surface.matrix.getDY());
        ctx.stroke();
    },

    render: function (surface, ctx, clipRect) {
        var attr = this.attr,
            x = surface.roundPixel(attr.x),
            dy = surface.matrix.getDY(),
            halfLineWidth = ctx.lineWidth * 0.5,
            width = attr.width,
            depth = attr.depth,
            left, top;

        if (x >= clipRect[2]) {
            return;
        }

        // Vertical stripe.

        left = x - halfLineWidth + depth;
        top  = clipRect[1] - depth - dy;

        ctx.beginPath();
        ctx.rect(left, top, width, clipRect[3]);
        ctx.fill();

        // Vertical line.

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, top + clipRect[3]);
        ctx.stroke();

        // Diagonal stripe.

        left = x - halfLineWidth;
        top  = clipRect[3];

        ctx.beginPath();
        ctx.moveTo(left,                 top);
        ctx.lineTo(left + depth,         top - depth);
        ctx.lineTo(left + depth + width, top - depth);
        ctx.lineTo(left + width,         top);
        ctx.closePath();
        ctx.fill();

        // Diagonal line.

        left = x - halfLineWidth;
        top  = clipRect[3];

        ctx.beginPath();
        ctx.moveTo(left,         top);
        ctx.lineTo(left + depth, top - depth);
        ctx.stroke();
    }
});