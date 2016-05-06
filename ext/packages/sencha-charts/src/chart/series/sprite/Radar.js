/**
 * @class Ext.chart.series.sprite.Radar
 * @extends Ext.chart.series.sprite.Polar
 * 
 * Radar series sprite.
 */
Ext.define('Ext.chart.series.sprite.Radar', {
    alias: 'sprite.radar',
    extend: 'Ext.chart.series.sprite.Polar',

    getDataPointXY: function (index) {
        var me = this,
            attr = me.attr,
            centerX = attr.centerX,
            centerY = attr.centerY,
            matrix = attr.matrix,
            minX = attr.dataMinX,
            maxX = attr.dataMaxX,
            dataX = attr.dataX,
            dataY = attr.dataY,
            endRho = attr.endRho,
            startRho = attr.startRho,
            baseRotation = attr.baseRotation,
            x, y, r, th, ox, oy, maxY;

        if (attr.rangeY) {
            maxY = attr.rangeY[1];
        } else {
            maxY = attr.dataMaxY;
        }

        th = (dataX[index] - minX) / (maxX - minX + 1) * 2 * Math.PI + baseRotation;
        r = dataY[index] / maxY * (endRho - startRho) + startRho;
        // Original coordinates.
        ox = centerX + Math.cos(th) * r;
        oy = centerY + Math.sin(th) * r;
        // Transformed coordinates.
        x = matrix.x(ox, oy);
        y = matrix.y(ox, oy);

        return [x, y];
    },

    render: function (surface, ctx) {
        var me = this,
            attr = me.attr,
            dataX = attr.dataX,
            length = dataX.length,
            surfaceMatrix = me.surfaceMatrix,
            markerCfg = {},
            i, x, y, xy;

        ctx.beginPath();
        for (i = 0; i < length; i++) {
            xy = me.getDataPointXY(i);
            x = xy[0];
            y = xy[1];
            if (i === 0) {
                ctx.moveTo(x, y);
            }
            ctx.lineTo(x, y);
            markerCfg.translationX = surfaceMatrix.x(x, y);
            markerCfg.translationY = surfaceMatrix.y(x, y);
            me.putMarker('markers', markerCfg, i, true);
        }
        ctx.closePath();
        ctx.fillStroke(attr);
    }
});