describe("Ext.direct.RemotingMethod", function() {
    var cb  = jasmine.createSpy('callback'),
        opt = { timeout: 10 },
        method;
    
    function makeMethod(params) {
        method = new Ext.direct.RemotingMethod(params || {});
    }
    
    afterEach(function() {
        method = null;
    });
    
    describe("Ordered parameters", function() {
        beforeEach(function() {
            makeMethod({
                name: 'foo',
                len: 2
            });
        });
        
        it("should instantiate", function() {
            expect(method).toBeDefined();
        });
        
        it("should set ordered property", function() {
            expect(method.ordered).toBe(true);
        });
        
        it("should return call data", function() {
            var data = method.getCallData(['foo', 'bar', cb, method, opt]);
            
            expect(data).toEqual({
                data: ['foo', 'bar'],
                metadata: undefined,
                callback: cb,
                scope: method,
                options: opt
            });
        });
    });
    
    describe("Named parameters", function() {
        beforeEach(function() {
            makeMethod({
                name: 'bar',
                params: ['foo', 'bar']
            });
        });
        
        it("should instantiate", function() {
            expect(method).toBeDefined();
        });
        
        it("should accept parameter names as array of strings", function() {
            expect(method.params).toEqual({
                foo: true,
                bar: true
            });
        });
        
        it("should accept parameter names as array of objects", function() {
            makeMethod({
                name: 'baz',
                params: [{
                    name: 'foo'
                }, {
                    name: 'bar'
                }]
            });
            
            expect(method.params).toEqual({
                foo: true,
                bar: true
            });
        });
        
        it("should return call data with less than specified params", function() {
            var data = method.getCallData([{ foo: 'foo' }, cb, method, opt]);
            
            expect(data).toEqual({
                data: {
                    foo: 'foo'
                },
                metadata: undefined,
                callback: cb,
                scope: method,
                options: opt
            });
        });
        
        it("should filter out unspecified params", function() {
            makeMethod({
                name: 'baz',
                params: ['foo']
            });
            
            var data = method.getCallData([{ foo: 'bar', bar: 'qux' }, cb, method, opt]);
            
            expect(data).toEqual({
                data: {
                    foo: 'bar'
                },
                metadata: undefined,
                callback: cb,
                scope: method,
                options: opt
            });
        });
        
        it("should not filter params with strict: false", function() {
            makeMethod({
                name: 'blerg',
                params: [],
                strict: false
            });
            
            var data = method.getCallData([{ foo: 'bar', qux: 'fred' }, cb, method, opt]);
            
            expect(data).toEqual({
                data: {
                    foo: 'bar',
                    qux: 'fred'
                },
                metadata: undefined,
                callback: cb,
                scope: method,
                options: opt
            });
        });
    });
    
    describe("metadata", function() {
        describe("declaration", function() {
            var metadata;
            
            describe("ordered meta-params", function() {
                beforeEach(function() {
                    makeMethod({
                        name: 'metaOrdered',
                        len: 0,
                        metadata: {
                            len: 42
                        }
                    });
                    
                    metadata = method.metadata;
                });
                
                it("should define metadata property", function() {
                    expect(metadata).toBeDefined();
                });
                
                it("should set metadata.len to 42", function() {
                    expect(metadata.len).toBe(42);
                });
                
                it("should not set metadata.params", function() {
                    expect(metadata.params).not.toBeDefined();
                });
                
                it("should not set metadata.strict", function() {
                    expect(metadata.strict).not.toBeDefined();
                });
            });
            
            describe("named meta-params", function() {
                beforeEach(function() {
                    makeMethod({
                        name: 'metaNamed',
                        len: 0,
                        metadata: {
                            params: ['foo', 'bar']
                        }
                    });
                    
                    metadata = method.metadata;
                });
                
                it("should define metadata property", function() {
                    expect(metadata).toBeDefined();
                });
                
                it("should set metadata.params", function() {
                    expect(metadata.params).toEqual({ foo: true, bar: true });
                });
                
                it("should set metadata.strict to true", function() {
                    expect(metadata.strict).toBe(true);
                });
                
                it("should set metadata.strict to false", function() {
                    method = null;
                    
                    makeMethod({
                        name: 'metaNamed2',
                        len: 0,
                        metadata: {
                            params: ['foo', 'bar'],
                            strict: false
                        }
                    });
                    
                    expect(method.metadata.strict).toBe(false);
                });
            });
        });
        
        describe("getCallData", function() {
            describe("ordered", function() {
                beforeEach(function() {
                    makeMethod({
                        name: 'metaOrdered',
                        len: 1,
                        metadata: {
                            len: 1
                        }
                    });
                });
                
                it("should return required number of metadata params", function() {
                    var data = method.getCallData([1, cb, null, { metadata: [42] }]);
                    
                    expect(data).toEqual({
                        data: [1],
                        metadata: [42],
                        callback: cb,
                        scope: null,
                        options: {}
                    });
                });
                
                it("should not return more than len metadata params", function() {
                    var data = method.getCallData([1, cb, null, { metadata: [42, 43] }]);
                    
                    expect(data).toEqual({
                        data: [1],
                        metadata: [42],
                        callback: cb,
                        scope: null,
                        options: {}
                    });
                });
                
                it("should throw exception when there is not enough metadata params", function() {
                    spyOn(Ext, 'log');
                    
                    expect(function() {
                        method.getCallData([1, cb, null, { metadata: [] }]);
                    }).toThrow("Not enough parameters in options.metadata " +
                               "for Ext.Direct method metaOrdered");
                });
            });
            
            describe("named strict", function() {
                beforeEach(function() {
                    makeMethod({
                        name: 'metaNamedStrict',
                        len: 0,
                        metadata: {
                            params: ['foo', 'bar']
                        }
                    });
                });
                
                it("should return all required metadata params", function() {
                    var data = method.getCallData([cb, null, { metadata: { foo: 1, bar: 2 } }]);
                    
                    expect(data).toEqual({
                        data: null,
                        metadata: { foo: 1, bar: 2 },
                        callback: cb,
                        scope: null,
                        options: {}
                    });
                });
                
                it("should strip non-required metadata params", function() {
                    var data = method.getCallData([
                        cb, null, { metadata: { foo: 1, bar: 2, baz: 3 } }
                    ]);
                    
                    expect(data).toEqual({
                        data: null,
                        metadata: { foo: 1, bar: 2 },
                        callback: cb,
                        scope: null,
                        options: {}
                    });
                });
                
                it("should throw exception when there is not enough required params", function() {
                    spyOn(Ext, 'log');
                    
                    expect(function() {
                        method.getCallData([cb, null, { metadata: { foo: 1 } }]);
                    }).toThrow("Named parameter bar is missing in options.metadata " +
                               "for Ext.Direct method metaNamedStrict");
                });
            });
            
            describe("named non-strict", function() {
                beforeEach(function() {
                    makeMethod({
                        name: 'metaNamedNonStrict',
                        len: 0,
                        metadata: {
                            params: ['foo'],
                            strict: false
                        }
                    });
                });
                
                it("should return all required metadata params", function() {
                    var data = method.getCallData([cb, null, { metadata: { foo: 1 } }]);
                    
                    expect(data).toEqual({
                        data: null,
                        metadata: { foo: 1 },
                        callback: cb,
                        scope: null,
                        options: {}
                    });
                });
                
                it("should not strip non-required metadata params", function() {
                    var data = method.getCallData([cb, null, { metadata: { foo: 1, bar: 2 } }]);
                    
                    expect(data).toEqual({
                        data: null,
                        metadata: { foo: 1, bar: 2 },
                        callback: cb,
                        scope: null,
                        options: {}
                    });
                });
                
                it("should throw exception when there is not enough required params", function() {
                    spyOn(Ext, 'log');
                    
                    expect(function() {
                        method.getCallData([cb, null, { metadata: { bar: 2 } }]);
                    }).toThrow("Named parameter foo is missing in options.metadata " +
                               "for Ext.Direct method metaNamedNonStrict");
                });
            });
        });
    });
});
