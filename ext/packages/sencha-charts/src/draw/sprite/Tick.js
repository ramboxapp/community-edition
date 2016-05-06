/**
 * A veritical line sprite. The x and y configs set the center of the line with the size 
 * value determining the height of the line (the line will be twice the height of 'size' 
 * since 'size' is added to above and below 'y' to set the line endpoints).
 *
 *     @example
 *     Ext.create({
 *        xtype: 'draw', 
 *        renderTo: document.body,
 *        width: 600,
 *        height: 400,
 *        sprites: [{
 *            type: 'tick',
 *            x: 20,
 *            y: 40,
 *            size: 10,
 *            strokeStyle: '#388FAD',
 *            lineWidth: 2
 *        }]
 *     });
 */
Ext.define('Ext.draw.sprite.Tick', {
    extend: 'Ext.draw.sprite.Line',
    alias: 'sprite.tick',

    inheritableStatics: {
        def: {
            processors: {
                /**
                 * @cfg {Object} x The position of the center of the sprite on the x-axis.
                 */
                x: 'number',
                /**
                 * @cfg {Object} y The position of the center of the sprite on the y-axis.
                 */
                y: 'number',
                /**
                 * @cfg {Number} [size=4] The size of the sprite.
                 * Meant to be comparable to the size of a circle sprite with the same radius.
                 */
                size: 'number'
            },
            defaults: {
                x: 0,
                y: 0,
                size: 4
            },
            triggers: {
                x: 'tick',
                y: 'tick',
                size: 'tick'
            },
            updaters: {
                tick: function (attr) {
                    var size = attr.size * 1.5,
                        halfLineWidth = attr.lineWidth / 2,
                        x = attr.x,
                        y = attr.y;
                    this.setAttributes({
                        fromX: x - halfLineWidth,
                        fromY: y - size,
                        toX: x - halfLineWidth,
                        toY: y + size
                    });
                }
            }
        }
    }

});