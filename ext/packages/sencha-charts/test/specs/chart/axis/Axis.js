describe('Ext.chart.axis.Axis', function() {

    describe('resolveListenerScope', function () {

        var testScope;

        function setTestScope() {
            testScope = this;
        }

        var scopeObject = {
            setTestScope: setTestScope
        };

        var store = Ext.create('Ext.data.Store', {
            fields: ['x', 'y'],
            data: [
                {x: 0, y: 0},
                {x: 1, y: 1}
            ]
        });

        var axisConfig = {
            type: 'numeric',
            position: 'bottom'
        };

        function createContainer(options) {
            var config = {
                width: 400,
                height: 400,
                layout: 'fit'
            };
            Ext.apply(config, options);
            var container = Ext.create('Ext.container.Container', config);
            container.setTestScope = setTestScope;
            return container;
        }

        function createController() {
            return Ext.create('Ext.app.ViewController', {
                setTestScope: setTestScope
            });
        }

        function createChart(options) {
            var config = {
                store: store,
                axes: axisConfig
            };
            Ext.apply(config, options);
            var chart = Ext.create('Ext.chart.CartesianChart', config);
            chart.setTestScope = setTestScope;
            return chart;
        }

        function createAxisClass(listenerScope) {
            return Ext.define(null, {
                extend: 'Ext.chart.axis.Numeric',
                setTestScope: setTestScope,
                listeners: {
                    test: {
                        fn: 'setTestScope',
                        scope: listenerScope
                    }
                }
            });
        }

        describe('axis instance listener', function () {

            describe('no chart controller, chart container controller', function () {
                var chart, axis,
                    container, containerController;

                beforeEach(function () {
                    testScope = undefined;
                    containerController = createController();
                    chart = createChart();
                    container = createContainer({
                        controller: containerController
                    });
                    container.add(chart);
                    axis = chart.getAxes()[0];
                    axis.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart container controller", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(containerController);
                });

                it("listener with no explicit scope should be scoped to chart container controller", function () {
                    axis.on('test', 'setTestScope');
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(containerController);
                });
            });


            describe('chart controller, no chart container controller', function () {
                var chart, axis,
                    container, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        controller: chartController
                    });
                    container = createContainer();
                    container.add(chart);
                    axis = chart.getAxes()[0];
                    axis.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart controller", function () {
                    axis.on('test', 'setTestScope');
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });
            });


            describe('chart controller, chart container controller', function () {
                var chart, container, axis,
                    chartController,
                    containerController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    containerController = createController();
                    chart = createChart({
                        controller: chartController
                    });
                    container = createContainer({
                        controller: containerController
                    });
                    container.add(chart);
                    axis = chart.getAxes()[0];
                    axis.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart controller", function () {
                    axis.on('test', 'setTestScope');
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });
            });

            describe('no chart controller, no chart container controller', function () {
                var chart, axis, container;

                beforeEach(function () {
                    testScope = undefined;
                    chart = createChart();
                    container = createContainer();
                    container.add(chart);
                    axis = chart.getAxes()[0];
                    axis.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should fail", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    expect(function () {
                        axis.fireEvent('test', axis);
                    }).toThrow();
                });

                it("listener with no explicit scope should be scoped to the chart", function () {
                    axis.on('test', 'setTestScope');
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chart);
                });
            });

            describe('chart inside container with defaultListenerScope: true (no controllers)', function () {
                var chart, axis, container;

                beforeEach(function () {
                    testScope = undefined;
                    chart = createChart();
                    container = createContainer({
                        defaultListenerScope: true
                    });
                    container.add(chart);
                    axis = chart.getAxes()[0];
                    axis.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should fail", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    expect(function () {
                        axis.fireEvent('test', axis);
                    }).toThrow();
                });

                it("listener with no explicit scope should be scoped to the container", function () {
                    axis.on('test', 'setTestScope');
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(container);
                });
            });

            describe('chart with a controller and defaultListenerScope: true', function () {
                var chart, axis, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        controller: chartController,
                        defaultListenerScope: true
                    });
                    axis = chart.getAxes()[0];
                    axis.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to the chart controller", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to the chart", function () {
                    axis.on('test', 'setTestScope');
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chart);
                });
            });

            describe('chart with a controller', function () {
                var chart, axis, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        controller: chartController
                    });
                    axis = chart.getAxes()[0];
                    axis.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to the chart controller", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to the chart controller", function () {
                    axis.on('test', 'setTestScope');
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });
            });

            describe('chart with defaultListenerScope: true (container, no controllers)', function () {
                var chart, container, axis, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        controller: chartController,
                        defaultListenerScope: true
                    });
                    container = createContainer();
                    container.add(chart);
                    axis = chart.getAxes()[0];
                    axis.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to the chart controller", function () {
                    axis.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to the chart", function () {
                    axis.on('test', 'setTestScope');
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chart);
                });
            });

        });

        // #######################################################################################

        describe('axis class listener', function () {

            describe('no chart controller, chart container controller', function () {
                var chart, axis,
                    container, containerController;

                beforeEach(function () {
                    testScope = undefined;
                    containerController = createController();
                    chart = createChart({
                        axes: []
                    });
                    container = createContainer({
                        controller: containerController
                    });
                    container.add(chart);
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis = new (createAxisClass('this'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis = new (createAxisClass(scopeObject))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart container controller", function () {
                    axis = new (createAxisClass('controller'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(containerController);
                });

                it("listener with no explicit scope should be scoped to chart container controller", function () {
                    axis = new (createAxisClass())();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(containerController);
                });
            });


            describe('chart controller, no chart container controller', function () {
                var chart, axis,
                    container, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        axes: [],
                        controller: chartController
                    });
                    container = createContainer();
                    container.add(chart);
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis = new (createAxisClass('this'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis = new (createAxisClass(scopeObject))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    axis = new (createAxisClass('controller'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart controller", function () {
                    axis = new (createAxisClass())();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });
            });


            describe('chart controller, chart container controller', function () {
                var chart, container, axis,
                    chartController,
                    containerController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    containerController = createController();
                    chart = createChart({
                        axes: [],
                        controller: chartController
                    });
                    container = createContainer({
                        controller: containerController
                    });
                    container.add(chart);
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis = new (createAxisClass('this'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis = new (createAxisClass(scopeObject))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    axis = new (createAxisClass('controller'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart controller", function () {
                    axis = new (createAxisClass())();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });
            });

            describe('no chart controller, no chart container controller', function () {
                var chart, axis, container;

                beforeEach(function () {
                    testScope = undefined;
                    chart = createChart({
                        axes: []
                    });
                    container = createContainer();
                    container.add(chart);
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis = new (createAxisClass('this'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis = new (createAxisClass(scopeObject))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should fail", function () {
                    axis = new (createAxisClass('controller'))();
                    chart.setAxes(axis);
                    expect(function () {
                        axis.fireEvent('test', axis);
                    }).toThrow();
                });

                it("listener with no explicit scope should be scoped to the axis", function () {
                    axis = new (createAxisClass())();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });
            });

            describe('chart inside container with defaultListenerScope: true (no controllers)', function () {
                var chart, axis, container;

                beforeEach(function () {
                    testScope = undefined;
                    chart = createChart({
                        axes: []
                    });
                    container = createContainer({
                        defaultListenerScope: true
                    });
                    container.add(chart);
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis = new (createAxisClass('this'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis = new (createAxisClass(scopeObject))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should fail", function () {
                    axis = new (createAxisClass('controller'))();
                    chart.setAxes(axis);
                    expect(function () {
                        axis.fireEvent('test', axis);
                    }).toThrow();
                });

                it("listener with no explicit scope should be scoped to chart container", function () {
                    axis = new (createAxisClass())();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(container);
                });
            });

            describe('chart with a controller and defaultListenerScope: true', function () {
                var chart, axis, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        axes: [],
                        controller: chartController,
                        defaultListenerScope: true
                    });
                });

                afterEach(function () {
                    chart.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis = new (createAxisClass('this'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis = new (createAxisClass(scopeObject))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    axis = new (createAxisClass('controller'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart", function () {
                    axis = new (createAxisClass())();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chart);
                });
            });

            describe('chart with a controller (no container)', function () {
                var chart, axis, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        axes: [],
                        controller: chartController
                    });
                });

                afterEach(function () {
                    chart.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis = new (createAxisClass('this'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis = new (createAxisClass(scopeObject))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    axis = new (createAxisClass('controller'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart controller", function () {
                    axis = new (createAxisClass())();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });
            });

            describe('chart with defaultListenerScope: true (container, no controllers)', function () {
                var chart, container, axis, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        axes: [],
                        controller: chartController,
                        defaultListenerScope: true
                    });
                    container = createContainer();
                    container.add(chart);
                });

                afterEach(function () {
                    chart.destroy();
                });

                it("listener scoped to 'this' should refer to the axis", function () {
                    axis = new (createAxisClass('this'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(axis);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    axis = new (createAxisClass(scopeObject))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    axis = new (createAxisClass('controller'))();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart", function () {
                    axis = new (createAxisClass())();
                    chart.setAxes(axis);
                    axis.fireEvent('test', axis);
                    expect(testScope).toBe(chart);
                });
            });

        })

    });
});