/**
 * @class Ext.draw.sprite.EllipticalArc
 * @extends Ext.draw.sprite.Ellipse
 *
 * A sprite that represents an elliptical arc.
 *
 *     @example
 *     Ext.create({
 *        xtype: 'draw', 
 *        renderTo: document.body,
 *        width: 600,
 *        height: 400,
 *        sprites: [{
 *            type: 'ellipticalArc',
 *            cx: 100,
 *            cy: 100,
 *            rx: 80,
 *            ry: 50,
 *            fillStyle: '#1F6D91',
 *            startAngle: 0,
 *            endAngle: Math.PI,
 *            anticlockwise: true
 *        }]
 *     });
 */
Ext.define('Ext.draw.sprite.EllipticalArc', {
    extend: 'Ext.draw.sprite.Ellipse',
    alias: 'sprite.ellipticalArc',
    type: 'ellipticalArc',
    inheritableStatics: {
        def: {
            processors: {
                /**
                 * @cfg {Number} [startAngle=0] The beginning angle of the arc.
                 */
                startAngle: 'number',

                /**
                 * @cfg {Number} [endAngle=Math.PI*2] The ending angle of the arc.
                 */
                endAngle: 'number',

                /**
                 * @cfg {Boolean} [anticlockwise=false] Determines whether or not the arc is drawn clockwise.
                 */
                anticlockwise: 'bool'
            },
            aliases: {
                from: 'startAngle',
                to: 'endAngle',
                start: 'startAngle',
                end: 'endAngle'
            },
            defaults: {
                startAngle: 0,
                endAngle: Math.PI * 2,
                anticlockwise: false
            },
            triggers: {
                startAngle: 'path',
                endAngle: 'path',
                anticlockwise: 'path'
            }
        }
    },

    updatePath: function (path, attr) {
        path.ellipse(attr.cx, attr.cy, attr.rx, attr.ry, attr.axisRotation, attr.startAngle, attr.endAngle, attr.anticlockwise);
    }
});