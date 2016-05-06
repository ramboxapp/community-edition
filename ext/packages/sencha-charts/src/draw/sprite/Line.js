/**
 * A sprite that represents a line.
 *
 *     @example
 *     Ext.create({
 *        xtype: 'draw', 
 *        renderTo: document.body,
 *        width: 600,
 *        height: 400,
 *        sprites: [{
 *            type: 'line',
 *            fromX: 20,
 *            fromY: 20,
 *            toX: 120,
 *            toY: 120,
 *            strokeStyle: '#1F6D91',
 *            lineWidth: 3
 *        }]
 *     });
 */
Ext.define('Ext.draw.sprite.Line', {
    extend: 'Ext.draw.sprite.Sprite',
    alias: 'sprite.line',
    type: 'line',

    inheritableStatics: {
        def: {
            processors: {
                fromX: 'number',
                fromY: 'number',
                toX: 'number',
                toY: 'number'
            },

            defaults: {
                fromX: 0,
                fromY: 0,
                toX: 1,
                toY: 1,
                strokeStyle: 'black'
            },

            aliases: {
                x1: 'fromX',
                y1: 'fromY',
                x2: 'toX',
                y2: 'toY'
            }
        }
    },

    updatePlainBBox: function (plain) {
        var attr = this.attr,
            fromX = Math.min(attr.fromX, attr.toX),
            fromY = Math.min(attr.fromY, attr.toY),
            toX = Math.max(attr.fromX, attr.toX),
            toY = Math.max(attr.fromY, attr.toY);
        plain.x = fromX;
        plain.y = fromY;
        plain.width = toX - fromX;
        plain.height = toY - fromY;
    },

    render: function (surface, ctx) {
        var attr = this.attr,
            matrix = this.attr.matrix;

        matrix.toContext(ctx);

        ctx.beginPath();
        ctx.moveTo(attr.fromX, attr.fromY);
        ctx.lineTo(attr.toX, attr.toY);
        ctx.stroke();
    }
});