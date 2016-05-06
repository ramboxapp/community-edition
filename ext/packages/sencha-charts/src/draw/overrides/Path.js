Ext.define('Ext.draw.overrides.Path', {
    override: 'Ext.draw.Path',

    // An arbitrary point outside the path used for hit testing with ray casting method.
    rayOrigin: {
        x: -10000,
        y: -10000
    },

    /**
     * Tests whether the given point is inside the path.
     * @param {Number} x
     * @param {Number} y
     * @return {Boolean}
     * @member Ext.draw.Path
     */
    isPointInPath: function (x, y) {
        var me = this,
            commands = me.commands,
            solver = Ext.draw.PathUtil,
            origin = me.rayOrigin,
            params = me.params,
            ln = commands.length,
            firstX = null,
            firstY = null,
            lastX = 0,
            lastY = 0,
            count = 0,
            i, j;

        for (i = 0, j = 0; i < ln; i++) {
            switch (commands[i]) {
                case 'M':
                    if (firstX !== null) {
                        if (solver.linesIntersection(firstX, firstY, lastX, lastY, origin.x, origin.y, x, y)) {
                            count += 1;
                        }
                    }
                    firstX = lastX = params[j];
                    firstY = lastY = params[j + 1];
                    j += 2;
                    break;
                case 'L':
                    if (solver.linesIntersection(lastX, lastY, params[j], params[j + 1], origin.x, origin.y, x, y)) {
                        count += 1;
                    }
                    lastX = params[j];
                    lastY = params[j + 1];
                    j += 2;
                    break;
                case 'C':
                    count += solver.cubicLineIntersections(
                        lastX, params[j], params[j + 2], params[j + 4],
                        lastY, params[j + 1], params[j + 3], params[j + 5],
                        origin.x, origin.y, x, y
                    ).length;
                    lastX = params[j + 4];
                    lastY = params[j + 5];
                    j += 6;
                    break;
                case 'Z':
                    if (firstX !== null) {
                        if (solver.linesIntersection(firstX, firstY, lastX, lastY, origin.x, origin.y, x, y)) {
                            count += 1;
                        }
                    }
                    break;
            }
        }
        return count % 2 === 1;
    },

    /**
     * Tests whether the given point is on the path.
     * @param {Number} x
     * @param {Number} y
     * @return {Boolean}
     * @member Ext.draw.Path
     */
    isPointOnPath: function (x, y) {
        var me = this,
            commands = me.commands,
            solver = Ext.draw.PathUtil,
            params = me.params,
            ln = commands.length,
            firstX = null,
            firstY = null,
            lastX = 0,
            lastY = 0,
            i, j;

        for (i = 0, j = 0; i < ln; i++) {
            switch (commands[i]) {
                case 'M':
                    if (firstX !== null) {
                        if (solver.pointOnLine(firstX, firstY, lastX, lastY, x, y)) {
                            return true;
                        }
                    }
                    firstX = lastX = params[j];
                    firstY = lastY = params[j + 1];
                    j += 2;
                    break;
                case 'L':
                    if (solver.pointOnLine(lastX, lastY, params[j], params[j + 1], x, y)) {
                        return true;
                    }
                    lastX = params[j];
                    lastY = params[j + 1];
                    j += 2;
                    break;
                case 'C':
                    if (solver.pointOnCubic(
                        lastX, params[j], params[j + 2], params[j + 4],
                        lastY, params[j + 1], params[j + 3], params[j + 5], x, y)) {
                        return true;
                    }
                    lastX = params[j + 4];
                    lastY = params[j + 5];
                    j += 6;
                    break;
                case 'Z':
                    if (firstX !== null) {
                        if (solver.pointOnLine(firstX, firstY, lastX, lastY, x, y)) {
                            return true;
                        }
                    }
                    break;
            }
        }
        return false;
    },

    /**
     * Calculates the points where the given segment intersects the path.
     * If four parameters are given then the segment is considered to be a line segment,
     * where given parameters are the coordinates of the start and end points.
     * If eight parameters are given then the segment is considered to be
     * a cubic Bezier curve segment, where given parameters are the
     * coordinates of its edge points and control points.
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @param x3
     * @param y3
     * @param x4
     * @param y4
     * @return {Array}
     * @member Ext.draw.Path
     */
    getSegmentIntersections: function (x1, y1, x2, y2, x3, y3, x4, y4) {
        var me = this,
            count = arguments.length,
            solver = Ext.draw.PathUtil,
            commands = me.commands,
            params = me.params,
            ln = commands.length,
            firstX = null,
            firstY = null,
            lastX = 0,
            lastY = 0,
            intersections = [],
            i, j, points;

        for (i = 0, j = 0; i < ln; i++) {
            switch (commands[i]) {
                case 'M':
                    if (firstX !== null) {
                        switch (count) {
                            case 4:
                                points = solver.linesIntersection(firstX, firstY, lastX, lastY, x1, y1, x2, y2);
                                if (points) {
                                    intersections.push(points);
                                }
                                break;
                            case 8:
                                points = solver.cubicLineIntersections(x1, x2, x3, x4, y1, y2, y3, y4,
                                    firstX, firstY, lastX, lastY);
                                intersections.push.apply(intersections, points);
                                break;
                        }
                    }
                    firstX = lastX = params[j];
                    firstY = lastY = params[j + 1];
                    j += 2;
                    break;
                case 'L':
                    switch (count) {
                        case 4:
                            points = solver.linesIntersection(lastX, lastY, params[j], params[j + 1], x1, y1, x2, y2);
                            if (points) {
                                intersections.push(points);
                            }
                            break;
                        case 8:
                            points = solver.cubicLineIntersections(x1, x2, x3, x4, y1, y2, y3, y4,
                                lastX, lastY, params[j], params[j + 1]);
                            intersections.push.apply(intersections, points);
                            break;
                    }
                    lastX = params[j];
                    lastY = params[j + 1];
                    j += 2;
                    break;
                case 'C':
                    switch (count) {
                        case 4:
                            points = solver.cubicLineIntersections(
                                lastX, params[j], params[j + 2], params[j + 4],
                                lastY, params[j + 1], params[j + 3], params[j + 5],
                                x1, y1, x2, y2);
                            intersections.push.apply(intersections, points);
                            break;
                        case 8:
                            points = solver.cubicsIntersections(
                                lastX, params[j], params[j + 2], params[j + 4],
                                lastY, params[j + 1], params[j + 3], params[j + 5],
                                x1, x2, x3, x4, y1, y2, y3, y4);
                            intersections.push.apply(intersections, points);
                            break;
                    }
                    lastX = params[j + 4];
                    lastY = params[j + 5];
                    j += 6;
                    break;
                case 'Z':
                    if (firstX !== null) {
                        switch (count) {
                            case 4:
                                points = solver.linesIntersection(firstX, firstY, lastX, lastY, x1, y1, x2, y2);
                                if (points) {
                                    intersections.push(points);
                                }
                                break;
                            case 8:
                                points = solver.cubicLineIntersections(x1, x2, x3, x4, y1, y2, y3, y4,
                                    firstX, firstY, lastX, lastY);
                                intersections.push.apply(intersections, points);
                                break;
                        }
                    }
                    break;
            }
        }
        return intersections;
    },

    getIntersections: function (path) {
        var me = this,
            commands = me.commands,
            params = me.params,
            ln = commands.length,
            firstX = null,
            firstY = null,
            lastX = 0,
            lastY = 0,
            intersections = [],
            i, j, points;

        for (i = 0, j = 0; i < ln; i++) {
            switch (commands[i]) {
                case 'M':
                    if (firstX !== null) {
                        points = path.getSegmentIntersections.call(path, firstX, firstY, lastX, lastY);
                        intersections.push.apply(intersections, points);
                    }
                    firstX = lastX = params[j];
                    firstY = lastY = params[j + 1];
                    j += 2;
                    break;
                case 'L':
                    points = path.getSegmentIntersections.call(path, lastX, lastY, params[j], params[j + 1]);
                    intersections.push.apply(intersections, points);
                    lastX = params[j];
                    lastY = params[j + 1];
                    j += 2;
                    break;
                case 'C':
                    points = path.getSegmentIntersections.call(path,
                        lastX, lastY, params[j], params[j + 1],
                        params[j + 2], params[j + 3], params[j + 4], params[j + 5]
                    );
                    intersections.push.apply(intersections, points);
                    lastX = params[j + 4];
                    lastY = params[j + 5];
                    j += 6;
                    break;
                case 'Z':
                    if (firstX !== null) {
                        points = path.getSegmentIntersections.call(path, firstX, firstY, lastX, lastY);
                        intersections.push.apply(intersections, points);
                    }
                    break;
            }
        }
        return intersections;
    }
});