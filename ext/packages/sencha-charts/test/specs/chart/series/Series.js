describe('Ext.chart.series.Series', function() {

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

        var seriesConfig = {
            type: 'bar',
            xField: 'x',
            yField: 'y'
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
                series: seriesConfig
            };
            Ext.apply(config, options);
            var chart = Ext.create('Ext.chart.CartesianChart', config);
            chart.setTestScope = setTestScope;
            return chart;
        }

        function createSeriesClass(listenerScope) {
            return Ext.define(null, {
                extend: 'Ext.chart.series.Bar',
                xField: 'x',
                yField: 'y',
                setTestScope: setTestScope,
                listeners: {
                    test: {
                        fn: 'setTestScope',
                        scope: listenerScope
                    }
                }
            });
        }

        describe('series instance listener', function () {

            describe('no chart controller, chart container controller', function () {
                var chart, series,
                    container, containerController;

                beforeEach(function () {
                    testScope = undefined;
                    containerController = createController();
                    chart = createChart();
                    container = createContainer({
                        controller: containerController
                    });
                    container.add(chart);
                    series = chart.getSeries()[0];
                    series.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart container controller", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(containerController);
                });

                it("listener with no explicit scope should be scoped to chart container controller", function () {
                    series.on('test', 'setTestScope');
                    series.fireEvent('test', series);
                    expect(testScope).toBe(containerController);
                });
            });


            describe('chart controller, no chart container controller', function () {
                var chart, series,
                    container, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        controller: chartController
                    });
                    container = createContainer();
                    container.add(chart);
                    series = chart.getSeries()[0];
                    series.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart controller", function () {
                    series.on('test', 'setTestScope');
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });
            });


            describe('chart controller, chart container controller', function () {
                var chart, container, series,
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
                    series = chart.getSeries()[0];
                    series.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart controller", function () {
                    series.on('test', 'setTestScope');
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });
            });

            describe('no chart controller, no chart container controller', function () {
                var chart, series, container;

                beforeEach(function () {
                    testScope = undefined;
                    chart = createChart();
                    container = createContainer();
                    container.add(chart);
                    series = chart.getSeries()[0];
                    series.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should fail", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    expect(function () {
                        series.fireEvent('test', series);
                    }).toThrow();
                });

                it("listener with no explicit scope should be scoped to the chart", function () {
                    series.on('test', 'setTestScope');
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chart);
                });
            });

            describe('chart inside container with defaultListenerScope: true (no controllers)', function () {
                var chart, series, container;

                beforeEach(function () {
                    testScope = undefined;
                    chart = createChart();
                    container = createContainer({
                        defaultListenerScope: true
                    });
                    container.add(chart);
                    series = chart.getSeries()[0];
                    series.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should fail", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    expect(function () {
                        series.fireEvent('test', series);
                    }).toThrow();
                });

                it("listener with no explicit scope should be scoped to the container", function () {
                    series.on('test', 'setTestScope');
                    series.fireEvent('test', series);
                    expect(testScope).toBe(container);
                });
            });

            describe('chart with a controller and defaultListenerScope: true', function () {
                var chart, series, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        controller: chartController,
                        defaultListenerScope: true
                    });
                    series = chart.getSeries()[0];
                    series.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to the chart controller", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to the chart", function () {
                    series.on('test', 'setTestScope');
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chart);
                });
            });

            describe('chart with a controller (no container)', function () {
                var chart, series, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        controller: chartController
                    });
                    series = chart.getSeries()[0];
                    series.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to the chart controller", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to the chart controller", function () {
                    series.on('test', 'setTestScope');
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });
            });

            describe('chart with defaultListenerScope: true (container, no controllers)', function () {
                var chart, container, series, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chart = createChart({
                        defaultListenerScope: true
                    });
                    container = createContainer();
                    container.add(chart);
                    series = chart.getSeries()[0];
                    series.setTestScope = setTestScope;
                });

                afterEach(function () {
                    chart.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'this'
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: scopeObject
                    });
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to the chart controller", function () {
                    series.on({
                        test: 'setTestScope',
                        scope: 'controller'
                    });
                    expect(function () {
                        series.fireEvent('test', series);
                    }).toThrow();
                });

                it("listener with no explicit scope should be scoped to the chart", function () {
                    series.on('test', 'setTestScope');
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chart);
                });
            });

        });

        // #######################################################################################

        describe('series class listener', function () {

            describe('no chart controller, chart container controller', function () {
                var chart, series,
                    container, containerController;

                beforeEach(function () {
                    testScope = undefined;
                    containerController = createController();
                    chart = createChart({
                        series: []
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

                it("listener scoped to 'this' should refer to the series", function () {
                    series = new (createSeriesClass('this'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series = new (createSeriesClass(scopeObject))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart container controller", function () {
                    series = new (createSeriesClass('controller'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(containerController);
                });

                it("listener with no explicit scope should be scoped to chart container controller", function () {
                    series = new (createSeriesClass())();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(containerController);
                });
            });


            describe('chart controller, no chart container controller', function () {
                var chart, series,
                    container, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        series: [],
                        controller: chartController
                    });
                    container = createContainer();
                    container.add(chart);
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series = new (createSeriesClass('this'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series = new (createSeriesClass(scopeObject))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    series = new (createSeriesClass('controller'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart controller", function () {
                    series = new (createSeriesClass())();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });
            });


            describe('chart controller, chart container controller', function () {
                var chart, container, series,
                    chartController,
                    containerController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    containerController = createController();
                    chart = createChart({
                        series: [],
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

                it("listener scoped to 'this' should refer to the series", function () {
                    series = new (createSeriesClass('this'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series = new (createSeriesClass(scopeObject))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    series = new (createSeriesClass('controller'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart controller", function () {
                    series = new (createSeriesClass())();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });
            });

            describe('no chart controller, no chart container controller', function () {
                var chart, series, container;

                beforeEach(function () {
                    testScope = undefined;
                    chart = createChart({
                        series: []
                    });
                    container = createContainer();
                    container.add(chart);
                });

                afterEach(function () {
                    chart.destroy();
                    container.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series = new (createSeriesClass('this'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series = new (createSeriesClass(scopeObject))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should fail", function () {
                    series = new (createSeriesClass('controller'))();
                    chart.setSeries(series);
                    expect(function () {
                        series.fireEvent('test', series);
                    }).toThrow();
                });

                it("listener with no explicit scope should be scoped to the series", function () {
                    series = new (createSeriesClass())();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });
            });

            describe('chart inside container with defaultListenerScope: true (no controllers)', function () {
                var chart, series, container;

                beforeEach(function () {
                    testScope = undefined;
                    chart = createChart({
                        series: []
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

                it("listener scoped to 'this' should refer to the series", function () {
                    series = new (createSeriesClass('this'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series = new (createSeriesClass(scopeObject))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should fail", function () {
                    series = new (createSeriesClass('controller'))();
                    chart.setSeries(series);
                    expect(function () {
                        series.fireEvent('test', series);
                    }).toThrow();
                });

                it("listener with no explicit scope should be scoped to chart container", function () {
                    series = new (createSeriesClass())();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(container);
                });
            });

            describe('chart with a controller and defaultListenerScope: true', function () {
                var chart, series, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        series: [],
                        controller: chartController,
                        defaultListenerScope: true
                    });
                });

                afterEach(function () {
                    chart.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series = new (createSeriesClass('this'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series = new (createSeriesClass(scopeObject))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    series = new (createSeriesClass('controller'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart", function () {
                    series = new (createSeriesClass())();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chart);
                });
            });

            describe('chart with a controller (no container)', function () {
                var chart, series, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        series: [],
                        controller: chartController
                    });
                });

                afterEach(function () {
                    chart.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series = new (createSeriesClass('this'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series = new (createSeriesClass(scopeObject))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    series = new (createSeriesClass('controller'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart controller", function () {
                    series = new (createSeriesClass())();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });
            });

            describe('chart with defaultListenerScope: true (container, no controllers)', function () {
                var chart, container, series, chartController;

                beforeEach(function () {
                    testScope = undefined;
                    chartController = createController();
                    chart = createChart({
                        series: [],
                        controller: chartController,
                        defaultListenerScope: true
                    });
                    container = createContainer();
                    container.add(chart);
                });

                afterEach(function () {
                    chart.destroy();
                });

                it("listener scoped to 'this' should refer to the series", function () {
                    series = new (createSeriesClass('this'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(series);
                });

                it("listener scoped to an arbitrary object should refer to that object", function () {
                    series = new (createSeriesClass(scopeObject))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(scopeObject);
                });

                it("listener scoped to 'controller' should refer to chart controller", function () {
                    series = new (createSeriesClass('controller'))();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chartController);
                });

                it("listener with no explicit scope should be scoped to chart", function () {
                    series = new (createSeriesClass())();
                    chart.setSeries(series);
                    series.fireEvent('test', series);
                    expect(testScope).toBe(chart);
                });
            });

        })

    });
});