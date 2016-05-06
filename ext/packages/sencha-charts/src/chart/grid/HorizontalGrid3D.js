/**
 * @class Ext.chart.grid.HorizontalGrid3D
 * @extends Ext.chart.grid.HorizontalGrid
 *
 * Horizontal 3D Grid sprite. Used in 3D Cartesian Charts.
 */
Ext.define('Ext.chart.grid.HorizontalGrid3D', {
    extend: 'Ext.chart.grid.HorizontalGrid',
    alias: 'grid.horizontal3d',

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

    render: function (surface, ctx, clipRect) {
        var attr = this.attr,
            x = surface.roundPixel(attr.x),
            y = surface.roundPixel(attr.y),
            dx = surface.matrix.getDX(),
            halfLineWidth = ctx.lineWidth * 0.5,
            height = attr.height,
            depth = attr.depth,
            left, top;

        if (y <= clipRect[1]) {
            return;
        }

        // Horizontal stripe.

        left = clipRect[0] + depth - dx;
        top  = y + halfLineWidth - depth;

        ctx.beginPath();
        ctx.rect(left, top, clipRect[2], height);
        ctx.fill();

        // Horizontal line.

        ctx.beginPath();
        ctx.moveTo(left,               top);
        ctx.lineTo(left + clipRect[2], top);
        ctx.stroke();

        // Diagonal stripe.

        left = clipRect[0] + x - dx;
        top  = y + halfLineWidth;

        ctx.beginPath();
        ctx.moveTo(left,         top);
        ctx.lineTo(left + depth, top - depth);
        ctx.lineTo(left + depth, top - depth + height);
        ctx.lineTo(left,         top + height);
        ctx.closePath();
        ctx.fill();

        // Diagonal line.

        ctx.beginPath();
        ctx.moveTo(left,         top);
        ctx.lineTo(left + depth, top - depth);
        ctx.stroke();
    }
});