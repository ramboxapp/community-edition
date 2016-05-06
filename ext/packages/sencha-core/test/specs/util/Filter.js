describe("Ext.util.Filter", function() {
    var filter;

    describe("construction", function() {
        var createFilter = function(config) {
            return function() {
                new Ext.util.Filter(config);
            };
        };

        it("should accept a property and value", function() {
            expect(createFilter({property: 'test', value: 'a'})).not.toThrow();
        });

        it("should accept a false", function() {
            expect(createFilter({property: 'test', value: false})).not.toThrow();
        });

        it("should accept a 0", function() {
            expect(createFilter({property: 'test', value: 0})).not.toThrow();
        });

        it("should accept a ''", function() {
            expect(createFilter({property: 'test', value: ''})).not.toThrow();
        });

        it("should accept a filter function", function() {
            expect(createFilter({filterFn: Ext.emptyFn})).not.toThrow();
        });

        it("should require at least a filter function or a property/value combination", function() {
            expect(createFilter()).toThrow();
        });
    });

    describe("disableOnEmpty", function() {
        var filter;

        function makeFilter(v) {
            filter = new Ext.util.Filter({
                disableOnEmpty: true,
                property: 'foo',
                value: v
            });
        }

        it("should disable when the value is ''", function() {
            makeFilter('');
            expect(filter.getDisabled()).toBe(true);
        });

        it("should disable when the value is null", function() {
            makeFilter(null);
            expect(filter.getDisabled()).toBe(true);
        });
    });

    describe("creating filter functions", function() {
        var edRecord     = {name: 'Ed'},
            tedRecord    = {name: 'Ted'},
            abeRecord    = {name: 'Abe'},
            edwardRecord = {name: 'Edward'};

        it("should honor a simple property matcher", function() {
            filter = new Ext.util.Filter({
                property: 'name',
                value   : 'Ed'
            });
            
            var fn = filter.getFilterFn(); 

            expect(fn(edRecord)).toBe(true);
            expect(fn(edwardRecord)).toBe(true);
            expect(fn(tedRecord)).toBe(false);
            expect(fn(abeRecord)).toBe(false);
        });

        it("should honor anyMatch", function() {
            filter = new Ext.util.Filter({
                anyMatch: true,
                property: 'name',
                value   : 'Ed'
            });

            var fn = filter.getFilterFn(); 
            
            expect(fn(edRecord)).toBe(true);
            expect(fn(edwardRecord)).toBe(true);
            expect(fn(tedRecord)).toBe(true);
            expect(fn(abeRecord)).toBe(false);
        });

        it("should honor exactMatch", function() {
            filter = new Ext.util.Filter({
                exactMatch: true,
                property  : 'name',
                value     : 'Ed'
            });
            
            var fn = filter.getFilterFn(); 

            expect(fn(edRecord)).toBe(true);
            expect(fn(edwardRecord)).toBe(false);
            expect(fn(tedRecord)).toBe(false);
            expect(fn(abeRecord)).toBe(false);
        });

        it("should honor case sensitivity", function() {
            filter = new Ext.util.Filter({
                caseSensitive: true,
                property     : 'name',
                value        : 'Ed'
            });
            
            var fn = filter.getFilterFn(); 

            expect(fn(edRecord)).toBe(true);
            expect(fn(edwardRecord)).toBe(true);
            expect(fn(tedRecord)).toBe(false);
        });

        it("should honor case sensitivity and anyMatch", function() {
            filter = new Ext.util.Filter({
                caseSensitive: true,
                anyMatch     : true,
                property     : 'name',
                value        : 'ed'
            });
            
            var fn = filter.getFilterFn(); 

            expect(fn(tedRecord)).toBe(true);
            expect(fn(edRecord)).toBe(false);
            expect(fn(edwardRecord)).toBe(false);
        });

        it("should honor the root property", function() {
            var users = [{
                data: {name: 'Ed'}
            }, {
                data: {name: 'Ted'}
            }, {
                data: {name: 'Edward'}
            }, {
                data: {name: 'Abe'}
            }];

            var filter = new Ext.util.Filter({
                root    : 'data',
                property: 'name',
                value   : 'Ed'
            });
            
            var fn = filter.getFilterFn(); 

            expect(fn(users[0])).toBe(true);
            expect(fn(users[2])).toBe(true);
            expect(fn(users[1])).toBe(false);
            expect(fn(users[3])).toBe(false);
        });
    });

    describe("operators", function() {
        var filter;

        function makeFilter(cfg) {
            filter = new Ext.util.Filter(Ext.apply({
                property: 'value'
            }, cfg));
        }

        function match(operator, v, candidate, cfg) {
            makeFilter(Ext.apply({
                operator: operator,
                value: candidate
            }, cfg));
            return filter.filter({value: v});
        }

        afterEach(function() {
            filter = null;
        });

        describe("<", function() {
            describe("numbers", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('<', 7, 10)).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('<', 10, 10)).toBe(false);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('<', 100, 10)).toBe(false);
                });
            });

            describe("strings", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('<', 'a', 'f')).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('<', 'j', 'j')).toBe(false);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('<', 'z', 'q')).toBe(false);
                });
            });

            describe("dates", function() {
                it("should match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('<', d1, d2)).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('<', d1, d2)).toBe(false);
                });

                it("should not match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('<', d1, d2)).toBe(false);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10);

                    expect(match('<', d1, d2)).toBe(false);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('<', d1, d2, {convert: convert})).toBe(false);
                });
            });

            describe("value coercion", function() {
                it("should coerce the candidate value based on the value", function() {
                    expect(match('<', '7', 10)).toBe(true);
                });
            });
        });

        describe("lt", function() {
            describe("numbers", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('lt', 7, 10)).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('lt', 10, 10)).toBe(false);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('lt', 100, 10)).toBe(false);
                });
            });

            describe("strings", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('lt', 'a', 'f')).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('lt', 'j', 'j')).toBe(false);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('lt', 'z', 'q')).toBe(false);
                });
            });

            describe("dates", function() {
                it("should match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('lt', d1, d2)).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('lt', d1, d2)).toBe(false);
                });

                it("should not match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('lt', d1, d2)).toBe(false);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10);

                    expect(match('lt', d1, d2)).toBe(false);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('lt', d1, d2, {convert: convert})).toBe(false);
                });
            });

            describe("value coercion", function() {
                it("should coerce the candidate value based on the value", function() {
                    expect(match('lt', '7', 10)).toBe(true);
                });
            });
        });

        describe("<=", function() {
            describe("numbers", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('<=', 7, 10)).toBe(true);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('<=', 10, 10)).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('<=', 100, 10)).toBe(false);
                });
            });

            describe("strings", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('<=', 'a', 'f')).toBe(true);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('<=', 'j', 'j')).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('<=', 'z', 'q')).toBe(false);
                });
            });

            describe("dates", function() {
                it("should match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('<=', d1, d2)).toBe(true);
                });

                it("should match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('<=', d1, d2)).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('<=', d1, d2)).toBe(false);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10);

                    expect(match('<=', d1, d2)).toBe(false);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('<=', d1, d2, {convert: convert})).toBe(true);
                });
            });

            describe("value coercion", function() {
                it("should coerce the candidate value based on the value", function() {
                    expect(match('<=', '7', 10)).toBe(true);
                });
            });
        });

        describe("le", function() {
            describe("numbers", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('le', 7, 10)).toBe(true);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('le', 10, 10)).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('le', 100, 10)).toBe(false);
                });
            });

            describe("strings", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('le', 'a', 'f')).toBe(true);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('le', 'j', 'j')).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('le', 'z', 'q')).toBe(false);
                });
            });

            describe("dates", function() {
                it("should match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('le', d1, d2)).toBe(true);
                });

                it("should match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('le', d1, d2)).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('le', d1, d2)).toBe(false);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10);

                    expect(match('le', d1, d2)).toBe(false);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('le', d1, d2, {convert: convert})).toBe(true);
                });
            });

            describe("value coercion", function() {
                it("should coerce the candidate value based on the value", function() {
                    expect(match('le', '7', 10)).toBe(true);
                });
            });
        });

        describe("=", function() {
            describe("numbers", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('=', 7, 10)).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('=', 10, 10)).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('=', 100, 10)).toBe(false);
                });
            });

            describe("strings", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('=', 'a', 'f')).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('=', 'j', 'j')).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('=', 'z', 'q')).toBe(false);
                });
            });

            describe("dates", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('=', d1, d2)).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('=', d1, d2)).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('=', d1, d2)).toBe(false);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12);

                    expect(match('=', d1, d2)).toBe(false);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('=', d1, d2, {convert: convert})).toBe(true);
                });
            });

            describe("value coercion", function() {
                it("should coerce the candidate value based on the value", function() {
                    expect(match('=', '10', 10)).toBe(true);
                });
            });
        });

        describe("eq", function() {
            describe("numbers", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('eq', 7, 10)).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('eq', 10, 10)).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('eq', 100, 10)).toBe(false);
                });
            });

            describe("strings", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('eq', 'a', 'f')).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('eq', 'j', 'j')).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('eq', 'z', 'q')).toBe(false);
                });
            });

            describe("dates", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('eq', d1, d2)).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('eq', d1, d2)).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('eq', d1, d2)).toBe(false);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12);

                    expect(match('eq', d1, d2)).toBe(false);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('eq', d1, d2, {convert: convert})).toBe(true);
                });
            });

            describe("value coercion", function() {
                it("should coerce the candidate value based on the value", function() {
                    expect(match('eq', '10', 10)).toBe(true);
                });
            });
        });

        describe("===", function() {
            describe("numbers", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('===', 7, 10)).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('===', 10, 10)).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('===', 100, 10)).toBe(false);
                });
            });

            describe("strings", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('===', 'a', 'f')).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('===', 'j', 'j')).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    expect(match('===', 'z', 'q')).toBe(false);
                });
            });

            describe("dates", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('===', d1, d2)).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('===', d1, d2)).toBe(true);
                });

                it("should not match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('===', d1, d2)).toBe(false);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12);

                    expect(match('===', d1, d2)).toBe(false);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('===', d1, d2, {convert: convert})).toBe(true);
                });
            });

            describe("value coercion", function() {
                it("should not coerce the candidate value based on the value", function() {
                    expect(match('===', '10', 10)).toBe(false);
                });
            });
        });

        describe(">", function() {
            describe("numbers", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('>', 7, 10)).toBe(false);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('>', 10, 10)).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('>', 100, 10)).toBe(true);
                });
            });

            describe("strings", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('>', 'a', 'f')).toBe(false);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('>', 'j', 'j')).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('>', 'z', 'q')).toBe(true);
                });
            });

            describe("dates", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('>', d1, d2)).toBe(false);
                });

                it("should not match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('>', d1, d2)).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('>', d1, d2)).toBe(true);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12);

                    expect(match('>', d1, d2)).toBe(false);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('>', d1, d2, {convert: convert})).toBe(false);
                });
            });

            describe("value coercion", function() {
                it("should coerce the candidate value based on the value", function() {
                    expect(match('>', '10', 7)).toBe(true);
                });
            });
        });

        describe("gt", function() {
            describe("numbers", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('gt', 7, 10)).toBe(false);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('gt', 10, 10)).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('gt', 100, 10)).toBe(true);
                });
            });

            describe("strings", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('gt', 'a', 'f')).toBe(false);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('gt', 'j', 'j')).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('gt', 'z', 'q')).toBe(true);
                });
            });

            describe("dates", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('gt', d1, d2)).toBe(false);
                });

                it("should not match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('gt', d1, d2)).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('gt', d1, d2)).toBe(true);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12);

                    expect(match('gt', d1, d2)).toBe(false);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('gt', d1, d2, {convert: convert})).toBe(false);
                });
            });

            describe("value coercion", function() {
                it("should coerce the candidate value based on the value", function() {
                    expect(match('gt', '10', 7)).toBe(true);
                });
            });
        });

        describe(">=", function() {
            describe("numbers", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('>=', 7, 10)).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('>=', 10, 10)).toBe(true);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('>=', 100, 10)).toBe(true);
                });
            });

            describe("strings", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('>=', 'a', 'f')).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('>=', 'j', 'j')).toBe(true);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('>=', 'z', 'q')).toBe(true);
                });
            });

            describe("dates", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('>=', d1, d2)).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('>=', d1, d2)).toBe(true);
                });

                it("should match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('>=', d1, d2)).toBe(true);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12);

                    expect(match('>=', d1, d2)).toBe(false);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('>=', d1, d2, {convert: convert})).toBe(true);
                });
            });

            describe("value coercion", function() {
                it("should coerce the candidate value based on the value", function() {
                    expect(match('>=', '10', 7)).toBe(true);
                });
            });
        });

        describe("ge", function() {
            describe("numbers", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('ge', 7, 10)).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('ge', 10, 10)).toBe(true);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('ge', 100, 10)).toBe(true);
                });
            });

            describe("strings", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    expect(match('ge', 'a', 'f')).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    expect(match('ge', 'j', 'j')).toBe(true);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('ge', 'z', 'q')).toBe(true);
                });
            });

            describe("dates", function() {
                it("should not match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('ge', d1, d2)).toBe(false);
                });

                it("should match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('ge', d1, d2)).toBe(true);
                });

                it("should match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('ge', d1, d2)).toBe(true);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12);

                    expect(match('ge', d1, d2)).toBe(false);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('ge', d1, d2, {convert: convert})).toBe(true);
                });
            });

            describe("value coercion", function() {
                it("should coerce the candidate value based on the value", function() {
                    expect(match('ge', '10', 7)).toBe(true);
                });
            });
        });

        describe("!=", function() {
            describe("numbers", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('!=', 7, 10)).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('!=', 10, 10)).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('!=', 100, 10)).toBe(true);
                });
            });

            describe("strings", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('!=', 'a', 'f')).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('!=', 'j', 'j')).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('!=', 'z', 'q')).toBe(true);
                });
            });

            describe("dates", function() {
                it("should match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('!=', d1, d2)).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('!=', d1, d2)).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('!=', d1, d2)).toBe(true);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12);

                    expect(match('!=', d1, d2)).toBe(true);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('!=', d1, d2, {convert: convert})).toBe(false);
                });
            });

            describe("value coercion", function() {
                it("should coerce the candidate value based on the value", function() {
                    expect(match('!=', '10', 10)).toBe(false);
                });
            });
        });

        describe("ne", function() {
            describe("numbers", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('ne', 7, 10)).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('ne', 10, 10)).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('ne', 100, 10)).toBe(true);
                });
            });

            describe("strings", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('ne', 'a', 'f')).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('ne', 'j', 'j')).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('ne', 'z', 'q')).toBe(true);
                });
            });

            describe("dates", function() {
                it("should match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('ne', d1, d2)).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('ne', d1, d2)).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('ne', d1, d2)).toBe(true);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12);

                    expect(match('ne', d1, d2)).toBe(true);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('ne', d1, d2, {convert: convert})).toBe(false);
                });
            });

            describe("value coercion", function() {
                it("should coerce the candidate value based on the value", function() {
                    expect(match('ne', '10', 10)).toBe(false);
                });
            });
        });

        describe("!==", function() {
            describe("numbers", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('!==', 7, 10)).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('!==', 10, 10)).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('!==', 100, 10)).toBe(true);
                });
            });

            describe("strings", function() {
                it("should match when the candidate is smaller than the value", function() {
                    expect(match('!==', 'a', 'f')).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    expect(match('!==', 'j', 'j')).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    expect(match('!==', 'z', 'q')).toBe(true);
                });
            });

            describe("dates", function() {
                it("should match when the candidate is smaller than the value", function() {
                    var d1 = new Date(2008, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('!==', d1, d2)).toBe(true);
                });

                it("should not match when the candidate is equal to the value", function() {
                    var d1 = new Date(2010, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('!==', d1, d2)).toBe(false);
                });

                it("should match when the candidate is larger than the value", function() {
                    var d1 = new Date(2012, 0, 1),
                        d2 = new Date(2010, 0, 1);

                    expect(match('!==', d1, d2)).toBe(true);
                });

                it("should match on the full date", function() {
                    var d1 = new Date(2010, 0, 1, 10),
                        d2 = new Date(2010, 0, 1, 12);

                    expect(match('!==', d1, d2)).toBe(true);
                });
            });

            describe("with convert", function() {
                it("should call the convert fn", function() {
                    var d1 = new Date(2010, 0, 1, 12),
                        d2 = new Date(2010, 0, 1, 10),
                        convert = function(v) {
                            return Ext.Date.clearTime(v, true).getTime();
                        };

                    expect(match('!==', d1, d2, {convert: convert})).toBe(false);
                });
            });

            describe("value coercion", function() {
                it("should not coerce the candidate value based on the value", function() {
                    expect(match('!==', '10', 10)).toBe(true);
                });
            });
        });

        describe("in", function() {
            it("should match when the candidate exists in the value", function() {
                expect(match('in', 2, [1, 2, 3, 4])).toBe(true);
            });

            it("should not match when the candidate does not exist in the value", function() {
                expect(match('in', 5, [1, 2, 3, 4])).toBe(false);
            });

            it("should call the convert fn", function() {
                var convert = function(v) {
                    return v + 1;
                }
                expect(match('in', 0, [1, 2, 3, 4], {convert: convert})).toBe(true);
            });
        });

        describe("like", function() {
            it("should match when the candidate matches the value", function() {
                expect(match('like', 'foo', 'foo')).toBe(true);
            });

            it("should match when the candidate is at the start of the value ", function() {
                expect(match('like', 'food', 'foo')).toBe(true);
            });

            it("should match when the candidate is at the end of the value ", function() {
                expect(match('like', 'food', 'ood')).toBe(true);
            });

            it("should match when the candidate is in the middle of the value ", function() {
                expect(match('like', 'foobar', 'oob')).toBe(true);
            });

            it("should not match when the candidate does not exist in the value", function() {
                expect(match('like', 'foo', 'bar')).toBe(false);
            });
        });
    });
});
