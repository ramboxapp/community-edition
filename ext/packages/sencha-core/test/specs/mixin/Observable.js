(function() {

function makeObservableSuite(Observable) {

    describe(Observable.$className, function() {
        var Boss,
            boss,
            bossConfig,
            bossListeners,
            bossAskListener,
            bossAskFn,
            bossFiredFn,
            bossFired2Fn,
            bossQuitFn,
            Employee,
            employee,
            employeeConfig,
            employeeListeners,
            employeeBubbleEvents,
            employeeAskListener,
            employeeAskFn,
            employeeFiredListener,
            employeeFiredFn,
            employeeQuitListener,
            employeeQuitFn,
            events,
            fakeScope;

        function makeDefaultListenerScope(o) {
            o.resolveListenerScope = function() {
                if (!this.defaultScope) {
                    this.defaultScope = {
                        meth1: function() {
                        },
                        resolveListenerScope: function() {
                            return null;
                        }
                    };
                }
                return this.defaultScope;
            };
        }

        beforeEach(function() {
            fakeScope = {};
            events = {
                "fired": true,
                "quit": true,
                "ask_salary_augmentation": true
            };
            // boss creation
            Boss = Ext.extend(Observable, {
                constructor: function(conf) {
                    conf = conf || {};
                    this.listeners = conf.listeners;
                    Boss.superclass.constructor.call(this, conf);
                },

                doSomething: function() {
                }
            });

            bossFiredFn = jasmine.createSpy("bossFiredFn");
            bossFired2Fn = jasmine.createSpy("bossFired2Fn");

            bossQuitFn = jasmine.createSpy("bossQuitFn");

            bossAskFn = jasmine.createSpy("bossAskFn");
            bossAskListener = {
                fn: bossAskFn,
                scope: fakeScope
            };
            bossListeners = {
                ask_salary_augmentation: bossAskListener
            };
            bossConfig = {
                listeners: bossListeners
            };

            boss = new Boss(bossConfig);

            // employee creation
            Employee = Ext.extend(Observable, {
                constructor: function(conf) {
                    conf = conf || {};
                    this.listeners = conf.listeners;
                    Employee.superclass.constructor.call(this, conf);
                },
                getBubbleTarget: function() {
                    return this.boss;
                }
            });

            employeeFiredFn = jasmine.createSpy("employeeFiredFn");
            employeeQuitFn = jasmine.createSpy("employeeQuitFn");
            employeeAskFn = jasmine.createSpy("employeeAskFn");
            employeeFiredListener = {
                fn: employeeFiredFn,
                scope: fakeScope
            };
            employeeQuitListener = {
                fn: employeeQuitFn,
                scope: fakeScope
            };
            employeeAskListener = {
                fn: employeeAskFn,
                scope: fakeScope
            };
            employeeListeners = {
                ask_salary_augmentation: employeeAskListener,
                fired: employeeFiredListener,
                quit: employeeQuitListener
            };

            employeeBubbleEvents = ['ask_salary_augmentation'];

            employeeConfig = {
                listeners: employeeListeners,
                bubbleEvents: employeeBubbleEvents,
                boss: boss
            };

            // some spies used in constructor
            spyOn(Employee.prototype, "on").andCallThrough();
            spyOn(Employee.prototype, "addListener").andCallThrough();
            spyOn(Employee.prototype, "enableBubble").andCallThrough();

            employee = new Employee(employeeConfig);
        });

        describe("constructor", function() {
            it("should allow the constructor to be called multiple times", function() {
                // In this test a class (Cls) uses two mixins that derive from Observable
                // and also mixes in observable itself.  The class calls the constructor
                // of both mixins and the Observable constructor from its constructor.
                // This results in 3 calls to the Observable constructor.  Since all 3 of
                // these calls are equivalent, only the first one should have any effect.
                // Successive calls should not re-initialize anything that was already
                // initialized by the first constructor call.
                var MixinA = Ext.define(null, {
                        extend: Observable
                    }),
                    MixinB = Ext.define(null, {
                        extend: Observable
                    }),
                    Cls = Ext.define(null, {
                        mixins: {
                            mixinA: MixinA,
                            mixinB: MixinB,
                            observable: Observable
                        },
                        constructor: function(config) {
                            var initConfig = spyOn(this, 'initConfig').andCallThrough(),
                                isMixinObservable = Observable.$className === 'Ext.mixin.Observable',
                                hasListeners, events;

                            this.mixins.mixinA.constructor.call(this, config);

                            if (isMixinObservable) {
                                expect(initConfig).toHaveBeenCalledWith({foo: 'bar'});
                            } else {
                                expect(this.foo).toBe('bar');
                            }

                            // After the first invocation of the constructor a couple objects
                            // are created.  Cache these so we can make sure that successive
                            // invocations do not recreate these objects
                            hasListeners = this.hasListeners;
                            events = this.events;

                            this.mixins.observable.constructor.call(this, config);

                            expect(this.hasListeners).toBe(hasListeners);
                            expect(this.events).toBe(events);

                            this.mixins.mixinB.constructor.call(this, config);

                            expect(this.hasListeners).toBe(hasListeners);
                            expect(this.events).toBe(events);

                            if (isMixinObservable) {
                                expect(initConfig.callCount).toBe(1);
                            }
                        }
                    });

                new Cls({foo: 'bar'});
            });
        });

        describe("destroyable", function() {
            describe('listeners', function() {
                it('should remove the listeners when you destroy the returned Destroyable', function() {
                    var newBoss = new Boss(),
                        listenerDestroyable = newBoss.on({
                            fired: function() {

                            },
                            quit: function() {

                            },
                            ask_salary_augmentation: function() {

                            },
                            destroyable: true
                        });

                    expect(newBoss.hasListeners.fired).toEqual(1);
                    expect(newBoss.hasListeners.quit).toEqual(1);
                    expect(newBoss.hasListeners.ask_salary_augmentation).toEqual(1);
                    listenerDestroyable.destroy();
                    expect(newBoss.hasListeners.fired).toBeUndefined();
                    expect(newBoss.hasListeners.quit).toBeUndefined();
                    expect(newBoss.hasListeners.ask_salary_augmentation).toBeUndefined();
                });
            });

            describe('managed listeners', function() {
                it('should remove managed listeners when you destroy the returned Destroyable', function() {
                    var newBoss = new Boss(),
                        listenerDestroyable = newBoss.mon(newBoss, {
                            fired: function() {

                            },
                            quit: function() {

                            },
                            ask_salary_augmentation: function() {

                            },
                            destroyable: true
                        });

                    expect(newBoss.hasListeners.fired).toEqual(1);
                    expect(newBoss.hasListeners.quit).toEqual(1);
                    expect(newBoss.hasListeners.ask_salary_augmentation).toEqual(1);
                    listenerDestroyable.destroy();
                    expect(newBoss.hasListeners.fired).toBeUndefined();
                    expect(newBoss.hasListeners.quit).toBeUndefined();
                    expect(newBoss.hasListeners.ask_salary_augmentation).toBeUndefined();
                });
            });

            describe('relayers', function() {
                it('should remove relayers when you destroy the returned Destroyable', function() {
                    var newBoss = new Boss(),
                        newEmployee = new Employee(),
                        relayers = newBoss.relayEvents(newEmployee, ['fired', 'quit', 'ask_salary_augmentation'], 'minion_'),
                        quit = 0, fired = 0, ask_salary_augmentation = 0;

                    newBoss.on({
                        minion_fired: function() {
                            fired++;
                        },
                        minion_quit: function() {
                            quit++;
                        },
                        minion_ask_salary_augmentation: function() {
                            ask_salary_augmentation++;
                        }
                    });

                    // Employee's events now have the relayers as listeners
                    expect(newEmployee.hasListeners.fired).toEqual(1);
                    expect(newEmployee.hasListeners.quit).toEqual(1);
                    expect(newEmployee.hasListeners.ask_salary_augmentation).toEqual(1);

                    // Fire the Employee events which should be relayed through the Boss
                    newEmployee.fireEvent('fired');
                    newEmployee.fireEvent('quit');
                    newEmployee.fireEvent('ask_salary_augmentation');
                    expect(fired).toEqual(1);
                    expect(quit).toEqual(1);
                    expect(ask_salary_augmentation).toEqual(1);

                    // Destroy the relayers, employee's events now should have no listeners
                    relayers.destroy();
                    expect(newEmployee.hasListeners.fired).toBeUndefined();
                    expect(newEmployee.hasListeners.quit).toBeUndefined();
                    expect(newEmployee.hasListeners.ask_salary_augmentation).toBeUndefined();

                    // Fire the Employee events which should **NOT** be relayed through the Boss
                    // The counters should remain at 1
                    newEmployee.fireEvent('fired');
                    newEmployee.fireEvent('quit');
                    newEmployee.fireEvent('ask_salary_augmentation');
                    expect(fired).toEqual(1);
                    expect(quit).toEqual(1);
                    expect(ask_salary_augmentation).toEqual(1);
                });
            });
        });

        describe("instantiation", function() {
            describe("config initialization", function() {
                if (Observable === Ext.mixin.Observable) {
                    it("should invoke initConfig", function() {
                        var Foo = Ext.define(null, {
                            extend: Observable
                        });

                        spyOn(Foo.prototype, 'initConfig');
                        spyOn(Ext, 'apply');

                        var foo = new Foo({x: 1});

                        expect(Foo.prototype.initConfig).toHaveBeenCalledWith({x: 1});
                        expect(Ext.apply).not.toHaveBeenCalled();
                        foo.destroy();
                    });

                    it("should apply configuration if $applyConfigs is true", function() {
                        var Foo = Ext.define(null, {
                            extend: Observable,
                            $applyConfigs: true
                        });

                        spyOn(Foo.prototype, 'initConfig');
                        spyOn(Ext, 'apply');

                        var foo = new Foo({x: 1});

                        expect(Ext.apply).toHaveBeenCalledWith(foo, {x: 1});
                        expect(Foo.prototype.initConfig).not.toHaveBeenCalled();
                        foo.destroy();
                    });
                } else {
                    it("should apply configuration", function() {
                        var Foo = Ext.define(null, {
                            extend: Observable
                        });

                        spyOn(Foo.prototype, 'initConfig');
                        spyOn(Ext, 'apply');

                        var foo = new Foo({x: 1});

                        expect(Ext.apply).toHaveBeenCalledWith(foo, {x: 1});
                        expect(Foo.prototype.initConfig).not.toHaveBeenCalled();
                        foo.destroy();
                    });

                    it("should invoke initConfig if $applyConfigs is false", function() {
                        var Foo = Ext.define(null, {
                            extend: Observable,
                            $applyConfigs: false
                        });

                        spyOn(Foo.prototype, 'initConfig');
                        spyOn(Ext, 'apply');

                        var foo = new Foo({x: 1});

                        expect(Foo.prototype.initConfig).toHaveBeenCalledWith({x: 1});
                        expect(Ext.apply).not.toHaveBeenCalled();
                        foo.destroy();
                    });
                }
            });

            it("should append event handlers passed in configuration params", function() {
                expect(Employee.prototype.addListener).toHaveBeenCalledWith(employeeListeners);
            });

            it("should delete listeners configuration property", function() {
                expect(employee.listeners).toBeNull();
            });

            it("should enable bubble", function() {
                expect(Employee.prototype.enableBubble).toHaveBeenCalledWith(employeeBubbleEvents);
            });
        });

        describe("event name normalization", function() {
            var spy, o;

            beforeEach(function() {
                spy = jasmine.createSpy();
                o = new Observable();
            });

            describe("firing", function() {
                it("should match when firing with lower case", function() {
                    o.on('FOO', spy);
                    o.fireEvent('foo');
                    expect(spy).toHaveBeenCalled();
                });

                it("should match when firing with mixed case", function() {
                    o.on('foo', spy);
                    o.fireEvent('FOO');
                    expect(spy).toHaveBeenCalled();
                });

                describe("using mon", function() {
                    var o2;

                    beforeEach(function() {
                        o2 = new Observable();
                    });

                    it("should match when firing with lower case", function() {
                        o2.mon(o, 'FOO', spy);
                        o.fireEvent('foo');
                        expect(spy).toHaveBeenCalled();
                    });

                    it("should match when firing with mixed case", function() {
                        o2.mon(o, 'foo', spy);
                        o.fireEvent('FOO');
                        expect(spy).toHaveBeenCalled();
                    });
                });
            });

            describe("removing", function() {
                it("should match when removing with lower case", function() {
                    o.on('FOO', spy);
                    o.un('foo', spy);
                    o.fireEvent('foo');
                    expect(spy).not.toHaveBeenCalled();
                });

                it("should match when removing with mixed case", function() {
                    o.on('foo', spy);
                    o.un('FOO', spy);
                    o.fireEvent('FOO');
                    expect(spy).not.toHaveBeenCalled();
                });

                describe("using mon/mun", function() {
                    var o2;

                    beforeEach(function() {
                        o2 = new Observable();
                    });

                    it("should match when removing with lower case", function() {
                        o2.mon(o, 'FOO', spy);
                        o2.mun(o, 'foo', spy);
                        o.fireEvent('foo');
                        expect(spy).not.toHaveBeenCalled();
                    });

                    it("should match when removing with mixed case", function() {
                        o2.mon(o, 'foo', spy);
                        o2.mun(o, 'FOO', spy);
                        o.fireEvent('FOO');
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });

            describe("hasListener(s)", function() {
                it("should use lower case for hasListeners", function() {
                    o.on('FOO', spy);
                    expect(o.hasListeners.foo).toBe(1);
                });

                it("should use lower case for hasListener", function() {
                    o.on('FOO', spy);
                    expect(o.hasListener('foo')).toBe(true);
                });

                describe("using mon", function() {
                    var o2;

                    beforeEach(function() {
                        o2 = new Observable();
                    });

                    it("should use lower case for hasListeners", function() {
                        o2.mon(o, 'FOO', spy);
                        expect(o.hasListeners.foo).toBe(1);
                    });

                    it("should use lower case for hasListener", function() {
                        o2.mon(o, 'FOO', spy);
                        expect(o.hasListener('foo')).toBe(true);
                    });
                })
            });

            describe("suspend/resume", function() {
                it("should ignore case when asking if an event is suspended", function() {
                    o.suspendEvent('FOO');
                    expect(o.isSuspended('foo')).toBe(true);
                });

                it("should ignore case when resuming events", function() {
                    o.on('foo', spy);
                    o.suspendEvent('FOO');
                    o.fireEvent('foo');
                    expect(spy).not.toHaveBeenCalled();
                    o.resumeEvent('foo');
                    o.fireEvent('foo');
                    expect(spy).toHaveBeenCalled();
                });
            });

            describe("bubbling", function() {
                it("should ignore case when bubbling events", function() {
                    var other = new Observable();
                    other.on('foo', spy);
                    o.enableBubble('FOO');
                    o.getBubbleTarget = function() {
                        return other;
                    }
                    o.fireEvent('foo');
                    expect(spy).toHaveBeenCalled();
                });
            });
        });

        describe("firing events", function() {

            describe("without options", function() {
                beforeEach(function() {
                    employee.fireEvent("fired", "I'am fired :s");
                });

                describe("bubbling", function() {
                    it("should not fire boss fired event", function() {
                        expect(bossFiredFn).not.toHaveBeenCalled();
                    });
                });

                it("should call the handler only one times", function() {
                    expect(employeeFiredFn.callCount).toEqual(1);
                });

                it("should call the handler function with passed arguments", function() {
                    expect(employeeFiredFn).toHaveBeenCalledWith("I'am fired :s", employeeFiredListener);
                });

                it("should call the handler function with the correct scope", function() {
                    expect(employeeFiredFn.calls[0].object).toBe(fakeScope);
                });

                describe("scope resolution", function() {
                    describe("with a function reference", function() {
                        it("should resolve to the instance with scope:'this'", function() {
                            var spy = jasmine.createSpy();
                            boss.on('fired', spy, 'this');
                            boss.fireEvent('fired');
                            expect(spy.mostRecentCall.object).toBe(boss);
                        });

                        it("should throw an error with scope:'controller'", function() {
                            var spy = jasmine.createSpy();
                            boss.on('fired', spy, 'controller');
                            expect(function() {
                                boss.fireEvent('fired');
                            }).toThrow();
                        });
                    });

                    describe("with scope: 'this'", function() {
                        it("resolve to the observable", function() {
                            boss.on('fired', 'doSomething', 'this');
                            var spy = spyOn(boss, 'doSomething');
                            boss.fireEvent('fired');
                            expect(spy).toHaveBeenCalled();
                        });
                    });

                    describe("with scope: 'controller'", function() {
                        it("not be able to resolve", function() {
                            boss.on('fired', 'doSomething', 'controller');
                            expect(function() {
                                boss.fireEvent('fired');
                            }).toThrow(
                                'scope: "controller" can only be specified on classes that derive from Ext.Component or Ext.Widget'
                            );
                        });
                    });

                    describe("without default listener scope", function() {
                        it("should always fire on the passed scope", function() {
                            var o = {
                                aMethod: function() {
                                }
                            };
                            var spy = spyOn(o, 'aMethod');
                            boss.on('fired', 'aMethod', o);
                            boss.fireEvent('fired');
                            expect(spy).toHaveBeenCalled();
                        });

                        it("should default to the observable", function() {
                            boss.aMethod = function() {
                            };
                            var spy = spyOn(boss, 'aMethod');
                            boss.on('fired', 'aMethod');
                            boss.fireEvent('fired');
                            expect(spy).toHaveBeenCalled();
                        });
                    });

                    describe("with default listener scope", function() {
                        beforeEach(function() {
                            makeDefaultListenerScope(boss);
                        });

                        it("should favour a passed scope", function() {
                            var o = {
                                aMethod: function() {
                                }
                            };
                            var spy = spyOn(o, 'aMethod');
                            boss.on('fired', 'aMethod', o);
                            boss.fireEvent('fired');
                            expect(spy).toHaveBeenCalled();
                        });

                        it("should favour a default listener scope over the observable", function() {
                            var spy = spyOn(boss.resolveListenerScope(), 'meth1');
                            boss.on('fired', 'meth1');
                            boss.fireEvent('fired');
                            expect(spy).toHaveBeenCalled();
                        });

                        it("should not cache the listener scope", function() {
                            var other = {
                                    meth1: function() {

                                    }
                                }, spy1 = spyOn(boss.resolveListenerScope(), 'meth1'),
                                spy2 = spyOn(other, 'meth1');

                            boss.on('fired', 'meth1');
                            boss.fireEvent('fired');
                            expect(spy1).toHaveBeenCalled();
                            expect(spy2).not.toHaveBeenCalled();
                            spy1.reset();
                            spy2.reset();

                            boss.resolveListenerScope = function() {
                                return other;
                            };
                            boss.fireEvent('fired');
                            expect(spy1).not.toHaveBeenCalled();
                            expect(spy2).toHaveBeenCalled();
                        });
                    });
                });
            });


            describe("with options", function() {
                describe("single", function() {
                    var singleFn;

                    beforeEach(function() {
                        singleFn = jasmine.createSpy("singleFn");
                        boss.addListener("singleevent", singleFn, fakeScope, {
                            single: true
                        });

                        boss.fireEvent("singleevent", "single 1");
                        boss.fireEvent("singleevent", "single 2");
                        boss.fireEvent("singleevent", "single 3");
                    });

                    it("should call the handler only one times", function() {
                        expect(singleFn.callCount).toEqual(1);
                    });

                    it("should call the handler function with passed arguments", function() {
                        expect(singleFn).toHaveBeenCalledWith("single 1", {
                            single: true
                        });
                    });

                    it("should call the handler function with the correct scope", function() {
                        expect(singleFn.calls[0].object).toBe(fakeScope);
                    });

                    it("should remove the listener", function() {
                        expect(boss.hasListener("singleevent")).toBe(false);
                    });

                    it("should fire with dynamic scope resoution", function() {
                        boss = new Boss();
                        makeDefaultListenerScope(boss);
                        var spy = spyOn(boss.resolveListenerScope(), 'meth1');

                        boss.addListener("singleevent", 'meth1', undefined, {
                            single: true
                        });

                        boss.fireEvent("singleevent", "single 1");
                        boss.fireEvent("singleevent", "single 2");
                        boss.fireEvent("singleevent", "single 3");
                        expect(spy.callCount).toBe(1);

                    });
                });

                describe("target", function() {
                    var ct,
                        callbackFn,
                        callbackFn2;

                    beforeEach(function() {
                        ct = Ext.create('Ext.container.Container', {
                            items: [{
                                bubbleEvents: ['add', 'remove'],
                                xtype: 'container',
                                itemId: 'foo',
                                items: [{
                                    bubbleEvents: ['add', 'remove'],
                                    xtype: 'component',
                                    itemId: 'bar'
                                }, {
                                    bubbleEvents: ['add', 'remove'],
                                    xtype: 'component',
                                    itemId: 'baz'
                                }]
                            }]
                        });
                        callbackFn = jasmine.createSpy('callbackFn');
                        callbackFn2 = jasmine.createSpy('callbackFn2');
                    });

                    afterEach(function() {
                        ct.destroy();
                    });

                    it("should bubble up to its owner containers when target is not defined", function() {
                        ct.on(
                            'remove',
                            callbackFn
                        );

                        ct.getComponent('foo').on(
                            'remove',
                            callbackFn2
                        );

                        ct.getComponent('foo').remove('bar');

                        expect(callbackFn).toHaveBeenCalled();
                        expect(callbackFn2).toHaveBeenCalled();
                    });

                    it("should not bubble up to its owner containers when target is defined on a different observable", function() {
                        ct.on(
                            'remove',
                            callbackFn,
                            ct,
                            {target: ct}
                        );

                        ct.getComponent('foo').on(
                            'remove',
                            callbackFn2,
                            ct,
                            {target: ct}
                        );

                        ct.getComponent('foo').remove('baz');

                        expect(callbackFn).not.toHaveBeenCalled();
                        expect(callbackFn2).not.toHaveBeenCalled();
                    });

                    it("should not bubble up to its owner container but will bubble up to its ancestor", function() {
                        ct.on(
                            'add',
                            callbackFn
                        );

                        ct.getComponent('foo').on(
                            'add',
                            callbackFn2,
                            ct,
                            {target: ct}
                        );

                        ct.getComponent('foo').add({
                            xtype: 'component',
                            itemId: 'test'
                        });

                        expect(callbackFn).toHaveBeenCalled();
                        expect(callbackFn2).not.toHaveBeenCalled();
                    });

                    it("should fire with dynamic scope resolution", function() {
                        makeDefaultListenerScope(ct);
                        var spy = spyOn(ct.resolveListenerScope(), 'meth1');
                        ct.on('add', 'meth1', undefined, {
                            target: ct
                        });

                        ct.add({
                            xtype: 'component',
                            itemId: 'test'
                        });

                        expect(spy).toHaveBeenCalled();
                    });
                });

                (Ext.isSafari4 ? xdescribe : describe)("buffer", function() {
                    var bufferFn,
                        bufferEventListener;

                    beforeEach(function() {
                        bufferFn = jasmine.createSpy("bufferFn");
                        boss.addListener("bufferevent", bufferFn, fakeScope, {
                            buffer: 5
                        });

                        boss.fireEvent("bufferevent", "buffer 1");
                        boss.fireEvent("bufferevent", "buffer 2");
                        boss.fireEvent("bufferevent", "buffer 3");
                    });

                    it("should not call handler immediately", function() {
                        expect(bufferFn).not.toHaveBeenCalled();
                    });

                    it("should call the handler only one times after a certain amount of time", function() {
                        waitsFor(function() {
                            return bufferFn.callCount === 1;
                        }, "bufferFn wasn't called");
                    });

                    it("should call the handler function with passed arguments coming from the last event firing", function() {
                        waitsFor(function() {
                            return bufferFn.callCount === 1;
                        }, "bufferFn wasn't called");

                        runs(function() {
                            expect(bufferFn).toHaveBeenCalledWith("buffer 3", {
                                buffer: 5
                            });
                        });
                    });

                    it("should call the handler function with the correct scope", function() {
                        waitsFor(function() {
                            return bufferFn.callCount === 1;
                        }, "bufferFn wasn't called");

                        runs(function() {
                            expect(bufferFn.calls[0].object).toBe(fakeScope);
                        });
                    });

                    it("should not remove the listener", function() {
                        waitsFor(function() {
                            return bufferFn.callCount === 1;
                        }, "bufferFn wasn't called");

                        runs(function() {
                            expect(boss.hasListener("bufferevent")).toBe(true);
                        });
                    });

                    it("should fire with dynamic scope resolution", function() {
                        boss = new Boss();
                        makeDefaultListenerScope(boss);
                        var spy = spyOn(boss.resolveListenerScope(), 'meth1');

                        boss.on("bufferevent", 'meth1', undefined, {
                            buffer: 5
                        });

                        boss.fireEvent("bufferevent", "buffer 1");
                        boss.fireEvent("bufferevent", "buffer 2");
                        boss.fireEvent("bufferevent", "buffer 3");

                        waitsFor(function() {
                            return spy.callCount === 1;
                        }, "spy wasn't called");

                        runs(function() {
                            expect(spy.callCount).toBe(1);
                        });
                    });
                });

                (Ext.isSafari4 ? xdescribe : describe)("delay", function() {
                    var delayFn,
                        delayEventListener;

                    beforeEach(function() {
                        delayFn = jasmine.createSpy("delayFn");
                        boss.addListener("delayevent", delayFn, fakeScope, {
                            delay: 5
                        });

                        boss.fireEvent("delayevent", "delay");
                    });

                    it("should not call handler immediately", function() {
                        expect(delayFn).not.toHaveBeenCalled();
                    });

                    it("should call the handler only one times after a certain amount of time", function() {
                        waitsFor(function() {
                            return delayFn.callCount === 1;
                        }, "delayFn wasn't called");
                    });

                    it("should call the handler function with passed arguments", function() {
                        waitsFor(function() {
                            return delayFn.callCount === 1;
                        }, "delayFn wasn't called");

                        runs(function() {
                            expect(delayFn).toHaveBeenCalledWith("delay", {
                                delay: 5
                            });
                        });
                    });

                    it("should call the handler function with the correct scope", function() {
                        waitsFor(function() {
                            return delayFn.callCount === 1;
                        }, "delayFn wasn't called");

                        runs(function() {
                            expect(delayFn.calls[0].object).toBe(fakeScope);
                        });
                    });

                    it("should fire with dynamic scope resolution", function() {
                        boss = new Boss();
                        makeDefaultListenerScope(boss);
                        var spy = spyOn(boss.resolveListenerScope(), 'meth1');

                        boss.on("delayevent", 'meth1', undefined, {
                            delay: 5
                        });

                        boss.fireEvent("delayevent", "buffer 1");

                        waitsFor(function() {
                            return spy.callCount === 1;
                        }, "spy wasn't called");

                        runs(function() {
                            expect(spy).toHaveBeenCalled();
                        });
                    });
                });

                describe("priority", function() {
                    var a, result;

                    beforeEach(function() {
                        Ext.define('A', {
                            extend: Observable
                        });
                        a = new A();
                        result = [];
                    });

                    afterEach(function() {
                        Ext.undefine('A');
                    });

                    it("should call the handlers in priority order", function() {
                        a.on('foo', function() {
                            result.push(10);
                        }, null, {priority: 10});

                        a.on('foo', function() {
                            result.push('u1');
                        }, null);

                        a.on('foo', function() {
                            result.push(-7);
                        }, null, {priority: -7});

                        a.on('foo', function() {
                            result.push(0);
                        }, null, {priority: 0});

                        a.on('foo', function() {
                            result.push(5);
                        }, null, {priority: 5});

                        a.on('foo', function() {
                            result.push(-3);
                        }, null, {priority: -3});

                        a.on('foo', function() {
                            result.push('u2');
                        });

                        a.fireEvent('foo');

                        expect(result.join(' ')).toBe('10 5 u1 0 u2 -3 -7');
                    });

                    it("should add a 0 priority listener after removal of a positive priority listener, when the listeners array contains negative priority listeners", function() {
                        // This spec is needed because of the inner workings of the priority
                        // mechanism. Internally, to avoid excessive looping, it tracks a
                        // highestNegativePriorityIndex so that when a 0 or undefined priority
                        // listener is added it can simply be inserted before the listener
                        // with the highest negative index.  This spec ensures the internal
                        // index gets updated when listeners are removed.
                        function f10() {
                            result.push(10);
                        }

                        a.on('foo', function() {
                            result.push('u1');
                        });
                        a.on('foo', f10, null, {priority: 10});
                        a.on('foo', function() {
                            result.push(-7);
                        }, null, {priority: -7});
                        a.on('foo', function() {
                            result.push(5);
                        }, null, {priority: 5});
                        a.un('foo', f10);
                        a.on('foo', function() {
                            result.push('u2');
                        });

                        a.fireEvent('foo');

                        expect(result.join(' ')).toBe('5 u1 u2 -7');
                    });
                });

                describe("order", function() {
                    var a, result;

                    beforeEach(function() {
                        Ext.define('A', {
                            extend: Observable
                        });
                        a = new A();
                        result = [];
                    });

                    afterEach(function() {
                        Ext.undefine('A');
                    });

                    it("should fire events in the correct order using the order event option", function() {
                        a.on('foo', function() {
                            result.push(101);
                        }, null, {priority: 101});

                        a.on('foo', function() {
                            result.push('after');
                        }, null, {order: 'after'});

                        a.on('foo', function() {
                            result.push(-101);
                        }, null, {priority: -101});

                        a.on('foo', function() {
                            result.push('before');
                        }, null, {order: 'before'});

                        a.on('foo', function() {
                            result.push('current');
                        }, null, {order: 'current'});

                        a.on('foo', function() {
                            result.push(0);
                        }, null, {priority: 0});

                        a.fireEvent('foo');

                        expect(result.join(' ')).toBe('101 before current 0 after -101');
                    });

                    it("should fire events in the correct order using the order method parameter", function() {
                        a.on('foo', function() {
                            result.push(101);
                        }, null, {priority: 101});

                        a.on('foo', function() {
                            result.push('after');
                        }, null, null, 'after');

                        a.on('foo', function() {
                            result.push(-101);
                        }, null, {priority: -101});

                        a.on('foo', function() {
                            result.push('before');
                        }, null, null, 'before');

                        a.on('foo', function() {
                            result.push('current');
                        }, null, null, 'current');

                        a.on('foo', function() {
                            result.push(0);
                        }, null, {priority: 0});

                        a.fireEvent('foo');

                        expect(result.join(' ')).toBe('101 before current 0 after -101');
                    });
                });
            });

            describe("return value", function() {
                var fn1, fn2, fn3, fn4,
                    fn1Called, fn2Called, fn3Called, fn4Called = false;
                beforeEach(function() {
                    fn1Called = fn2Called = fn3Called = fn4Called = false;
                    fn1 = function() {
                        fn1Called = true;
                        return true;
                    };
                    fn2 = function() {
                        fn2Called = true;
                        return true;
                    };
                    fn3 = function() {
                        fn3Called = true;
                        return true;
                    };
                    fn4 = function() {
                        fn4Called = true;
                        return false;
                    };
                });

                afterEach(function() {
                    fn1 = fn2 = fn3 = fn4 = null;
                });

                it("should return true if there are no listeners", function() {
                    employee = new Employee();
                    expect(employee.fireEvent('quit')).toBe(true);
                });

                it("should return true if none of the listeners return false", function() {
                    employee = new Employee();
                    employee.on('quit', fn1);
                    employee.on('quit', fn2);
                    employee.on('quit', fn3);
                    expect(employee.fireEvent('quit')).toBe(true);
                });

                it("should return false if any handler returns false", function() {
                    employee = new Employee();
                    employee.on('quit', fn1);
                    employee.on('quit', fn4);
                    employee.on('quit', fn3);
                    expect(employee.fireEvent('quit')).toBe(false);
                });

                it("should stop firing once a listener returns false", function() {
                    employee = new Employee();
                    employee.on('quit', fn1);
                    employee.on('quit', fn4);
                    employee.on('quit', fn2);
                    employee.on('quit', fn3);
                    employee.fireEvent('quit');
                    expect(fn1Called).toBe(true);
                    expect(fn4Called).toBe(true);
                    expect(fn2Called).toBe(false);
                    expect(fn3Called).toBe(false);
                });
            });
        });

        describe("adding/removing listeners", function() {
            describe("use a string as first param", function() {
                beforeEach(function() {
                    boss.addListener("fired", bossFiredFn, fakeScope);
                    boss.fireEvent("fired", "I'am fired! (1)");
                    boss.removeListener("fired", bossFiredFn, fakeScope);
                    boss.fireEvent("fired", "I'am fired! (2)");
                });

                it("should call the event handler only one time", function() {
                    expect(bossFiredFn.callCount).toEqual(1);
                });

                it("should call the event with correct arguments", function() {
                    expect(bossFiredFn).toHaveBeenCalledWith("I'am fired! (1)");
                });

                it("should call the event with correct scope", function() {
                    expect(bossFiredFn.calls[0].object).toBe(fakeScope);
                });
            });

            describe("use an object as first param without using fn to specify the function", function() {
                var listeners;

                beforeEach(function() {


                    listeners = {
                        fired: bossFiredFn,
                        scope: fakeScope
                    };

                    boss.addListener(listeners);
                    boss.fireEvent("fired", "I'am fired! (1)");
                    boss.removeListener(listeners);
                    boss.fireEvent("fired", "I'am fired! (2)");
                });

                it("should call the event handler only one time", function() {
                    expect(bossFiredFn.callCount).toEqual(1);
                });

                it("should call the event with correct arguments", function() {
                    expect(bossFiredFn).toHaveBeenCalledWith("I'am fired! (1)", listeners);
                });

                it("should call the event with correct scope", function() {
                    expect(bossFiredFn.calls[0].object).toBe(fakeScope);
                });
            });

            describe("use an object as first param using fn to specify the function", function() {
                var listeners,
                    firedListener;

                beforeEach(function() {
                    firedListener = {
                        fn: bossFiredFn,
                        scope: fakeScope
                    };
                    listeners = {
                        fired: firedListener
                    };

                    boss.addListener(listeners);
                    boss.fireEvent("fired", "I'am fired! (1)");
                    boss.removeListener(listeners);
                    boss.fireEvent("fired", "I'am fired! (2)");
                });

                it("should call the event handler only one time", function() {
                    expect(bossFiredFn.callCount).toEqual(1);
                });

                it("should call the event with correct arguments", function() {
                    expect(bossFiredFn).toHaveBeenCalledWith("I'am fired! (1)", firedListener);
                });

                it("should call the event with correct scope", function() {
                    expect(bossFiredFn.calls[0].object).toBe(fakeScope);
                });
            });

            describe("add/remove using function name as string", function() {
                beforeEach(function() {
                    fakeScope = {
                        bossFired: bossFiredFn
                    };
                });

                afterEach(function() {
                    fakeScope = null;
                });

                describe("with object scope", function() {
                    beforeEach(function() {
                        boss.addListener('fired', 'bossFired', fakeScope);
                        boss.fireEvent('fired', "I'm fired! (1)");
                        boss.removeListener('fired', 'bossFired', fakeScope);
                        boss.fireEvent('fired', "I'm fired! (2)");
                    });

                    it("should call the event handler only once", function() {
                        expect(bossFiredFn.callCount).toEqual(1);
                    });

                    it("should call the event with correct arguments", function() {
                        expect(bossFiredFn).toHaveBeenCalledWith("I'm fired! (1)");
                    });

                    it("should call the event with correct scope", function() {
                        expect(bossFiredFn.calls[0].object).toBe(fakeScope);
                    });

                    it("should only call the function once", function() {
                        expect(bossFiredFn.callCount).toBe(1);
                    });
                });

                describe("with scope: 'this'", function() {
                    var spy;
                    beforeEach(function() {
                        spy = spyOn(boss, 'doSomething');
                        boss.addListener('fired', 'doSomething', 'this');
                        boss.fireEvent('fired', "I'm fired! (1)");
                        boss.removeListener('fired', 'doSomething', 'this');
                        boss.fireEvent('fired', "I'm fired! (2)");
                    });

                    it("should call the event handler only once", function() {
                        expect(spy.callCount).toEqual(1);
                    });

                    it("should call the event with correct arguments", function() {
                        expect(spy).toHaveBeenCalledWith("I'm fired! (1)");
                    });

                    it("should call the event with correct scope", function() {
                        expect(spy.calls[0].object).toBe(boss);
                    });

                    it("should only call the function once", function() {
                        expect(spy.callCount).toBe(1);
                    });
                });

                describe("with scope: 'controller'", function() {
                    var spy;

                    it("throw while firing", function() {
                        spy = spyOn(boss, 'doSomething');
                        boss.addListener('fired', 'doSomething', 'controller');
                        expect(function() {
                            boss.fireEvent('fired', "I'm fired! (1)");
                        }).toThrow();
                    });

                    it("should be able to remove listeners", function() {
                        spy = spyOn(boss, 'doSomething');
                        boss.addListener('fired', 'doSomething', 'controller');
                        boss.removeListener('fired', 'doSomething', 'controller');
                        boss.fireEvent('fired', "I'm fired! (2)");
                        expect(spy).not.toHaveBeenCalled();
                    });
                });

                describe("with no scope specified", function() {
                    describe("without a default listener scope holder", function() {
                        beforeEach(function() {
                            boss.bossFired = bossFiredFn;
                            boss.addListener('fired', 'bossFired');
                            boss.fireEvent('fired', "I'm fired! (1)");
                            boss.removeListener('fired', 'bossFired');
                            boss.fireEvent('fired', "I'm fired! (2)");
                        });

                        it("should call the event handler only once", function() {
                            expect(bossFiredFn.callCount).toEqual(1);
                        });

                        it("should call the event with correct arguments", function() {
                            expect(bossFiredFn).toHaveBeenCalledWith("I'm fired! (1)");
                        });

                        it("should call the event with correct scope", function() {
                            expect(bossFiredFn.calls[0].object).toBe(boss);
                        });

                        it("should only call the function once", function() {
                            expect(bossFiredFn.callCount).toBe(1);
                        });

                        it("should raise an error if fn cannot be resolved when firing", function() {
                            expect(function() {
                                boss.addListener('fired', 'bossFiredAgain');
                                boss.fireEvent('fired');
                            }).toThrow();
                        });
                    });

                    describe("with a default listener scope", function() {
                        beforeEach(function() {
                            makeDefaultListenerScope(boss);
                            boss.resolveListenerScope().bossFired = bossFiredFn;
                            boss.addListener('fired', 'bossFired');
                            boss.fireEvent('fired', "I'm fired! (1)");
                            boss.removeListener('fired', 'bossFired');
                            boss.fireEvent('fired', "I'm fired! (2)");
                        });

                        it("should call the event handler only once", function() {
                            expect(bossFiredFn.callCount).toEqual(1);
                        });

                        it("should call the event with correct arguments", function() {
                            expect(bossFiredFn).toHaveBeenCalledWith("I'm fired! (1)");
                        });

                        it("should call the event with correct scope", function() {
                            expect(bossFiredFn.calls[0].object).toBe(boss.resolveListenerScope());
                        });

                        it("should only call the function once", function() {
                            expect(bossFiredFn.callCount).toBe(1);
                        });

                        it("should raise an error if fn cannot be resolved when firing", function() {
                            expect(function() {
                                boss.addListener('fired', 'bossFiredAgain');
                                boss.fireEvent('fired');
                            }).toThrow();
                        });
                    });
                });
            });

            describe("remove a listener when a buffered handler hasn't fired yet", function() {
                it("should never call the handler", function() {
                    runs(function() {
                        boss.addListener("fired", bossFiredFn, fakeScope, {buffer: 5});
                        boss.fireEvent("fired");
                        boss.removeListener("fired", bossFiredFn, fakeScope, {buffer: 5});
                    });
                    waits(5);
                    runs(function() {
                        expect(bossFiredFn).not.toHaveBeenCalled();
                    });
                });
            });

            describe("remove a listener when a delayed handler hasn't fired yet", function() {
                it("should never call the handler", function() {
                    runs(function() {
                        boss.addListener("fired", bossFiredFn, fakeScope, {delay: 5});
                        boss.fireEvent("fired");
                        boss.removeListener("fired", bossFiredFn, fakeScope, {buffer: 5});
                    });
                    waits(5);
                    runs(function() {
                        expect(bossFiredFn).not.toHaveBeenCalled();
                    });
                });
            });

            it("should continue to fire events after removing a non-existent event", function() {
                boss.addListener('fired', bossFiredFn);
                boss.fireEvent('fired');
                boss.removeListener('fired', Ext.emptyFn);
                boss.fireEvent('fired');
                expect(bossFiredFn.callCount).toBe(2);
            });

            it("should complain if the named method does not exist on the scope object", function() {
                var foo = new Observable(),
                    scope = {};

                expect(function() {
                    foo.addListener('bar', 'onBar', scope);
                }).toThrow("No method named 'onBar' found on scope object");
            });
        });

        describe("clearListeners", function() {
            beforeEach(function() {
                employee.clearListeners();
                employee.fireEvent("fired", "I'am fired :s");
                employee.fireEvent("quit", "I'am quitting my job :)");
            });

            it("should not call fired event handler", function() {
                expect(employeeFiredFn).not.toHaveBeenCalled();
            });

            it("should not call quit event handler", function() {
                expect(employeeQuitFn).not.toHaveBeenCalled();
            });

            it("should always return false on a hasListener call", function() {
                expect(employee.hasListener('ask_salary_augmentation')).toBe(false);
                expect(employee.hasListener('fired')).toBe(false);
                expect(employee.hasListener('quit')).toBe(false);
            });
        });

        describe("adding/removing managed listeners", function() {
            describe("use a string as first param", function() {
                describe("firing", function() {
                    beforeEach(function() {
                        boss.addManagedListener(employee, "fired", bossFiredFn, fakeScope);
                        employee.fireEvent("fired", "I'am fired! (1)");
                        boss.removeManagedListener(employee, "fired", bossFiredFn, fakeScope);
                        employee.fireEvent("fired", "I'am fired! (2)");
                    });

                    it("should call the event handler only one time", function() {
                        expect(bossFiredFn.callCount).toEqual(1);
                    });

                    it("should call the event with correct arguments", function() {
                        expect(bossFiredFn).toHaveBeenCalledWith("I'am fired! (1)", employeeFiredListener);
                    });

                    it("should call the event with correct scope", function() {
                        expect(bossFiredFn.calls[0].object).toBe(fakeScope);
                    });
                });

                describe("destruction", function() {
                    it("should remove the listener when the destroyer is invoked", function() {
                        var destroyer = boss.addManagedListener(employee, 'fired', bossFiredFn, fakeScope, {
                            destroyable: true
                        });
                        employee.fireEvent("fired", "I'am fired! (1)");

                        expect(bossFiredFn.callCount).toBe(1);

                        destroyer.destroy();
                        employee.fireEvent("fired", "I'am fired! (2)");

                        expect(bossFiredFn.callCount).toBe(1);
                    });

                    it("should remove the listener when the target observable is destroyed", function() {
                        boss.addManagedListener(employee, 'fired', bossFiredFn, fakeScope);
                        employee.fireEvent("fired", "I'am fired! (1)");

                        expect(bossFiredFn.callCount).toBe(1);

                        boss.destroy();
                        employee.fireEvent("fired", "I'am fired! (2)");

                        expect(bossFiredFn.callCount).toBe(1);
                    });

                    it("should stop tracking the managed listener if the listener is removed from the target", function() {
                        boss.addManagedListener(employee, 'fired', bossFiredFn, fakeScope);
                        boss.addManagedListener(employee, 'fired', bossFired2Fn, fakeScope);

                        expect(boss.managedListeners.length).toBe(2);

                        employee.removeListener('fired', bossFiredFn, fakeScope);

                        expect(boss.managedListeners.length).toBe(1);
                        expect(boss.managedListeners[0].fn).toBe(bossFired2Fn);
                    });

                    it("should stop tracking the managed listener if the target is destroyed", function() {
                        var employee2 = new Employee();
                        boss.addManagedListener(employee, 'fired', bossFiredFn, fakeScope);
                        boss.addManagedListener(employee2, 'fired', bossFired2Fn, fakeScope);

                        expect(boss.managedListeners.length).toBe(2);

                        employee.destroy();

                        expect(boss.managedListeners.length).toBe(1);
                        expect(boss.managedListeners[0].item).toBe(employee2);
                        expect(boss.managedListeners[0].fn).toBe(bossFired2Fn);
                    });
                });
            });

            describe("use an object as first param without using fn to specify the function", function() {
                var listeners;

                describe("firing", function() {
                    beforeEach(function() {
                        listeners = {
                            fired: bossFiredFn,
                            scope: fakeScope
                        };

                        boss.addManagedListener(employee, listeners);
                        employee.fireEvent("fired", "I'am fired! (1)");
                        boss.removeManagedListener(employee, listeners);
                        employee.fireEvent("fired", "I'am fired! (2)");
                    });

                    it("should call the event handler only one time", function() {
                        expect(bossFiredFn.callCount).toEqual(1);
                    });

                    it("should call the event with correct arguments", function() {
                        expect(bossFiredFn).toHaveBeenCalledWith("I'am fired! (1)", listeners);
                    });

                    it("should call the event with correct scope", function() {
                        expect(bossFiredFn.calls[0].object).toBe(fakeScope);
                    });
                });

                describe("destruction", function() {
                    it("should remove the listener when the destroyer is invoked", function() {
                        var destroyer = boss.addManagedListener(employee, {
                            fired: bossFiredFn,
                            scope: fakeScope,
                            destroyable: true
                        });
                        employee.fireEvent("fired", "I'am fired! (1)");

                        expect(bossFiredFn.callCount).toBe(1);

                        destroyer.destroy();
                        employee.fireEvent("fired", "I'am fired! (2)");

                        expect(bossFiredFn.callCount).toBe(1);
                    });

                    it("should remove the listener when the target observable is destroyed", function() {
                        boss.addManagedListener(employee, {
                            fired: bossFiredFn,
                            scope: fakeScope
                        });
                        employee.fireEvent("fired", "I'am fired! (1)");

                        expect(bossFiredFn.callCount).toBe(1);

                        boss.destroy();
                        employee.fireEvent("fired", "I'am fired! (2)");

                        expect(bossFiredFn.callCount).toBe(1);
                    });

                    it("should stop tracking the managed listener if the listener is removed from the target", function() {
                        boss.addManagedListener(employee, {
                            fired: bossFiredFn,
                            scope: fakeScope
                        });
                        boss.addManagedListener(employee, {
                            fired: bossFired2Fn,
                            scope: fakeScope
                        });

                        expect(boss.managedListeners.length).toBe(2);

                        employee.removeListener({
                            fired: bossFiredFn,
                            scope: fakeScope
                        });

                        expect(boss.managedListeners.length).toBe(1);
                        expect(boss.managedListeners[0].fn).toBe(bossFired2Fn);
                    });

                    it("should stop tracking the managed listener if the target is destroyed", function() {
                        var employee2 = new Employee();
                        boss.addManagedListener(employee, {
                            fired: bossFiredFn,
                            scope: fakeScope
                        });
                        boss.addManagedListener(employee2, {
                            fired: bossFired2Fn,
                            scope: fakeScope
                        });

                        expect(boss.managedListeners.length).toBe(2);

                        employee.destroy();

                        expect(boss.managedListeners.length).toBe(1);
                        expect(boss.managedListeners[0].item).toBe(employee2);
                        expect(boss.managedListeners[0].fn).toBe(bossFired2Fn);
                    });
                });
            });

            describe("use an object as first param  using fn to specify the function", function() {
                var listeners,
                    firedListener;

                describe("firing", function() {
                    beforeEach(function() {
                        firedListener = {
                            fn: bossFiredFn,
                            scope: fakeScope
                        };
                        listeners = {
                            fired: firedListener
                        };

                        boss.addManagedListener(employee, listeners);
                        employee.fireEvent("fired", "I'am fired! (1)");
                        boss.removeManagedListener(employee, listeners);
                        employee.fireEvent("fired", "I'am fired! (2)");
                    });

                    it("should call the event handler only one time", function() {
                        expect(bossFiredFn.callCount).toEqual(1);
                    });

                    it("should call the event with correct arguments", function() {
                        expect(bossFiredFn).toHaveBeenCalledWith("I'am fired! (1)", firedListener);
                    });

                    it("should call the event with correct scope", function() {
                        expect(bossFiredFn.calls[0].object).toBe(fakeScope);
                    });
                });

                describe("destruction", function() {
                    it("should remove the listener when the destroyer is invoked", function() {
                        var destroyer = boss.addManagedListener(employee, {
                            fired: {
                                fn: bossFiredFn,
                                scope: fakeScope
                            },
                            destroyable: true
                        });
                        employee.fireEvent("fired", "I'am fired! (1)");

                        expect(bossFiredFn.callCount).toBe(1);

                        destroyer.destroy();
                        employee.fireEvent("fired", "I'am fired! (2)");

                        expect(bossFiredFn.callCount).toBe(1);
                    });

                    it("should remove the listener when the target observable is destroyed", function() {
                        boss.addManagedListener(employee, {
                            fired: {
                                fn: bossFiredFn,
                                scope: fakeScope
                            }
                        });
                        employee.fireEvent("fired", "I'am fired! (1)");

                        expect(bossFiredFn.callCount).toBe(1);

                        boss.destroy();
                        employee.fireEvent("fired", "I'am fired! (2)");

                        expect(bossFiredFn.callCount).toBe(1);
                    });

                    it("should stop tracking the managed listener if the listener is removed from the target", function() {
                        boss.addManagedListener(employee, {
                            fired: {
                                fn: bossFiredFn,
                                scope: fakeScope
                            }
                        });
                        boss.addManagedListener(employee, {
                            fired: {
                                fn: bossFired2Fn,
                                scope: fakeScope
                            }
                        });

                        expect(boss.managedListeners.length).toBe(2);

                        employee.removeListener({
                            fired: {
                                fn: bossFiredFn,
                                scope: fakeScope
                            }
                        });

                        expect(boss.managedListeners.length).toBe(1);
                        expect(boss.managedListeners[0].fn).toBe(bossFired2Fn);
                    });

                    it("should stop tracking the managed listener if the target is destroyed", function() {
                        var employee2 = new Employee();
                        boss.addManagedListener(employee, {
                            fired: {
                                fn: bossFiredFn,
                                scope: fakeScope
                            }
                        });
                        boss.addManagedListener(employee2, {
                            fired: {
                                fn: bossFired2Fn,
                                scope: fakeScope
                            }
                        });

                        expect(boss.managedListeners.length).toBe(2);

                        employee.destroy();

                        expect(boss.managedListeners.length).toBe(1);
                        expect(boss.managedListeners[0].item).toBe(employee2);
                        expect(boss.managedListeners[0].fn).toBe(bossFired2Fn);
                    });
                });
            });

            describe("add/remove using function name as string", function() {
                beforeEach(function() {
                    fakeScope = {
                        employeeFired: bossFiredFn
                    };
                });

                afterEach(function() {
                    fakeScope = null;
                });

                describe("with object scope", function() {
                    beforeEach(function() {
                        boss.addManagedListener(employee, 'fired', 'employeeFired', fakeScope);
                        employee.fireEvent('fired', "I'm fired! (1)");
                        boss.removeManagedListener(employee, 'fired', 'employeeFired', fakeScope);
                        employee.fireEvent('fired', "I'm fired! (2)");
                    });

                    it("should call the event handler only once", function() {
                        expect(bossFiredFn.callCount).toEqual(1);
                    });

                    it("should call the event with correct arguments", function() {
                        expect(bossFiredFn).toHaveBeenCalledWith("I'm fired! (1)", employeeFiredListener);
                    });

                    it("should call the event with correct scope", function() {
                        expect(bossFiredFn.calls[0].object).toBe(fakeScope);
                    });

                    it("should only call the function once", function() {
                        expect(bossFiredFn.callCount).toBe(1);
                    });
                });

                describe("with scope: 'this'", function() {
                    var bossSpy;
                    beforeEach(function() {
                        bossSpy = spyOn(boss, 'doSomething');
                        boss.addManagedListener(employee, 'fired', 'doSomething', 'this');
                        employee.fireEvent('fired', "I'm fired! (1)");
                        boss.removeManagedListener(employee, 'fired', 'doSomething', 'this');
                        employee.fireEvent('fired', "I'm fired! (2)");
                    });

                    it("should call the event handler only once", function() {
                        expect(bossSpy.callCount).toEqual(1);
                    });

                    it("should call the event with correct arguments", function() {
                        expect(bossSpy).toHaveBeenCalledWith("I'm fired! (1)", employeeFiredListener);
                    });

                    it("should call the event with correct scope", function() {
                        expect(bossSpy.calls[0].object).toBe(boss);
                    });

                    it("should only call the function once", function() {
                        expect(bossSpy.callCount).toBe(1);
                    });
                });

                describe("with scope: 'controller'", function() {
                    var bossSpy;
                    it("should throw when firing the event", function() {
                        bossSpy = spyOn(boss, 'doSomething');
                        boss.addManagedListener(employee, 'fired', 'doSomething', 'controller');
                        expect(function() {
                            employee.fireEvent('fired', "I'm fired! (1)");
                        }).toThrow();
                    });

                    it("should be able to remove an event", function() {
                        bossSpy = spyOn(boss, 'doSomething');
                        boss.addManagedListener(employee, 'fired', 'doSomething', 'controller');
                        boss.removeManagedListener(employee, 'fired', 'doSomething', 'controller');
                        employee.fireEvent('fired', "I'm fired! (2)");
                        expect(bossSpy).not.toHaveBeenCalled();
                    })
                });

                describe("with no scope specified", function() {
                    beforeEach(function() {
                        boss.employeeFired = bossFiredFn;
                        boss.addManagedListener(employee, 'fired', 'employeeFired');
                        employee.fireEvent('fired', "I'm fired! (1)");
                        boss.removeManagedListener(employee, 'fired', 'employeeFired');
                        employee.fireEvent('fired', "I'm fired! (2)");
                    });

                    it("should call the event handler only once", function() {
                        expect(bossFiredFn.callCount).toEqual(1);
                    });

                    it("should call the event with correct arguments", function() {
                        expect(bossFiredFn).toHaveBeenCalledWith("I'm fired! (1)", employeeFiredListener);
                    });

                    it("should call the event with correct scope", function() {
                        expect(bossFiredFn.calls[0].object).toBe(boss);
                    });

                    it("should only call the function once", function() {
                        expect(bossFiredFn.callCount).toBe(1);
                    });
                });
            });
        });

        describe("clearManagedListeners", function() {
            beforeEach(function() {
                boss.addManagedListener(employee, "fired", bossFiredFn, fakeScope);
                boss.clearManagedListeners();
                employee.fireEvent("fired", "I'am fired!");
                employee.fireEvent("quit", "I'am quitting!");
            });

            it("should not call fired event handler", function() {
                expect(bossFiredFn).not.toHaveBeenCalled();
            });

            it("should not call quit event handler", function() {
                expect(bossQuitFn).not.toHaveBeenCalled();
            });
        });

        describe("auto managed listeners", function() {
            describe("use a string as first param", function() {
                beforeEach(function() {
                    employee.addListener("fired", bossFiredFn, boss);
                });

                it("should call the event handler only one time", function() {
                    employee.fireEvent("fired", "I am fired!");
                    expect(bossFiredFn.callCount).toEqual(1);
                });

                it("should call the event with correct arguments", function() {
                    employee.fireEvent("fired", "I am fired!");
                    expect(bossFiredFn).toHaveBeenCalledWith("I am fired!", employeeFiredListener);
                });

                it("should call the event with correct scope", function() {
                    employee.fireEvent("fired", "I am fired!");
                    expect(bossFiredFn.calls[0].object).toBe(boss);
                });

                it("should remove the listener when the scope is destroyed", function() {
                    boss.destroy();
                    employee.fireEvent("fired", "I am fired!");
                    expect(bossFiredFn).not.toHaveBeenCalled();
                });

                it("should stop tracking the managed listener if the listener is removed", function() {
                    // an extra listener to be sure we remove only the one
                    employee.addListener("fired", bossFired2Fn, boss);

                    expect(boss.managedListeners.length).toBe(2);

                    employee.removeListener('fired', bossFiredFn, boss);

                    expect(boss.managedListeners.length).toBe(1);
                    expect(boss.managedListeners[0].fn).toBe(bossFired2Fn);
                });

                it("should stop tracking the managed listener if the target is destroyed", function() {
                    var employee2 = new Employee();
                    employee2.addListener('fired', bossFired2Fn, boss);

                    expect(boss.managedListeners.length).toBe(2);

                    employee.destroy();

                    expect(boss.managedListeners.length).toBe(1);
                    expect(boss.managedListeners[0].item).toBe(employee2);
                    expect(boss.managedListeners[0].fn).toBe(bossFired2Fn);
                });
            });

            describe("use an object as first param without using fn to specify the function", function() {
                var listeners;

                beforeEach(function() {
                    listeners = {
                        fired: bossFiredFn,
                        scope: boss
                    };

                    employee.addListener(listeners);
                });

                it("should call the event handler only one time", function() {
                    employee.fireEvent("fired", "I am fired!");
                    expect(bossFiredFn.callCount).toEqual(1);
                });

                it("should call the event with correct arguments", function() {
                    employee.fireEvent("fired", "I am fired!");
                    expect(bossFiredFn).toHaveBeenCalledWith("I am fired!", listeners);
                });

                it("should call the event with correct scope", function() {
                    employee.fireEvent("fired", "I am fired!");
                    expect(bossFiredFn.calls[0].object).toBe(boss);
                });

                it("should remove the listener when the scope is destroyed", function() {
                    boss.destroy();
                    employee.fireEvent("fired", "I am fired!");
                    expect(bossFiredFn).not.toHaveBeenCalled();
                });

                it("should stop tracking the managed listener if the listener is removed", function() {
                    // an extra listener to be sure we remove only the one
                    employee.addListener({
                        fired: bossFired2Fn,
                        scope: boss
                    });

                    expect(boss.managedListeners.length).toBe(2);

                    employee.removeListener({
                        fired: bossFiredFn,
                        scope: boss
                    });

                    expect(boss.managedListeners.length).toBe(1);
                    expect(boss.managedListeners[0].fn).toBe(bossFired2Fn);
                });

                it("should stop tracking the managed listener if the target is destroyed", function() {
                    var employee2 = new Employee();
                    employee2.addListener({
                        fired: bossFired2Fn,
                        scope: boss
                    });

                    expect(boss.managedListeners.length).toBe(2);

                    employee.destroy();

                    expect(boss.managedListeners.length).toBe(1);
                    expect(boss.managedListeners[0].item).toBe(employee2);
                    expect(boss.managedListeners[0].fn).toBe(bossFired2Fn);
                });
            });

            describe("use an object as first param  using fn to specify the function", function() {
                var listeners,
                    firedListener;

                beforeEach(function() {
                    firedListener = {
                        fn: bossFiredFn,
                        scope: boss
                    };
                    listeners = {
                        fired: firedListener
                    };

                    employee.addListener(listeners);
                });

                it("should call the event handler only one time", function() {
                    employee.fireEvent("fired", "I am fired!");
                    expect(bossFiredFn.callCount).toEqual(1);
                });

                it("should call the event with correct arguments", function() {
                    employee.fireEvent("fired", "I am fired!");
                    expect(bossFiredFn).toHaveBeenCalledWith("I am fired!", firedListener);
                });

                it("should call the event with correct scope", function() {
                    employee.fireEvent("fired", "I am fired!");
                    expect(bossFiredFn.calls[0].object).toBe(boss);
                });

                it("should remove the listener when the scope is destroyed", function() {
                    boss.destroy();
                    employee.fireEvent("fired", "I am fired!");
                    expect(bossFiredFn).not.toHaveBeenCalled();
                });

                it("should stop tracking the managed listener if the listener is removed", function() {
                    // an extra listener to be sure we remove only the one
                    employee.addListener({
                        fired: {
                            fn: bossFired2Fn,
                            scope: boss
                        }
                    });

                    expect(boss.managedListeners.length).toBe(2);

                    employee.removeListener({
                        fired: {
                            fn: bossFiredFn,
                            scope: boss
                        }
                    });

                    expect(boss.managedListeners.length).toBe(1);
                    expect(boss.managedListeners[0].fn).toBe(bossFired2Fn);
                });

                it("should stop tracking the managed listener if the target is destroyed", function() {
                    var employee2 = new Employee();
                    employee2.addListener({
                        fired: {
                            fn: bossFired2Fn,
                            scope: boss
                        }
                    });

                    expect(boss.managedListeners.length).toBe(2);

                    employee.destroy();

                    expect(boss.managedListeners.length).toBe(1);
                    expect(boss.managedListeners[0].item).toBe(employee2);
                    expect(boss.managedListeners[0].fn).toBe(bossFired2Fn);
                });
            });
        });

        describe("hasListener", function() {
            it("should return true if the observable has a listener on a particular event", function() {
                expect(boss.hasListener("ask_salary_augmentation")).toBe(true);
            });

            it("should normalize the case", function() {
                expect(boss.hasListener("ASK_salary_augmentation")).toBe(true);
            });

            it("should return false if the observable has no listener on a particular event", function() {
                expect(boss.hasListener("fired")).toBe(false);
            });
        });

        describe("fireAction", function() {
            var result, o, scope, actionArgs, handlerArgs;

            beforeEach(function() {
                result = [];
                o = new Observable();
                o.on('foo', function() {
                    handlerArgs = arguments;
                    result.push(1);
                });
                o.on('foo', function() {
                    result.push(2);
                });
            });

            function actionFn() {
                scope = this;
                actionArgs = arguments;
                result.push('action');
            }

            it("should call the action fn before the handlers", function() {
                o.fireAction('foo', null, actionFn);

                expect(result).toEqual(['action', 1, 2])
            });

            it("should call the action fn before the handlers if order is 'before'", function() {
                o.fireAction('foo', null, actionFn, null, null, 'before');

                expect(result).toEqual(['action', 1, 2])
            });

            it("should call the action fn after the handlers if order is 'after'", function() {
                o.fireAction('foo', null, actionFn, null, null, 'after');

                expect(result).toEqual([1, 2, 'action'])
            });

            describe("with a 'before' and 'after' handler", function() {
                beforeEach(function() {
                    o.on({
                        foo: function() {
                            result.push(0);
                        },
                        order: 'before'
                    });

                    o.on({
                        foo: function() {
                            result.push(3);
                        },
                        order: 'after'
                    })
                });

                it("should call the action fn after the 'before' handler", function() {
                    o.fireAction('foo', null, actionFn);

                    expect(result).toEqual([0, 'action', 1, 2, 3]);
                });

                it("should call the action fn after the 'before' handler if order is 'before'", function() {
                    o.fireAction('foo', null, actionFn, null, null, 'before');

                    expect(result).toEqual([0, 'action', 1, 2, 3]);
                });

                it("should call the action fn before the 'after' handler if order is 'after'", function() {
                    o.fireAction('foo', null, actionFn, null, null, 'after');

                    expect(result).toEqual([0, 1, 2, 'action', 3]);
                });
            });

            describe("if a handler returns false", function() {
                beforeEach(function() {
                    o.on('foo', function() {
                        result.push(3);
                        return false;
                    });
                });

                it("should call the action fn", function() {
                    o.fireAction('foo', null, actionFn);

                    expect(result).toEqual(['action', 1, 2, 3]);
                });

                it("should call the action fn if order is 'before'", function() {
                    o.fireAction('foo', null, actionFn, null, null, 'before');

                    expect(result).toEqual(['action', 1, 2, 3]);
                });

                it("should not call the action fn if order is 'after'", function() {
                    o.fireAction('foo', null, actionFn, null, null, 'after');

                    expect(result).toEqual([1, 2, 3])
                });
            });

            it("should use the observable instance as the default scope for the action fn", function() {
                o.fireAction('foo', null, actionFn);
                expect(scope).toBe(o);
            });

            it("should call the action fn with the passed scope", function() {
                o.fireAction('foo', null, actionFn, fakeScope);

                expect(scope).toBe(fakeScope);
            });

            it("should call the action fn with the passed arguments", function() {
                o.fireAction('foo', ['a', 'b', 'c'], actionFn);

                expect(actionArgs.length).toBe(4);
                expect(actionArgs[0]).toBe('a');
                expect(actionArgs[1]).toBe('b');
                expect(actionArgs[2]).toBe('c');
            });

            it("should call the handlers with the passed arguments", function() {
                o.fireAction('foo', ['a', 'b', 'c'], actionFn);

                expect(handlerArgs.length).toBe(4);
                expect(handlerArgs[0]).toBe('a');
                expect(handlerArgs[1]).toBe('b');
                expect(handlerArgs[2]).toBe('c');
            });

            it("should not call the action fn on next fire (it should remove the single listener)", function() {
                actionFn = jasmine.createSpy();

                o.fireAction('foo', null, actionFn);

                expect(actionFn.callCount).toBe(1);

                o.fireEvent('foo');

                expect(actionFn.callCount).toBe(1);
            });
        });

        describe("setListeners", function() {
            it("should be an alias for addListener", function() {
                var o = new Observable(),
                    listeners = {
                        foo: 'onFoo'
                    };

                spyOn(o, 'addListener');

                o.setListeners(listeners);

                expect(o.addListener).toHaveBeenCalledWith(listeners);
            });
        });

        describe("suspend/resume events", function() {
            var generateFireEventTraffic = function() {
                employee.fireEvent("fired", "I'am fired :s (1)");
                employee.fireEvent("fired", "I'am fired :s (2)");
                employee.fireEvent("quit", "I'am quitting my job :) (1)");
                employee.fireEvent("quit", "I'am quitting my job :) (2)");
            };

            describe("queue suspended events to be fired after the resumeEvents", function() {
                beforeEach(function() {
                    employee.suspendEvents(true);
                    generateFireEventTraffic();
                });

                describe("when suspended", function() {
                    it("should not call fired event handler", function() {
                        expect(employeeFiredFn).not.toHaveBeenCalled();
                    });

                    it("should not call quit event handler", function() {
                        expect(employeeQuitFn).not.toHaveBeenCalled();
                    });
                });

                describe("on resume", function() {
                    describe("without discarding", function() {
                        beforeEach(function() {
                            employee.resumeEvents();
                        });

                        it("should call fired event handler two times", function() {
                            expect(employeeFiredFn.callCount).toEqual(2);
                        });

                        it("should call quit event handler two times", function() {
                            expect(employeeQuitFn.callCount).toEqual(2);
                        });
                    });

                    describe("with discarding", function() {
                        beforeEach(function() {
                            employee.resumeEvents(true);
                        });

                        it("should not call fired event handler", function() {
                            expect(employeeFiredFn).not.toHaveBeenCalled();
                        });

                        it("should call quit event handler two times", function() {
                            expect(employeeQuitFn).not.toHaveBeenCalled();
                        });
                    });
                });
            });

            describe("discard events", function() {
                beforeEach(function() {
                    employee.suspendEvents();
                    generateFireEventTraffic();
                });

                describe("when suspended", function() {
                    it("should not call fired event handler", function() {
                        expect(employeeFiredFn).not.toHaveBeenCalled();
                    });

                    it("should not call quit event handler", function() {
                        expect(employeeQuitFn).not.toHaveBeenCalled();
                    });
                });

                describe("on resume", function() {
                    beforeEach(function() {
                        employee.resumeEvents();
                    });

                    it("should not call fired event handler", function() {
                        expect(employeeFiredFn).not.toHaveBeenCalled();
                    });

                    it("should call quit event handler two times", function() {
                        expect(employeeQuitFn).not.toHaveBeenCalled();
                    });
                });
            });

            describe("multiple suspend/resume", function() {
                it("should not fire events if there are more suspend than resume calls", function() {
                    employee.suspendEvents();
                    employee.suspendEvents();
                    employee.resumeEvents();
                    generateFireEventTraffic();
                    expect(employeeFiredFn).not.toHaveBeenCalled();
                    expect(employeeQuitFn).not.toHaveBeenCalled();
                });

                it("should fire events if the suspend/resume calls match", function() {
                    employee.suspendEvents();
                    employee.suspendEvents();
                    employee.suspendEvents();
                    employee.resumeEvents();
                    employee.resumeEvents();
                    employee.resumeEvents();
                    generateFireEventTraffic();
                    expect(employeeFiredFn).toHaveBeenCalled();
                    expect(employeeQuitFn).toHaveBeenCalled();
                });

                it("should ignore extra resumeEvents calls", function() {
                    employee.suspendEvents();
                    employee.resumeEvents();
                    employee.resumeEvents();
                    employee.resumeEvents();
                    generateFireEventTraffic();
                    expect(employeeFiredFn).toHaveBeenCalled();
                    expect(employeeQuitFn).toHaveBeenCalled();
                });
            });

            describe("specific events", function() {
                it("should be able to suspend a specific event", function() {
                    employee.suspendEvent('fired');
                    generateFireEventTraffic();
                    expect(employeeFiredFn).not.toHaveBeenCalled();
                });

                it("should be able to suspend a specific event before anything is bound", function() {
                    var o = new Observable(),
                        called = false;

                    o.suspendEvent('foo');
                    o.on('foo', function() {
                        called = true;
                    });
                    o.fireEvent('foo', o);
                    expect(called).toBe(false);
                });

                it("should begin firing events after resuming a specific event", function() {
                    employee.suspendEvent('fired');
                    generateFireEventTraffic();
                    employee.resumeEvent('fired');
                    generateFireEventTraffic();
                    expect(employeeFiredFn.callCount).toBe(2);
                });

                it("should not resume firing if suspend is called more than resume", function() {
                    employee.suspendEvent('fired');
                    employee.suspendEvent('fired');
                    employee.resumeEvent('fired');
                    generateFireEventTraffic();
                    expect(employeeFiredFn).not.toHaveBeenCalled();
                });
            });

            describe("isSuspended", function() {
                describe("all events", function() {
                    it("should return false if all events aren't suspended", function() {
                        expect(employee.isSuspended()).toBe(false);
                    });

                    it("should return false after suspending and then resuming all events", function() {
                        employee.suspendEvents();
                        employee.resumeEvents();
                        expect(employee.isSuspended()).toBe(false);
                    });

                    it("should return true when events are globally suspended", function() {
                        employee.suspendEvents();
                        expect(employee.isSuspended()).toBe(true);
                    });
                });

                describe("specific event", function() {
                    it("should return false if the specific event is not suspended", function() {
                        expect(employee.isSuspended('fired')).toBe(false);
                    });

                    it("should return false if the specific event is suspended then resumed", function() {
                        employee.suspendEvent('fired');
                        employee.resumeEvent('fired');
                        expect(employee.isSuspended('fired')).toBe(false);
                    });

                    it("should return true if a specific event is suspended", function() {
                        employee.suspendEvent('fired');
                        expect(employee.isSuspended('fired')).toBe(true);
                    });

                    it("should return true if all events are suspended and the specific event is not", function() {
                        employee.suspendEvents();
                        expect(employee.isSuspended('fired')).toBe(true);
                    });
                });
            });
        });

        describe("event bubbling", function() {
            describe("if handler doesn't return false", function() {
                beforeEach(function() {
                    employee.fireEvent("ask_salary_augmentation", "I want 5%!");
                });

                describe("in the bubbling target", function() {
                    it("should call the handler only one times", function() {
                        expect(bossAskFn.callCount).toEqual(1);
                    });

                    it("should call the handler function with passed arguments", function() {
                        expect(bossAskFn).toHaveBeenCalledWith("I want 5%!", bossAskListener);
                    });

                    it("should call the handler function with the correct scope", function() {
                        expect(bossAskFn.calls[0].object).toBe(fakeScope);
                    });
                });

                describe("in the main observable", function() {
                    it("should call the handler only one times", function() {
                        expect(employeeAskFn.callCount).toEqual(1);
                    });

                    it("should call the handler function with passed arguments", function() {
                        expect(employeeAskFn).toHaveBeenCalledWith("I want 5%!", employeeAskListener);
                    });

                    it("should call the handler function with the correct scope", function() {
                        expect(employeeAskFn.calls[0].object).toBe(fakeScope);
                    });
                });
            });

            describe("if handler return false", function() {
                beforeEach(function() {
                    employeeAskFn.andReturn(false);
                    employee.fireEvent("ask_salary_augmentation", "I want 5%!");
                });

                describe("in the bubbling target", function() {
                    it("should not call the handler", function() {
                        expect(bossAskFn).not.toHaveBeenCalled();
                    });
                });

                describe("in the main observable", function() {
                    it("should call the handler only one times", function() {
                        expect(employeeAskFn.callCount).toEqual(1);
                    });

                    it("should call the handler function with passed arguments", function() {
                        expect(employeeAskFn).toHaveBeenCalledWith("I want 5%!", employeeAskListener);
                    });

                    it("should call the handler function with the correct scope", function() {
                        expect(employeeAskFn.calls[0].object).toBe(fakeScope);
                    });
                });
            });
        });

        describe("relaying events", function() {
            it("should call the event handler only one time", function() {
                employee.relayEvents(boss, ["fired"]);
                boss.fireEvent("fired", "You're fired!");
                expect(employeeFiredFn.callCount).toEqual(1);
            });

            it("should call the event with correct arguments", function() {
                employee.relayEvents(boss, ["fired"]);
                boss.fireEvent("fired", "You're fired!");
                expect(employeeFiredFn).toHaveBeenCalledWith("You're fired!", employeeFiredListener);
            });

            it("should call the event with correct scope", function() {
                employee.relayEvents(boss, ["fired"]);
                boss.fireEvent("fired", "You're fired!");
                expect(employeeFiredFn.calls[0].object).toBe(fakeScope);
            });

            it("should respect the prefix parameter", function() {
                employee.relayEvents(boss, ["fired"], 'got');
                employee.on('gotfired', employeeFiredFn);
                boss.fireEvent("fired", "You're fired!");
                expect(employeeFiredFn).toHaveBeenCalled();
            });

            it("should remove relaying functions when the relayer clears its listeners", function() {
                employee.relayEvents(boss, ["fired"], 'got');
                expect(boss.hasListeners.fired).toEqual(1);
                employee.clearListeners();
                expect(boss.hasListeners.fired).toBeUndefined();
            });

            it("should should return false & stop firing events if a listener returns false", function() {
                var employeeSpy = jasmine.createSpy(),
                    bossSpy = jasmine.createSpy();

                employee.relayEvents(boss, ["fired"]);
                employee.on('fired', employeeSpy.andReturn(false));
                boss.on('fired', bossSpy);
                expect(boss.fireEvent('fired')).toBe(false);
                expect(bossSpy).not.toHaveBeenCalled();
            });

            describe("with options", function() {
                it("should should return false & stop firing events if a listener returns false with single: true", function() {
                    var employeeSpy = jasmine.createSpy(),
                        bossSpy = jasmine.createSpy();

                    employee.relayEvents(boss, ["fired"]);
                    employee.on('fired', employeeSpy.andReturn(false), null, {single: true});
                    boss.on('fired', bossSpy);
                    expect(boss.fireEvent('fired')).toBe(false);
                    expect(bossSpy).not.toHaveBeenCalled();
                });
            });
        });

        describe("creating relayers", function() {
            it("should call the event handler only one time", function() {
                boss.on({
                    quit: employee.createRelayer("fired")
                });
                boss.fireEvent("quit", "You're fired!");
                expect(employeeFiredFn.callCount).toEqual(1);
            });

            it("should call the event with correct arguments", function() {
                boss.on({
                    quit: employee.createRelayer("fired", [0, -1])
                });
                boss.fireEvent("quit", "You can't fire me, I quit!");
                expect(employeeFiredFn).toHaveBeenCalledWith("You can't fire me, I quit!", employeeFiredListener);
            });

            it("should call the event with correct scope", function() {
                boss.on({
                    quit: employee.createRelayer("fired")
                });
                boss.fireEvent("quit", "You're fired!");
                expect(employeeFiredFn.calls[0].object).toBe(fakeScope);
            });

            it("should reference same object at same position regardless of number of function parameters", function() {
                boss.on({
                    quit: employee.createRelayer("fired", [0, -1])
                });
                boss.on({
                    quit: employee.createRelayer("fired", [0, 2])
                });

                boss.fireEvent("quit", boss, true);
                boss.fireEvent("quit", boss, true, ["bob", "chuck"], {});

                expect(employeeFiredFn.calls[0].args[2]).toBe(employeeFiredFn.calls[1].args[2]);
            });
        });

        describe("args", function() {
            it("should append the firing args to the event option args", function() {
                var foo = new Observable(),
                    handler = function() {
                        args = arguments;
                    },
                    opts = {
                        bar: handler,
                        args: [1, 2, 3]
                    },
                    args;

                foo.on(opts);

                foo.fireEvent('bar', 4, 5);

                expect(args).toEqual([1, 2, 3, 4, 5, opts]);
            });
        });

        describe("alias", function() {
            it("should alias addListener with on", function() {
                spyOn(Observable.prototype, 'addListener');

                Observable.prototype.on();

                expect(Observable.prototype.addListener).toHaveBeenCalled();
            });

            it("should alias removeListener with un", function() {
                spyOn(Observable.prototype, 'removeListener');

                Observable.prototype.un();

                expect(Observable.prototype.removeListener).toHaveBeenCalled();
            });

            it("should alias addManagedListener with mon", function() {
                spyOn(Observable.prototype, 'addManagedListener');

                Observable.prototype.mon();

                expect(Observable.prototype.addManagedListener).toHaveBeenCalled();
            });

            it("should alias removeManagedListener with mun", function() {
                spyOn(Observable.prototype, 'removeManagedListener');

                Observable.prototype.mun();

                expect(Observable.prototype.removeManagedListener).toHaveBeenCalled();
            });

            it("should alias observe with observeClass for retro compatibility", function() {
                expect(Observable.observeClass).toEqual(Observable.observe);
            });
        });

        describe("capture/release", function() {
            var capturer;

            beforeEach(function() {
                spyOn(Ext.Function, "createInterceptor").andCallThrough();
                capturer = jasmine.createSpy('capturer');
                Observable.capture(boss, capturer, fakeScope);
            });

            describe("capture", function() {
                it("should create an interceptor of observable fireEventArgs method", function() {
                    expect(Ext.Function.createInterceptor).toHaveBeenCalled();
                });
            });

            describe("capturer", function() {
                it("should have the same signature as fireEvent", function() {
                    boss.fireEvent('foo', 'bar', 'baz');

                    expect(capturer).toHaveBeenCalledWith('foo', 'bar', 'baz');
                });
            });

            describe("release", function() {
                beforeEach(function() {
                    Observable.releaseCapture(boss);
                });

                it("should restore the original fireEvent function", function() {
                    expect(boss.fireEventArgs).toEqual(Observable.prototype.fireEventArgs);
                });

            });
        });

        describe("observe", function() {
            var firedListener,
                firedListener2,
                boss1,
                boss2;

            beforeEach(function() {
                firedListener = {
                    fn: bossFiredFn,
                    scope: fakeScope
                };
                firedListener2 = {
                    fn: bossFired2Fn,
                    scope: fakeScope
                };
                Observable.observe(Boss, {
                    fired: firedListener
                });

                boss1 = new Boss();
                boss2 = new Boss();

                if (boss1.hasListeners.fired) {
                    boss1.fireEvent("fired", "You're Fired! (boss 1)");
                }
                if (boss2.hasListeners.fired) {
                    boss2.fireEvent("fired", "You're Fired! (boss 2)");
                }

                // now listen on both the instance and the class
                boss1.on({
                    fired: firedListener2
                });
                if (boss1.hasListeners.fired) {
                    boss1.fireEvent("fired", "You're Fired! (boss 3)");
                }

                // now remove the instance listener and fire again
                boss1.un('fired', bossFired2Fn, fakeScope);
                if (boss1.hasListeners.fired) {
                    // this one should only go to the class listener
                    boss1.fireEvent("fired", "You're Fired! (boss 4)");
                }

                Boss.un('fired', bossFiredFn, fakeScope);
            });

            it("should call bossFiredFn several times", function() {
                expect(bossFiredFn.callCount).toEqual(4);
            });

            it("should call bossFired2Fn", function() {
                expect(bossFired2Fn.callCount).toEqual(1);
            });

            it("should have no listeners on instances", function() {
                expect(boss1.hasListeners.fired).toBeFalsy();
                expect(boss2.hasListeners.fired).toBeFalsy();
            });

            describe("first event firing", function() {
                var call;

                beforeEach(function() {
                    call = bossFiredFn.calls[0];
                });

                it("should execute handler with the correct scope", function() {
                    expect(call.object).toBe(fakeScope);
                });

                it("should execute handler with desired params", function() {
                    expect(call.args).toEqual(["You're Fired! (boss 1)", firedListener]);
                });
            });

            describe("second event firing", function() {
                var call;

                beforeEach(function() {
                    call = bossFiredFn.calls[1];
                });

                it("should execute handler with the correct scope", function() {
                    expect(call.object).toBe(fakeScope);
                });

                it("should execute handler with desired params", function() {
                    expect(call.args).toEqual(["You're Fired! (boss 2)", firedListener]);
                });
            });

            describe("third event firing", function() {
                var call;

                beforeEach(function() {
                    call = bossFiredFn.calls[2];
                });

                it("should execute handler with the correct scope", function() {
                    expect(call.object).toBe(fakeScope);
                });

                it("should execute handler with desired params", function() {
                    expect(call.args).toEqual(["You're Fired! (boss 3)", firedListener]);
                });
            });

            describe("third event firing to instance", function() {
                var call;

                beforeEach(function() {
                    call = bossFired2Fn.calls[0];
                });

                it("should execute handler with the correct scope", function() {
                    expect(call.object).toBe(fakeScope);
                });

                it("should execute handler with desired params", function() {
                    expect(call.args).toEqual(["You're Fired! (boss 3)", firedListener2]);
                });
            });

            describe("fourth event firing", function() {
                var call;

                beforeEach(function() {
                    call = bossFiredFn.calls[3];
                });

                it("should execute handler with the correct scope", function() {
                    expect(call.object).toBe(fakeScope);
                });

                it("should execute handler with desired params", function() {
                    expect(call.args).toEqual(["You're Fired! (boss 4)", firedListener]);
                });
            });
        });

        /*
         * Below is a rough sketch of the class hierarchy we generate here. The idea is to
         * generate all direct combinations of mixins and extends from Observable. The names
         * generated are similar to molecular names, e.g., "EM2E2O" expands into "a class that
         * (E)xtends a class which (M)ixins a class which (M)ixins a class that (E)xtends a
         * class that (E)xtends (O)bservable".
         *
         *
         *                      M3O <---- M2O <---- MO <---- Observable
         *                       ^          ^        ^            ^
         *                       |          |        |            |
         *          MEM3O <--- EM3O       EM2O       |           EO
         *            ^                     ^        |
         *            |                     |        |
         *          EMEM3O    ME2M2O <--- E2M2O      |
         *                       ^                   |
         *                       |                   |
         *                   EME2M2O                 |
         *                                           |
         *                    M2EMO <---- MEMO <--- EMO
         *                                  ^
         *                                  |
         *                   MEMEMO <---- EMEMO
         *
         * It should be noted that this does not cover the "dreaded diamond" structure, where
         * a class appears multiple times. This can happen using mixins.
         */
        describe("using mixin and extend in combination", function() {
            // an array of objects created by makeEntry:
            var classes;

            // Prepends a 'M' or 'E' to a given string ("to") following the pattern above.
            function prepend(c, to) {
                var d, s;

                if (to.charAt(0) === c) {
                    d = parseInt(to.charAt(1), 10); // look for "E#..."
                    if (d) {
                        s = c + (d + 1) + to.substring(2);
                    } else {
                        s = c + '2' + to.substring(1);
                    }
                } else {
                    s = c + to;
                }
                return s;
            }

            function makeEntry(baseEntry, prefix) {
                var nameCap = prepend(prefix, baseEntry.name), // ex: "E2MO"
                    name = nameCap.toLowerCase(), // "e2mo"
                    entry = {
                        //T: class,  <-- added by declare() below
                        base: baseEntry,
                        fullName: 'spec.observable.' + nameCap,
                        name: nameCap,
                        lowerName: name,
                        events: baseEntry.events.concat([name])
                    };

                return entry;
            }

            // Makes derived classes from the given base and recurses to specified depth. This
            // method declares a derived class from the base and a class that uses the base as
            // a mixin.
            function declare(baseEntry, depth) {
                var entryE = makeEntry(baseEntry, 'E');
                Ext.define(entryE.fullName, {
                    extend: baseEntry.T,
                    constructor: function() {
                        this.callParent(arguments);
                    }
                });

                var mixins = {},
                    entryM = makeEntry(baseEntry, 'M');
                mixins[baseEntry.lowerName] = baseEntry.T;
                Ext.define(entryM.fullName, {
                    mixins: mixins,
                    constructor: function() {
                        this.mixins[baseEntry.lowerName].constructor.apply(this, arguments);
                    }
                });

                Observable.observe(entryE.T = spec.observable[entryE.name]);
                Observable.observe(entryM.T = spec.observable[entryM.name]);
                classes.push(entryE, entryM);

                if (depth) {
                    declare(entryE, depth - 1);
                    declare(entryM, depth - 1);
                }
            }

            beforeEach(function() {
                classes = [];
                // kick off the declarations with Observable as the base and go deep...
                declare({T: Observable, name: 'O', events: []}, 5);
            });

            afterEach(function() {
                Ext.Array.forEach(classes, function(cls) {
                    Ext.undefine(cls.fullName);
                });
                classes = null;
            });

            it('should prepare all classes', function() {
                Ext.Array.forEach(classes, function(entry) {
                    if (typeof entry.T.HasListeners !== 'function') {
                        expect(entry.fullName).toBe('prepared');
                    }
                });
            });

            // Ensure that all events declared for an instance fire poperly.
            it('should fire events on instances', function() {
                Ext.Array.forEach(classes, function(entry) {
                    Ext.Array.forEach(entry.events, function(event) {
                        var T = entry.T,
                            calls = 0,
                            listeners = {},
                            fn = function() {
                                ++calls;
                            };

                        listeners[event] = fn;
                        var obj = new T({listeners: listeners});

                        //console.log('Firing ' + event + ' on ' + T.$className);
                        if (obj.hasListeners[event]) {
                            // the check is made to ensure that hasListeners is being populated
                            // correctly...
                            obj.fireEvent(event);
                        }
                        if (!calls) {
                            expect(T.$className + ' ' + event + ' event').toBe('fired');
                        }

                        obj.un(event, fn);
                        if (obj.hasListeners[event]) {
                            expect(T.$className + '.hasListeners.' + event).toBe('0 after');
                        }
                    });
                });
            });

            it('should fire events to all bases', function() {
                Ext.Array.forEach(classes, function(entry) {
                    var T = entry.T,
                        obj = new T(),
                        base;

                    // make sure that class listeners work on all bases for instances of each
                    // class...
                    for (base = entry.base; base; base = base.base) {
                        Ext.Array.forEach(base.events, function(event) {
                            var B = base.T,
                                calls = 0,
                                fn = function() {
                                    ++calls;
                                };

                            if (obj.hasListeners[event]) {
                                expect(T.$className + '.hasListeners.' + event).toBe('0 before');
                            }

                            //console.log('Firing '+event+' on '+B.$className+' via '+T.$className);
                            B.on(event, fn);

                            if (obj.hasListeners[event]) {
                                obj.fireEvent(event);
                            }
                            if (!calls) {
                                expect(T.$className + ' ' + event + ' event').toBe('fired');
                            }

                            B.un(event, fn);
                            if (obj.hasListeners[event]) {
                                expect(T.$className + '.hasListeners.' + event).toBe('0 after');
                            }
                        });
                    }
                });
            });
        }); // using mixin and extend in combination

        describe("listener merging", function() {
            var Sub, Cls, o, spy1, spy2, spy3;

            beforeEach(function() {
                spy1 = jasmine.createSpy();
                spy2 = jasmine.createSpy();
                spy3 = jasmine.createSpy();
            });

            function mixinCtor() {
                this.mixins.observable.constructor.apply(this, arguments);
            }

            afterEach(function() {
                spy1 = spy2 = spy3 = o = Sub = Cls = null;
            });

            describe("via mixin", function() {
                function makeCls(cfg) {
                    Cls = Ext.define(null, Ext.apply({
                        mixins: [Observable],
                        constructor: mixinCtor
                    }, cfg));
                }

                describe("direct mixin", function() {
                    it("should fire events with listeners only on the instance", function() {
                        makeCls();
                        o = new Cls({
                            listeners: {
                                foo: spy1
                            }
                        });
                        o.fireEvent('foo');
                        expect(spy1).toHaveBeenCalled();
                    });

                    it("should fire events with listeners only on the class", function() {
                        makeCls({
                            listeners: {
                                foo: spy1
                            }
                        });
                        o = new Cls();
                        o.fireEvent('foo');
                        expect(spy1).toHaveBeenCalled();
                    });

                    it("should fire events with listeners on the class & instance", function() {
                        makeCls({
                            listeners: {
                                foo: spy1
                            }
                        });
                        o = new Cls({
                            listeners: {
                                foo: spy2
                            }
                        });
                        o.fireEvent('foo');
                        expect(spy1).toHaveBeenCalled();
                        expect(spy2).toHaveBeenCalled();
                    });
                });

                describe("subclass of mixin", function() {
                    beforeEach(function() {
                        makeCls({
                            listeners: {
                                foo: spy1
                            }
                        });
                    });

                    it("should fire events with listeners only on the instance", function() {
                        Sub = Ext.define(null, {
                            extend: Cls
                        });
                        o = new Sub({
                            listeners: {
                                foo: spy2
                            }
                        });
                        o.fireEvent('foo');
                        expect(spy1).toHaveBeenCalled();
                        expect(spy2).toHaveBeenCalled();
                    });

                    it("should fire events with listeners only on the class", function() {
                        Sub = Ext.define(null, {
                            extend: Cls,
                            listeners: {
                                foo: spy2
                            }
                        });
                        o = new Sub();
                        o.fireEvent('foo');
                        expect(spy1).toHaveBeenCalled();
                        expect(spy2).toHaveBeenCalled();
                    });

                    it("should fire events with listeners on the class & instance", function() {
                        Sub = Ext.define(null, {
                            extend: Cls,
                            listeners: {
                                foo: spy2
                            }
                        });
                        o = new Sub({
                            listeners: {
                                foo: spy3
                            }
                        });
                        o.fireEvent('foo');
                        expect(spy1).toHaveBeenCalled();
                        expect(spy2).toHaveBeenCalled();
                        expect(spy3).toHaveBeenCalled();
                    });
                });
            });

            describe("via extend", function() {
                function makeCls(cfg) {
                    Cls = Ext.define(null, Ext.apply({
                        extend: Observable
                    }, cfg));
                }

                describe("direct subclass", function() {
                    it("should fire events with listeners only on the instance", function() {
                        makeCls();
                        o = new Cls({
                            listeners: {
                                foo: spy1
                            }
                        });
                        o.fireEvent('foo');
                        expect(spy1).toHaveBeenCalled();
                    });

                    it("should fire events with listeners only on the class", function() {
                        makeCls({
                            listeners: {
                                foo: spy1
                            }
                        });
                        o = new Cls();
                        o.fireEvent('foo');
                        expect(spy1).toHaveBeenCalled();
                    });

                    it("should fire events with listeners on the class & instance", function() {
                        makeCls({
                            listeners: {
                                foo: spy1
                            }
                        });
                        o = new Cls({
                            listeners: {
                                foo: spy2
                            }
                        });
                        o.fireEvent('foo');
                        expect(spy1).toHaveBeenCalled();
                        expect(spy2).toHaveBeenCalled();
                    });
                });

                describe("subclass of subclass", function() {
                    beforeEach(function() {
                        makeCls({
                            listeners: {
                                foo: spy1
                            }
                        });
                    });

                    it("should fire events with listeners only on the instance", function() {
                        Sub = Ext.define(null, {
                            extend: Cls
                        });
                        o = new Sub({
                            listeners: {
                                foo: spy2
                            }
                        });
                        o.fireEvent('foo');
                        expect(spy1).toHaveBeenCalled();
                        expect(spy2).toHaveBeenCalled();
                    });

                    it("should fire events with listeners only on the class", function() {
                        Sub = Ext.define(null, {
                            extend: Cls,
                            listeners: {
                                foo: spy2
                            }
                        });
                        o = new Sub();
                        o.fireEvent('foo');
                        expect(spy1).toHaveBeenCalled();
                        expect(spy2).toHaveBeenCalled();
                    });

                    it("should fire events with listeners on the class & instance", function() {
                        Sub = Ext.define(null, {
                            extend: Cls,
                            listeners: {
                                foo: spy2
                            }
                        });
                        o = new Sub({
                            listeners: {
                                foo: spy3
                            }
                        });
                        o.fireEvent('foo');
                        expect(spy1).toHaveBeenCalled();
                        expect(spy2).toHaveBeenCalled();
                        expect(spy3).toHaveBeenCalled();
                    });
                });
            });
        });

        describe("declarative listeners", function() {
            var ParentMixin, ChildMixin, ParentClass, ChildClass,
                result = [];

            beforeEach(function() {
                ParentMixin = Ext.define(null, {
                    mixins: [Observable],
                    type: 'ParentMixin',
                    listeners: {
                        foo: 'parentMixinHandler',
                        scope: 'this'
                    },
                    constructor: function(config) {
                        this.mixins.observable.constructor.call(this, config);
                    },

                    parentMixinHandler: function() {
                        result.push('parentMixin:' + this.id);
                    }
                });

                ChildMixin = Ext.define(null, {
                    extend: ParentMixin,
                    mixinId: 'childMixin',
                    type: 'ChildMixin',
                    listeners: {
                        foo: 'childMixinHandler',
                        scope: 'this'
                    },

                    childMixinHandler: function() {
                        result.push('childMixin:' + this.id);
                    }
                });

                ParentClass = Ext.define(null, {
                    mixins: [ChildMixin],
                    type: 'ParentClass',
                    listeners: {
                        foo: 'parentClassHandler',
                        scope: 'this'
                    },

                    constructor: function(config) {
                        this.mixins.childMixin.constructor.call(this, config);
                    },

                    parentClassHandler: function() {
                        result.push('parentClass:' + this.id);
                    }
                });

                ChildClass = Ext.define(null, {
                    extend: ParentClass,
                    type: 'ChildClass',
                    listeners: {
                        foo: 'childClassHandler',
                        scope: 'this'
                    },

                    childClassHandler: function() {
                        result.push('childClass:' + this.id);
                    }
                });

            });

            it("should call all the listeners", function() {
                var instance = new ChildClass({
                    listeners: {
                        foo: function() {
                            result.push('childInstance:' + this.id);
                        }
                    }
                });

                instance.id = 'theId';
                instance.fireEvent('foo');

                expect(result).toEqual([
                    'parentMixin:theId',
                    'childMixin:theId',
                    'parentClass:theId',
                    'childClass:theId',
                    'childInstance:theId'
                ]);
            });

            it("should not call addListener if extending and no listeners are declared", function() {
                var spy = jasmine.createSpy();

                var Cls = Ext.define(null, {
                    extend: Observable,
                    constructor: function(config) {
                        this.callParent(arguments);
                    },

                    addListener: spy
                });
                new Cls();
                expect(spy).not.toHaveBeenCalled();
            });

            it("should not call addListener if mixing in and no listeners are declared", function() {
                var spy = jasmine.createSpy();

                var Cls = Ext.define(null, {
                    mixins: [
                        Observable
                    ],

                    constructor: function(config) {
                        this.mixins.observable.constructor.apply(this, arguments);
                    },

                    addListener: spy
                });

                new Cls();
                expect(spy).not.toHaveBeenCalled();
            });

            describe("with options", function() {
                var Cls, spy;

                function defineCls(listeners) {
                    Cls = Ext.define(null, {
                        mixins: [
                            Observable
                        ],

                        constructor: function(config) {
                            this.mixins.observable.constructor.apply(this, arguments);
                        },

                        listeners: listeners,

                        trigger: function() {
                            this.fireEvent('foo');
                        }
                    });
                }

                beforeEach(function() {
                    spy = jasmine.createSpy();
                });

                afterEach(function() {
                    spy = Cls = null;
                });

                it("should default the scope to the class when specifying no scope & a function when using single: true", function() {
                    defineCls({
                        foo: {
                            single: true,
                            fn: spy
                        }
                    });
                    var o = new Cls();
                    o.trigger();
                    expect(spy.mostRecentCall.object).toBe(o);
                });

                it("should default the scope to the class when specifying no scope & a function when using delay", function() {
                    defineCls({
                        foo: {
                            delay: 1,
                            fn: spy
                        }
                    });
                    var o = new Cls();
                    o.trigger();
                    waitsFor(function() {
                        return spy.callCount > 0;
                    }, "Function never called");
                    runs(function() {
                        expect(spy.mostRecentCall.object).toBe(o);
                    });
                });

                it("should default the scope to the class when specifying no scope & a function when using buffer", function() {
                    defineCls({
                        foo: {
                            buffer: 1,
                            fn: spy
                        }
                    });
                    var o = new Cls();
                    o.trigger();
                    waitsFor(function() {
                        return spy.callCount > 0;
                    }, "Function never called");
                    runs(function() {
                        expect(spy.mostRecentCall.object).toBe(o);
                    });
                });
            });
        });

        describe("destroy", function() {
            it("should hook the clearListeners method on destroy when used as a mixin", function() {
                var Foo = Ext.define(null, {
                        mixins: [Observable],
                        constructor: function() {
                            this.mixins.observable.constructor.call(this);
                        }
                    }),
                    foo = new Foo();

                spyOn(Observable.prototype, 'clearListeners').andCallThrough();

                foo.destroy();

                expect(Observable.prototype.clearListeners).toHaveBeenCalled();
            });
        });
    });

}

makeObservableSuite(Ext.mixin.Observable);
makeObservableSuite(Ext.util.Observable);

})();
