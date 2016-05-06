/**
 * A sprite that represents a triangle.
 *
 *     @example
 *     Ext.create({
 *        xtype: 'draw', 
 *        renderTo: document.body,
 *        width: 600,
 *        height: 400,
 *        sprites: [{
 *            type: 'triangle',
 *            size: 50,
 *            translationX: 100,
 *            translationY: 100,
 *            fillStyle: '#1F6D91'
 *        }]
 *     });
 * 
 */
Ext.define('Ext.draw.sprite.Triangle', {
    extend: 'Ext.draw.sprite.Path',
    alias: 'sprite.triangle',

    inheritableStatics: {
        def: {
            processors: {
                x: 'number',
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
                x: 'path',
                y: 'path',
                size: 'path'
            }
        }
    },

    updatePath: function (path, attr) {
        var s = attr.size * 2.2,
            x = attr.x,
            y = attr.y;
        path.fromSvgString('M'.concat(x, ',', y, 'm0-', s * 0.58, 'l', s * 0.5, ',', s * 0.87, '-', s, ',0z'));
    }

});