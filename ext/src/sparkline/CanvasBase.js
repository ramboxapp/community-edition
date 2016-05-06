/**
 * @class Ext.sparkline.CanvasBase
 * @private
 */
Ext.define('Ext.sparkline.CanvasBase', {
    requires: [
        'Ext.sparkline.Shape'
    ],

    shapeCount: 0,

    _pxregex: /(\d+)(px)?\s*$/i,

    constructor: function(ownerSparkLine) {
        this.owner = ownerSparkLine;
    },

    setWidth: function(width) {
        this.pixelWidth = width;
    },

    setHeight: function(height) {
        this.pixelHeight = height;
    },

    drawLine: function (x1, y1, x2, y2, lineColor, lineWidth) {
        return this.drawShape([[x1, y1], [x2, y2]], lineColor, lineWidth);
    },

    drawShape: function (path, lineColor, fillColor, lineWidth) {
        return this._genShape('Shape', [path, lineColor, fillColor, lineWidth]);
    },

    drawCircle: function (x, y, radius, lineColor, fillColor, lineWidth) {
        return this._genShape('Circle', [x, y, radius, lineColor, fillColor, lineWidth]);
    },

    drawPieSlice: function (x, y, radius, startAngle, endAngle, lineColor, fillColor) {
        return this._genShape('PieSlice', [x, y, radius, startAngle, endAngle, lineColor, fillColor]);
    },

    drawRect: function (x, y, width, height, lineColor, fillColor) {
        return this._genShape('Rect', [x, y, width, height, lineColor, fillColor]);
    },

    getElement: function () {
        return this.el;
    },

    /*
     * Return the most recently inserted shape id
     */
    getLastShapeId: function () {
        return this.lastShapeId;
    },

    /*
     * Clear and reset the canvas
     */
    reset: function () {
        //<debug>
        Ext.Error.raise('reset not implemented');
        //</debug>
    },

    /*
     * Generate a shape object and id for later rendering
     */
    _genShape: function (shapetype, shapeargs) {
        var id = this.shapeCount++;
        shapeargs.unshift(id);
        return new Ext.sparkline.Shape(this, id, shapetype, shapeargs);
    },

    /*
     * Add a shape to the end of the render queue
     */
    appendShape: function (shape) {
        //<debug>
        Ext.Error.raise('appendShape not implemented');
        //</debug>
    },

    /*
     * Replace one shape with another
     */
    replaceWithShape: function (shapeid, shape) {
        //<debug>
        Ext.Error.raise('replaceWithShape not implemented');
        //</debug>
    },

    /*
     * Insert one shape after another in the render queue
     */
    insertAfterShape: function (shapeid, shape) {
        //<debug>
        Ext.Error.raise('insertAfterShape not implemented');
        //</debug>
    },

    /*
     * Remove a shape from the queue
     */
    removeShapeId: function (shapeid) {
        //<debug>
        Ext.Error.raise('removeShapeId not implemented');
        //</debug>
    },

    /*
     * Find a shape at the specified x/y co-ordinates
     */
    getShapeAt: function (x, y) {
        //<debug>
        Ext.Error.raise('getShapeAt not implemented');
        //</debug>
    },

    /*
     * Render all queued shapes onto the canvas
     */
    render: function () {
        //<debug>
        Ext.Error.raise('render not implemented');
        //</debug>
    }
});
