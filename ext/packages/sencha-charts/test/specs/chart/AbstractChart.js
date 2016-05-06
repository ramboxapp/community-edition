describe('Ext.chart.AbstractChart', function() {
    var chart, store;

    var Model = Ext.define(null, {
        extend: 'Ext.data.Model',
        fields: ['label', 'value']
    });

    function makeStore(rows) {
        var data = [],
            i;

        for (i = 1; i <= rows; ++i) {
            data.push({
                label: 'Item' + i,
                value: i
            });
        }

        store = new Ext.data.Store({
            model: Model,
            data: data
        });
    }

    afterEach(function() {
        store = chart = Ext.destroy(chart, store);
    });

    it('is defined', function() {
        expect(Ext.chart.AbstractChart).toBeDefined();
    });

    describe('adding and removing series', function() {
        var store = Ext.create('Ext.data.Store', {
                fields: ['x', 'y', 'z'],
                data: [
                    {x: 0, y: 0, z: 0},
                    {x: 1, y: 1, z: 1}
                ]
            }),
            chart;

        beforeEach(function() {
            chart = new Ext.chart.CartesianChart({
                store: store,
                axes: [{
                    position: 'left',
                    type: 'numeric'
                }, {
                    position: 'bottom',
                    type: 'numeric'
                }]
            });
        });

        it('should start with no series', function() {
            expect(chart.getSeries().length).toBe(0);
        });

        it('should add and remove series using setSeries', function() {
            var series;

            chart.setSeries([{
                type: 'line',
                xField: 'x',
                yField: 'y',
                id: 'xySeries'
            }]);
            series = chart.getSeries();

            expect(series.length).toBe(1);
            expect(series[0].getId()).toBe('xySeries');

            chart.setSeries([{
                type: 'line',
                xField: 'x',
                yField: 'z',
                id: 'xzSeries'
            }]);
            series = chart.getSeries();

            expect(series.length).toBe(1);
            expect(series[0].getId()).toBe('xzSeries');
        });

        it('should add series using addSeries', function() {
            var series;

            chart.addSeries([{
                type: 'line',
                xField: 'x',
                yField: 'y',
                id: 'xySeries'
            }]);
            series = chart.getSeries();

            expect(series.length).toBe(1);
            expect(series[0].getId()).toBe('xySeries');

            chart.addSeries({
                type: 'line',
                xField: 'x',
                yField: 'z',
                id: 'xzSeries'
            });
            series = chart.getSeries();

            expect(series.length).toBe(2);
            expect(series[0].getId()).toBe('xySeries');
            expect(series[1].getId()).toBe('xzSeries');
        });

        it('should remove series using removeSeries', function() {
            var series;

            chart.addSeries([{
                type: 'line',
                xField: 'x',
                yField: 'y',
                id: 'xySeries'
            }, {
                type: 'line',
                xField: 'x',
                yField: 'z',
                id: 'xzSeries'
            }]);
            series = chart.getSeries();

            expect(series.length).toBe(2);
            expect(series[0].getId()).toBe('xySeries');
            expect(series[1].getId()).toBe('xzSeries');

            // Remove Series id "xySeries", should leave only "xzSeries"
            chart.removeSeries('xySeries');
            series = chart.getSeries();
            expect(series.length).toBe(1);
            expect(series[0].getId()).toBe('xzSeries');

            // Remove a Series by specifying the instance should leav no Series
            chart.removeSeries(series[0]);
            expect(chart.getSeries().length).toBe(0);
        });
    });

    describe("stores", function() {
        function makeChart(storeOnSeries, chartCfg, seriesCfg) {
            var cfg = Ext.apply({
                xtype: 'cartesian',
                axes: [{
                    type: 'numeric',
                    position: 'left'
                }, {
                    type: 'category',
                    position: 'bottom'
                }],
                animation: false,
                series: Ext.apply({
                    type: 'bar',
                    xField: 'label',
                    yField: 'value'
                }, seriesCfg)
            }, chartCfg);
            if (storeOnSeries) {
                if (!cfg.series.store) {
                    cfg.series.store = makeStore(3);
                }
            } else {
                if (!cfg.store) {
                    cfg.store = makeStore(3);
                }
            }
            chart = new Ext.chart.CartesianChart(cfg);
        }

        function extractHasListeners(o) {
            var ret = {},
                key;

            for (key in o) {
                ret[key] = o[key];
            }
            delete ret._decr_;
            delete ret._incr_;
            return ret;
        }

        describe("store on the chart", function() {
            function makeStoreChart(chartCfg, seriesCfg) {
                makeChart(false, chartCfg, seriesCfg);
            }

            describe("configuration", function() {
                it("should accept a store id", function() {
                    store = new Ext.data.Store({
                        model: Model,
                        storeId: 'foo'
                    });
                    makeStoreChart({
                        store: 'foo'
                    });
                    expect(chart.getStore()).toBe(store);
                });

                it("should accept a store config", function() {
                    makeStoreChart({
                        store: {
                            model: Model,
                            data: [{}]
                        }
                    });
                    expect(chart.getStore().getCount()).toBe(1);
                    expect(chart.getStore().getModel()).toBe(Model);
                });

                it("should accept a store instance", function() {
                    makeStore(10);
                    makeStoreChart({
                        store: store
                    });
                    expect(chart.getStore()).toBe(store);
                });
            });

            describe("destruction", function() {
                it("should remove all listeners", function() {
                    makeStore(3);
                    var listeners = extractHasListeners(store.hasListeners);
                    makeStoreChart({
                        store: store
                    });
                    chart.destroy();
                    expect(extractHasListeners(store.hasListeners)).toEqual(listeners);
                });

                it("should not destroy the store by default", function() {
                    makeStore(3);
                    makeStoreChart({
                        store: store
                    });
                    chart.destroy();
                    expect(store.isDestroyed).toBe(false);
                });

                it("should destroy the store when the store has autoDestroy: true", function() {
                    makeStore(3);
                    store.setAutoDestroy(true);
                    makeStoreChart({
                        store: store
                    });
                    chart.destroy();
                    expect(store.isDestroyed).toBe(true);
                });
            });
        });

        describe("store on the series", function() {
            function makeSeriesChart(chartCfg, seriesCfg) {
                makeChart(true, chartCfg, seriesCfg);
            }

            describe("configuration", function() {
                it("should accept a store id", function() {
                    store = new Ext.data.Store({
                        model: Model,
                        storeId: 'foo'
                    });
                    makeSeriesChart(null, {
                        store: 'foo'
                    });
                    expect(chart.getStore().isEmptyStore).toBe(true);
                    expect(chart.getSeries()[0].getStore()).toBe(store);
                });

                it("should accept a store config", function() {
                    makeSeriesChart(null, {
                        store: {
                            model: Model,
                            data: [{}]
                        }
                    });
                    expect(chart.getStore().isEmptyStore).toBe(true);
                    expect(chart.getSeries()[0].getStore().getCount()).toBe(1);
                    expect(chart.getSeries()[0].getStore().getModel()).toBe(Model);
                });

                it("should accept a store instance", function() {
                    makeStore(10);
                    makeSeriesChart(null, {
                        store: store
                    });
                    expect(chart.getStore().isEmptyStore).toBe(true);
                    expect(chart.getSeries()[0].getStore()).toBe(store);
                });
            });

            describe("destruction", function() {
                it("should remove all listeners", function() {
                    makeStore(3);
                    var listeners = extractHasListeners(store.hasListeners);
                    makeSeriesChart(null, {
                        store: store
                    });
                    chart.destroy();
                    expect(extractHasListeners(store.hasListeners)).toEqual(listeners);
                });

                it("should not destroy the store by default", function() {
                    makeStore(3);
                    makeSeriesChart(null, {
                        store: store
                    });
                    chart.destroy();
                    expect(store.isDestroyed).toBe(false);
                });

                it("should destroy the store when the store has autoDestroy: true", function() {
                    makeStore(3);
                    store.setAutoDestroy(true);
                    makeSeriesChart(null, {
                        store: store
                    });
                    chart.destroy();
                    expect(store.isDestroyed).toBe(true);
                });

                it("should not destroy the store when destroying the series by default", function() {
                    makeStore(3);
                    makeSeriesChart(null, {
                        store: store
                    });
                    chart.getSeries()[0].destroy();
                    expect(store.isDestroyed).toBe(false);
                });

                it("should destroy the store when destroying the series when the store has autoDestroy: true", function() {
                    makeStore(3);
                    store.setAutoDestroy(true);
                    makeSeriesChart(null, {
                        store: store
                    });
                    chart.getSeries()[0].destroy();
                    expect(store.isDestroyed).toBe(true);
                });
            });
        });
    });
});