describe("Ext.data.field.Field", function() {
    
    var stypes = Ext.data.SortTypes,
        field;
        
    function make(cfg) {
        field = new Ext.data.field.Field(cfg);    
    }
    
    afterEach(function() {
        field = null;
    });
    
    describe("defaults", function() {
        beforeEach(function() {
            make();
        });
        
        it("should configure the type", function() {
            expect(field.getType()).toBe('auto');
        }); 
        
        it("should have allowBlank: true", function() {
            expect(field.getAllowBlank()).toBe(true);    
        });
        
        it("should have allowNull: false", function() {
            expect(field.getAllowNull()).toBe(false);    
        });
        
        it("should have convert: null", function() {
            expect(field.getConvert()).toBeNull();    
        });
        
        it("should have defaultValue: undefined", function() {
            expect(field.getDefaultValue()).toBeUndefined();    
        });    
        
        it("should have depends: null", function() {
            expect(field.getDepends()).toBeNull();    
        });
        
        it("should have mapping: null", function() {
            expect(field.getMapping()).toBeNull();    
        });
        
        it("should have name: null", function() {
            expect(field.getName()).toBeNull();    
        });
        
        it("should have persist: true", function() {
            expect(field.getPersist()).toBe(true);    
        });
        
        it("should have sortType: none", function() {
            expect(field.getSortType()).toBe(stypes.none);    
        });
        
    });
    
    describe("configuring", function() {
        it("should accept a string name", function() {
            make('foo');
            expect(field.getName()).toBe('foo');
        }); 
        
        it("should configure the name", function() {
            make({
                name: 'foo'
            });
            expect(field.getName()).toBe('foo');
        });
        
        it("should configure allowBlank", function() {
            make({
                allowBlank: false
            });
            expect(field.getAllowBlank()).toBe(false);
        });
        
        describe("allowNull", function() {
            it("should configure a value", function() {
                make({
                    allowNull: true
                });
                expect(field.getAllowNull()).toBe(true);
            });

            it("should default to true for fields with a reference (FK)", function() {
                make({
                    // Feign a reference here
                    reference: {}
                });
                expect(field.getAllowNull()).toBe(true);
            });
        });
        
        describe("convert", function() {
            it("should configure a fn", function() {
                var fn = function() {};
                make({
                    convert: fn
                });
                expect(field.getConvert()).toBe(fn);
            });
            
            describe("calculated", function() {
                it("should have calculated false if the convert function has < 2 args", function() {
                    make({
                        convert: function(a) {}
                    });
                    expect(field.calculated).toBe(false);
                });
                
                it("should have calculated true if the convert function has >= 2 args", function() {
                    make({
                        convert: function(a, b) {}
                    });
                    expect(field.calculated).toBe(true);
                });
            });
        });
        
        describe("defaultValue", function() {
            it("should configure a number", function() {
                make({
                    defaultValue: 3
                });    
                expect(field.getDefaultValue()).toBe(3);
            });  
            
            it("should configure a string", function() {
                make({
                    defaultValue: 'foo'
                });    
                expect(field.getDefaultValue()).toBe('foo');
            });
            
            it("should configure a bool", function() {
                make({
                    defaultValue: true
                });    
                expect(field.getDefaultValue()).toBe(true);
            });
            
            it("should not pass the value through the converter", function() {
                var spy = jasmine.createSpy().andReturn(8);
                make({
                    defaultValue: 7,
                    convert: spy
                });
                expect(field.getDefaultValue()).toBe(7);
                expect(spy).not.toHaveBeenCalled();
            });
        });
        
        describe("depends", function() {
            it("should accept a single string", function() {
                make({
                    depends: 'foo'
                });    
                expect(field.getDepends()).toEqual(['foo']);
            });
            
            it("should accept an array", function() {
                make({
                    depends: ['foo', 'bar', 'baz']
                });    
                expect(field.getDepends()).toEqual(['foo', 'bar', 'baz']);
            });    
        });
        
        it("should configure the mapping", function() {
            make({
                mapping: 'some.obj.key'
            });    
            expect(field.getMapping()).toBe('some.obj.key');
        });
        
        describe("persist", function() {
            it("should configure a true value", function() {
                make({
                    persist: true
                });    
                expect(field.getPersist()).toBe(true);
            });
            
            it("should configure a false value", function() {
                make({
                    persist: false
                });    
                expect(field.getPersist()).toBe(false);
            });
            
            describe("with a convert method", function() {
                describe("single arg", function() {
                    function fn(v) {}

                    it("should default to true", function() {
                        make({
                            convert: fn
                        });
                        expect(field.getPersist()).toBe(true);
                    });

                    it("should configure a true value", function() {
                        make({
                            persist: true,
                            convert: fn
                        });
                        expect(field.getPersist()).toBe(true);
                    });

                    it("should configure a false value", function() {
                        make({
                            persist: false,
                            convert: fn
                        });
                        expect(field.getPersist()).toBe(false);
                    });
                });

                describe("multi arg", function() {
                    function fn(v, rec) {}

                    it("should default to true", function() {
                        make({
                            convert: fn
                        });
                        expect(field.getPersist()).toBe(true);
                    });

                    it("should configure a true value", function() {
                        make({
                            persist: true,
                            convert: fn
                        });
                        expect(field.getPersist()).toBe(true);
                    });

                    it("should configure a false value", function() {
                        make({
                            persist: false,
                            convert: fn
                        });
                        expect(field.getPersist()).toBe(false);
                    });
                });
            });

            describe("with a calculate method", function() {
                function fn() {}

                it("should default to false", function() {
                    make({
                        calculate: fn
                    });
                    expect(field.getPersist()).toBe(false);
                });

                it("should configure a true value", function() {
                    make({
                        persist: true,
                        calculate: fn
                    });
                    expect(field.getPersist()).toBe(true);
                });

                it("should configure a false value", function() {
                    make({
                        persist: false,
                        calculate: fn
                    });
                    expect(field.getPersist()).toBe(false);
                });
            });
        });

        describe("sortType", function() {
            it("should accept a string from Ext.data.SortTypes", function() {
                make({
                    sortType: 'asDate'
                });    
                expect(field.getSortType()).toBe(stypes.asDate);
            });
            
            it("should accept a custom sorter fn", function() {
                var fn = function() {};    
                make({
                    sortType: fn
                }); 
                expect(field.getSortType()).toBe(fn);
            });
        });
    });
    
    describe("collate", function() {
        var fn = function(v) {
            return v * -1;    
        };
        
        beforeEach(function() {
            make({
                sortType: fn
            });
        });
        
        it("should call the sortType and return -1 if a < b", function() {
            expect(field.collate(2, 1)).toBe(-1);
        });
        
        it("should call the sortType and return 0 if a === b", function() {
            expect(field.collate(1, 1)).toBe(0);
        });
        
        it("should call the sortType and return 1 if a > b", function() {
            expect(field.collate(1, 2)).toBe(1);
        });
    });
    
    describe("compare", function() {
        beforeEach(function() {
            make();
        });
        
        describe("numbers", function() {
            it("should return -1 if a < b", function() {
                expect(field.compare(0, 1)).toBe(-1);        
            });
            
            it("should return 0 if a === b", function() {
                expect(field.compare(1, 1)).toBe(0);        
            });
            
            it("should return 1 if a > b", function() {
                expect(field.compare(2, 1)).toBe(1);        
            });  
        });
        
        describe("strings", function() {
            it("should return -1 if a < b", function() {
                expect(field.compare('a', 'b')).toBe(-1);        
            });
            
            it("should return 0 if a === b", function() {
                expect(field.compare('b', 'b')).toBe(0);        
            });
            
            it("should return 1 if a > b", function() {
                expect(field.compare('c', 'b')).toBe(1);        
            });    
        });
        
        describe("dates", function() {
            var d1 = new Date(1970, 0, 1),
                d2 = new Date(1970, 1, 1),
                d3 = new Date(1970, 2, 1);
                
            it("should return -1 if a < b", function() {
                expect(field.compare(d1, d2)).toBe(-1);        
            });
            
            it("should return 0 if a === b", function() {
                expect(field.compare(d2, d2)).toBe(0);        
            });
            
            it("should return 1 if a > b", function() {
                expect(field.compare(d3, d2)).toBe(1);        
            });    
        });
    });
    
    describe("isEqual", function() {
        beforeEach(function() {
            make();
        });
        
        describe("numbers", function() {
            it("should return true if equal", function() {
                expect(field.isEqual(1, 1)).toBe(true);    
            });
            
            it("should return false if unequal", function() {
                expect(field.isEqual(1, 3)).toBe(false);    
            });
        });
        
        describe("strings", function() {
            it("should return true if equal", function() {
                expect(field.isEqual('foo', 'foo')).toBe(true);    
            });
            
            it("should return false if unequal", function() {
                expect(field.isEqual('foo', 'fo')).toBe(false);    
            });
        });
        
        describe("bools", function() {
            it("should return true if equal", function() {
                expect(field.isEqual(true, true)).toBe(true);    
            });
            
            it("should return false if unequal", function() {
                expect(field.isEqual(false, true)).toBe(false);    
            });
        });
        
        describe("object", function() {
            it("should return true if they are equal references", function() {
                var o = {};
                expect(field.isEqual(o, o)).toBe(true);    
            });
            
            it("should return false if they are not equal references", function() {
                var a = {},
                    b = {};
                    
                expect(field.isEqual(a, b)).toBe(false);    
            });  
        });
        
        describe("array", function() {
            it("should return true if they are equal references", function() {
                var o = [1, 2];
                expect(field.isEqual(o, o)).toBe(true);    
            });
            
            it("should return false if they are not equal references", function() {
                var a = [1, 2],
                    b = [1, 2];
                    
                expect(field.isEqual(a, b)).toBe(false);    
            });  
        });
        
        describe("dates", function() {
            it("should return true if they are equal references", function() {
                var o = new Date();
                expect(field.isEqual(o, o)).toBe(true);    
            });
            
            it("should return false if they are not equal references", function() {
                var a = new Date(1970, 0, 1),
                    b = new Date(1970, 0, 1);
                    
                expect(field.isEqual(a, b)).toBe(false);    
            });  
        });
    });
    
    describe("factory", function() {
        var factory = function(type) {
            field = Ext.data.field.Field.create({
                type: type
            });
        };
        
        describe("boolean", function() {
            it("should use the bool alias", function() {
                factory('bool');
                expect(field.isBooleanField).toBe(true);
            });
            
            it("should use the boolean alias", function() {
                factory('boolean');
                expect(field.isBooleanField).toBe(true);
            });
        });
        
        it("should create a date field", function() {
            factory('date');
            expect(field.isDateField).toBe(true);
        }); 
        
        describe("integer", function() {
            it("should use the int alias", function() {
                factory('int');
                expect(field.isIntegerField).toBe(true);
            });
            
            it("should use the integer alias", function() {
                factory('integer');
                expect(field.isIntegerField).toBe(true);
            });
        });
        
        describe("number", function() {
            it("should use the number alias", function() {
                factory('number');
                expect(field.isNumberField).toBe(true);
            });
            
            it("should use the float alias", function() {
                factory('float');
                expect(field.isNumberField).toBe(true);
            });
        });
        
        it("should create a string field", function() {
            factory('string');
            expect(field.isStringField).toBe(true);
        });
        
        describe("base", function() {
            it("should create a base field with auto", function() {
                factory('auto');
                expect(field.isField).toBe(true);
            });
            
            it("should create a base field no type", function() {
                factory();
                expect(field.isField).toBe(true);
            });    
        });
    });
    
    describe("subclassing with validators", function() {
        var presenceMsg = 'Must be present',
            formatMsg = 'Is in the wrong format',
            emailMsg = 'Is not a valid email address',
            A;

        function defineA(validators) {
            A = Ext.define(null, {
                extend: 'Ext.data.field.Field',
                validators: validators
            });
        }

        function expectError(Type, cfg, value, expected) {
            var v = new Type(cfg),
                msg = v.validate(value, '|');

            if (msg === true) {
                msg = [];
            } else {
                msg = msg.split('|');
            }
            expect(msg).toEqual(expected);
        }

        afterEach(function() {
            A = null;
        });

        it("should accept a string", function() {
            defineA('presence');
            expectError(A, null, null, [presenceMsg]);
        });

        it("should accept an object", function() {
            defineA({
                type: 'format',
                matcher: /foo/
            });
            expectError(A, null, null, [formatMsg]);
        });

        it("should accept a function", function() {
            defineA(function() {
                return 'Fail';
            });
            expectError(A, null, null, ['Fail']);
        });

        it("should accept an array of mixed string/object/function", function() {
            defineA(['presence', {
                type: 'format',
                matcher: /foo/
            }, function() {
                return 'Fail';
            }]);
            expectError(A, null, null, [presenceMsg, formatMsg, 'Fail']);
        });

        it("should combine instance validators with class validators", function() {
            defineA('presence');
            expectError(A, {
                validators: 'email'
            }, null, [presenceMsg, emailMsg]);
        });

        describe("extending a custom field", function() {
            var B;

            function defineB(validators) {
                B = Ext.define(null, {
                    extend: A,
                    validators: validators
                });
            }

            afterEach(function() {
                B = null;
            });

            describe("merging", function() {
                it("should merge a string and a string", function() {
                    defineA('presence');
                    defineB('email');
                    expectError(B, null, null, [presenceMsg, emailMsg]);
                });

                it("should merge a string and an object", function() {
                    defineA('presence');
                    defineB({
                        type: 'format',
                        matcher: /foo/
                    });
                    expectError(B, null, null, [presenceMsg, formatMsg]);
                });

                it("should merge a string and a function", function() {
                    defineA('presence');
                    defineB(function() {
                        return 'Fail';
                    });
                    expectError(B, null, null, [presenceMsg, 'Fail']);
                });

                it("should merge a string and an array", function() {
                    defineA('presence');
                    defineB(['email', {
                        type: 'format',
                        matcher: /foo/
                    }, function() {
                        return 'Fail';
                    }]);
                    expectError(B, null, null, [presenceMsg, emailMsg, formatMsg, 'Fail']);
                });

                it("should merge an object and a string", function() {
                    defineA({
                        type: 'format',
                        matcher: /foo/
                    });
                    defineB('presence');
                    expectError(B, null, null, [formatMsg, presenceMsg]);
                });

                it("should merge a function and a string", function() {
                    defineA(function() {
                        return 'Fail';
                    });
                    defineB('presence');
                    expectError(B, null, null, ['Fail', presenceMsg]);
                });

                it("should merge an array and a string", function() {
                    defineA(['email', {
                        type: 'format',
                        matcher: /foo/
                    }, function() {
                        return 'Fail';
                    }]);
                    defineB('presence');
                    expectError(B, null, null, [emailMsg, formatMsg, 'Fail', presenceMsg]);
                });

                it("should merge 2 arrays", function() {
                    defineA(['presence']);
                    defineB(['email']);
                    expectError(B, null, null, [presenceMsg, emailMsg]);
                });

                it("should not modify the superclass validators", function() {
                    defineA('presence');
                    defineB('email');
                    expectError(A, null, null, [presenceMsg]);
                    expectError(B, null, null, [presenceMsg, emailMsg]);
                });
            });
        });
    });
});
