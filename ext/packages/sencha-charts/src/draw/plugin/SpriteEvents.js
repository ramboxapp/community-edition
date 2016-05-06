/**
 * A draw container {@link Ext.AbstractPlugin plugin} that adds ability to listen
 * to sprite events. For example:
 *
 *     var drawContainer = Ext.create('Ext.draw.Container', {
 *          plugins: ['spriteevents'],
 *          renderTo: Ext.getBody(),
 *          width: 200,
 *          height: 200,
 *          sprites: [{
 *               type: 'circle',
 *               fillStyle: '#79BB3F',
 *               r: 50,
 *               x: 100,
 *               y: 100
 *          }],
 *          listeners: {
 *              spriteclick: function (item, event) {
 *                  var sprite = item && item.sprite;
 *                  if (sprite) {
 *                      sprite.setAttributes({fillStyle: 'red'});
                        sprite.getSurface().renderFrame();
 *                  }
 *              }
 *          }
 *     });
 */
Ext.define('Ext.draw.plugin.SpriteEvents', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.spriteevents',

    requires: ['Ext.draw.PathUtil'],

    /**
     * @event spritemousemove
     * Fires when the mouse is moved on a sprite.
     * @param {Object} sprite
     * @param {Event} event
     */

    /**
     * @event spritemouseup
     * Fires when a mouseup event occurs on a sprite.
     * @param {Object} sprite
     * @param {Event} event
     */

    /**
     * @event spritemousedown
     * Fires when a mousedown event occurs on a sprite.
     * @param {Object} sprite
     * @param {Event} event
     */

    /**
     * @event spritemouseover
     * Fires when the mouse enters a sprite.
     * @param {Object} sprite
     * @param {Event} event
     */

    /**
     * @event spritemouseout
     * Fires when the mouse exits a sprite.
     * @param {Object} sprite
     * @param {Event} event
     */

    /**
     * @event spriteclick
     * Fires when a click event occurs on a sprite.
     * @param {Object} sprite
     * @param {Event} event
     */

    /**
     * @event spritedblclick
     * Fires when a double click event occurs on a sprite.
     * @param {Object} sprite
     * @param {Event} event
     */

    /**
     * @event spritetap
     * Fires when a tap event occurs on a sprite.
     * @param {Object} sprite
     * @param {Event} event
     */

    mouseMoveEvents: {
        mousemove: true,
        mouseover: true,
        mouseout: true
    },

    spriteMouseMoveEvents: {
        spritemousemove: true,
        spritemouseover: true,
        spritemouseout: true
    },

    init: function (drawContainer) {
        var handleEvent = 'handleEvent';

        this.drawContainer = drawContainer;

        drawContainer.addElementListener({
            click: handleEvent,
            dblclick: handleEvent,
            mousedown: handleEvent,
            mousemove: handleEvent,
            mouseup: handleEvent,
            mouseover: handleEvent,
            mouseout: handleEvent,
            // run our handlers before user code
            priority: 1001,
            scope: this
        });
    },

    hasSpriteMouseMoveListeners: function () {
        var listeners = this.drawContainer.hasListeners,
            name;
        for (name in this.spriteMouseMoveEvents) {
            if (name in listeners) {
                return true;
            }
        }
        return false;
    },

    hitTestEvent: function (e) {
        var items = this.drawContainer.getItems(),
            surface, sprite, i;

        for (i = items.length - 1; i >= 0; i--) {
            surface = items.get(i);
            sprite = surface.hitTestEvent(e);
            if (sprite) {
                return sprite;
            }
        }

        return null;
    },

    handleEvent: function (e) {
        var me = this,
            drawContainer = me.drawContainer,
            isMouseMoveEvent = e.type in me.mouseMoveEvents,
            lastSprite = me.lastSprite,
            sprite;

        if (isMouseMoveEvent && !me.hasSpriteMouseMoveListeners()) {
            return;
        }

        sprite = me.hitTestEvent(e);

        if (isMouseMoveEvent && !Ext.Object.equals(sprite, lastSprite)) {
            if (lastSprite) {
                drawContainer.fireEvent('spritemouseout', lastSprite, e);
            }
            if (sprite) {
                drawContainer.fireEvent('spritemouseover', sprite, e);
            }
        }

        if (sprite) {
            drawContainer.fireEvent('sprite' + e.type, sprite, e);
        }

        me.lastSprite = sprite;
    }
});