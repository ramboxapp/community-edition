/**
 * @private
 * Singleton that provides methods used by the Ext.draw.Path
 * for hit testing and finding path intersection points.
 */
Ext.define('Ext.draw.PathUtil', function () {
    var abs = Math.abs,
        pow = Math.pow,
        cos = Math.cos,
        acos = Math.acos,
        sqrt = Math.sqrt,
        PI = Math.PI;

    // For extra info see: http://pomax.github.io/bezierinfo/

    return {
        singleton: true,

        requires: [
            'Ext.draw.overrides.Path',
            'Ext.draw.overrides.sprite.Path',
            'Ext.draw.overrides.Surface'
        ],

        /**
         * @private
         * Finds roots of a cubic equation in t, where t lies in the interval of [0,1].
         * Based on http://www.particleincell.com/blog/2013/cubic-line-intersection/
         * @param P {Number[]} Cubic equation coefficients.
         * @return {Number[]} Returns an array of parametric intersection locations along the cubic,
         *                  with -1 indicating an out-of-bounds intersection
         *                  (before or after the end point or in the imaginary plane).
         */
        cubicRoots: function (P) {
            var a = P[0],
                b = P[1],
                c = P[2],
                d = P[3];

            if (a === 0) {
                return this.quadraticRoots(b, c, d);
            }

            var A = b / a,
                B = c / a,
                C = d / a,

                Q = (3*B - pow(A, 2)) / 9,
                R = (9*A*B - 27*C - 2*pow(A, 3)) / 54,
                D = pow(Q, 3) + pow(R, 2), // Polynomial discriminant.
                t = [],
                S, T, Im, th, i,

                sign = Ext.Number.sign;

            if (D >= 0) { // Complex or duplicate roots.
                S = sign(R + sqrt(D)) * pow(abs(R + sqrt(D)), 1/3);
                T = sign(R - sqrt(D)) * pow(abs(R - sqrt(D)), 1/3);

                t[0] = -A/3 + (S + T);          // Real root.
                t[1] = -A/3 - (S + T)/2;        // Real part of complex root.
                t[2] = t[1];                    // Real part of complex root.
                Im = abs(sqrt(3) * (S - T)/2);  // Complex part of root pair.

                // Discard complex roots.
                if (Im !== 0) {
                    t[1] =- 1;
                    t[2] =- 1;
                }

            } else { // Distinct real roots.
                th = acos(R / sqrt(-pow(Q, 3)));

                t[0] = 2*sqrt(-Q)*cos(th/3) - A/3;
                t[1] = 2*sqrt(-Q)*cos((th + 2*PI)/3) - A/3;
                t[2] = 2*sqrt(-Q)*cos((th + 4*PI)/3) - A/3;
            }

            // Discard out of spec roots.
            for (i = 0; i < 3; i++) {
                if (t[i] < 0 || t[i] > 1) {
                    t[i] = -1;
                }
            }

            return t;
        },

        /**
         * @private
         * Finds roots of a quadratic equation in t, where t lies in the interval of [0,1].
         * Takes three quadratic equation coefficients as parameters.
         * @param a {Number}
         * @param b {Number}
         * @param c {Number}
         * @return {Array}
         */
        quadraticRoots: function (a, b, c) {
            var D, rD, t, i;
            if (a === 0) {
                return this.linearRoot(b, c);
            }
            D = b*b - 4*a*c;
            if (D === 0) { // One real root.
                t = [-b/(2*a)];
            } else if (D > 0) { // Distinct real roots.
                rD = sqrt(D);
                t = [(-b - rD) / (2*a), (-b + rD) / (2*a)];
            } else { // Complex roots.
                return [];
            }
            for (i = 0; i < t.length; i++) {
                if (t[i] < 0 || t[i] > 1) {
                    t[i] = -1;
                }
            }
            return t;
        },

        /**
         * @private
         * Finds roots of a linear equation in t, where t lies in the interval of [0,1].
         * Takes two linear equation coefficients as parameters.
         * @param a {Number}
         * @param b {Number}
         * @return {Array}
         */
        linearRoot: function (a, b) {
            var t = -b/a;
            if (a === 0 || t < 0 || t > 1) {
                return [];
            }
            return [t];
        },

        /**
         * @private
         * Calculates the coefficients of a cubic function for the given coordinates.
         * @param P0 {Number}
         * @param P1 {Number}
         * @param P2 {Number}
         * @param P3 {Number}
         * @return {Array}
         */
        bezierCoeffs: function (P0, P1, P2, P3) {
            var Z = [];
            Z[0] = -P0 + 3*P1 - 3*P2 + P3;
            Z[1] = 3*P0 - 6*P1 + 3*P2;
            Z[2] = -3*P0 + 3*P1;
            Z[3] = P0;
            return Z;
        },

        /**
         * @private
         * Computes intersection points between a cubic spline and a line segment.
         * Takes in x/y components of cubic control points and line segment start/end points
         * as parameters.
         * @param px1 {Number}
         * @param px2 {Number}
         * @param px3 {Number}
         * @param px4 {Number}
         * @param py1 {Number}
         * @param py2 {Number}
         * @param py3 {Number}
         * @param py4 {Number}
         * @param x1 {Number}
         * @param y1 {Number}
         * @param x2 {Number}
         * @param y2 {Number}
         * @return {Array} Array of intersection points, where each intersection point
         *                  is itself a two-item array [x,y].
         */
        cubicLineIntersections: function (px1, px2, px3, px4, py1, py2, py3, py4,
                                          x1, y1, x2, y2) {
            var P = [],
                intersections = [],

                // Finding line equation coefficients.
                A = y1 - y2,
                B = x2 - x1,
                C = x1 * (y2 - y1) - y1 * (x2 - x1),

                // Finding cubic Bezier curve equation coefficients.
                bx = this.bezierCoeffs(px1, px2, px3, px4),
                by = this.bezierCoeffs(py1, py2, py3, py4),

                i, r, s,
                t, tt, ttt,
                cx, cy;

            P[0] = A*bx[0] + B*by[0];		// t^3
            P[1] = A*bx[1] + B*by[1];		// t^2
            P[2] = A*bx[2] + B*by[2];		// t
            P[3] = A*bx[3] + B*by[3] + C;	// 1

            r = this.cubicRoots(P);

            // Verify the roots are in bounds of the linear segment.
            for (i = 0; i < r.length; i++) {
                t = r[i];

                if (t < 0 || t > 1) {
                    continue;
                }

                tt = t*t;
                ttt = tt*t;

                cx = bx[0]*ttt + bx[1]*tt + bx[2]*t + bx[3];
                cy = by[0]*ttt + by[1]*tt + by[2]*t + by[3];

                // Above is intersection point assuming infinitely long line segment,
                // make sure we are also in bounds of the line.
                if ((x2 - x1) !== 0) { // If not vertical line
                    s = (cx - x1) / (x2 - x1);
                } else {
                    s = (cy - y1) / (y2 - y1);
                }
                // In bounds?
                if (!(s < 0 || s > 1)) {
                    intersections.push([cx, cy]);
                }
            }
            return intersections;
        },

        /**
         * @private
         * Splits cubic Bezier curve into two cubic Bezier curves at point z,
         * where z belongs to a range of [0, 1].
         * Accepts cubic coefficients and point z as parameters.
         * @param P1 {Number}
         * @param P2 {Number}
         * @param P3 {Number}
         * @param P4 {Number}
         * @param z Point to split the given curve at.
         * @return {Array} Two-item array, where each item is itself an array
         *                  of cubic coefficients.
         */
        splitCubic: function (P1, P2, P3, P4, z) {
            var zz = z * z,
                zzz = z * zz,
                iz = z - 1,
                izz = iz * iz,
                izzz = iz * izz,
                // Common point for both curves.
                P = zzz * P4 - 3 * zz * iz * P3 + 3 * z * izz * P2 - izzz * P1;

            return [
                [
                    P1,
                    z * P2 - iz * P1,
                    zz * P3 - 2 * z * iz * P2 + izz * P1,
                    P
                ],
                [
                    P,
                    zz * P4 - 2 * z * iz * P3 + izz * P2,
                    z * P4 - iz * P3,
                    P4
                ]
            ]
        },

        /**
         * @private
         * Returns the dimension of a cubic Bezier curve in a single direction.
         * @param a {Number}
         * @param b {Number}
         * @param c {Number}
         * @param d {Number}
         * @return {Array} Two-item array representing cubic's range in the given direction.
         */
        cubicDimension: function (a, b, c, d) {
            var qa = 3 * (-a + 3 * (b - c) + d),
                qb = 6 * (a - 2 * b + c),
                qc = -3 * (a - b), x, y,
                min = Math.min(a, d),
                max = Math.max(a, d), delta;

            if (qa === 0) {
                if (qb === 0) {
                    return [min, max];
                } else {
                    x = -qc / qb;
                    if (0 < x && x < 1) {
                        y = this.interpolateCubic(a, b, c, d, x);
                        min = Math.min(min, y);
                        max = Math.max(max, y);
                    }
                }
            } else {
                delta = qb * qb - 4 * qa * qc;
                if (delta >= 0) {
                    delta = sqrt(delta);
                    x = (delta - qb) / 2 / qa;
                    if (0 < x && x < 1) {
                        y = this.interpolateCubic(a, b, c, d, x);
                        min = Math.min(min, y);
                        max = Math.max(max, y);
                    }
                    if (delta > 0) {
                        x -= delta / qa;
                        if (0 < x && x < 1) {
                            y = this.interpolateCubic(a, b, c, d, x);
                            min = Math.min(min, y);
                            max = Math.max(max, y);
                        }
                    }
                }
            }
            return [min, max];
        },

        /**
         * @private
         * Calculates a value of a cubic function at the given point t. In other words
         * returns a * (1 - t) ^ 3 + 3 * b (1 - t) ^ 2 * t + 3 * c (1 - t) * t ^ 3 + d * t ^ 3
         * for given a, b, c, d and t, where t belongs to an interval of [0, 1].
         * @param a {Number}
         * @param b {Number}
         * @param c {Number}
         * @param d {Number}
         * @param t {Number}
         * @return {Number}
         */
        interpolateCubic: function (a, b, c, d, t) {
            if (t === 0) {
                return a;
            }
            if (t === 1) {
                return d;
            }
            var rate = (1 - t) / t;
            return t * t * t * (d + rate * (3 * c + rate * (3 * b + rate * a)));
        },

        /**
         * @private
         * Computes intersection points between two cubic Bezier curve segments.
         * Takes x/y components of control points for two Bezier curve segments.
         * @param ax1 {Number}
         * @param ax2 {Number}
         * @param ax3 {Number}
         * @param ax4 {Number}
         * @param ay1 {Number}
         * @param ay2 {Number}
         * @param ay3 {Number}
         * @param ay4 {Number}
         * @param bx1 {Number}
         * @param bx2 {Number}
         * @param bx3 {Number}
         * @param bx4 {Number}
         * @param by1 {Number}
         * @param by2 {Number}
         * @param by3 {Number}
         * @param by4 {Number}
         * @return {Array} Array of intersection points, where each intersection point
         *                  is itself a two-item array [x,y].
         */
        cubicsIntersections: function (ax1, ax2, ax3, ax4, ay1, ay2, ay3, ay4,
                                       bx1, bx2, bx3, bx4, by1, by2, by3, by4) {
            var me = this,
                axDim = me.cubicDimension(ax1, ax2, ax3, ax4),
                ayDim = me.cubicDimension(ay1, ay2, ay3, ay4),
                bxDim = me.cubicDimension(bx1, bx2, bx3, bx4),
                byDim = me.cubicDimension(by1, by2, by3, by4),
                splitAx, splitAy, splitBx, splitBy,
                points = [];

            // Curves' bounding boxes don't intersect.
            if (axDim[0] > bxDim[1] || axDim[1] < bxDim[0] || ayDim[0] > byDim[1] || ayDim[1] < byDim[0]) {
                return [];
            }
            // Both curves occupy sub-pixel areas which is effectively their intersection point.
            if (abs(ay1 - ay2) < 1 && abs(ay3 - ay4) < 1 && abs(ax1 - ax4) < 1 && abs(ax2 - ax3) < 1 &&
                abs(by1 - by2) < 1 && abs(by3 - by4) < 1 && abs(bx1 - bx4) < 1 && abs(bx2 - bx3) < 1) {
                return [[ (ax1 + ax4) * 0.5, (ay1 + ay2) * 0.5 ]];
            }

            splitAx = me.splitCubic(ax1, ax2, ax3, ax4, 0.5);
            splitAy = me.splitCubic(ay1, ay2, ay3, ay4, 0.5);
            splitBx = me.splitCubic(bx1, bx2, bx3, bx4, 0.5);
            splitBy = me.splitCubic(by1, by2, by3, by4, 0.5);

            points.push.apply(points, me.cubicsIntersections.apply(me, splitAx[0].concat(splitAy[0], splitBx[0], splitBy[0])));
            points.push.apply(points, me.cubicsIntersections.apply(me, splitAx[0].concat(splitAy[0], splitBx[1], splitBy[1])));
            points.push.apply(points, me.cubicsIntersections.apply(me, splitAx[1].concat(splitAy[1], splitBx[0], splitBy[0])));
            points.push.apply(points, me.cubicsIntersections.apply(me, splitAx[1].concat(splitAy[1], splitBx[1], splitBy[1])));

            return points;
        },

        /**
         * @private
         * Returns the point [x,y] where two line segments intersect or null.
         * Takes x/y components of the start and end point of the segments as parameters.
         * Based on Paul Bourke's explanation:
         * http://paulbourke.net/geometry/pointlineplane/
         * @param x1 {Number}
         * @param y1 {Number}
         * @param x2 {Number}
         * @param y2 {Number}
         * @param x3 {Number}
         * @param y3 {Number}
         * @param x4 {Number}
         * @param y4 {Number}
         * @return {Number[]|null}
         */
        linesIntersection: function (x1, y1, x2, y2, x3, y3, x4, y4) {
            var d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3),
                ua, ub;
            if (d === 0) { // Lines are parallel.
                return null;
            }
            ua = ( (x4 - x3) * (y1 - y3) - (x1 - x3) * (y4 - y3) ) / d;
            ub = ( (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3) ) / d;
            if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
                return [
                    x1 + ua * (x2 - x1), // x
                    y1 + ua * (y2 - y1)  // y
                ];
            }
            return null; // The intersection point is outside one or both segments.
        },

        /**
         * @private
         * Checks if a point belongs to a line segment.
         * Takes x/y components of the start and end points of the segment and the point's
         * coordinates as parameters.
         * @param x1 {Number}
         * @param y1 {Number}
         * @param x2 {Number}
         * @param y2 {Number}
         * @param x {Number}
         * @param y {Number}
         * @return {Boolean}
         */
        pointOnLine: function (x1, y1, x2, y2, x, y) {
            var t, _;
            if (abs(x2 - x1) < abs(y2 - y1)) {
                _ = x1;
                x1 = y1;
                y1 = _;
                _ = x2;
                x2 = y2;
                y2 = _;
                _ = x;
                x = y;
                y = _;
            }
            t = (x - x1) / (x2 - x1);
            if (t < 0 || t > 1) {
                return false;
            }
            return abs(y1 + t * (y2 - y1) - y) < 4;
        },

        /**
         * @private
         * Checks if a point belongs to a cubic Bezier curve segment.
         * Takes x/y components of the control points of the segment and the point's
         * coordinates as parameters.
         * @param px1 {Number}
         * @param px2 {Number}
         * @param px3 {Number}
         * @param px4 {Number}
         * @param py1 {Number}
         * @param py2 {Number}
         * @param py3 {Number}
         * @param py4 {Number}
         * @param x {Number}
         * @param y {Number}
         * @return {Boolean}
         */
        pointOnCubic: function (px1, px2, px3, px4, py1, py2, py3, py4, x, y) {
            // Finding cubic Bezier curve equation coefficients.
            var me = this,
                bx = me.bezierCoeffs(px1, px2, px3, px4),
                by = me.bezierCoeffs(py1, py2, py3, py4),
                i, j, rx, ry, t;

            bx[3] -= x;
            by[3] -= y;

            rx = me.cubicRoots(bx);
            ry = me.cubicRoots(by);

            for (i = 0; i < rx.length; i++) {
                t = rx[i];
                for (j = 0; j < ry.length; j++) {
                    // TODO: for more accurate results tolerance should be dynamic
                    // TODO: based on the length and shape of the segment.
                    if (t >= 0 && t <= 1 && abs(t - ry[j]) < 0.05) {
                        return true;
                    }
                }
            }

            return false;
        }

    };
});
