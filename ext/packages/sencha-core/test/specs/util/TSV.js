describe("Ext.util.TSV", function() {
    var TSV = Ext.util.TSV;

    // The "hostile" string is a single cell that has all of the special characters in
    // its value.
    var hostile = 'foo "bar"\t, \n\r\nbletch';

    // This is the encoded version of the above.
    var hostileEnc = '"foo ""bar""\t, \n\r\nbletch"';

    describe("encode", function() {
        it("should encode valid data types to TSV representation", function() {
            // Set the reference date to be an absolute time value so that tests will
            // run in any time zone.
            // This is Friday, January 1, 2010, 21:45:32.004 UTC
            // Around the world where tests may be run, the default toString
            // rendition of this may change, so testers beware.
            var date = new Date(1262382332004),
                result = TSV.encode([
                    [ hostile, 'Normal String', date ],
                    [ Math.PI, 1, false ]
                ]);

            // Test all valid types:
            //      String with quotes,    string,         Date,
            //      floating point number, integer number, boolean
            expect(result).toEqual(
                    hostileEnc + '\tNormal String\t2010-01-01T21:45:32.004Z' +
                    TSV.lineBreak +
                    '3.141592653589793\t1\tfalse');
        });

        it('should handle empty rows', function () {
            expect(TSV.encode([[]])).toBe('');
        });

        it('should handle null cell', function () {
            expect(TSV.encode([[null]])).toBe('');
        });

        it("should not encode arrays in cells", function() {
            expect(function() {
                TSV.encode([[[]]]);
            }).toThrow();
        });

        it("should not encode objects in cells", function() {
            expect(function() {
                TSV.encode([[{}]]);
            }).toThrow();
        });

        it("should not encode HTMLDocument in a cell", function() {
            expect(function() {
                TSV.encode([[document]]);
            }).toThrow();
        });

        it("should not encode HTMLBody in a cell", function() {
            expect(function() {
                TSV.encode([[document.body]]);
            }).toThrow();
        });

        it("should not encode NodeList in a cell", function() {
            expect(function() {
                TSV.encode([[document.body.childNodes]]);
            }).toThrow();
        });

        it("should not encode window in a cell", function() {
            expect(function() {
                TSV.encode([[Ext.global]]);
            }).toThrow();
        });
    });

    describe("decode", function() {
        it('should decode TSV back into an array of string arrays', function() {
            var result = TSV.decode(
                    hostileEnc + '\tNormal String\t2010-01-01T21:45:32.004Z' +
                    TSV.lineBreak +
                    '3.141592653589793\t1\tfalse');

            expect(result).toEqual([
                [ hostile, 'Normal String', '2010-01-01T21:45:32.004Z' ],
                [ '3.141592653589793', '1', 'false' ]
            ]);
        });
    });
});
