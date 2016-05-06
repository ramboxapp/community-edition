describe("Ext.plugin.Abstract", function() {

    describe("listener scope resolution", function() {
        var spies, Plugin, plugin, Component, component, Parent, parent,
            Controller, Controller, ParentController;

        function defineComponent(cfg) {
            Component = Ext.define(null, Ext.apply({
                extend: 'Ext.Component',
                onFoo: spies.component
            }, cfg));
        }

        function defineParent(cfg) {
            Parent = Ext.define(null, Ext.apply({
                extend: 'Ext.Container',
                onFoo: spies.parent
            }, cfg));
        }

        function expectScope(scope) {
            var scopes = {
                    plugin: plugin,
                    component: component,
                    controller: component && component.getController(),
                    parent: parent,
                    parentController: parent && parent.getController()
                },
                name, spy;

            for (name in spies) {
                spy = spies[name];

                if (name === scope) {
                    expect(spy).toHaveBeenCalled();
                    expect(spy.mostRecentCall.object).toBe(scopes[name]);
                } else {
                    expect(spy).not.toHaveBeenCalled();
                }
            }
        }

        beforeEach(function() {
            spies = {
                plugin: jasmine.createSpy(),
                component: jasmine.createSpy(),
                controller: jasmine.createSpy(),
                parent: jasmine.createSpy(),
                parentController: jasmine.createSpy()
            };

            Controller = Ext.define(null, {
                extend: 'Ext.app.ViewController',
                onFoo: spies.controller
            });

            ParentController = Ext.define(null, {
                extend: 'Ext.app.ViewController',
                onFoo: spies.parentController
            });
        });

        afterEach(function() {
            if (plugin) {
                plugin.destroy();
            }
            if (component) {
                component.destroy();
            }
            if (parent) {
                parent.destroy();
            }
            Plugin = Component = Parent = Controller = ParentController = null;
        });

        describe("listener declared on class body", function() {
            function definePlugin(cfg) {
                Plugin = Ext.define(null, Ext.merge({
                    extend: 'Ext.plugin.Abstract',
                    mixins: ['Ext.mixin.Observable'],
                    constructor: function(config) {
                        this.callParent([config]);
                        this.mixins.observable.constructor.call(this);
                    },
                    listeners: {
                        foo: 'onFoo'
                    },
                    onFoo: spies.plugin
                }, cfg));
            }

            describe("with no defaultListenerScope or controller", function() {
                beforeEach(function() {
                    defineComponent();
                });

                it("should resolve to the plugin with unspecified scope", function() {
                    definePlugin();
                    plugin = new Plugin();
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });

                it("should fail with scope:'controller'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'controller'
                        }
                    });
                    plugin = new Plugin();
                    component = new Component({
                        plugins: plugin
                    });
                    expect(function() {
                        plugin.fireEvent('foo');
                    }).toThrow();
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'this'
                        }
                    });
                    plugin = new Plugin();
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with defaultListenerScope on component", function() {
                beforeEach(function() {
                    defineComponent({
                        defaultListenerScope: true
                    });
                });

                it("should resolve to the component with unspecified scope", function() {
                    definePlugin();
                    plugin = new Plugin();
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('component');
                });

                it("should fail with scope:'controller'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'controller'
                        }
                    });
                    plugin = new Plugin();
                    component = new Component({
                        plugins: plugin
                    });
                    expect(function() {
                        plugin.fireEvent('foo');
                    }).toThrow();
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'this'
                        }
                    });
                    plugin = new Plugin();
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with view controller on component", function() {
                beforeEach(function() {
                    defineComponent({
                        controller: new Controller()
                    });
                });

                it("should resolve to the view controller with unspecified scope", function() {
                    definePlugin();
                    plugin = new Plugin();
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('controller');
                });

                it("should resolve to the view controller with scope:'controller'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'controller'
                        }
                    });
                    plugin = new Plugin();
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('controller');
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'this'
                        }
                    });
                    plugin = new Plugin();
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with view controller and defaultListenerScope on component", function() {
                beforeEach(function() {
                    defineComponent({
                        controller: new Controller(),
                        defaultListenerScope: true
                    });
                });

                it("should resolve to the component with unspecified scope", function() {
                    definePlugin();
                    plugin = new Plugin();
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('component');
                });

                it("should resolve to the view controller with scope:'controller'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'controller'
                        }
                    });
                    plugin = new Plugin();
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('controller');
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'this'
                        }
                    });
                    plugin = new Plugin();
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with parent and no defaultListenerScope or controller", function() {
                beforeEach(function() {
                    defineParent();
                });

                it("should resolve to the plugin with unspecified scope", function() {
                    definePlugin();
                    plugin = new Plugin();
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });

                it("should fail with scope:'controller'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'controller'
                        }
                    });
                    plugin = new Plugin();
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    expect(function() {
                        plugin.fireEvent('foo');
                    }).toThrow();
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'this'
                        }
                    });
                    plugin = new Plugin();
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with defaultListenerScope on parent", function() {
                beforeEach(function() {
                    defineParent({
                        defaultListenerScope: true
                    });
                });

                it("should resolve to the parent with unspecified scope", function() {
                    definePlugin();
                    plugin = new Plugin();
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('parent');
                });

                it("should fail with scope:'controller'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'controller'
                        }
                    });
                    plugin = new Plugin();
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    expect(function() {
                        plugin.fireEvent('foo');
                    }).toThrow();
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'this'
                        }
                    });
                    plugin = new Plugin();
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with view controller on parent", function() {
                beforeEach(function() {
                    defineParent({
                        controller: new ParentController()
                    });
                });

                it("should resolve to the parent view controller with unspecified scope", function() {
                    definePlugin();
                    plugin = new Plugin();
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('parentController');
                });

                it("should resolve to the parent view controller with scope:'controller'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'controller'
                        }
                    });
                    plugin = new Plugin();
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('parentController');
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'this'
                        }
                    });
                    plugin = new Plugin();
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with view controller and defaultListenerScope on parent", function() {
                beforeEach(function() {
                    defineParent({
                        controller: new ParentController(),
                        defaultListenerScope: true
                    });
                });

                it("should resolve to the parent with unspecified scope", function() {
                    definePlugin();
                    plugin = new Plugin();
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('parent');
                });

                it("should resolve to the parent view controller with scope:'controller'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'controller'
                        }
                    });
                    plugin = new Plugin();
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('parentController');
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    definePlugin({
                        listeners: {
                            scope: 'this'
                        }
                    });
                    plugin = new Plugin();
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with handler declared as a function reference", function() {
                var handler, scope;

                function definePlugin(cfg) {
                    Plugin = Ext.define(null, Ext.merge({
                        extend: 'Ext.plugin.Abstract',
                        mixins: ['Ext.mixin.Observable'],
                        constructor: function(config) {
                            this.callParent([config]);
                            this.mixins.observable.constructor.call(this);
                        },
                        listeners: {
                            foo: handler
                        }
                    }, cfg))
                }

                beforeEach(function() {
                    handler = jasmine.createSpy();
                    handler.andCallFake(function() {
                        scope = this;
                    });
                });

                afterEach(function() {
                    scope = null;
                });

                describe("with no defaultListenerScope or controller", function() {
                    beforeEach(function() {
                        defineComponent();
                    });

                    it("should resolve to the plugin with unspecified scope", function() {
                        definePlugin();
                        plugin = new Plugin();
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(plugin);
                    });

                    it("should fail with scope:'controller'", function() {
                        definePlugin({
                            listeners: {
                                scope: 'controller'
                            }
                        });
                        plugin = new Plugin();
                        component = new Component({
                            plugins: plugin
                        });
                        expect(function() {
                            plugin.fireEvent('foo');
                        }).toThrow();
                    });

                    it("should resolve to the plugin with scope:'this'", function() {
                        definePlugin({
                            listeners: {
                                scope: 'this'
                            }
                        });
                        plugin = new Plugin();
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(plugin);
                    });
                });

                describe("with defaultListenerScope on component", function() {
                    beforeEach(function() {
                        defineComponent({
                            defaultListenerScope: true
                        });
                    });

                    it("should resolve to the plugin with unspecified scope", function() {
                        definePlugin();
                        plugin = new Plugin();
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(plugin);
                    });

                    it("should fail with scope:'controller'", function() {
                        definePlugin({
                            listeners: {
                                scope: 'controller'
                            }
                        });
                        plugin = new Plugin();
                        component = new Component({
                            plugins: plugin
                        });
                        expect(function() {
                            plugin.fireEvent('foo');
                        }).toThrow();
                    });

                    it("should resolve to the plugin with scope:'this'", function() {
                        definePlugin({
                            listeners: {
                                scope: 'this'
                            }
                        });
                        plugin = new Plugin();
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(plugin);
                    });
                });

                describe("with view controller on component", function() {
                    beforeEach(function() {
                        defineComponent({
                            controller: new Controller()
                        });
                    });

                    it("should resolve to the plugin with unspecified scope", function() {
                        definePlugin();
                        plugin = new Plugin();
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(plugin);
                    });

                    it("should resolve to the component view controller with scope:'controller'", function() {
                        definePlugin({
                            listeners: {
                                scope: 'controller'
                            }
                        });
                        plugin = new Plugin();
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(component.getController());
                    });

                    it("should resolve to the plugin with scope:'this'", function() {
                        definePlugin({
                            listeners: {
                                scope: 'this'
                            }
                        });
                        plugin = new Plugin();
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(plugin);
                    });
                });
            });
        });

        describe("listener declared on instance config", function() {
            function definePlugin(cfg) {
                Plugin = Ext.define(null, Ext.merge({
                    extend: 'Ext.plugin.Abstract',
                    mixins: ['Ext.mixin.Observable'],
                    constructor: function(config) {
                        this.callParent([config]);
                        this.mixins.observable.constructor.call(this);
                    },
                    onFoo: spies.plugin
                }, cfg));
            }

            describe("with no defaultListenerScope or controller", function() {
                beforeEach(function() {
                    defineComponent();
                    definePlugin();
                });

                it("should resolve to the component with unspecified scope", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo'
                        }
                    });
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('component');
                });

                it("should fail with scope:'controller'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'controller'
                        }
                    });
                    component = new Component({
                        plugins: plugin
                    });
                    expect(function() {
                        plugin.fireEvent('foo');
                    }).toThrow();
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'this'
                        }
                    });
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with defaultListenerScope on component", function() {
                beforeEach(function() {
                    defineComponent({
                        defaultListenerScope: true
                    });
                    definePlugin();
                });

                it("should resolve to the component with unspecified scope", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo'
                        }
                    });
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('component');
                });

                it("should fail with scope:'controller'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'controller'
                        }
                    });
                    component = new Component({
                        plugins: plugin
                    });
                    expect(function() {
                        plugin.fireEvent('foo');
                    }).toThrow();
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'this'
                        }
                    });
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with view controller on component", function() {
                beforeEach(function() {
                    defineComponent({
                        controller: new Controller()
                    });
                    definePlugin();
                });

                it("should resolve to the component view controller with unspecified scope", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo'
                        }
                    });
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('controller');
                });

                it("should resolve to the component view controller with scope:'controller'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'controller'
                        }
                    });
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('controller');
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'this'
                        }
                    });
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with view controller and defaultListenerScope on component", function() {
                beforeEach(function() {
                    defineComponent({
                        controller: new Controller(),
                        defaultListenerScope: true
                    });
                    definePlugin();
                });

                it("should resolve to the component with unspecified scope", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo'
                        }
                    });
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('component');
                });

                it("should resolve to the component view controller with scope:'controller'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'controller'
                        }
                    });
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('controller');
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'this'
                        }
                    });
                    component = new Component({
                        plugins: plugin
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with parent and no defaultListenerScope or controller", function() {
                beforeEach(function() {
                    defineParent();
                    definePlugin();
                    defineComponent();
                });

                it("should resolve to the component with unspecified scope", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo'
                        }
                    });
                    parent = new Parent({
                        items: (component = new Component({
                            plugins: plugin
                        }))
                    });
                    plugin.fireEvent('foo');
                    expectScope('component');
                });

                it("should fail with scope:'controller'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'controller'
                        }
                    });
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    expect(function() {
                        plugin.fireEvent('foo');
                    }).toThrow();
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'this'
                        }
                    });
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with defaultListenerScope on parent", function() {
                beforeEach(function() {
                    defineParent({
                        defaultListenerScope: true
                    });
                    definePlugin();
                });

                it("should resolve to the parent with unspecified scope", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo'
                        }
                    });
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('parent');
                });

                it("should fail with scope:'controller'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'controller'
                        }
                    });
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    expect(function() {
                        plugin.fireEvent('foo');
                    }).toThrow();
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'this'
                        }
                    });
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with view controller on parent", function() {
                beforeEach(function() {
                    defineParent({
                        controller: new ParentController()
                    });
                    definePlugin();
                });

                it("should resolve to the parent view controller with unspecified scope", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo'
                        }
                    });
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('parentController');
                });

                it("should resolve to the parent view controller with scope:'controller'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'controller'
                        }
                    });
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('parentController');
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'this'
                        }
                    });
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with view controller and defaultListenerScope on parent", function() {
                beforeEach(function() {
                    defineParent({
                        controller: new ParentController(),
                        defaultListenerScope: true
                    });
                    definePlugin();
                });

                it("should resolve to the parent with unspecified scope", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo'
                        }
                    });
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('parent');
                });

                it("should resolve to the parent view controller with scope:'controller'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'controller'
                        }
                    });
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('parentController');
                });

                it("should resolve to the plugin with scope:'this'", function() {
                    plugin = new Plugin({
                        listeners: {
                            foo: 'onFoo',
                            scope: 'this'
                        }
                    });
                    parent = new Parent({
                        items: {
                            plugins: plugin
                        }
                    });
                    plugin.fireEvent('foo');
                    expectScope('plugin');
                });
            });

            describe("with handler declared as a function reference", function() {
                var handler, scope;

                function definePlugin(cfg) {
                    Plugin = Ext.define(null, Ext.merge({
                        extend: 'Ext.plugin.Abstract',
                        mixins: ['Ext.mixin.Observable'],
                        constructor: function(config) {
                            this.callParent([config]);
                            this.mixins.observable.constructor.call(this);
                        }
                    }, cfg));
                }

                beforeEach(function() {
                    handler = jasmine.createSpy();
                    handler.andCallFake(function() {
                        scope = this;
                    });
                });

                afterEach(function() {
                    scope = null;
                });

                describe("with no defaultListenerScope or controller", function() {
                    beforeEach(function() {
                        defineComponent();
                        definePlugin();
                    });

                    it("should resolve to the plugin with unspecified scope", function() {
                        plugin = new Plugin({
                            listeners: {
                                foo: handler
                            }
                        });
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(plugin);
                    });

                    it("should fail with scope:'controller'", function() {
                        plugin = new Plugin({
                            listeners: {
                                foo: handler,
                                scope: 'controller'
                            }
                        });
                        component = new Component({
                            plugins: plugin
                        });
                        expect(function() {
                            plugin.fireEvent('foo');
                        }).toThrow();
                    });

                    it("should resolve to the plugin with scope:'this'", function() {
                        plugin = new Plugin({
                            listeners: {
                                foo: handler,
                                scope: 'this'
                            }
                        });
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(plugin);
                    });
                });

                describe("with defaultListenerScope on component", function() {
                    beforeEach(function() {
                        defineComponent({
                            defaultListenerScope: true
                        });
                        definePlugin();
                    });

                    it("should resolve to the plugin with unspecified scope", function() {
                        plugin = new Plugin({
                            listeners: {
                                foo: handler
                            }
                        });
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(plugin);
                    });

                    it("should fail with scope:'controller'", function() {
                        plugin = new Plugin({
                            listeners: {
                                foo: handler,
                                scope: 'controller'
                            }
                        });
                        component = new Component({
                            plugins: plugin
                        });
                        expect(function() {
                            plugin.fireEvent('foo');
                        }).toThrow();
                    });

                    it("should resolve to the plugin with scope:'this'", function() {
                        plugin = new Plugin({
                            listeners: {
                                foo: handler,
                                scope: 'this'
                            }
                        });
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(plugin);
                    });
                });

                describe("with view controller on component", function() {
                    beforeEach(function() {
                        defineComponent({
                            controller: new Controller()
                        });
                        definePlugin();
                    });

                    it("should resolve to the plugin with unspecified scope", function() {
                        plugin = new Plugin({
                            listeners: {
                                foo: handler
                            }
                        });
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(plugin);
                    });

                    it("should resolve to the controller with scope:'controller'", function() {
                        plugin = new Plugin({
                            listeners: {
                                foo: handler,
                                scope: 'controller'
                            }
                        });
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(component.getController());
                    });

                    it("should resolve to the plugin with scope:'this'", function() {
                        plugin = new Plugin({
                            listeners: {
                                foo: handler,
                                scope: 'this'
                            }
                        });
                        component = new Component({
                            plugins: plugin
                        });
                        plugin.fireEvent('foo');
                        expect(scope).toBe(plugin);
                    });
                });
            });
        });
    });
});