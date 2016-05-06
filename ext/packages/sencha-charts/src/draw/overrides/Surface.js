Ext.define('Ext.draw.overrides.Surface', {
    override: 'Ext.draw.Surface',

    hitOptions: {
        fill: true,
        stroke: true
    },

    /**
     * Performs a hit test on all sprites in the surface, returning the first matching one.
     * @param {Array} point A two-item array containing x and y coordinates of the point.
     * @param {Object} options Hit testing options.
     * @return {Object} A hit result object that contains more information about what
     * exactly was hit or null if nothing was hit.
     * @member Ext.draw.Surface
     */
    hitTest: function (point, options) {
        var me = this,
            sprites = me.getItems(),
            i, sprite, result;

        options = options || me.hitOptions;

        for (i = sprites.length - 1; i >= 0; i--) {
            sprite = sprites[i];
            if (sprite.hitTest) {
                result = sprite.hitTest(point, options);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    },

    /**
     * Performs a hit test on all sprites in the surface, returning the first matching one.
     * Since hit testing is typically performed on mouse events, this convenience method
     * converts event's page coordinates to surface coordinates before calling {@link #hitTest}.
     * @param {Array} point An event object.
     * @param {Object} options Hit testing options.
     * @return {Object} A hit result object that contains more information about what
     * exactly was hit or null if nothing was hit.
     * @member Ext.draw.Surface
     */
    hitTestEvent: function (event, options) {
        var xy = this.getEventXY(event);
        return this.hitTest(xy, options);
    }
});