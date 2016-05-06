describe("Ext.data.proxy.Direct", function() {
    var proxy, api, provider, spies,
        readSpy, createSpy, updateSpy, destroySpy, directSpy, namedSpy, orderedSpy;
    
    function makeApi(cfg) {
        api = Ext.apply({
            "namespace": "spec",
            type: "remoting",
            url: "fake"
        }, cfg);
    
        provider = Ext.direct.Manager.addProvider(api);
    }
    
    function makeProxy(cfg) {
        proxy = new Ext.data.proxy.Direct(cfg);
    }

    function makeSpy(name) {
        var directCfg = spec.DirectSpecs[name].directCfg,
            spy = spyOn(spec.DirectSpecs, name);

        spy.directCfg = directCfg;
        
        return spy;
    }
    
    function readSome(proxyObject, operation) {
        proxyObject = proxyObject || proxy;
        
        proxyObject.read(new Ext.data.operation.Read(operation));
    }
    
    function createSome(proxyObject, operation) {
        proxyObject = proxyObject || proxy;
        
        proxyObject.create(new Ext.data.operation.Create(operation || {}));
    }
    
    function updateSome(proxyObject, operation) {
        proxyObject = proxyObject || proxy;
        
        proxyObject.update(new Ext.data.operation.Update(operation || {}));
    }
    
    function destroySome(proxyObject, operation) {
        proxyObject = proxyObject || proxy;
        
        proxyObject.erase(new Ext.data.operation.Destroy(operation || {}));
    }

    afterEach(function() {
        if (proxy) {
            Ext.destroy(proxy);
        }
        
        if (provider) {
            Ext.direct.Manager.removeProvider(provider);
        }
        
        provider = proxy = null;
        readSpy = createSpy = updateSpy = destroySpy = directSpy = null;
        namedSpy = orderedSpy = spies = null;
    });
    
    describe("API declaration", function() {
        beforeEach(function() {
            makeApi({
                actions: {
                    'DirectSpecs': [{
                        len: 0,
                        name: 'read'
                    }, {
                        len: 0,
                        name: 'create'
                    }, {
                        len: 0,
                        name: 'update'
                    }, {
                        len: 0,
                        name: 'destroy'
                    }, {
                        len: 0,
                        name: 'directFn'
                    }]
                }
            });
            
            readSpy = makeSpy('read');
            createSpy = makeSpy('create');
            updateSpy = makeSpy('update');
            destroySpy = makeSpy('destroy');
            directSpy = makeSpy('directFn');
            
            spies = {
                read: readSpy,
                create: createSpy,
                update: updateSpy,
                destroy: destroySpy,
                directFn: directSpy
            };
        });
        
        describe("directFn", function() {
            beforeEach(function() {
                makeProxy({
                    directFn: directSpy
                });
            });
        
            it("should be used to read", function() {
                readSome();
            
                expect(directSpy).toHaveBeenCalled();
            });
        
            it("should be used to create", function() {
                createSome();
            
                expect(directSpy).toHaveBeenCalled();
            });
        
            it("should be used to update", function() {
                updateSome();
            
                expect(directSpy).toHaveBeenCalled();
            });
        
            it("should be used to destroy", function() {
                destroySome();
            
                expect(directSpy).toHaveBeenCalled();
            });
        });
    
        describe("api blob", function() {
            beforeEach(function() {
                makeProxy({
                    api: {
                        read: readSpy,
                        create: createSpy,
                        update: updateSpy,
                        destroy: destroySpy
                    }
                });
            });
        
            it("should be used to read", function() {
                readSome();
            
                expect(readSpy).toHaveBeenCalled();
            });
        
            it("should be used to create", function() {
                createSome();
            
                expect(createSpy).toHaveBeenCalled();
            });
        
            it("should be used to update", function() {
                updateSome();
            
                expect(updateSpy).toHaveBeenCalled();
            });
        
            it("should be used to destroy", function() {
                destroySome();
            
                expect(destroySpy).toHaveBeenCalled();
            });
        });
    
        describe("both directFn and api blob", function() {
            function makeSuite(name, wantCalled, wantNotCalled, opFn) {
                return describe(name, function() {
                    beforeEach(opFn);
                
                    it("should call " + wantCalled, function() {
                        var spy = spies[wantCalled];
                    
                        expect(spy).toHaveBeenCalled();
                    });
                
                    it("should not call " + wantNotCalled, function() {
                        var spy = spies[wantNotCalled];
                    
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            }
        
            beforeEach(function() {
                // This configuration is taken from customer use case,
                // see https://sencha.jira.com/browse/EXTJS-14843
                makeProxy({
                    api: {
                        create: createSpy,
                        update: updateSpy,
                        destroy: destroySpy
                    },
                    directFn: directSpy
                });
            });
        
            makeSuite('read',    'directFn', 'read',     function() { readSome() });
            makeSuite('create',  'create',   'directFn', function() { createSome() });
            makeSuite('update',  'update',   'directFn', function() { updateSome() });
            makeSuite('destroy', 'destroy',  'directFn', function() { destroySome() });
        });

        describe("string name resolving", function() {
            describe("directFn", function() {
                beforeEach(function() {
                    makeProxy({
                        directFn: 'spec.DirectSpecs.directFn'
                    });
                });
            
                it("should resolve directFn", function() {
                    readSome();
                
                    expect(directSpy.callCount).toBe(1);
                });

                it("should be able to resolve a new directFn after loading", function() {
                    readSome(); // To resolve the first time
                
                    proxy.setDirectFn('spec.DirectSpecs.read');
                
                    readSome();
                
                    expect(readSpy.callCount).toBe(1);
                });
            });
        
            describe("api blob", function() {
                describe("initial", function() {
                    beforeEach(function() {
                        makeProxy({
                            api: {
                                read: 'spec.DirectSpecs.read',
                                create: 'spec.DirectSpecs.create',
                                update: 'spec.DirectSpecs.update',
                                destroy: 'spec.DirectSpecs.destroy'
                            }
                        });
                    });
                
                    it("should resolve read fn", function() {
                        readSome();
                    
                        expect(readSpy.callCount).toBe(1);
                    });
                
                    it("should resolve create fn", function() {
                        createSome();
                    
                        expect(createSpy.callCount).toBe(1);
                    });
                
                    it("should resolve update fn", function() {
                        updateSome();
                    
                        expect(updateSpy.callCount).toBe(1);
                    });
                
                    it("should resolve destroy fn", function() {
                        destroySome();
                    
                        expect(destroySpy.callCount).toBe(1);
                    });
                });
            
                describe("re-initializing", function() {
                    beforeEach(function() {
                        makeProxy({
                            api: {
                                read: 'spec.DirectSpecs.directFn',
                                create: 'spec.DirectSpecs.directFn',
                                update: 'spec.DirectSpecs.directFn',
                                destroy: 'spec.DirectSpecs.directFn'
                            }
                        });
                    
                        it("should resolve to directFn upfront", function() {
                            readSome();
                        
                            expect(directSpy.callCount).toBe(1);
                        });
                    
                        describe("after re-init", function() {
                            beforeEach(function() {
                                proxy.setApi({
                                    read: 'spec.DirectSpecs.read',
                                    create: 'spec.DirectSpecs.create',
                                    update: 'spec.DirectSpecs.update',
                                    destroy: 'spec.DirectSpecs.destroy'
                                });
                            });
                        
                            it("should resolve read fn", function() {
                                readSome();
                    
                                expect(readSpy.callCount).toBe(1);
                            });
                
                            it("should resolve create fn", function() {
                                createSome();
                    
                                expect(createSpy.callCount).toBe(1);
                            });
                
                            it("should resolve update fn", function() {
                                updateSome();
                    
                                expect(updateSpy.callCount).toBe(1);
                            });
                
                            it("should resolve destroy fn", function() {
                                destroySome();
                    
                                expect(destroySpy.callCount).toBe(1);
                            });
                        });
                    });
                });
            });
        
            describe("both directFn and api blob", function() {
                beforeEach(function() {
                    makeProxy({
                        api: {
                            read: 'spec.DirectSpecs.read',
                            create: 'spec.DirectSpecs.create',
                            update: 'spec.DirectSpecs.update',
                            destroy: 'spec.DirectSpecs.destroy'
                        },
                        directFn: 'spec.DirectSpecs.directFn'
                    });
                
                    proxy.resolveMethods();
                });
            
                it("should resolve directFn", function() {
                    expect(proxy.directFn).toBe(directSpy);
                });
            
                it("should resolve api.read", function() {
                    expect(proxy.api.read).toBe(readSpy);
                });
            
                it("should resolve api.create", function() {
                    expect(proxy.api.create).toBe(createSpy);
                });
            
                it("should resolve api.update", function() {
                    expect(proxy.api.update).toBe(updateSpy);
                });
            
                it("should resolve api.destroy", function() {
                    expect(proxy.api.destroy).toBe(destroySpy);
                });
            });
        });
    });
    
    describe("extraParams", function() {
        beforeEach(function() {
            makeApi({
                actions: {
                    'DirectSpecs': [{
                        name: 'named',
                        params: ['blerg']
                    }, {
                        name: 'ordered',
                        len: 2
                    }]
                }
            });
        
            namedSpy = makeSpy('named');
            orderedSpy = makeSpy('ordered');
        });
        
        describe("with named fn", function() {
            beforeEach(function() {
                makeProxy({
                    directFn: namedSpy,
                    extraParams: { foo: true, bar: false }
                });
            });

            it("should pass extraParams with read", function() {
                readSome(proxy, { params: { blerg: 42 } });
    
                expect(namedSpy.mostRecentCall.args[0]).toEqual({
                    foo: true,
                    bar: false,
                    blerg: 42
                });
            });
        
            it("should not pass extraParams with create", function() {
                createSome();
            
                expect(namedSpy.mostRecentCall.args[0]).toBe(undefined);
            });
        
            it("should not pass extraParams with update", function() {
                updateSome();
            
                expect(namedSpy.mostRecentCall.args[0]).toBe(undefined);
            });
        
            it("should not pass extraParams with destroy", function() {
                destroySome();
            
                expect(namedSpy.mostRecentCall.args[0]).toBe(undefined);
            });
        });
    
        describe("with ordered fn", function() {
            beforeEach(function() {
                makeProxy({
                    directFn: orderedSpy,
                    extraParams: { foo: true, bar: false }
                });
            });
        
            describe("read", function() {
                it("should pass an object by default", function() {
                    readSome(proxy, { params: { blerg: 43 } });
                
                    // This is a bug in Direct proxy that we want to keep
                    // for backwards compatibility
                    expect(orderedSpy.mostRecentCall.args[0]).toEqual({
                        blerg: 43,
                        foo: true,
                        bar: false
                    });
                });
            
                it("should pass an object with paramsAsHash", function() {
                    proxy.setParamsAsHash(true);
                
                    readSome(proxy, { params: { blerg: 44 } });
                
                    expect(orderedSpy.mostRecentCall.args[0]).toEqual({
                        blerg: 44,
                        foo: true,
                        bar: false
                    });
                });
            
                describe("paramOrder", function() {
                    it("should pass ordered args", function() {
                        proxy.setParamOrder(['blerg', 'foo', 'bar']);
                    
                        readSome(proxy, { params: { blerg: 45 } });
                    
                        var args = orderedSpy.mostRecentCall.args;
                    
                        expect(args[0]).toBe(45);
                        expect(args[1]).toBe(true);
                        expect(args[2]).toBe(false);
                    });
                
                    it("should not discriminate extraParams", function() {
                        proxy.setParamOrder(['bar', 'blerg', 'foo']);
                    
                        readSome(proxy, { params: { blerg: 46 } });
                    
                        var args = orderedSpy.mostRecentCall.args;
                    
                        expect(args[0]).toBe(false);
                        expect(args[1]).toBe(46);
                        expect(args[2]).toBe(true);
                    });
                });
            });
        
            describe("create/update/delete", function() {
                it("should not pass extraParams with create", function() {
                    createSome();
                
                    expect(orderedSpy.mostRecentCall.args[0]).toBe(undefined);
                });
            
                it("should not pass extraParams with update", function() {
                    updateSome();
                
                    expect(orderedSpy.mostRecentCall.args[0]).toBe(undefined);
                });
            
                it("should not pass extraParams with destroy", function() {
                    destroySome();
                
                    expect(orderedSpy.mostRecentCall.args[0]).toBe(undefined);
                });
            });
        });
    });
    
    describe("metadata", function() {
        describe("named", function() {
            beforeEach(function() {
                makeApi({
                    actions: {
                        'DirectSpecs': [{
                            name: 'named',
                            params: ['blerg'],
                            metadata: {
                                params: ['foo', 'bar']
                            }
                        }]
                    }
                });
            
                namedSpy = makeSpy('named');
            
                makeProxy({ directFn: namedSpy });
            });
            
            describe("read operation", function() {
                it("should not set options by default", function() {
                    readSome();
                    
                    expect(namedSpy.mostRecentCall.args[3]).toBe(undefined);
                });
                
                it("should pass metadata when it is set", function() {
                    proxy.setMetadata({ foo: 42, bar: false });
                
                    readSome();
                
                    expect(namedSpy.mostRecentCall.args[3]).toEqual({
                        metadata: { foo: 42, bar: false }
                    });
                });
            });
            
            describe("create operation", function() {
                it("should not set options by default", function() {
                    createSome();
                    
                    expect(namedSpy.mostRecentCall.args[3]).toBe(undefined);
                });
                
                it("should pass metadata when it is set", function() {
                    proxy.setMetadata({ foo: false, bar: null });
                
                    createSome();
                
                    expect(namedSpy.mostRecentCall.args[3]).toEqual({
                        metadata: { foo: false, bar: null }
                    });
                });
            });
            
            describe("update operation", function() {
                it("should not set options by default", function() {
                    updateSome();
                    
                    expect(namedSpy.mostRecentCall.args[3]).toBe(undefined);
                });
                
                it("should pass metadata to update fn", function() {
                    proxy.setMetadata({ foo: { baz: 1 }, bar: ['foo'] });
                
                    updateSome();
                
                    expect(namedSpy.mostRecentCall.args[3]).toEqual({
                        metadata: { foo: { baz: 1 }, bar: ['foo'] }
                    });
                });
            });
            
            describe("destroy operation", function() {
                it("should not set options by default", function() {
                    destroySome();
                    
                    expect(namedSpy.mostRecentCall.args[3]).toBe(undefined);
                });
                
                it("should pass metadata to destroy fn", function() {
                    proxy.setMetadata({ foo: { bar: { baz: 42 } }, bar: 'blerg' });
                
                    destroySome();
                
                    expect(namedSpy.mostRecentCall.args[3]).toEqual({
                        metadata: {
                            foo: { bar: { baz: 42 } }, bar: 'blerg'
                        }
                    });
                });
            });
        });
        
        describe("ordered", function() {
            beforeEach(function() {
                makeApi({
                    actions: {
                        'DirectSpecs': [{
                            name: 'ordered',
                            len: 0,
                            metadata: {
                                len: 1
                            }
                        }]
                    }
                });
                
                orderedSpy = makeSpy('ordered');
                
                makeProxy({ directFn: orderedSpy });
            });
            
            describe("read operation", function() {
                it("should not set options by default", function() {
                    readSome();
                    
                    expect(orderedSpy.mostRecentCall.args[2]).toBe(undefined);
                });
                
                it("should pass metadata when it is set", function() {
                    proxy.setMetadata([42]);
                
                    readSome();
                    
                    expect(orderedSpy.mostRecentCall.args[2]).toEqual({
                        metadata: [42]
                    });
                });
            });
            
            describe("create operation", function() {
                it("should not set options by default", function() {
                    createSome();
                    
                    expect(orderedSpy.mostRecentCall.args[2]).toBe(undefined);
                });
                
                it("should pass metadata when it is set", function() {
                    proxy.setMetadata([43]);
                    
                    createSome();
                    
                    expect(orderedSpy.mostRecentCall.args[2]).toEqual({
                        metadata: [43]
                    });
                });
            });
            
            describe("update operation", function() {
                it("should not set options by default", function() {
                    updateSome();
                    
                    expect(orderedSpy.mostRecentCall.args[2]).toBe(undefined);
                });
                
                it("should pass metadata when it is set", function() {
                    proxy.setMetadata([44]);
                    
                    updateSome();
                    
                    expect(orderedSpy.mostRecentCall.args[2]).toEqual({
                        metadata: [44]
                    });
                });
            });
            
            describe("destroy operation", function() {
                it("should not set options by default", function() {
                    destroySome();
                    
                    expect(orderedSpy.mostRecentCall.args[2]).toBe(undefined);
                });
                
                it("should pass metadata when it is set", function() {
                    proxy.setMetadata([45]);
                    
                    destroySome();
                    
                    expect(orderedSpy.mostRecentCall.args[2]).toEqual({
                        metadata: [45]
                    });
                });
            });
        });
    });
});
