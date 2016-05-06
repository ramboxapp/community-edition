describe("Ext.direct.Manager", function() {
    var Manager = Ext.direct.Manager,
        provider, handler;

    beforeEach(function() {
        provider = new Ext.direct.Provider({ id: 'foo' });
        handler  = jasmine.createSpy('event handler');
    });
    
    afterEach(function() {
        Manager.providers.clear();
        Manager.transactions.clear();
        Manager.clearListeners();
    });
    
    it("should be a singleton", function() {
        expect(Manager.isInstance).toBeTruthy();
    });
    
    it("should init default varName", function() {
        expect(Manager.getVarName()).toBe('Ext.app.REMOTING_API');
    });
    
    describe("handles Providers:", function() {
        it("adds provider as instance", function() {
            Manager.addProvider(provider);
            
            expect(Manager.providers.getCount()).toBe(1);
        });
        
        it("adds provider as config object", function() {
            Manager.addProvider({
                id:   'bar',
                type: ''
            });
            
            expect(Manager.getProvider('bar')).toBeDefined();
        });
        
        it("subscribes to provider's 'data' event", function() {
            spyOn(Manager, 'onProviderData').andReturn();
            
            Manager.addProvider(provider);
            provider.fireEvent('data');
            
            expect(Manager.onProviderData).toHaveBeenCalled();
        });

        it("connects the provider if it's not alredy connected", function() {
            spyOn(provider, 'connect');
            
            Manager.addProvider(provider);
            
            expect(provider.connect).toHaveBeenCalled();
        });
        
        it("relays provider events if requested", function() {
            provider.relayedEvents = ['foo'];
            
            Manager.addProvider(provider);
            Manager.on('foo', handler);
            provider.fireEvent('foo');
            
            expect(handler).toHaveBeenCalled();
        });
        
        it("returns provider by id", function() {
            Manager.addProvider(provider);
            
            var p = Manager.getProvider('foo');
            
            expect(p.id).toBe('foo');
        });
        
        it("removes provider by id", function() {
            Manager.addProvider(provider);
            
            Manager.removeProvider('foo');
            
            expect(Manager.providers.getCount()).toBe(0);
        });
        
        it("removes provider by instance", function() {
            Manager.addProvider(provider);
            
            Manager.removeProvider(provider);
            
            expect(Manager.providers.getCount()).toBe(0);
        });
        
        it("stops relaying 'data' event on removed provider", function() {
            Manager.on('data', handler);
            
            Manager.addProvider(provider);
            Manager.removeProvider('foo');
            
            provider.fireEvent('data');
            
            expect(handler).not.toHaveBeenCalled();
        });
        
        it("stops relaying specified provider events on removed provider", function() {
            provider.relayedEvents = ['foo'];
            
            Manager.addProvider(provider);
            Manager.on('foo', handler);
            Manager.removeProvider(provider);
            
            provider.fireEvent('foo');
            
            expect(handler).not.toHaveBeenCalled();
        });
    });
    
    describe("handles Transactions:", function() {
        var transaction;
        
        beforeEach(function() {
            transaction = new Ext.direct.Transaction({
                provider: provider
            });
        });
        
        it("adds transaction", function() {
            Manager.addTransaction(transaction);
            
            expect(Manager.transactions.getCount()).toBe(1);
        });
        
        it("finds transaction by tid", function() {
            Manager.addTransaction(transaction);
            
            var t = Manager.getTransaction(transaction.tid);
            
            expect(t).toEqual(transaction);
        });
        
        it("finds transaction by instance", function() {
            Manager.addTransaction(transaction);
            
            var t = Manager.getTransaction(transaction);
            
            expect(t).toEqual(transaction);
        });
        
        it("removes transaction by tid", function() {
            Manager.addTransaction(transaction);
            Manager.removeTransaction(transaction.tid);
            
            expect(Manager.transactions.getCount()).toBe(0);
        });
        
        it("removes transaction by instance", function() {
            Manager.addTransaction(transaction);
            Manager.removeTransaction(transaction);
            
            expect(Manager.transactions.getCount()).toBe(0);
        });
    });
    
    // This behavior is highly debatable as it does not make a lot of sense;
    // however it is not possible to deduce original developer's intent
    // from the code so I decided to "ratify" existing functionality
    // for the sake of backwards compatibility. - AT
    describe("handles provider data:", function() {
        var event, exception, handlerFoo, handlerBar;
        
        beforeEach(function() {
            event = new Ext.direct.Event({
                name: 'foo',
                data: { foo: 'bar' }
            });
            
            exception = new Ext.direct.ExceptionEvent({
                data: 'bar is closed'
            });
            
            handlerFoo = jasmine.createSpy('handler foo');
            handlerBar = jasmine.createSpy('handler bar');
        });
        
        it("fires events with name 'event' only once", function() {
            event.name = 'event';
            
            Manager.on('event', handler);
            Manager.on('exception', handlerFoo);
            Manager.onProviderData(provider, event);
            
            expect(handler).toHaveBeenCalled();
            // AND
            expect(handlerFoo).not.toHaveBeenCalled();
        });
        
        it("fires events with name 'exception' only once", function() {
            event.name = 'exception';
            
            Manager.on('event', handler);
            Manager.on('exception', handlerFoo);
            Manager.onProviderData(provider, event);
            
            expect(handler).toHaveBeenCalled();
            // AND
            expect(handlerFoo).not.toHaveBeenCalled();
        });
        
        it("fires unnamed exceptions twice", function() {
            Manager.on('exception', handler);
            Manager.on('event', handlerFoo);
            Manager.onProviderData(provider, exception);
            
            expect(handler).toHaveBeenCalled();
            // AND
            expect(handlerFoo).toHaveBeenCalled();
        });
        
        it("fires other events twice", function() {
            Manager.on('foo', handler);
            Manager.on('event', handlerFoo);
            Manager.on('exception', handlerBar);
            Manager.onProviderData(provider, event);
            
            expect(handler).toHaveBeenCalled();
            // AND
            expect(handlerFoo).toHaveBeenCalled();
            // AND
            expect(handlerBar).not.toHaveBeenCalled();
        });
    });
    
    describe("handles method resolving:", function() {
        var api = {
            actions: {
                TestAction: [{
                    name: 'foo',
                    len: 0
                }],
                'TestAction.Foo': [{
                    name: 'bar',
                    len: 0
                }],
                'TestAction.Foo.Bar': [{
                    name: 'baz',
                    len: 0
                }],
                'TestAction.Foo.Bar.Baz': [{
                    name: 'qux',
                    len: 0
                }]
            },
            namespace: 'Direct',
            type: 'remoting',
            url: '/router'
        };
        
        function checkFn(fn) {
            return Ext.isFunction(fn) && fn.$directCfg;
        }
        
        beforeEach(function() {
            Manager.addProvider(api);
        });
        
        afterEach(function() {
            try {
                delete Ext.global.Direct;
            }
            catch (e) {
                Ext.global.Direct = undefined;
            }
        });
        
        it("forwards methods passed as function", function() {
            var fn = Manager.parseMethod(handler);
            
            expect(fn).toEqual(handler);
        });
        
        it("parses methods of a first level Actions", function() {
            var fn = Manager.parseMethod('TestAction.foo');
            
            expect(checkFn(fn)).toBeTruthy();
        });
        
        it("parses methods of a nested Action", function() {
            var fn = Manager.parseMethod('TestAction.Foo.bar');
            
            expect(checkFn(fn)).toBeTruthy();
        });
        
        it("parses methods of a deeply nested Action", function() {
            var fn = Manager.parseMethod('TestAction.Foo.Bar.baz');
            
            expect(checkFn(fn)).toBeTruthy();
        });
        
        it("parses methods of a really truly deeply nested Action", function() {
            var fn = Manager.parseMethod('TestAction.Foo.Bar.Baz.qux');
            
            expect(checkFn(fn)).toBeTruthy();
        });
        
        it("parses methods of a nested Action with namespace included", function() {
            var fn = Manager.parseMethod('Direct.TestAction.Foo.Bar.Baz.qux');
            
            expect(checkFn(fn)).toBeTruthy();
        });
    });
    
    describe("loadProvider", function() {
        var provider, successSpy, failureSpy, callbackSpy, callbackScope;
        
        beforeEach(function() {
            Ext.define('test.Provider', {
                extend: 'Ext.direct.Provider',
                alias:  'direct.testprovider',
                type: 'test',
                inheritableStatics: {
                    checkConfig: Ext.returnTrue
                }
            });
            
            successSpy  = jasmine.createSpy('success');
            failureSpy  = jasmine.createSpy('failure');
            callbackSpy = jasmine.createSpy('callback');
            
            Manager.on({
                providerload: successSpy,
                providerloaderror: failureSpy
            });
            
            callbackScope = {};
        });
        
        afterEach(function() {
            if (provider) {
                provider.destroy();
            }

            Manager.un({
                providerload: successSpy,
                providerloaderror: failureSpy
            });
            
            successSpy = failureSpy = callbackSpy = callbackScope = null;

            Ext.undefine('test.Provider');
            Manager.providerClasses.test = provider = null;
            test = undefined;
            
            delete Ext.app.REMOTING_API;
        });
        
        describe("passing array", function() {
            beforeEach(function() {
                Manager.loadProvider([{
                    type: 'test',
                    url: 'test1'
                }, {
                    type: 'test',
                    url: 'test2'
                }, {
                    type: 'test',
                    url: 'test3'
                }], callbackSpy);
            });
            
            afterEach(function() {
                Manager.providers.each(function(p) {
                    p.destroy();
                });
            });
            
            it("should create 3 providers", function() {
                expect(Manager.providers.getCount()).toBe(3);
            });
            
            it("should fire providerload event thrice", function() {
                expect(successSpy.callCount).toBe(3);
            });
            
            it("should fire callback thrice", function() {
                expect(callbackSpy.callCount).toBe(3);
            });
        });
        
        describe("fast track", function() {
            beforeEach(function() {
                Manager.loadProvider({
                    type: 'test',
                    url:  'test'
                }, callbackSpy, callbackScope);
                
                provider = Manager.providers.getAt(0);
            });
            
            it("should add provider immediately", function() {
                expect(provider.type).toBe('test');
            });
            
            it("should fire providerload event", function() {
                // Fired event contains extra objects
                var args = Ext.Array.slice(successSpy.mostRecentCall.args, 0, 2);
                
                expect(args).toEqual(['test', provider]);
            });
            
            it("should not fire providerloaderror event", function() {
                expect(failureSpy).not.toHaveBeenCalled();
            });
            
            it("should fire callback", function() {
                expect(callbackSpy).toHaveBeenCalledWith('test', provider);
            });
            
            it("should pass scope to callback", function() {
                expect(callbackSpy.mostRecentCall.object).toBe(callbackScope);
            });
        });
        
        describe("remote load", function() {
            var loadCb, errorCb,
                loaderArgs, successArgs, errorArgs;
            
            beforeEach(function() {
                spyOn(Ext.Loader, 'loadScript').andCallFake(function() {
                    loaderArgs = arguments[0];
                    
                    if (loaderArgs) {
                        loadCb = loaderArgs.onLoad;
                        errorCb = loaderArgs.onError;
                    }
                });
            });
            
            afterEach(function() {
                loadCb = errorCb = loaderArgs = null;
                successArgs = errorArgs = null;
            });
            
            describe("configuration passing via closures", function() {
                var loadOrError;
                
                beforeEach(function() {
                    spyOn(Manager, 'onApiLoadSuccess').andCallFake(function() {
                        successArgs = arguments[0];
                    });
                    
                    spyOn(Manager, 'onApiLoadFailure').andCallFake(function() {
                        errorArgs = arguments[0];
                    });
                    
                    Ext.Loader.loadScript.andCallFake(function() {
                        if (loadOrError === 'load') {
                            arguments[0].onLoad.call(Manager);
                        }
                        else if (loadOrError === 'error') {
                            arguments[0].onError.call(Manager);
                        }
                    });
                });
                
                afterEach(function() {
                    loadOrError = null;
                });
                
                describe("url", function() {
                    it("should throw if no url is provided", function() {
                        expect(function() {
                            Manager.loadProvider({});
                        }).toThrow(
                            "Need API discovery URL to load a Remoting provider!"
                        );
                    });
                    
                    describe("onLoad", function() {
                        beforeEach(function() {
                            loadOrError = 'load';
                        
                            Manager.loadProvider({ url: 'foo' });
                        });
                        
                        it("should pass url to onLoad callback", function() {
                            expect(successArgs.url).toBe('foo');
                        });
                    
                        it("should clear original url value from config", function() {
                            expect('url' in successArgs.config).toBe(false);
                        });
                    });
                    
                    describe("onError", function() {
                        beforeEach(function() {
                            loadOrError = 'error';
                            
                            Manager.loadProvider({ url: 'bar' });
                        });
                        
                        it("should pass url to onError callback", function() {
                            expect(errorArgs.url).toBe('bar');
                        });
                        
                        it("should not pass config to onError callback", function() {
                            expect(errorArgs.config).toBe(undefined);
                        });
                    });
                });
                
                describe("variable name", function() {
                    beforeEach(function() {
                        loadOrError = 'load';
                    });
                    
                    it("should use default if not configured", function() {
                        Manager.loadProvider({ url: 'foo' });
                    
                        expect(successArgs.varName).toBe(Manager.getVarName());
                    });
                
                    it("should use passed value", function() {
                        Manager.loadProvider({ url: 'foo', varName: 'blerg' });
                    
                        expect(successArgs.varName).toBe('blerg');
                    });
                });
                
                describe("callback and scope", function() {
                    var cb = function() {},
                        scope = {};
                    
                    it("should pass both to onLoad callback", function() {
                        loadOrError = 'load';
                        
                        Manager.loadProvider({ url: 'foo' }, cb, scope);
                        
                        expect(successArgs.callback).toBe(cb);
                        expect(successArgs.scope).toBe(scope);
                    });
                    
                    it("should pass both to onError callback", function() {
                        loadOrError = 'error';
                        
                        Manager.loadProvider({ url: 'bar' }, cb, scope);
                        
                        expect(errorArgs.callback).toBe(cb);
                        expect(errorArgs.scope).toBe(scope);
                    });
                });
            });
            
            describe("onApiLoadSuccess", function() {
                describe("success", function() {
                    describe("new provider", function() {
                        beforeEach(function() {
                            Manager.onApiLoadSuccess({
                                url: 'foo',
                                varName: {},
                                config: { type: 'test' },
                                callback: callbackSpy,
                                scope: callbackScope
                            });
                            
                            provider = Manager.providers.getAt(0);
                        });
                        
                        it("should create new provider", function() {
                            expect(provider.type).toBe('test');
                        });
                        
                        it("should fire providerload event", function() {
                            expect(successSpy).toHaveBeenCalled();
                        });
                        
                        it("should pass url and provider with providerload event", function() {
                            var args = Ext.Array.slice(successSpy.mostRecentCall.args, 0, 2);
                            
                            expect(args).toEqual(['foo', provider]);
                        });
                        
                        it("should fire callback", function() {
                            expect(callbackSpy).toHaveBeenCalled();
                        });
                        
                        it("should apply scope to callback", function() {
                            expect(callbackSpy.mostRecentCall.object).toBe(callbackScope);
                        });
                        
                        it("should pass url and provider to callback", function() {
                            var args = callbackSpy.mostRecentCall.args;
                            
                            expect(args).toEqual(['foo', provider]);
                        });
                    });
                    
                    describe("variable resolution", function() {
                        it("should eval nested variable", function() {
                            test.foo = { bar: { baz: 'qux' } };
                            
                            Manager.onApiLoadSuccess({
                                url: 'bar',
                                varName: 'test.foo.bar',
                                config: { type: 'test' }
                            });
                            
                            provider = Manager.providers.getAt(0);
                            
                            expect(provider.baz).toBe('qux');
                        });
                    });
                });
                
                describe("failure", function() {
                    var error = [
                            'blerg',
                            Ext.isIE     ? "ReferenceError: 'nonexistent' is undefined" :
                            Ext.isSafari ? "ReferenceError: Can't find variable: nonexistent" :
                                           "ReferenceError: nonexistent is not defined"
                        ];
                    
                    beforeEach(function() {
                        Manager.onApiLoadSuccess({
                            url: 'blerg',
                            varName: 'nonexistent.variable.name',
                            config: { type: 'test' },
                            callback: callbackSpy,
                            scope: callbackScope
                        });
                        
                        provider = Manager.providers.getAt(0);
                    });
                    
                    it("should not create provider when eval fails", function() {
                        expect(provider).toBe(undefined);
                    });
                    
                    it("should fire providerloaderror event", function() {
                        expect(failureSpy).toHaveBeenCalled();
                    });
                    
                    it("should pass url and error with providerloaderror event", function() {
                        var args = Ext.Array.slice(failureSpy.mostRecentCall.args, 0, 2);
                        
                        expect(args).toEqual(error);
                    });
                    
                    it("should fire callback", function() {
                        expect(callbackSpy).toHaveBeenCalled();
                    });
                    
                    it("should apply scope to callback", function() {
                        expect(callbackSpy.mostRecentCall.object).toBe(callbackScope);
                    });
                    
                    it("should pass url and error to callback", function() {
                        var args = callbackSpy.mostRecentCall.args;
                        
                        expect(args).toEqual(error);
                    });
                });
            });
            
            describe("onApiLoadFailure", function() {
                beforeEach(function() {
                    Manager.onApiLoadFailure({
                        url: 'fred',
                        callback: callbackSpy,
                        scope: callbackScope
                    });
                });
                
                it("should fire providerloaderror event", function() {
                    expect(failureSpy).toHaveBeenCalled();
                });
                
                it("should pass url and error with providerloaderror event", function() {
                    var args = Ext.Array.slice(failureSpy.mostRecentCall.args, 0, 2);
                    
                    expect(args).toEqual([
                        'fred', 'Ext Direct API was not found at fred'
                    ]);
                });
                
                it("should fire callback", function() {
                    expect(callbackSpy).toHaveBeenCalled();
                });
                
                it("should apply scope to callback", function() {
                    expect(callbackSpy.mostRecentCall.object).toBe(callbackScope);
                });
                
                it("should pass url and error to callback", function() {
                    var args = callbackSpy.mostRecentCall.args;
                    
                    expect(args).toEqual([
                        'fred', 'Ext Direct API was not found at fred'
                    ]);
                });
            });
        });
    });
});
