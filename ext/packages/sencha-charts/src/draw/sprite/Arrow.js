/**
 * A sprite that represents an arrow.
 *
 *     @example
 *     Ext.create({
 *        xtype: 'draw', 
 *        renderTo: document.body,
 *        width: 600,
 *        height: 400,
 *        sprites: [{
 *            type: 'arrow',
 *            translationX: 100,
 *            translationY: 100,
 *            size: 40,
 *            fillStyle: '#30BDA7'
 *        }]
 *     });
 */
Ext.define('Ext.draw.sprite.Arrow', {
    extend: 'Ext.draw.sprite.Path',
    alias: 'sprite.arrow',

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
        var s = attr.size * 1.5,
            x = attr.x - attr.lineWidth / 2,
            y = attr.y;
        path.fromSvgString('M'.concat(x - s * 0.7, ',', y - s * 0.4, 'l', [s * 0.6, 0, 0, -s * 0.4, s, s * 0.8, -s, s * 0.8, 0, -s * 0.4, -s * 0.6, 0], 'z'));
    }

});