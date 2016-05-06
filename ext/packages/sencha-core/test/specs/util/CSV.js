describe("Ext.util.CSV", function() {
    var CSV = Ext.util.CSV;

    // The "hostile" string is a single cell that has all of the special characters in
    // its value.
    var hostile = 'foo "bar"\t, \n\r\nbletch';

    // This is the encoded version of the above.
    var hostileEnc = '"foo ""bar""\t, \n\r\nbletch"';

    describe("encode", function() {
        it("should encode valid data types to CSV representation", function() {
            // Set the reference date to be an absolute time value so that tests will
            // run in any time zone.
            // This is Friday, January 1, 2010, 21:45:32.004 UTC
            // Around the world where tests may be run, the default toString
            // rendition of this may change, so testers beware.
            var date = new Date(1262382332004),
                result = CSV.encode([
                    [ hostile, 'Normal String', date ],
                    [ Math.PI, 1, false ]
                ]);

            // Test all valid types:
            //      String with quotes,    string,         Date,
            //      floating point number, integer number, boolean
            expect(result).toEqual(
                    hostileEnc + ',Normal String,2010-01-01T21:45:32.004Z' +
                    CSV.lineBreak +
                    '3.141592653589793,1,false');
        });

        it("should quote lines with \\n", function() {
            expect(CSV.encode([['foo\nbar']])).toEqual('"foo\nbar"');
        });

        it("should quote lines with \\r\\n", function() {
            expect(CSV.encode([['foo\r\nbar']])).toEqual('"foo\r\nbar"');
        });

        it("should quote lines with the delimiter", function() {
            expect(CSV.encode([['foo,bar']])).toEqual('"foo,bar"');
        });

        it("should quote quoted lines", function() {
            expect(CSV.encode([['foo"bar']])).toEqual('"foo""bar"');
        });

        it('should handle empty rows', function () {
            expect(CSV.encode([[]])).toBe('');
        });

        it('should handle null cell', function () {
            expect(CSV.encode([[null]])).toBe('');
        });

        it("should not encode arrays in cells", function() {
            expect(function() {
                CSV.encode([[[]]]);
            }).toThrow();
        });

        it("should not encode objects in cells", function() {
            expect(function() {
                CSV.encode([[{}]]);
            }).toThrow();
        });

        it("should not encode HTMLDocument in a cell", function() {
            expect(function() {
                CSV.encode([[document]]);
            }).toThrow();
        });

        it("should not encode HTMLBody in a cell", function() {
            expect(function() {
                CSV.encode([[document.body]]);
            }).toThrow();
        });

        it("should not encode NodeList in a cell", function() {
            expect(function() {
                CSV.encode([[document.body.childNodes]]);
            }).toThrow();
        });

        it("should not encode window in a cell", function() {
            expect(function() {
                CSV.encode([[Ext.global]]);
            }).toThrow();
        });
    });

    describe("decode", function() {
        it('should decode CSV back into an array of string arrays', function() {
            var result = CSV.decode(
                    hostileEnc + ',Normal String,2010-01-01T21:45:32.004Z' +
                    CSV.lineBreak +
                    '3.141592653589793,1,false');

            expect(result).toEqual([
                [ hostile, 'Normal String', '2010-01-01T21:45:32.004Z' ],
                [ '3.141592653589793', '1', 'false' ]
            ]);
        });
    });
});
