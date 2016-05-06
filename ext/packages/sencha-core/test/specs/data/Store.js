describe("Ext.data.Store", function() {
    var fakeScope = {},
        abeRaw, aaronRaw, edRaw, tommyRaw,
        abeRec, aaronRec, edRec, tommyRec, 
        store, User, spy;
        
    function customSort(v) {
        return v * -1;
    }

    function spyOnEvent(object, eventName, fn) {
        var obj = {
            fn: fn || Ext.emptyFn
        },
        spy = spyOn(obj, "fn");
        object.addListener(eventName, obj.fn);
        return spy;
    }

    function addStoreData() {
        store.add(edRaw, abeRaw, aaronRaw, tommyRaw);
        assignRecs();
    }

    function assignRecs() {
        edRec    = store.getAt(0);
        abeRec   = store.getAt(1);
        aaronRec = store.getAt(2);
        tommyRec = store.getAt(3);
    }
    
    function makeUser(email, data) {
        if (Ext.isObject(email)) {
            data = email;
        } else {
            data = data || {};
            if (!data.email) {
                data.email = email;
            }
        }
        return new User(data);
    }
    
    function createStore(cfg, withData) {
        cfg = cfg || {};
        store = new Ext.data.Store(Ext.applyIf(cfg, {
            model: User,
            data: withData ? [edRaw, abeRaw, aaronRaw, tommyRaw] : null
        }));
        if (withData) {
            assignRecs();
        }
    }
    
    function completeWithData(data) {
        Ext.Ajax.mockComplete({
            status: 200,
            responseText: Ext.JSON.encode(data)
        });
    }

    function complete(status, text) {
        Ext.Ajax.mockComplete({
            status: status,
            responseText: ''
        });
    }
    
    beforeEach(function() {
        MockAjaxManager.addMethods();
        User = Ext.define('spec.User', {
            extend: 'Ext.data.Model',
            idProperty: 'email',

            fields: [
                {name: 'name',      type: 'string'},
                {name: 'email',     type: 'string'},
                {name: 'evilness',  type: 'int'},
                {name: 'group',     type: 'string'},
                {name: 'old',       type: 'boolean'},
                {name: 'valid',     type: 'string'},
                {
                    name: 'age',
                    type: 'int',
                    sortType: customSort
                }, {
                    name: 'validField',
                    validators: 'presence'
                }
            ]
        });

        edRaw    = {name: 'Ed Spencer',   email: 'ed@sencha.com',    evilness: 100, group: 'code',  old: false, age: 25, valid: 'yes'};
        abeRaw   = {name: 'Abe Elias',    email: 'abe@sencha.com',   evilness: 70,  group: 'admin', old: false, age: 20, valid: 'yes'};
        aaronRaw = {name: 'Aaron Conran', email: 'aaron@sencha.com', evilness: 5,   group: 'admin', old: true,  age: 26, valid: 'yes'};
        tommyRaw = {name: 'Tommy Maintz', email: 'tommy@sencha.com', evilness: -15, group: 'code',  old: true,  age: 70, valid: 'yes'};
    });
    
    afterEach(function() {
        MockAjaxManager.removeMethods();
        Ext.undefine('spec.User');
        Ext.data.Model.schema.clear();
        store.destroy();
        store = spy = User = null;
        edRaw = edRec = abeRaw = abeRec = aaronRaw = aaronRec = tommyRaw = tommyRec = null;
    });
    
    describe("initializing", function() {
        describe("store manager", function() {
            it("should register if a storeId is passed", function() {
                createStore({
                    storeId: 'foo'
                });
                expect(Ext.data.StoreManager.get('foo')).toBe(store);
            });
        });
        
        describe("proxy", function() {
            describe("configured on the store", function() {
                it("should create from a string", function() {
                    createStore({
                        proxy: 'jsonp'
                    });
                    expect(store.getProxy() instanceof Ext.data.proxy.JsonP).toBe(true);
                });
                
                it("should create from a config", function() {
                    createStore({
                        proxy: {
                            type: 'ajax',
                            url: 'foo'
                        }
                    });
                    var proxy = store.getProxy();
                    expect(proxy instanceof Ext.data.proxy.Ajax);
                    expect(proxy.getUrl()).toBe('foo');
                });
                
                it("should accept an instance", function() {
                    var proxy = new Ext.data.proxy.Memory();
                    createStore({
                        proxy: proxy
                    });
                    expect(store.getProxy()).toBe(proxy);
                });
            });
            
            describe("configured on the model", function() {
                it("should use the proxy from the model", function() {
                    Ext.define('spec.ProxyWithModel', {
                        extend: 'Ext.data.Model',
                        fields: [],
                        
                        proxy: {
                            type: 'ajax'
                        }
                    });
                    createStore({
                        model: 'spec.ProxyWithModel'
                    });
                    expect(store.getProxy()).toBe(spec.ProxyWithModel.getProxy());
                    Ext.undefine('spec.ProxyWithModel');
                });
            });
            
            describe("configured on both", function() {
                it("should favour the store proxy", function() {
                    Ext.define('spec.ProxyWithModel', {
                        extend: 'Ext.data.Model',
                        fields: [],
                        
                        proxy: {
                            type: 'ajax'
                        }
                    });
                    var proxy = new Ext.data.proxy.Ajax();
                    createStore({
                        model: 'spec.ProxyWithModel',
                        proxy: proxy
                    });
                    expect(store.getProxy()).toBe(proxy);
                    Ext.undefine('spec.ProxyWithModel');
                });
            });
            
            describe("memory with data", function() {
                it("should load the data instantly", function() {
                    createStore({
                        proxy: {
                            type: 'memory'
                        },
                        data: [edRaw, abeRaw]
                    });
                    expect(store.getCount()).toBe(2);
                });
            });
        });
        
        describe("autoLoad", function() {
            it("should not auto load by default", function() {
                createStore();
                spyOn(store, 'load').andReturn();
                waits(50);
                runs(function() {
                    expect(store.load).not.toHaveBeenCalled();
                });
            });
            
            describe("autoLoad: true", function() {
                it("should load the store", function() {
                    createStore({
                        autoLoad: true
                    });
                    spyOn(store, 'load').andReturn();
                    waitsFor(function() {
                        return store.load.callCount > 0;
                    }, 'Load never called');
                    runs(function() {
                        expect(store.load.callCount).toBe(1);
                    });
                });
                
                it("should pass the options if autoLoad is an object", function() {
                    var o = {};
                    createStore({
                        autoLoad: o
                    });
                    spyOn(store, 'load').andReturn();
                    waitsFor(function() {
                        return store.load.callCount > 0;
                    });
                    runs(function() {
                        expect(store.load).toHaveBeenCalledWith(o);
                        expect(store.load.callCount).toBe(1);
                    });
                });
            });
        });
        
        describe("fields", function() {
            it("should create a model with the configured fields", function() {
                createStore({
                    fields: ['id', 'height', 'width']
                });
                var Model = store.getModel(),
                    fields = Model.getFields();
                    
                expect(Model.prototype.isModel).toBe(true);
                expect(fields[0].getName()).toBe('id');
                expect(fields[1].getName()).toBe('height');
                expect(fields[2].getName()).toBe('width');
            });
            
            it("should not be created with a class name", function() {
                createStore({
                    fields: ['id', 'height', 'width']
                });
                var Model = store.getModel();
                expect(Model.$className).toBe(null);
            });
        });

        describe("data", function() {
            describe("with no proxy", function() {
                it("should add any inline data", function() {
                    createStore({
                        data: [edRaw, abeRaw]
                    });
                    expect(store.first().id).toBe('ed@sencha.com');
                    expect(store.last().id).toBe('abe@sencha.com');
                });

                it("should not fire any events", function() {
                    var spy = jasmine.createSpy();
                    createStore({
                        listeners: {
                            clear: spy,
                            add: spy,
                            load: spy,
                            datachanged: spy,
                            refresh: spy
                        },
                        data: [edRaw, abeRaw, tommyRaw]
                    });
                    expect(spy).not.toHaveBeenCalled();
                });
            });

            describe("with a proxy", function() {
                describe("with a memory proxy", function() {
                    it("should load the data and call proxy.read", function() {
                        var proxy = new Ext.data.proxy.Memory();
                        spyOn(proxy, 'read').andCallThrough();
                        createStore({
                            proxy: proxy,
                            data: [abeRaw, tommyRaw]
                        });
                        expect(store.first().id).toBe('abe@sencha.com');
                        expect(store.last().id).toBe('tommy@sencha.com');
                        expect(proxy.read.callCount).toBe(1);
                    });

                    it("should not fire any events", function() {
                        var spy = jasmine.createSpy();
                        var proxy = new Ext.data.proxy.Memory();
                        createStore({
                            proxy: proxy,
                            data: [abeRaw, tommyRaw],
                            listeners: {
                                clear: spy,
                                add: spy,
                                load: spy,
                                datachanged: spy,
                                refresh: spy
                            }
                        });
                        expect(spy).not.toHaveBeenCalled();
                    });
                });

                describe("with a server proxy", function() {
                    it("should load the data and not call proxy.read", function() {
                        var proxy = new Ext.data.proxy.Ajax();
                        spyOn(proxy, 'read').andCallThrough();
                        createStore({
                            proxy: proxy,
                            data: [aaronRaw, edRaw]
                        });
                        expect(store.first().id).toBe('aaron@sencha.com');
                        expect(store.last().id).toBe('ed@sencha.com');
                        expect(proxy.read).not.toHaveBeenCalled();
                    });

                    it("should not fire any events", function() {
                        var spy = jasmine.createSpy();
                        var proxy = new Ext.data.proxy.Ajax();
                        createStore({
                            proxy: proxy,
                            data: [aaronRaw, edRaw],
                            listeners: {
                                clear: spy,
                                add: spy,
                                load: spy,
                                datachanged: spy,
                                refresh: spy
                            }
                        });
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });
        });

        describe('buffered stores', function () {
            it('should create a BufferedStore if given buffered:true', function () {
                createStore({
                    buffered: true
                });

                expect(store.isBufferedStore).toBe(true);
                expect(store instanceof Ext.data.BufferedStore).toBe(true);
            });

            it('should create a BufferedStore if given type:buffered', function () {
                // Silence console warning about store created with no model
                spyOn(Ext.log, 'warn');
                
                store = Ext.Factory.store({
                    type: 'buffered'
                });

                expect(store.isBufferedStore).toBe(true);
                expect(store instanceof Ext.data.BufferedStore).toBe(true);
            });
        });
    });
    
    describe("getting records", function() {
        beforeEach(function() {
            createStore();
            addStoreData();
        });
        
        describe("first", function() {
            it("should return the first record", function() {
                expect(store.first()).toBe(edRec);
            });

            it("should return the record if there is only 1", function() {
                store.remove([edRec, abeRec, tommyRec]);
                expect(store.first()).toBe(aaronRec);
            });
            
            it("should return null with an empty store", function() {
                store.removeAll();
                expect(store.first()).toBeNull();
            });

            it("should be affected by filters", function() {
                store.getFilters().add({
                    property: 'group',
                    value: 'admin'
                });
                expect(store.first()).toBe(abeRec);
            });
        });
        
        describe("last", function() {
            it("should return the last record", function() {
                expect(store.last()).toBe(tommyRec);
            });

            it("should return the record if there is only 1", function() {
                store.remove([edRec, abeRec, tommyRec]);
                expect(store.last()).toBe(aaronRec);
            });
            
            it("should return null with an empty store", function() {
                createStore();
                expect(store.last()).toBeNull();
            });

            it("should be affected by filters", function() {
                store.getFilters().add({
                    property: 'group',
                    value: 'admin'
                });
                expect(store.last()).toBe(aaronRec);
            });
        });
        
        describe("getAt", function() {
            it("should return the record at the specified index", function() {
                expect(store.getAt(1)).toBe(abeRec);
            });
            
            it("should return null when the index is outside the store bounds", function() {
                expect(store.getAt(100)).toBe(null);
            });
            
            it("should return null when the store is empty", function() {
                createStore();
                expect(store.getAt(0)).toBe(null);
            });
        });
        
        describe("getById", function() {
            it("should return the record with the matching id", function() {
                expect(store.getById('tommy@sencha.com')).toBe(tommyRec);
            });
            
            it("should return null if a matching id is not found", function() {
                expect(store.getById('foo@sencha.com')).toBe(null);
            });
            
            it("should return null when the store is empty", function() {
                createStore();
                expect(store.getById('ed@sencha.com')).toBe(null);
            });
            
            it("should ignore filters", function() {
                store.filter('email', 'ed@sencha.com');
                expect(store.getById('aaron@sencha.com')).toBe(aaronRec);
            });
        });
        
        describe("getByInternalId", function() {
            it("should return the record with the matching id", function() {
                expect(store.getByInternalId(tommyRec.internalId)).toBe(tommyRec);
            });
            
            it("should return null if a matching id is not found", function() {
                expect(store.getByInternalId('foo@sencha.com')).toBe(null);
            });
            
            it("should return null when the store is empty", function() {
                createStore();
                expect(store.getByInternalId('ed@sencha.com')).toBe(null);
            });
            
            it("should ignore filters", function() {
                store.filter('email', 'ed@sencha.com');
                expect(store.getByInternalId(aaronRec.internalId)).toBe(aaronRec);
            });
        });
        
        describe("getRange", function() {
            it("should default to the full store range", function() {
                expect(store.getRange()).toEqual([edRec, abeRec, aaronRec, tommyRec]);
            });
            
            it("should return from the start index", function() {
                expect(store.getRange(2)).toEqual([aaronRec, tommyRec]);
            });
            
            it("should use the end index, and include it", function() {
                expect(store.getRange(0, 2)).toEqual([edRec, abeRec, aaronRec]);
            });
            
            it("should ignore an end index greater than the store range", function() {
                expect(store.getRange(1, 100)).toEqual([abeRec, aaronRec, tommyRec]);
            });
        });

        describe("query", function() {
            var coders,
                slackers;

            it("should return records with group: 'coder'", function() {
                coders = store.query('group', 'code');
                expect(coders.length).toBe(2);
                expect(coders.contains(edRec)).toBe(true);
                expect(coders.contains(tommyRec)).toBe(true);
                expect(coders.contains(aaronRec)).toBe(false);
                expect(coders.contains(abeRec)).toBe(false);
            });
            
            it("should return null if a matching id is not found", function() {
                slackers = store.query('group', 'slackers');
                expect(slackers.length).toBe(0);
            });
            
            it("should return null when the store is empty", function() {
                createStore();
                coders = store.query('group', 'code');
                expect(coders.length).toBe(0);
            });
            
            it("should ignore filters", function() {
                store.filter('email', 'ed@sencha.com');
                expect(store.getCount()).toBe(1);
                coders = store.query('group', 'code');
                expect(coders.length).toBe(2);
                expect(coders.contains(edRec)).toBe(true);
                expect(coders.contains(tommyRec)).toBe(true);
                expect(coders.contains(aaronRec)).toBe(false);
                expect(coders.contains(abeRec)).toBe(false);
            });
        });        
    });
    
    describe("finding", function() {
        beforeEach(function() {
            createStore();
            addStoreData();
        });
        
        describe("find", function() {
            // Only minimal tests here, since it just calls through to the collection
            it("should find by the field", function() {
                expect(store.find('email', 'tommy@sencha.com')).toBe(3);
            });
            
            it("should find the first matching index", function() {
                expect(store.find('group', 'admin')).toBe(1);
            });

            it("should return -1 if value is empty", function() {
                expect(store.find('id', null)).toBe(-1);
                expect(store.find('id', '')).toBe(-1);
                expect(store.find('id', undefined)).toBe(-1);
                expect(store.find('id', [])).toBe(-1);
                expect(store.find('id', 'foo')).toBe(-1);
            });

            it("should match the start of strings as a default", function() {
                 expect(store.find('email', 'to')).toBe(3);
            });
        });
        
        // Only minimal tests here, since it just calls through to the collection
        describe("findRecord", function() {
            it("should return the record instance", function() {
                expect(store.findRecord('name', 'Ed Spencer')).toBe(edRec);
            });
            
            it("should find the first matching record", function() {
                expect(store.findRecord('group', 'code')).toBe(edRec);
            });

            it("should return null when not found", function() {
                expect(store.findRecord('name', 'Derp')).toBeNull();
            });
        });

        // Only minimal tests here, since it just calls through to the collection
        describe("finding exact", function() {
            it("should find the first exact matching record", function() {
                expect(store.findExact('name', 'Aaron Conran')).toBe(2);
            });
            
            it("should return -1 if there is no match", function() {
                expect(store.findExact('name', 'Bed Spencer')).toBe(-1);
            });

            it("should honor the start index", function() {
                expect(store.findExact('group', 'admin', 1)).toBe(1);
            });
            
            it("should not do any type coercion", function() {
                expect(store.findExact('evilness', '70')).toBe(-1);
            });
        });

        // Only minimal tests here, since it just calls through to the collection
        describe("findBy", function() {
            it("should find by the matching FN", function() {
                var index = store.findBy(function(rec) {
                    return rec.get('email') === 'abe@sencha.com';
                });
                expect(index).toBe(1);
            });
        });
        
        // Only minimal tests here, since it just calls through to the collection
        describe("collect", function() {
            it("should collect values in order", function() {
                expect(store.collect('age')).toEqual([25, 20, 26, 70]);
            });
            
            it("should ignore filtered out values", function() {
                store.filter('group', 'code');
                expect(store.collect('age')).toEqual([25, 70]);
            });
            
            it("should bypass the filter if we pass the bypass param", function() {
                store.filter('group', 'code');
                expect(store.collect('age', true, true)).toEqual([25, 20, 26, 70]);
            });
        });
    });
    
    describe("iterating", function() {
        var spy;
        beforeEach(function() {
            createStore();
            addStoreData();
            spy = jasmine.createSpy();
        });
        
        describe("each", function() {
            it("should iterate over each record", function() {
                store.each(spy);
                expect(spy.callCount).toBe(4);
            });
            
            it("should pass the record, index & total length", function() {
                store.each(spy);
                
                var args = spy.calls[0].args;
                expect(args[0]).toBe(edRec);
                expect(args[1]).toBe(0);
                expect(args[2]).toBe(4);
                
                args = spy.calls[1].args;
                expect(args[0]).toBe(abeRec);
                expect(args[1]).toBe(1);
                expect(args[2]).toBe(4);
                
                args = spy.calls[2].args;
                expect(args[0]).toBe(aaronRec);
                expect(args[1]).toBe(2);
                expect(args[2]).toBe(4);
                
                args = spy.calls[3].args;
                expect(args[0]).toBe(tommyRec);
                expect(args[1]).toBe(3);
                expect(args[2]).toBe(4);
            });
            
            it("should stop iterating if false is returned", function() {
                var count = 0;
                store.each(function(rec, idx) {
                    if (idx > 1) {
                        return false;
                    }
                    ++count;
                });
                expect(count).toBe(2);
            });
            
            it("should default the scope to the record", function() {
                store.each(spy);
                expect(spy.mostRecentCall.object).toBe(store.last());
            });
            
            it("should use the passed scope", function() {
                store.each(spy, fakeScope);
                expect(spy.mostRecentCall.object).toBe(fakeScope);
            });
        });
    });
    
    describe("index", function() {
        
        beforeEach(function() {
            createStore();
            addStoreData();
        });
        
        describe("indexOf", function() {
            it("should return the index of a record that exists in the store", function() {
                expect(store.indexOf(abeRec)).toBe(1);
            }); 
           
            it("should return -1 when the record does not exist in the store", function() {
                expect(store.indexOf(makeUser('foo@sencha.com'))).toBe(-1);
            });
           
            it("should return -1 when the store is empty", function() {
                store.removeAll();
                expect(store.indexOf(edRec)).toBe(-1);
            });
            
            it("should return -1 when the passed record is null", function() {
                expect(store.indexOf(null)).toBe(-1);
            });
        });
       
        describe("indexOfId", function() {
            it("should return the record with matching index", function() {
                expect(store.indexOfId('aaron@sencha.com')).toBe(2);
            });
            
            it("should return -1 when the id does not exist in the store", function() {
                expect(store.indexOfId('foo@sencha.com')).toBe(-1);
            });
            
            it("should return -1 when the store is empty", function() {
                store.removeAll();
                expect(store.indexOfId('ed@sencha.com')).toBe(-1);
            });
        });
    });
    
    describe("counting", function() {
        describe("getCount", function() {
            beforeEach(function() {
                createStore();
            });
            
            it("should return 0 when the store is empty", function() {
                expect(store.getCount()).toBe(0);
            });
            
            it("should return the number of records currently in the store", function() {
                addStoreData();
                expect(store.getCount()).toBe(4);
            });
        });
        
        describe("getTotalCount", function() {
            it("should default to 0", function() {
                createStore();
                expect(store.getTotalCount()).toBe(0);
            });
            
            it("should set a value returned from a proxy read", function() {
                createStore({
                    proxy: {
                        type: 'memory',
                        data: {
                            total: 1234
                        },
                        reader: 'json'
                    }
                });
                store.load();
                expect(store.getTotalCount()).toBe(1234);
            });
        });
    });
    
    describe("adding records", function() {
        describe("add", function() {
            beforeEach(function() {
                createStore();
            });
            
            describe("position", function() { 
                it("should add to the end of the store", function() {
                    addStoreData();
                    var rec = makeUser('foo@sencha.com');
                    store.add(rec);
                    expect(store.getAt(4)).toBe(rec);
                });
            });
            
            describe("arg values", function() {
                it("should add a model instance", function() {
                    var rec = makeUser('foo@sencha.com');
                    store.add(rec);
                    expect(store.first()).toBe(rec);
                });
            
                it("should create a model from an object config", function() {
                    store.add({
                        email: 'foo@sencha.com',
                        name: 'Foo'
                    });
                    var rec = store.first();
                    expect(rec.isModel).toBe(true);
                    expect(rec.get('name')).toBe('Foo');
                });
            });
            
            describe("adding multiple", function() {
                it("should add an array of records", function() {
                    store.add([{
                        email: 'personA@sencha.com',
                        name: 'Person A'
                    }, {
                        email: 'personB@sencha.com',
                        name: 'Person B'
                    }]);
                    expect(store.first().get('name')).toBe('Person A');
                    expect(store.last().get('name')).toBe('Person B');
                });

                it("should add multiple arguments", function() {
                    store.add({
                        email: 'personA@sencha.com',
                        name: 'Person A'
                    }, {
                        email: 'personB@sencha.com',
                        name: 'Person B'
                    });
                    expect(store.first().get('name')).toBe('Person A');
                    expect(store.last().get('name')).toBe('Person B');
                });
            });
            
            describe("return value", function() {
                it("should return an array when adding a single item", function() {
                    var rec = makeUser('foo@sencha.com');
                    expect(store.add(rec)).toEqual([rec]);
                });
                
                it("should return an array when adding an array, should not mutate the array", function() {
                    var rec = makeUser('foo@sencha.com'), 
                        arr = [rec], 
                        result = store.add(arr);
                    
                    expect(result).toEqual([rec]);
                    expect(result).not.toBe(arr);
                });
                
                it("should return an array when adding multiple args", function() {
                    var rec1 = makeUser('user1@sencha.com'),
                        rec2 = makeUser('user2@sencha.com');
                        
                    expect(store.add(rec1, rec2)).toEqual([rec1, rec2]);
                });
                
                it("should return an empty array if nothing was passed", function() {
                    expect(store.add()).toEqual([]);
                });
                
                it("should return an empty array if an empty array was passed", function() {
                    expect(store.add([])).toEqual([]);
                });
            });
            
            describe("events", function() {
                var spy, rec1, rec2;
                
                beforeEach(function() {
                    addStoreData();
                    spy = jasmine.createSpy();
                    rec1 = makeUser('user1@sencha.com');
                    rec2 = makeUser('user2@sencha.com');
                });
                
                describe("a single item", function() {
                    it("should fire the add event, passing the store, the records & the added index", function() {
                        store.on('add', spy);
                        store.add(rec1);
                        var args = spy.mostRecentCall.args;
                        expect(spy.callCount).toBe(1);
                        expect(args[0]).toBe(store);
                        expect(args[1]).toEqual([rec1]);
                        expect(args[2]).toBe(4);
                    });
                
                
                    it("should fire the datachanged event", function() {
                        store.on('datachanged', spy);
                        store.add(rec1, rec2);
                        var args = spy.mostRecentCall.args;
                        expect(spy.callCount).toBe(1);
                        expect(args[0]).toBe(store);
                    });
                });
                
                describe("multiple items", function() {
                    describe("contiguous range", function() {
                        it("should fire the add event, passing the store, the records & the added index", function() {
                            store.on('add', spy);
                            store.add(rec1, rec2);
                            var args = spy.mostRecentCall.args;
                            expect(spy.callCount).toBe(1);
                            expect(args[0]).toBe(store);
                            expect(args[1]).toEqual([rec1, rec2]);
                            expect(args[2]).toBe(4);
                        });


                        it("should fire the datachanged event", function() {
                            store.on('datachanged', spy);
                            store.add(rec1, rec2);
                            var args = spy.mostRecentCall.args;
                            expect(spy.callCount).toBe(1);
                            expect(args[0]).toBe(store);
                        });
                    });
                    
                    // This is only possible if the store is sorted, since adding multiple items may
                    // require them to be split into different "add" groups
                    describe("discontiguous range", function() {
                        var recs;
                        beforeEach(function() {
                            store.removeAll();
                            store.sort('email');
                            store.add(
                                makeUser('e@sencha.com'),
                                makeUser('j@sencha.com'),
                                makeUser('o@sencha.com'),
                                makeUser('t@sencha.com')
                            );
                        
                            recs = [
                                makeUser('a@sencha.com'),
                                makeUser('b@sencha.com'),
                                makeUser('f@sencha.com'),
                                makeUser('g@sencha.com'),
                                makeUser('h@sencha.com'),
                                makeUser('l@sencha.com'),
                                makeUser('p@sencha.com'),
                                makeUser('q@sencha.com'),
                                makeUser('r@sencha.com'),
                                makeUser('s@sencha.com')
                            ];
                        });
                        
                        it("should fire the add event, passing the store, the records & the added index for each chunk", function() {
                            store.on('add', spy);
                            store.add(
                                recs[6],
                                recs[1],
                                recs[9],
                                recs[4],
                                recs[3],
                                recs[7],
                                recs[5],
                                recs[2],
                                recs[8],
                                recs[0]
                            );
                        
                            expect(spy.callCount).toBe(4);
                            
                            var args = spy.calls[0].args;
                            expect(args[0]).toBe(store);
                            expect(args[1]).toEqual([recs[0], recs[1]]);
                            expect(args[2]).toBe(0);
                            
                            args = spy.calls[1].args;
                            expect(args[0]).toBe(store);
                            expect(args[1]).toEqual([recs[2], recs[3], recs[4]]);
                            expect(args[2]).toBe(3);
                            
                            args = spy.calls[2].args;
                            expect(args[0]).toBe(store);
                            expect(args[1]).toEqual([recs[5]]);
                            expect(args[2]).toBe(7);
                            
                            args = spy.calls[3].args;
                            expect(args[0]).toBe(store);
                            expect(args[1]).toEqual([recs[6], recs[7], recs[8], recs[9]]);
                            expect(args[2]).toBe(9);
                        });


                        it("should fire the datachanged event", function() {
                            store.on('datachanged', spy);
                            store.add(
                                recs[6],
                                recs[1],
                                recs[9],
                                recs[4],
                                recs[3],
                                recs[7],
                                recs[5],
                                recs[2],
                                recs[8],
                                recs[0]
                            );
                            var args = spy.mostRecentCall.args;
                            expect(spy.callCount).toBe(1);
                            expect(args[0]).toBe(store);
                        });
                    });
                    
                });
                
                describe("invalid cases", function() {
                    it("should not call the event when the record is null", function() {
                        store.on({
                            add: spy,
                            datachanged: spy
                        });
                        store.add(null);
                        expect(spy).not.toHaveBeenCalled();
                    });
                    
                    it("should not call the event when the array is empty", function() {
                        store.on({
                            add: spy,
                            datachanged: spy
                        });
                        store.add([]);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });
        });
        
        describe("insert", function() {
            beforeEach(function() {
                createStore();
            });
            
            describe("position", function() { 
                it("should add at the specified position", function() {
                    addStoreData();
                    var rec = makeUser('foo@sencha.com');
                    store.insert(2, rec);
                    expect(store.getAt(2)).toBe(rec);
                });
                
                it("should add to the end if the index is larger than the bounds", function() {
                    var rec = makeUser('foo@sencha.com');
                    store.insert(100, rec);
                    expect(store.first()).toBe(rec);
                });
            });
            
            describe("arg values", function() {
                it("should add a model instance", function() {
                    var rec = makeUser('foo@sencha.com');
                    store.insert(0, rec);
                    expect(store.first()).toBe(rec);
                });
            
                it("should create a model from an object config", function() {
                    store.insert(0, {
                        email: 'foo@sencha.com',
                        name: 'Foo'
                    });
                    var rec = store.first();
                    expect(rec.isModel).toBe(true);
                    expect(rec.get('name')).toBe('Foo');
                });
            });
            
            describe("adding multiple", function() {
                it("should add an array of records", function() {
                    store.insert(0, [{
                        email: 'personA@sencha.com',
                        name: 'Person A'
                    }, {
                        email: 'personB@sencha.com',
                        name: 'Person B'
                    }]);
                    expect(store.first().get('name')).toBe('Person A');
                    expect(store.last().get('name')).toBe('Person B');
                });
            });
            
            describe("return value", function() {
                it("should return an array when adding a single item", function() {
                    var rec = makeUser('foo@sencha.com');
                    expect(store.insert(0, rec)).toEqual([rec]);
                });
                
                it("should return an array when adding an array, should not mutate the array", function() {
                    var rec = makeUser('foo@sencha.com'), 
                        arr = [rec], 
                        result = store.insert(0, arr);
                    
                    expect(result).toEqual([rec]);
                    expect(result).not.toBe(arr);
                });
                
                it("should return an empty array if nothing was passed", function() {
                    expect(store.insert(0)).toEqual([]);
                });
                
                it("should return an empty array if an empty array was passed", function() {
                    expect(store.insert(0, [])).toEqual([]);
                });
            });

            describe("when filtered", function() {
                beforeEach(function() {
                    addStoreData();
                });

                it("should insert at the correct position", function() {
                    store.filter('group', 'code');
                    var rec = store.insert(0, {
                        email: 'foo@sencha.com',
                        group: 'code'
                    })[0];
                    expect(store.getAt(0)).toBe(rec);
                });

                it("should retain the relative position when filters are cleared", function() {
                    store.filter('group', 'code');
                    var rec = store.insert(1, {
                        email: 'foo@sencha.com',
                        group: 'code'
                    })[0];
                    store.getFilters().removeAll();
                    expect(store.indexOf(rec)).toBe(3);
                });

                it("should have the correct position when inserted but filtered out", function() {
                    store.filter('group', 'code');
                    var rec = store.insert(0, {
                        email: 'foo@sencha.com',
                        group: 'admin'
                    })[0];
                    store.getFilters().removeAll();
                    expect(store.indexOf(rec)).toBe(0);
                });
            });
            
            describe("events", function() {
                var spy, rec1, rec2;
                
                beforeEach(function() {
                    addStoreData();
                    spy = jasmine.createSpy();
                    rec1 = makeUser('user1@sencha.com');
                    rec2 = makeUser('user2@sencha.com');
                });
                
                it("should fire the add event, passing the store, the records & the added index", function() {
                    store.on('add', spy);
                    store.insert(0, [rec1, rec2]);
                    var args = spy.mostRecentCall.args;
                    expect(spy.callCount).toBe(1);
                    expect(args[0]).toBe(store);
                    expect(args[1]).toEqual([rec1, rec2]);
                    expect(args[2]).toBe(0);
                });
                
                it("should correct the added index when it exceeds the bounds of the store", function() {
                    store.on('add', spy);
                    store.insert(50, [rec1, rec2]);
                    var args = spy.mostRecentCall.args;
                    expect(args[2]).toBe(4);
                });
                
                it("should fire the datachanged event", function() {
                    store.on('datachanged', spy);
                    store.insert(0, [rec1, rec2]);
                    var args = spy.mostRecentCall.args;
                    expect(spy.callCount).toBe(1);
                    expect(args[0]).toBe(store);
                });
                
                describe("invalid cases", function() {
                    it("should not call the event when the record is null", function() {
                        store.on({
                            add: spy,
                            datachanged: spy
                        });
                        store.insert(0, null);
                        expect(spy).not.toHaveBeenCalled();
                    });
                    
                    it("should not call the event when the array is empty", function() {
                        store.on({
                            add: spy,
                            datachanged: spy
                        });
                        store.insert(0, []);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });
        });

        describe("moving records", function() {
            var spy, removeMap, addMap;

            beforeEach(function() {
                createStore();
                addStoreData();
                spy = jasmine.createSpy();
            });

            afterEach(function() {
                removeMap = addMap = spy = null;
            });

            function mapify(map, records) {
                Ext.Array.forEach(records, function(record) {
                    if (store.isMoving(record)) {
                        map[record.id] = true;
                    }
                });
            }

            function setupAddRemove() {
                removeMap = {};
                addMap = {};

                store.on('remove', function(store, records) {
                    mapify(removeMap, records);
                });
                store.on('add', function(store, records) {
                    mapify(addMap, records);
                });
            }

            describe("via add", function() {
                describe("a single record", function() {
                    it("should move the record to the end of the collection", function() {
                        store.add(edRec);
                        expect(store.indexOf(edRec)).toBe(3);
                    });

                    it("should be moving during the add & remove event", function() {
                        setupAddRemove();

                        store.add(edRec);
                        var expected = {
                            'ed@sencha.com': true
                        };
                        expect(removeMap).toEqual(expected);
                        expect(addMap).toEqual(expected);

                        expect(store.isMoving([edRec])).toBe(0);
                        expect(store.isMoving()).toBe(0);
                    });
                });

                describe("multiple records", function() {
                    describe("existing records only", function() {
                        describe("in a contiguous range", function() {
                            it("should move the records to the end of the collection", function() {
                                store.add([edRec, abeRec]);
                                expect(store.indexOf(edRec)).toBe(2);
                                expect(store.indexOf(abeRec)).toBe(3);
                            });

                            it("should be moving during the add & remove event", function() {
                                setupAddRemove();

                                store.add([edRec, abeRec]);
                                var expected = {
                                    'ed@sencha.com': true,
                                    'abe@sencha.com': true
                                };

                                expect(removeMap).toEqual(expected);
                                expect(addMap).toEqual(expected);

                                expect(store.isMoving([edRec, abeRec])).toBe(0);
                                expect(store.isMoving()).toBe(0);
                            });
                        });

                        describe("in a discontiguous range", function() {
                            var fooRec, barRec, bazRec;

                            beforeEach(function() {
                                fooRec = makeUser('foo@sencha.com');
                                barRec = makeUser('bar@sencha.com');
                                bazRec = makeUser('baz@sencha.com');
                                store.add([fooRec, barRec, bazRec]);
                            });

                            afterEach(function() {
                                fooRec = barRec = bazRec = null;
                            });

                            it("should move the records to the end of the collection", function() {
                                store.add([abeRec, tommyRec, barRec]);
                                expect(store.indexOf(abeRec)).toBe(4);
                                expect(store.indexOf(tommyRec)).toBe(5);
                                expect(store.indexOf(barRec)).toBe(6);
                            });

                            it("should be moving during the add & remove event", function() {
                                setupAddRemove();

                                store.add([abeRec, tommyRec, barRec]);
                                var expected = {
                                    'abe@sencha.com': true,
                                    'tommy@sencha.com': true,
                                    'bar@sencha.com': true
                                };

                                expect(removeMap).toEqual(expected);
                                expect(addMap).toEqual(expected);

                                expect(store.isMoving([abeRec, tommyRec, barRec])).toBe(0);
                                expect(store.isMoving()).toBe(0);
                            });
                        });
                    });

                    describe("mixture of new/existing records", function() {
                        var fooRec, barRec, bazRec;

                        beforeEach(function() {
                            fooRec = makeUser('foo@sencha.com');
                            barRec = makeUser('bar@sencha.com');
                            bazRec = makeUser('baz@sencha.com');
                        });

                        afterEach(function() {
                            fooRec = barRec = bazRec = null;
                        });

                        it("should add the records to the end", function() {
                            store.add([fooRec, edRec]);
                            expect(store.indexOf(fooRec)).toBe(3);
                            expect(store.indexOf(edRec)).toBe(4);
                        });

                        it("should only mark existing records as moving", function() {
                            setupAddRemove();

                            store.add([fooRec, edRec]);
                            var expected = {
                                'ed@sencha.com': true
                            };
                            expect(removeMap).toEqual(expected);
                            expect(addMap).toEqual(expected);

                            expect(store.isMoving([fooRec, edRec])).toBe(0);
                            expect(store.isMoving()).toBe(0);
                        });
                    });
                });
            });

            describe("via insert", function() {
                describe("a single record", function() {
                    it("should move the record to the specified position", function() {
                        store.insert(0, tommyRec);
                        expect(store.indexOf(tommyRec)).toBe(0);
                    });

                    it("should be moving during the add & remove event", function() {
                        setupAddRemove();

                        store.insert(0, tommyRec);
                        var expected = {
                            'tommy@sencha.com': true
                        };
                        expect(removeMap).toEqual(expected);
                        expect(addMap).toEqual(expected);

                        expect(store.isMoving(tommyRec)).toBe(0);
                        expect(store.isMoving()).toBe(0);
                    });
                });

                describe("multiple records", function() {
                    describe("existing records only", function() {
                        describe("in a contiguous range", function() {
                            it("should move the records to the specified position", function() {
                                store.insert(0, [aaronRec, tommyRec]);
                                expect(store.indexOf(aaronRec)).toBe(0);
                                expect(store.indexOf(tommyRec)).toBe(1);
                            });

                            it("should be moving during the add & remove event", function() {
                                setupAddRemove();

                                store.insert(0, [aaronRec, tommyRec]);
                                var expected = {
                                    'aaron@sencha.com': true,
                                    'tommy@sencha.com': true
                                };

                                expect(removeMap).toEqual(expected);
                                expect(addMap).toEqual(expected);

                                expect(store.isMoving([aaronRec, tommyRec])).toBe(0);
                                expect(store.isMoving()).toBe(0);
                            });
                        });

                        describe("in a discontiguous range", function() {
                            var fooRec, barRec, bazRec;

                            beforeEach(function() {
                                fooRec = makeUser('foo@sencha.com');
                                barRec = makeUser('bar@sencha.com');
                                bazRec = makeUser('baz@sencha.com');
                                store.add([fooRec, barRec, bazRec]);
                            });

                            afterEach(function() {
                                fooRec = barRec = bazRec = null;
                            });

                            it("should move the records to the specified position", function() {
                                store.insert(0, [abeRec, tommyRec, barRec]);
                                expect(store.indexOf(abeRec)).toBe(0);
                                expect(store.indexOf(tommyRec)).toBe(1);
                                expect(store.indexOf(barRec)).toBe(2);
                            });

                            it("should be moving during the add & remove event", function() {
                                setupAddRemove();

                                store.insert(0, [abeRec, tommyRec, barRec]);
                                var expected = {
                                    'abe@sencha.com': true,
                                    'tommy@sencha.com': true,
                                    'bar@sencha.com': true
                                };

                                expect(removeMap).toEqual(expected);
                                expect(addMap).toEqual(expected);

                                expect(store.isMoving([abeRec, tommyRec, barRec])).toBe(0);
                                expect(store.isMoving()).toBe(0);
                            });
                        });
                    });

                    describe("mixture of new/existing records", function() {
                        var fooRec, barRec, bazRec;

                        beforeEach(function() {
                            fooRec = makeUser('foo@sencha.com');
                            barRec = makeUser('bar@sencha.com');
                            bazRec = makeUser('baz@sencha.com');
                        });

                        afterEach(function() {
                            fooRec = barRec = bazRec = null;
                        });

                        it("should move the records to the specified position", function() {
                            store.insert(2, [fooRec, edRec]);
                            expect(store.indexOf(fooRec)).toBe(1);
                            expect(store.indexOf(edRec)).toBe(2);
                        });

                        it("should only mark existing records as moving", function() {
                            setupAddRemove();

                            store.insert(2, [fooRec, edRec]);
                            var expected = {
                                'ed@sencha.com': true
                            };
                            expect(removeMap).toEqual(expected);
                            expect(addMap).toEqual(expected);

                            expect(store.isMoving([fooRec, edRec])).toBe(0);
                            expect(store.isMoving()).toBe(0);
                        });
                    });
                });
            });

            describe("via edits that cause position changes", function() {
                beforeEach(function() {
                    store.getSorters().add({
                        property: 'name',
                        direction: 'ASC'
                    })
                });

                it("should move the record to the correct position", function() {
                    tommyRec.set('name', 'cccc');
                    expect(store.indexOf(tommyRec)).toBe(2);
                });

                it("should be moving during the add & remove event", function() {
                    setupAddRemove();
                    tommyRec.set('name', 'cccc');

                    var expected = {
                        'tommy@sencha.com': true
                    };
                    expect(removeMap).toEqual(expected);
                    expect(addMap).toEqual(expected);

                    expect(store.isMoving(tommyRec)).toBe(0);
                    expect(store.isMoving()).toBe(0);
                });
            });

            describe("isMoving", function() {
                describe("no records", function() {
                    it("should return 0 when no records are moving", function() {
                        expect(store.isMoving()).toBe(0);
                    });

                    it("should return 1 when a single record is moving", function() {
                        var moving;
                        store.on('add', function() {
                            moving = store.isMoving();
                        });
                        store.add(edRec);
                        expect(moving).toBe(1);
                    });

                    it("should return the amount of moving records", function() {
                        var moving;
                        store.on('add', function() {
                            moving = store.isMoving();
                        });
                        store.add([edRec, abeRec]);
                        expect(moving).toBe(2);
                    });
                });

                describe("single record", function() {
                    it("should return 0 when the record is not moving", function() {
                        expect(store.isMoving(edRec)).toBe(0);
                    });

                    it("should return 1 when the record is moving", function() {
                        var moving;
                        store.on('add', function() {
                            moving = store.isMoving(edRec);
                        });
                        store.add(edRec);
                        expect(moving).toBe(1);
                    });
                });

                describe("multiple records", function() {
                    it("should return 0 for an empty array", function() {
                        expect(store.isMoving([])).toBe(0);
                    });

                    it("should return the number of moving records", function() {
                        var moving;
                        store.on('add', function() {
                            moving = store.isMoving([edRec, abeRec, aaronRec, tommyRec]);
                        });
                        store.add([edRec, abeRec]);
                        expect(moving).toBe(2);
                    });
                });
            });
        });
    });
    
    describe("removing", function() {
        beforeEach(function() {
            createStore();
            addStoreData();
        });
        
        describe("remove", function() {
            describe("single record", function() {
                it("should remove a single record", function() {
                    store.remove(abeRec);
                    expect(store.getCount()).toBe(3);
                    expect(store.indexOf(abeRec)).toBe(-1);
                });
                
                it("should return an array", function() {
                    expect(store.remove(aaronRec)).toEqual([aaronRec]);
                });
                
                it("should return an empty array if the item is not in the store", function() {
                    var rec = makeUser('foo@sencha.com');
                    expect(store.remove(rec)).toEqual([]);
                });
            });
            
            describe("array of records", function() {
                it("should remove an array", function() {
                    store.remove([abeRec, tommyRec]);
                    expect(store.getCount()).toBe(2);
                    expect(store.indexOf(abeRec)).toBe(-1);
                    expect(store.indexOf(tommyRec)).toBe(-1);
                });
                
                it("should return an array, not mutated", function() {
                    var records = [edRec, aaronRec],
                        result = store.remove(records);
                        
                    expect(result).toEqual([edRec, aaronRec]);
                    expect(result).not.toBe(records);
                });
                
                it("should return an empty array if the array is empty", function() {
                    expect(store.remove([])).toEqual([]);
                });
                
                it("should only return records that could be removed", function() {
                    var rec = makeUser('foo@sencha.com');
                    expect(store.remove([edRec, rec, tommyRec])).toEqual([edRec, tommyRec]);
                });
            });
            
            it("should shift other items into the correct position", function() {
                store.remove([edRec, tommyRec]);
                expect(store.indexOf(abeRec)).toBe(0);
                expect(store.indexOf(aaronRec)).toBe(1);
            });
            
            describe("events", function() {
                var spy;
                beforeEach(function() {
                    spy = jasmine.createSpy();
                });
                
                describe("a single record", function() {
                    it("should fire the remove event, passing the store, array of records & index", function() {
                        store.on('remove', spy);
                        store.remove(aaronRec);
                        expect(spy.callCount).toBe(1);
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(store);
                        expect(args[1]).toEqual([aaronRec]);
                        expect(args[2]).toBe(2);
                    });
                    
                    it("should fire the datachanged event", function() {
                        store.on('datachanged', spy);
                        store.remove(edRec);
                        expect(spy.callCount).toBe(1);
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(store);
                    });
                    
                    describe("invalid cases", function() {
                        it("should not fire an event if the record is null", function() {
                            store.on('remove', spy);
                            store.remove(null);
                            expect(spy).not.toHaveBeenCalled();
                        });
                    
                        it("should not fire an event if the record is not in the store", function() {
                            store.on('remove', spy);
                            store.remove(makeUser('foo@sencha.com'));
                            expect(spy).not.toHaveBeenCalled();
                        });
                    });
                });
                
                describe("multiple records", function() {
                    describe("contiguous range", function() {
                        it("should fire the remove event, passing the store, array of records & index", function() {
                            store.on('remove', spy);
                            store.remove([abeRec, aaronRec]);
                            expect(spy.callCount).toBe(1);
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(store);
                            expect(args[1]).toEqual([abeRec, aaronRec]);
                            expect(args[2]).toBe(1);
                        });
                        
                        it("should fire the datachanged event", function() {
                            store.on('datachanged', spy);
                            store.remove([abeRec, aaronRec]);
                            expect(spy.callCount).toBe(1);
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(store);
                        });
                    });
                    
                    describe("discontiguous range", function() {
                        var all;
                        
                        beforeEach(function() {
                            store.removeAll();
                            all = [];
                            
                            for (var i = 0; i < 10; ++i) {
                                all.push(makeUser('user' + i + '@sencha.com'));
                            }
                            store.add(all);
                        });
                        
                        it("should fire a remove event for each contiguous chunk, with highest indexes first", function() {
                            store.on('remove', spy);
                            store.remove([all[1], all[4], all[2], all[6], all[7], all[0]]);
                            
                            expect(spy.callCount).toBe(3);
                            
                            var args = spy.calls[0].args;
                            expect(args[0]).toBe(store);
                            expect(args[1]).toEqual([all[6], all[7]]);
                            expect(args[2]).toBe(6);
                            
                            args = spy.calls[1].args;
                            expect(args[0]).toBe(store);
                            expect(args[1]).toEqual([all[4]]);
                            expect(args[2]).toBe(4);
                            
                            args = spy.calls[2].args;
                            expect(args[0]).toBe(store);
                            expect(args[1]).toEqual([all[0], all[1], all[2]]);
                            expect(args[2]).toBe(0);
                        });
                        
                        it("should fire a single datachanged event", function() {
                            store.on('datachanged', spy);
                            store.remove([all[1], all[4], all[2], all[6], all[7], all[0]]);
                            expect(spy.callCount).toBe(1);
                        });
                    });
                    
                    describe("invalid cases", function() {
                        it("should not fire when the array is empty", function() {
                            store.on({
                                remove: spy,
                                datachanged: spy
                            });
                            store.on('remove', spy);
                            store.remove([]);
                            expect(spy).not.toHaveBeenCalled();
                        });
                        
                        it("should not fire when the array is stripped of items not in the store", function() {
                            store.on({
                                remove: spy,
                                datachanged: spy
                            });
                            store.remove([makeUser('foo@sencha.com')]);
                            expect(spy).not.toHaveBeenCalled();
                        });
                    });
                });
            });
        });
        
        describe("removeAt", function() {
            it("should remove the record at the specified index", function() {
                store.removeAt(1);
                expect(store.indexOf(abeRec)).toBe(-1);
            });
            
            it("should do nothing if the index is larger than the store size", function() {
                store.removeAt(100);
                expect(store.getCount()).toBe(4);
            });
            
            describe("with count", function() {
                it("should remove a single item with count = 1", function() {
                    store.removeAt(2, 1);
                    expect(store.getCount()).toBe(3);
                    expect(store.indexOf(aaronRec)).toBe(-1);
                });
                
                it("should remove the counted amount of items", function() {
                    store.removeAt(0, 3);
                    expect(store.getCount()).toBe(1);
                    expect(store.indexOf(edRec)).toBe(-1);
                    expect(store.indexOf(abeRec)).toBe(-1);
                    expect(store.indexOf(aaronRec)).toBe(-1);
                });
                
                it("should clip the count to the collection size", function() {
                    store.removeAt(2, 50);
                    expect(store.getCount()).toBe(2);
                    expect(store.indexOf(aaronRec)).toBe(-1);
                    expect(store.indexOf(tommyRec)).toBe(-1);
                });
            });
            
            describe("events", function() {
                var spy;
                
                beforeEach(function() {
                    spy = jasmine.createSpy();
                });
                
                it("should fire a remove event with the removed records", function() {
                    store.on('remove', spy);
                    store.removeAt(1, 2);
                    expect(spy.callCount).toBe(1);
                    var args = spy.mostRecentCall.args;
                    expect(args[0]).toBe(store);
                    expect(args[1]).toEqual([abeRec, aaronRec]);
                    expect(args[2]).toBe(1);
                });
                
                it("should fire a datachanged event", function() {
                    store.on('datachanged', spy);
                    store.removeAt(1, 2);
                    expect(spy.callCount).toBe(1);
                    var args = spy.mostRecentCall.args;
                    expect(args[0]).toBe(store);
                });
                
                describe("invalid cases", function() {
                    it("should not fire when the index is greater than the store bounds", function() {
                        store.on({
                            remove: spy,
                            datachanged: spy
                        });
                        store.removeAt(100);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });
        });
        
        describe("removeAll", function() {
            it("should remove all records from the store", function() {
                store.removeAll();
                expect(store.getCount()).toBe(0);
            });
            
            it("should do nothing if the store is empty", function() {
                store.destroy();
                createStore();
                store.removeAll();
                expect(store.getCount()).toBe(0);
            });

            describe("when filtered", function() {
                it("should only remove items in the active collection", function() {
                    store.filter('group', 'code');
                    store.removeAll();
                    expect(store.getCount()).toBe(0);
                    store.getFilters().removeAll();
                    expect(store.getCount()).toBe(2);
                    expect(store.getAt(0)).toBe(abeRec);
                    expect(store.getAt(1)).toBe(aaronRec);
                });
            });

            it("should return the removed records", function() {
                createStore();
                var records = store.getRange();
                expect(store.removeAll()).toEqual(records);
            });

            it("should return an empty array if the store is empty", function() {
                createStore();
                store.removeAll();
                expect(store.removeAll()).toEqual([]);
            });
            
            describe("events", function() {
                var spy;
                beforeEach(function() {
                    spy = jasmine.createSpy();
                });
                
                it("should not fire any remove events", function() {
                    store.on('remove', spy);
                    store.removeAll();
                    expect(spy).not.toHaveBeenCalled();
                });
                
                it("should fire the clear event and pass the current records", function() {
                    var range = store.getRange();
                    store.on('clear', spy);
                    store.removeAll();
                    expect(spy.callCount).toBe(1);
                    expect(spy.mostRecentCall.args[0]).toBe(store);
                    expect(spy.mostRecentCall.args[1]).toEqual(range);
                });
                
                it("should fire the datachanged event", function() {
                    store.on('datachanged', spy);
                    store.removeAll();
                    expect(spy.callCount).toBe(1);
                });
                
                describe("with silent: true", function() {
                    it("should not fire the clear event", function() {
                        store.on('clear', spy);
                        store.removeAll(true);
                        expect(spy).not.toHaveBeenCalled();
                    });
                
                    it("should not fire the datachanged event", function() {
                        store.on('datachanged', spy);
                        store.removeAll(true);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });

                it("should be able to fire remove events after calling removeAll", function() {
                    store.removeAll();
                    store.add({}, {}, {});
                    store.on('remove', spy);
                    store.removeAt(0);
                    expect(spy.callCount).toBe(1);
                });
            });
        });
    });
    
    describe("loading", function() {

        describe("loadCount", function() {
            it("should default to 0", function() {
                createStore();
                expect(store.loadCount).toBe(0);
            });

            describe("construction", function() {
                it("should increment the loadCount when passing data with no proxy", function() {
                    createStore({
                        data: [abeRaw]
                    });
                    expect(store.loadCount).toBe(1);
                });

                it("should increment the loadCount when passing data with a memory proxy", function() {
                    createStore({
                        proxy: {
                            type: 'memory'
                        },
                        data: [abeRaw]
                    });
                    expect(store.loadCount).toBe(1);
                });
            });

            describe("with no proxy", function() {
                beforeEach(function() {
                    createStore();
                });

                it("should increment when using loadRecords", function() {
                    store.loadRecords([makeUser('foo@sencha.com')]);
                    expect(store.loadCount).toBe(1);
                });

                it("should increment when using loadData", function() {
                    store.loadData([tommyRaw]);
                    expect(store.loadCount).toBe(1);
                });
            });

            describe("with a proxy", function() {
                beforeEach(function() {
                    createStore({
                        proxy: {
                            type: 'ajax',
                            url: '/foo'
                        }
                    });
                });

                it("should increment on a successful load with no records", function() {
                    store.load();
                    completeWithData([]);
                    expect(store.loadCount).toBe(1);
                });

                it("should increment on a successful load with records", function() {
                    store.load();
                    completeWithData([abeRaw, aaronRaw]);
                    expect(store.loadCount).toBe(1);
                });

                it("should not increment on an unsuccessful load", function() {
                    store.load();
                    complete(500);
                    expect(store.loadCount).toBe(0);
                });
            });

            it("should increment for each load", function() {
                createStore({
                    proxy: {
                        type: 'ajax',
                        url: '/foo'
                    }
                });
                for (var i = 0; i < 5; ++i) {
                    store.load();
                    completeWithData([]);
                }
                expect(store.loadCount).toBe(5);
            });
        });

        describe("local data", function() {
            describe("loadData", function() {
                beforeEach(function() {
                    createStore();
                });
            
                it("should create model instances", function() {
                    store.loadData([edRaw, abeRaw]);
                    expect(store.first().get('name')).toBe('Ed Spencer');
                    expect(store.last().get('name')).toBe('Abe Elias');
                    expect(store.getCount()).toBe(2);
                });
                
                it("should accept model instances", function() {
                    edRec = makeUser(edRaw);
                    abeRec = makeUser(abeRaw);
                    aaronRec = makeUser(aaronRaw);
                    
                    store.loadData([edRec, abeRec, aaronRec]);
                    expect(store.first()).toBe(edRec);
                    expect(store.getAt(1)).toBe(abeRec);
                    expect(store.last()).toBe(aaronRec);
                    expect(store.getCount()).toBe(3);
                });
                
                it("should clear existing records by default", function() {
                    addStoreData();
                    store.loadData([{
                        email: 'foo@sencha.com'
                    }]);
                    expect(store.first().get('email')).toBe('foo@sencha.com');
                    expect(store.getCount()).toBe(1);
                });
                
                it("should append records to the end when using append: true", function() {
                    addStoreData();
                    store.loadData([{
                        email: 'foo@sencha.com'
                    }], true);
                    expect(store.last().get('email')).toBe('foo@sencha.com');
                    expect(store.getCount()).toBe(5);
                });

                describe("when filtered", function() {
                    it("should clear filtered out records", function() {
                        addStoreData();
                        store.getFilters().add({
                            property: 'email',
                            value: 'ed@sencha.com'
                        });

                        expect(store.getCount()).toBe(1);

                        store.loadData([{
                            email: 'a@sencha.com'
                        }, {
                            email: 'b@sencha.com'
                        }]);

                        expect(store.getCount()).toBe(0);

                        store.getFilters().removeAll();

                        expect(store.getCount()).toBe(2);
                        expect(store.getAt(0).getId()).toBe('a@sencha.com');
                        expect(store.getAt(1).getId()).toBe('b@sencha.com');

                        expect(store.indexOf(edRec)).toBe(-1);
                    });

                    it("should include only matching records", function() {
                        addStoreData();
                        store.getFilters().add({
                            property: 'group',
                            value: 'code'
                        });

                        expect(store.getCount()).toBe(2);

                        store.loadData([{
                            email: 'a@sencha.com',
                            group: 'admin'
                        }, {
                            email: 'b@sencha.com',
                            group: 'code'
                        }]);

                        expect(store.getCount()).toBe(1);
                        expect(store.getAt(0).getId()).toBe('b@sencha.com');

                        store.getFilters().removeAll();

                        expect(store.getCount()).toBe(2);
                        expect(store.getAt(0).getId()).toBe('a@sencha.com');
                        expect(store.getAt(1).getId()).toBe('b@sencha.com');

                        expect(store.indexOf(edRec)).toBe(-1);
                        expect(store.indexOf(tommyRec)).toBe(-1);
                    });
                });
                
                describe("events", function() {
                    var spy;
                    beforeEach(function() {
                        spy = jasmine.createSpy();
                    });
                    
                    it("should fire a datachanged event", function() {
                        store.on('datachanged', spy);
                        store.loadData([edRaw]);
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe(store);
                    });
                    
                    it("should fire a refresh event", function() {
                        store.on('refresh', spy);
                        store.loadData([edRaw]);
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe(store);
                    });
                    
                    it("should not fire any add events", function() {
                        store.on('add', spy);
                        store.loadData([tommyRaw]);
                        expect(spy).not.toHaveBeenCalled();
                    });
                    
                    it("should not fire any remove event when records are being cleared", function() {
                        store.on('remove', spy);
                        store.loadData([tommyRaw]);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });
        
            describe("loadRecords", function() {
                beforeEach(function() {
                    createStore();
                });
                
                it("should accept model instances", function() {
                    edRec = makeUser(edRaw);
                    abeRec = makeUser(abeRaw);
                    aaronRec = makeUser(aaronRaw);
                    
                    store.loadRecords([edRec, abeRec, aaronRec]);
                    expect(store.first()).toBe(edRec);
                    expect(store.getAt(1)).toBe(abeRec);
                    expect(store.last()).toBe(aaronRec);
                    expect(store.getCount()).toBe(3);
                });
                
                it("should clear existing records by default", function() {
                    addStoreData();
                    var rec = makeUser('foo@sencha.com');
                    store.loadRecords([rec]);
                    expect(store.first().get('email')).toBe('foo@sencha.com');
                    expect(store.getCount()).toBe(1);
                });
                
                it("should append records to the end when using append: true", function() {
                    addStoreData();
                    var rec = makeUser('foo@sencha.com');
                    store.loadRecords([rec], {
                        addRecords: true
                    });
                    expect(store.last()).toBe(rec);
                    expect(store.getCount()).toBe(5);
                });

                describe("when filtered", function() {
                    it("should clear filtered out records", function() {
                        addStoreData();
                        store.getFilters().add({
                            property: 'email',
                            value: 'ed@sencha.com'
                        });

                        expect(store.getCount()).toBe(1);

                        store.loadRecords([makeUser('a@sencha.com'), makeUser('b@sencha.com')]);

                        expect(store.getCount()).toBe(0);

                        store.getFilters().removeAll();

                        expect(store.getCount()).toBe(2);
                        expect(store.getAt(0).getId()).toBe('a@sencha.com');
                        expect(store.getAt(1).getId()).toBe('b@sencha.com');

                        expect(store.indexOf(edRec)).toBe(-1);
                    });

                    it("should include only matching records", function() {
                        addStoreData();
                        store.getFilters().add({
                            property: 'group',
                            value: 'code'
                        });

                        expect(store.getCount()).toBe(2);
                        
                        store.loadRecords([makeUser('a@sencha.com', {
                            group: 'admin'
                        }), makeUser('b@sencha.com', {
                            group: 'code'
                        })]);

                        expect(store.getCount()).toBe(1);
                        expect(store.getAt(0).getId()).toBe('b@sencha.com');

                        store.getFilters().removeAll();

                        expect(store.getCount()).toBe(2);
                        expect(store.getAt(0).getId()).toBe('a@sencha.com');
                        expect(store.getAt(1).getId()).toBe('b@sencha.com');

                        expect(store.indexOf(edRec)).toBe(-1);
                        expect(store.indexOf(tommyRec)).toBe(-1);
                    });
                });
                
                describe("events", function() {
                    var spy;
                    beforeEach(function() {
                        spy = jasmine.createSpy();
                    });
                    
                    it("should fire a datachanged event", function() {
                        store.on('datachanged', spy);
                        store.loadRecords([makeUser(edRaw)]);
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe(store);
                    });
                    
                    it("should fire a refresh event", function() {
                        store.on('refresh', spy);
                        store.loadRecords([makeUser(edRaw)]);
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe(store);
                    });
                    
                    it("should not fire any add events", function() {
                        store.on('add', spy);
                        store.loadRecords([makeUser(tommyRaw)]);
                        expect(spy).not.toHaveBeenCalled();
                    });
                    
                    it("should not fire any remove event when records are being cleared", function() {
                        store.on('remove', spy);
                        store.loadRecords([makeUser(tommyRaw)]);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });
        
            describe("loadRawData", function() {
                beforeEach(function() {
                    Ext.define('spec.UserWithReader', {
                        extend: 'Ext.data.Model',
                        idProperty: 'email',
                        fields: ['email', {
                            name: 'name',
                            mapping: 'person'
                        }],
                        proxy: {
                            type: 'memory',
                            reader: {
                                type: 'json',
                                rootProperty: 'data',
                                successProperty: 'success',
                                totalProperty: 'myTotal'
                            }
                        }
                    });
                    createStore({
                        model: 'spec.UserWithReader'
                    });
                });
                
                afterEach(function() {
                    Ext.undefine('spec.UserWithReader');
                });
                
                describe("reader processing", function() {
                    it("should pass the data through the proxy reader", function() {
                        store.loadRawData({
                            success: true,
                            data: [{
                                email: 'foo@sencha.com',
                                person: 'The name'
                            }]
                        });
                        var rec = store.first();
                        expect(rec.$className).toBe('spec.UserWithReader');
                        expect(rec.get('name')).toBe('The name');
                    });
                    
                
                    it("should read the totalCount", function() {
                        store.loadRawData({
                            success: true,
                            myTotal: 9876,
                            data: []
                        });
                        expect(store.getTotalCount()).toBe(9876);
                    });
                    
                    it("should return true when the records are read", function() {
                        var result = store.loadRawData({
                            success: true,
                            data: [{
                                email: 'foo@sencha.com',
                                person: 'The name'
                            }]
                        });
                        expect(result).toBe(true);
                    });
                    
                    it("should return false if the reader can't read the data and load no records", function() {
                        var result = store.loadRawData({
                            success: false,
                            data: [{
                                email: 'foo@sencha.com',
                                person: 'Name1'
                            }]
                        });
                        expect(result).toBe(false);
                        expect(store.getCount()).toBe(0);
                    });
                });
                
                it("should clear existing records by default", function() {
                    addStoreData();
                    store.loadRawData({
                        success: true,
                        data: [{
                            email: 'foo@sencha.com'
                        }]
                    });
                    expect(store.first().get('email')).toBe('foo@sencha.com');
                    expect(store.getCount()).toBe(1);
                });
                
                it("should append records to the end when using append: true", function() {
                    addStoreData();
                    store.loadRawData({
                        success: true,
                        data: [{
                            email: 'foo@sencha.com'
                        }]
                    }, {
                        addRecords: true
                    });
                    expect(store.last().get('email')).toBe('foo@sencha.com');
                    expect(store.getCount()).toBe(5);
                });

                describe("when filtered", function() {
                    it("should clear filtered out records", function() {
                        addStoreData();
                        store.getFilters().add({
                            property: 'email',
                            value: 'ed@sencha.com'
                        });

                        expect(store.getCount()).toBe(1);

                        store.loadRawData([{
                            email: 'a@sencha.com'
                        }, {
                            email: 'b@sencha.com'
                        }]);

                        expect(store.getCount()).toBe(0);

                        store.getFilters().removeAll();

                        expect(store.getCount()).toBe(2);
                        expect(store.getAt(0).getId()).toBe('a@sencha.com');
                        expect(store.getAt(1).getId()).toBe('b@sencha.com');

                        expect(store.indexOf(edRec)).toBe(-1);
                    });

                    it("should include only matching records", function() {
                        addStoreData();
                        store.getFilters().add({
                            property: 'group',
                            value: 'code'
                        });

                        expect(store.getCount()).toBe(2);

                        store.loadRawData([{
                            email: 'a@sencha.com',
                            group: 'admin'
                        }, {
                            email: 'b@sencha.com',
                            group: 'code'
                        }]);

                        expect(store.getCount()).toBe(1);
                        expect(store.getAt(0).getId()).toBe('b@sencha.com');

                        store.getFilters().removeAll();

                        expect(store.getCount()).toBe(2);
                        expect(store.getAt(0).getId()).toBe('a@sencha.com');
                        expect(store.getAt(1).getId()).toBe('b@sencha.com');

                        expect(store.indexOf(edRec)).toBe(-1);
                        expect(store.indexOf(tommyRec)).toBe(-1);
                    });
                });
                
                describe("events", function() {
                    var spy, data;
                    beforeEach(function() {
                        spy = jasmine.createSpy();
                        data = {
                            success: true,
                            data: [{
                                email: 'foo@sencha.com'
                            }]
                        };
                    });
                    
                    it("should fire a datachanged event", function() {
                        store.on('datachanged', spy);
                        store.loadRawData(data);
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe(store);
                    });
                    
                    it("should fire a refresh event", function() {
                        store.on('refresh', spy);
                        store.loadRawData(data);
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe(store);
                    });
                    
                    it("should not fire any add events", function() {
                        store.on('add', spy);
                        store.loadRawData(data);
                        expect(spy).not.toHaveBeenCalled();
                    });
                    
                    it("should not fire any remove event when records are being cleared", function() {
                        store.on('remove', spy);
                        store.loadRawData(data);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });
        });
        
        describe("loading remote data", function() {
            var successData;
            
            beforeEach(function() {
                successData = {
                    success: true,
                    data: [{
                        email: 'foo@sencha.com'
                    }]
                };
                createStore({
                    proxy: {
                        type: 'ajax',
                        url: 'foo',
                        reader: {
                            type: 'json',
                            successProperty: 'success',
                            rootProperty: 'data'
                        }
                    }
                });
            });
            
            describe("setting options on the operation", function() {
                var proxySpy,
                    collectionSortSpy;
                
                function getOperation() {
                    return proxySpy.mostRecentCall.args[0];
                }
                
                beforeEach(function() {
                    proxySpy = spyOn(store.getProxy(), 'read').andReturn();
                    collectionSortSpy = spyOn(store.getData(), 'sortItems').andCallThrough();
                });
                
                describe("sorters", function() {
                    function makeSorter(prop, dir) {
                       return {
                            property: prop,
                            direction: dir
                        };
                    }
                    
                    it("should pass along sorters if remoteSort: true", function() {
                        var beforeSortSpy = spyOnEvent(store, 'beforesort'),
                            sorters;

                        store.setRemoteSort(true);
                        store.getSorters().add(makeSorter('email', 'ASC'));

                        // Mutating the sorters of a remoteSort ProxyStore triggers a load of sorted data
                        expect(beforeSortSpy.callCount).toBe(1);

                        // beforesort event passes Sorters as an array
                        expect(beforeSortSpy.calls[0].args[1]).toEqual(store.getSorters().getRange());

                        store.getSorters().add(makeSorter('evilness', 'DESC'));

                        // Mutating the sorters of a remoteSort ProxyStore triggers a load of sorted data
                        expect(beforeSortSpy.callCount).toBe(2);

                        // beforesort event passes Sorters as an array
                        expect(beforeSortSpy.calls[1].args[1]).toEqual(store.getSorters().getRange());

                        store.load();

                        // The beforesort event should be fired on load.
                        expect(beforeSortSpy.callCount).toBe(3);

                        // beforesort event passes Sorters as an array
                        expect(beforeSortSpy.calls[2].args[1]).toEqual(store.getSorters().getRange());

                        sorters = getOperation().getSorters();
                        expect(sorters[0].getProperty()).toBe('email');
                        expect(sorters[0].getDirection()).toBe('ASC');
                    
                        expect(sorters[1].getProperty()).toBe('evilness');
                        expect(sorters[1].getDirection()).toBe('DESC');

                        // The Collection should not have sorted itself
                        expect(collectionSortSpy).not.toHaveBeenCalled();
                    });
                    
                    it("should not pass sorters if there are none", function() {
                        store.setRemoteSort(true);
                        store.load();
                        expect(getOperation().getSorters()).toBeUndefined();

                        // The Collection should not have sorted itself
                        expect(collectionSortSpy).not.toHaveBeenCalled();
                    });
                
                    it("should not pass sorters if remoteSort: false", function() {
                        var beforeSortSpy = spyOnEvent(store, 'beforesort');

                        store.setRemoteSort(false);
                        store.getSorters().add(makeSorter('email', 'ASC'));

                        // Mutating the Sorters Collection causes a sort if remoteSort is false
                        expect(beforeSortSpy.callCount).toBe(1);

                        // beforesort event passes Sorters as an array
                        expect(beforeSortSpy.calls[0].args[1]).toEqual(store.getSorters().getRange());

                        store.getSorters().add(makeSorter('evilness', 'DESC'));

                        // Mutating the Sorters Collection causes a sort if remoteSort is false
                        expect(beforeSortSpy.callCount).toBe(2);

                        // beforesort event passes Sorters as an array
                        expect(beforeSortSpy.calls[1].args[1]).toEqual(store.getSorters().getRange());

                        store.load();
                        expect(getOperation().getSorters()).toBeUndefined();

                        // The Collection should have sorted itself
                        expect(collectionSortSpy.callCount).toBe(2);
                    });
                });
                
                describe("grouper", function() {
                    function makeGrouper(prop, dir) {
                       return {
                            property: prop,
                            direction: dir
                        };
                    }
                    
                    it("should pass along the grouper if remoteSort: true", function() {
                        store.setRemoteSort(true);
                        store.setGrouper(makeGrouper('group', 'ASC'));
                        store.load();
                        var grouper = getOperation().getGrouper();
                        expect(grouper.getProperty()).toBe('group');
                        expect(grouper.getDirection()).toBe('ASC');
                    });
                    
                    it("should pass the grouper if there isn't one", function() {
                        store.setRemoteSort(true);
                        store.load();
                        expect(getOperation().getGrouper()).toBeUndefined();
                    });
                    
                    it("should pass the grouper if remoteSort: false", function() {
                        store.setRemoteSort(false);
                        store.setGrouper(makeGrouper('group', 'ASC'));
                        store.load();
                        expect(getOperation().getGrouper()).toBeUndefined();
                    });

                    it('should sort a grouped store according to the group field and then sorters', function() {
                        var sorted = 0,
                            Task = Ext.define(null, {
                                extend: 'Ext.data.Model',
                                idProperty: 'taskId',
                                fields: [
                                    {name: 'projectId', type: 'int'},
                                    {name: 'project', type: 'string'},
                                    {name: 'taskId', type: 'int'},
                                    {name: 'description', type: 'string'},
                                    {name: 'estimate', type: 'float'},
                                    {name: 'rate', type: 'float'},
                                    {name: 'due', type: 'date', dateFormat:'m/d/Y'}
                                ]
                            });

                        var data = [
                            {projectId: 100, project: 'Ext Forms: Field Anchoring', taskId: 112, description: 'Integrate 2.0 Forms with 2.0 Layouts', estimate: 6, rate: 150, due:'06/24/2007'},
                            {projectId: 100, project: 'Ext Forms: Field Anchoring', taskId: 113, description: 'Implement AnchorLayout', estimate: 4, rate: 150, due:'06/25/2007'},
                            {projectId: 100, project: 'Ext Forms: Field Anchoring', taskId: 114, description: 'Add support for multiple<br>types of anchors', estimate: 4, rate: 150, due:'06/27/2007'},
                            {projectId: 100, project: 'Ext Forms: Field Anchoring', taskId: 115, description: 'Testing and debugging', estimate: 8, rate: 0, due:'06/29/2007'},

                            {projectId: 101, project: 'Ext Grid: Single-level Grouping', taskId: 101, description: 'Add required rendering "hooks" to GridView', estimate: 6, rate: 100, due:'07/01/2007'},
                            {projectId: 101, project: 'Ext Grid: Single-level Grouping', taskId: 102, description: 'Extend GridView and override rendering functions', estimate: 6, rate: 100, due:'07/03/2007'},
                            {projectId: 101, project: 'Ext Grid: Single-level Grouping', taskId: 103, description: 'Extend Store with grouping functionality', estimate: 4, rate: 100, due:'07/04/2007'},
                            {projectId: 101, project: 'Ext Grid: Single-level Grouping', taskId: 121, description: 'Default CSS Styling', estimate: 2, rate: 100, due:'07/05/2007'},
                            {projectId: 101, project: 'Ext Grid: Single-level Grouping', taskId: 104, description: 'Testing and debugging', estimate: 6, rate: 100, due:'07/06/2007'},

                            {projectId: 102, project: 'Ext Grid: Summary Rows', taskId: 105, description: 'Ext Grid plugin integration', estimate: 4, rate: 125, due:'07/01/2007'},
                            {projectId: 102, project: 'Ext Grid: Summary Rows', taskId: 106, description: 'Summary creation during rendering phase', estimate: 4, rate: 125, due:'07/02/2007'},
                            {projectId: 102, project: 'Ext Grid: Summary Rows', taskId: 107, description: 'Dynamic summary updates in editor grids', estimate: 6, rate: 125, due:'07/05/2007'},
                            {projectId: 102, project: 'Ext Grid: Summary Rows', taskId: 108, description: 'Remote summary integration', estimate: 4, rate: 125, due:'07/05/2007'},
                            {projectId: 102, project: 'Ext Grid: Summary Rows', taskId: 109, description: 'Summary renderers and calculators', estimate: 4, rate: 125, due:'07/06/2007'},
                            {projectId: 102, project: 'Ext Grid: Summary Rows', taskId: 110, description: 'Integrate summaries with GroupingView', estimate: 10, rate: 125, due:'07/11/2007'},
                            {projectId: 102, project: 'Ext Grid: Summary Rows', taskId: 111, description: 'Testing and debugging', estimate: 8, rate: 125, due:'07/15/2007'}
                        ];

                        store = Ext.create('Ext.data.Store', {
                            model: Task,
                            data: data,
                            sorters: {property: 'due', direction: 'ASC'},
                            groupField: 'project'
                        });

                        expect(store.getAt(0).get('taskId')).toBe(112);
                        expect(store.getAt(1).get('taskId')).toBe(113);
                        expect(store.getAt(2).get('taskId')).toBe(114);
                        expect(store.getAt(3).get('taskId')).toBe(115);

                        expect(store.getAt(4).get('taskId')).toBe(101);
                        expect(store.getAt(5).get('taskId')).toBe(102);
                        expect(store.getAt(6).get('taskId')).toBe(103);
                        expect(store.getAt(7).get('taskId')).toBe(121);
                        expect(store.getAt(8).get('taskId')).toBe(104);
                        
                        expect(store.getAt(9).get('taskId')).toBe(105);
                        expect(store.getAt(10).get('taskId')).toBe(106);
                        expect(store.getAt(11).get('taskId')).toBe(107);
                        expect(store.getAt(12).get('taskId')).toBe(108);
                        expect(store.getAt(13).get('taskId')).toBe(109);
                        expect(store.getAt(14).get('taskId')).toBe(110);
                        expect(store.getAt(15).get('taskId')).toBe(111);

                        store.on({
                            sort: function() {
                                expect(store.getAt(0).get('taskId')).toBe(113);
                                expect(store.getAt(1).get('taskId')).toBe(114);
                                expect(store.getAt(2).get('taskId')).toBe(112);
                                expect(store.getAt(3).get('taskId')).toBe(115);

                                // Ext Grid: Single-level Grouping
                                expect(store.getAt(4).get('taskId')).toBe(121);
                                expect(store.getAt(5).get('taskId')).toBe(103);
                                expect(store.getAt(6).get('taskId')).toBe(101);
                                expect(store.getAt(7).get('taskId')).toBe(102);
                                expect(store.getAt(8).get('taskId')).toBe(104);

                                expect(store.getAt(9).get('taskId')).toBe(105);
                                expect(store.getAt(10).get('taskId')).toBe(106);
                                expect(store.getAt(11).get('taskId')).toBe(108);
                                expect(store.getAt(12).get('taskId')).toBe(109);
                                expect(store.getAt(13).get('taskId')).toBe(107);
                                expect(store.getAt(14).get('taskId')).toBe(111);
                                expect(store.getAt(15).get('taskId')).toBe(110);
                                sorted++;
                            }                            
                        });
                        // This should switch the order within the two groups.
                        // This becomes the primary sorter instead of evilness
                        // IMPORTANT: The age field has a sortType* function which flips the value to negative.
                        // So to sort by age,ASC, we specify DESC here.
                        store.sort('estimate', undefined, 'replace');
                        expect(sorted).toBe(1);
                    });
                });
                
                describe("filters", function() {
                    function makeFilter(prop, value) {
                       return {
                            property: prop,
                            value: value
                        };
                    }
                    
                    it("should pass along filters if remoteFilter: true", function() {
                        store.setRemoteFilter(true);
                        store.getFilters().add(makeFilter('email', 'ed@sencha.com'));
                        store.getFilters().add(makeFilter('evilness', 100));
                        store.load();
                        var filters = getOperation().getFilters();
                        expect(filters[0].getProperty()).toBe('email');
                        expect(filters[0].getValue()).toBe('ed@sencha.com');
                    
                        expect(filters[1].getProperty()).toBe('evilness');
                        expect(filters[1].getValue()).toBe(100);
                    });
                    
                    it("should not pass filters if there are none", function() {
                        store.setRemoteFilter(true);
                        store.load();
                        expect(getOperation().getFilters()).toBeUndefined();
                    });
                
                    it("should not pass filters if remoteFilter: false", function() {
                        store.setRemoteFilter(false);
                        store.getFilters().add(makeFilter('email', 'ed@sencha.com'));
                        store.getFilters().add(makeFilter('evilness', 100));
                        store.load();
                        expect(getOperation().getFilters()).toBeUndefined();
                    });
                });
                
                describe("params", function() {
                    it("should pass along params", function() {
                        store.load({
                            params: {
                                foo: 'bar'
                            }
                        });
                        expect(getOperation().getParams()).toEqual({
                            foo: 'bar'
                        });
                    });
                });
                
                describe("paging", function() {
                    describe("page", function() {
                        it("should use the passed page", function() {
                            store.load({
                                page: 7
                            });
                            expect(getOperation().getPage()).toBe(7);
                        });

                        it("should set the store currentPage", function() {
                            store.load({
                                page: 7
                            });
                            expect(store.currentPage).toBe(7);
                        });
                        
                        it("should default to the current page in the store", function() {
                            store.load();
                            expect(getOperation().getPage()).toBe(store.currentPage);
                        });
                    });
                    
                    describe("start", function() {
                        it("should use the passed start", function() {
                            store.load({
                                start: 100
                            });
                            expect(getOperation().getStart()).toBe(100);
                        });
                        
                        it("should calculate the start based on the page & pageSize", function() {
                            store.setPageSize(50);
                            store.currentPage = 13;
                            store.load();
                            expect(getOperation().getStart()).toBe(600);
                        });
                    });
                    
                    describe("limit", function() {
                        it("should used the passed limit", function() {
                            store.load({
                                limit: 12
                            });
                            expect(getOperation().getLimit()).toBe(12);
                        });
                        
                        it("should default to the page size", function() {
                            store.load();
                            expect(getOperation().getLimit()).toBe(store.getPageSize());
                        });
                    });
                    
                    describe("with paging disabled", function() {
                        beforeEach(function() {
                            store.setPageSize(0);
                        });
                        
                        describe("page", function() {
                            it("should use the passed page", function() {
                                store.load({
                                    page: 7
                                });
                                expect(getOperation().getPage()).toBe(7);
                            });

                            it("should not default a page param", function() {
                                store.load();
                                expect(getOperation().getPage()).toBeUndefined();
                            });
                        });

                        describe("start", function() {
                            it("should use the passed start", function() {
                                store.load({
                                    start: 100
                                });
                                expect(getOperation().getStart()).toBe(100);
                            });

                            it("should not default the start", function() {
                                store.load();
                                expect(getOperation().getStart()).toBeUndefined();
                            });
                        });

                        describe("limit", function() {
                            it("should used the passed limit", function() {
                                store.load({
                                    limit: 12
                                });
                                expect(getOperation().getLimit()).toBe(12);
                            });

                            it("should not default the limit", function() {
                                store.load();
                                expect(getOperation().getLimit()).toBeUndefined();
                            });
                        });
                    });
                });
            });
            
            describe("isLoading", function() {
                it("should not be loading by default", function() {
                    expect(store.isLoading()).toBe(false);
                });
                
                it("should be loading once a remote request is triggered", function() {
                    store.load();
                    expect(store.isLoading()).toBe(true);
                });
                
                it("should not be loading when the server returns a successful response", function() {
                    store.load();
                    completeWithData(successData);
                    expect(store.isLoading()).toBe(false);
                });
                
                it("should not be loading when the server returns a failed response", function() {
                    store.load();
                    completeWithData({
                        success: false
                    });
                    expect(store.isLoading()).toBe(false);
                });
            });
            
            describe("callbacks", function() {
                var spy;
                beforeEach(function() {
                    spy = jasmine.createSpy();
                });
                
                describe("function paramter", function() {
                    it("should accept a function", function() {
                        store.load(spy);
                        completeWithData(successData);
                        expect(spy.callCount).toBe(1);
                    });
                    
                    it("should default the scope to the store", function() {
                        store.load(spy);
                        completeWithData(successData);
                        expect(spy.mostRecentCall.object).toBe(store);
                    });
                });
                
                describe("object paramter", function() {
                    it("should take a callback parameter", function() {
                        store.load({
                            callback: spy
                        });
                        completeWithData(successData);
                        expect(spy.callCount).toBe(1);
                    });
                    
                    it("should use a passed scope", function() {
                        store.load({
                            callback: spy,
                            scope: fakeScope
                        });
                        completeWithData(successData);
                        expect(spy.mostRecentCall.object).toBe(fakeScope);
                    });
                    
                    it("should default the scope to the store", function() {
                        store.load({
                            callback: spy
                        });
                        completeWithData(successData);
                        expect(spy.mostRecentCall.object).toBe(store);
                    });
                });
                
                describe("arguments", function() {
                    var proxySpy;
                    
                    beforeEach(function() {
                        proxySpy = spyOn(store.getProxy(), 'read').andCallThrough();
                    });
                    
                    describe("on success", function() {
                        it("should pass the records, the operation and success status", function() {
                            store.load(spy);
                            completeWithData({
                                success: true,
                                data: [{
                                    email: 'user1@sencha.com'
                                }, {
                                    email: 'user2@sencha.com'
                                }]
                            });
                            var args = spy.mostRecentCall.args;
                            expect(args[0][0].get('email')).toBe('user1@sencha.com');
                            expect(args[0][1].get('email')).toBe('user2@sencha.com');
                            expect(args[1]).toBe(proxySpy.mostRecentCall.args[0]);
                            expect(args[2]).toBe(true);
                        });
                    });
                    
                    describe("on failure", function() {
                        it("should pass empty records, the operation and success status", function() {
                            store.load(spy);
                            completeWithData({
                                success: false
                            });
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toEqual([]);
                            expect(args[1]).toBe(proxySpy.mostRecentCall.args[0]);
                            expect(args[2]).toBe(false);
                        });
                    });
                });
                
                describe("when the callback is triggered", function() {
                    it("should not have the store loading", function() {
                        var loading;
                        store.load(function() {
                            loading = store.isLoading();
                        });
                        completeWithData(successData);
                        expect(loading).toBe(false);
                    });
                    
                    it("should have populated the store", function() {
                        var count;
                        store.load(function() {
                            count = store.getCount();
                        });
                        completeWithData(successData);
                        expect(count).toBe(1);
                    });
                    
                    it("should fire after the load event", function() {
                        var eventFired,
                            loadSpy = jasmine.createSpy();
                        
                        store.on('load', loadSpy);
                        store.load(function() {
                            eventFired = loadSpy.callCount === 1;
                        });
                        completeWithData(successData);
                        expect(eventFired).toBe(true);
                    });
                });
            });
            
            describe("events", function() {
                var spy, proxySpy;
                
                beforeEach(function() {
                    spy = jasmine.createSpy();
                    proxySpy = spyOn(store.getProxy(), 'read').andCallThrough();
                });
                
                describe("beforeload", function() {
                    it("should fire the beforeload event", function() {
                        store.on('beforeload', spy);
                        store.load();
                        expect(spy.callCount).toBe(1);
                    });
                    
                    it("should pass the store and the operation", function() {
                        store.on('beforeload', spy);
                        store.load();
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(store);
                        expect(args[1] instanceof Ext.data.operation.Read).toBe(true);
                    });
                    
                    it("should not be loading when the beforeload event is fired", function() {
                        var loading;
                        store.on('beforeload', function() {
                            loading = store.isLoading();
                        });
                        store.load();
                        expect(loading).toBe(false);
                    });
                    
                    it("should not continue with the load if false is returned", function() {
                        store.on('beforeload', function() {
                            return false;
                        });
                        store.load();
                        expect(store.isLoading()).toBe(false);
                        expect(proxySpy).not.toHaveBeenCalled();
                    });
                });
                
                describe("load", function() {
                    describe("on success", function() {
                        it("should fire with the store, records and the success param", function() {
                            store.on('load', spy);
                            store.load();
                            completeWithData(successData);
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(store);
                            expect(args[1][0].get('email')).toBe('foo@sencha.com');
                            expect(args[2]).toBe(true);
                        });
                    });
                    
                    describe("on failure", function() {
                        it("should fire with the store, an empty record array and the success param", function() {
                            store.on('load', spy);
                            store.load();
                            completeWithData({
                                success: false
                            });
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(store);
                            expect(args[1]).toEqual([]);
                            expect(args[2]).toBe(false);
                        });
                    });
                    
                    describe("when the event is triggered", function() {
                        it("should not be loading", function() {
                            var loading;
                            store.on('load', function() {
                                loading = store.isLoading();
                            });
                            store.load();
                            completeWithData(successData);
                            expect(loading).toBe(false);
                        });
                        
                        it("should be populated with records", function() {
                            var count;
                            store.on('load', function() {
                                count = store.getCount();
                            });
                            store.load();
                            completeWithData(successData);
                            expect(count).toBe(1);
                        });
                    });
                });
            });
            
            describe("after the load completes", function() {                
                it("should clear existing records by default", function() {
                    addStoreData();
                    store.load();
                    completeWithData(successData);
                    expect(store.first().get('email')).toBe('foo@sencha.com');
                    expect(store.getCount()).toBe(1);
                });
                
                it("should append records to the end when using append: true", function() {
                    addStoreData();
                    store.load({
                        addRecords: true
                    });
                    completeWithData(successData);
                    expect(store.last().get('email')).toBe('foo@sencha.com');
                    expect(store.getCount()).toBe(5);
                });
                
                describe("events", function() {
                    var spy;
                    beforeEach(function() {
                        spy = jasmine.createSpy();
                    });
                    
                    it("should fire a datachanged event", function() {
                        store.on('datachanged', spy);
                        store.load();
                        completeWithData(successData);
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe(store);
                    });
                    
                    it("should fire a refresh event", function() {
                        store.on('refresh', spy);
                        store.load();
                        completeWithData(successData);
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe(store);
                    });
                    
                    it("should not fire any add events", function() {
                        store.on('add', spy);
                        store.load();
                        completeWithData(successData);
                        expect(spy).not.toHaveBeenCalled();
                    });
                    
                    it("should not fire any remove event when records are being cleared", function() {
                        store.on('remove', spy);
                        store.load();
                        completeWithData(successData);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });
            
            describe("reload", function() {
                it("should be able to be called if load was never called", function() {
                    var spy = jasmine.createSpy();
            
                    store.reload({
                        callback: spy
                    });
                    completeWithData(successData);
                    expect(spy.callCount).toBe(1);
                });
                
                it("should use the params from the last load", function() {
                    store.load({
                        params: {
                            foo: 'bar'
                        }
                    });
                    completeWithData(successData);
                    var spy = spyOn(store.getProxy(), 'read').andReturn();
                    store.reload();
                    expect(spy.mostRecentCall.args[0].getParams()).toEqual({
                        foo: 'bar'
                    });
                });
            });
        });
    });
    
    describe("paging", function() {
        var successData, proxySpy;
        
        function getOperation() {
            return proxySpy.mostRecentCall.args[0];
        }

        beforeEach(function() {
            successData = {
                success: true,
                data: [{
                    email: 'foo@sencha.com'
                }]
            };
            createStore({
                proxy: {
                    type: 'ajax',
                    url: 'foo',
                    reader: {
                        type: 'json',
                        successProperty: 'success',
                        rootProperty: 'data'
                    }
                }
            });
            proxySpy = spyOn(store.getProxy(), 'read').andCallThrough();
        });
        
        it("should default the current page to 1", function() {
            expect(store.currentPage).toBe(1);
        });
        
        describe("previousPage", function() {
            it("should call loadPage with the current page - 1 and pass the options", function() {
                var o = {};
                spyOn(store, 'loadPage').andReturn();
                store.currentPage = 9;
                store.previousPage(o);
                expect(store.loadPage).toHaveBeenCalledWith(8, o);
                expect(store.loadPage.callCount).toBe(1);
            });
        });
        
        describe("nextPage", function() {
            it("should call loadPage with the current page + 1 and pass the options", function() {
                var o = {};
                spyOn(store, 'loadPage').andReturn();
                store.currentPage = 3;
                store.nextPage(o);
                expect(store.loadPage).toHaveBeenCalledWith(4, o);
                expect(store.loadPage.callCount).toBe(1);
            });
        });
        
        describe("params passed to the proxy", function() {
            describe("page", function() {
                it("should favour a passed page param", function() {
                    store.loadPage(10, {
                        page: 1234
                    });
                    expect(getOperation().getPage()).toBe(1234);
                });
                
                it("should use the passed the page", function() {
                    store.loadPage(10);
                    expect(getOperation().getPage()).toBe(10);
                });
            });
            
            describe("start", function() {
                it("should favour a passed start param", function() {
                    store.loadPage(3, {
                        start: 789
                    });
                    expect(getOperation().getStart()).toBe(789);
                });
                
                it("should calculate the start based off the pageSize", function() {
                    store.loadPage(2);
                    expect(getOperation().getStart()).toBe(25);
                });
            });
            
            describe("limit", function() {
                it("should favour a passed limit param", function() {
                    store.loadPage(3, {
                        limit: 456
                    });
                    expect(getOperation().getLimit()).toBe(456);
                });
                
                it("should set the limit to be the pageSize", function() {
                    store.loadPage(2);
                    expect(getOperation().getLimit()).toBe(store.getPageSize());
                });
            });
            
            describe("other params", function() {
                it("should pass the params object", function() {
                    store.loadPage(1, {
                        params: {
                            custom: true
                        }
                    });
                    expect(getOperation().getParams()).toEqual({
                        custom: true
                    });
                });
            });
        });
        
        describe("after load", function() {
            it("should set the currentPage", function() {
                store.loadPage(12);
                expect(store.currentPage).toBe(12);
            });
            
            it("should clear existing records when using clearOnPageLoad: true", function() {
                store.setClearOnPageLoad(true);
                store.setPageSize(1);
                store.loadPage(1);
                completeWithData({
                    success: true,
                    data: [{
                        email: 'user1@sencha.com'
                    }]
                });
                store.loadPage(2);
                completeWithData({
                    success: true,
                    data: [{
                        email: 'user2@sencha.com'
                    }]
                });
                expect(store.getCount()).toBe(1);
                expect(store.indexOfId('user1@sencha.com')).toBe(-1);
                expect(store.indexOfId('user2@sencha.com')).toBe(0);
            });
            
            it("should not clear existing records when using clearOnPageLoad: false", function() {
                store.setClearOnPageLoad(false);
                store.setPageSize(1);
                store.loadPage(1);
                completeWithData({
                    success: true,
                    data: [{
                        email: 'user1@sencha.com'
                    }]
                });
                store.loadPage(2);
                completeWithData({
                    success: true,
                    data: [{
                        email: 'user2@sencha.com'
                    }]
                });
                expect(store.getCount()).toBe(2);
                expect(store.indexOfId('user1@sencha.com')).toBe(0);
                expect(store.indexOfId('user2@sencha.com')).toBe(1);
            });
        });
    });
    
    describe("sorting", function() {
        function expectSorter(sorter, property, direction) {
            expect(sorter.getProperty()).toBe(property);
            expect(sorter.getDirection()).toBe(direction);
        }

        describe("the sorter collection", function() {
            it("should be an instance of Ext.util.SorterCollection", function() {
                createStore();
                expect(store.getSorters() instanceof Ext.util.SorterCollection).toBe(true);
            });

            it("should be empty by default", function() {
                createStore();
                expect(store.getSorters().getCount()).toBe(0);
            });

            it("should add any sorters passed in the constructor", function() {
                createStore({
                    sorters: [{
                        property: 'foo',
                        direction: 'DESC'
                    }, {
                        property: 'bar',
                        direction: 'ASC'
                    }]
                });
                expectSorter(store.getSorters().getAt(0), 'foo', 'DESC');
                expectSorter(store.getSorters().getAt(1), 'bar', 'ASC');
            });

            it("should not set the rootProperty as data on the sorter collection", function() {
                createStore();
                expect(store.getSorters().getRootProperty()).not.toBe('data');
            });

            it("should not trigger events when asking for the collection and it has not been created", function () {
                var spy = jasmine.createSpy();
                createStore({
                    listeners: {
                        beforesort: spy,
                        sort: spy
                    }
                });
                store.getSorters();
                expect(spy).not.toHaveBeenCalled();
            });
        });

        describe("sort method", function() {
            beforeEach(function() {
                createStore();
            });
            
            it("should accept a field name, default direction to ASC", function() {
                store.sort('name');
                expectSorter(store.getSorters().getAt(0), 'name', 'ASC');
            });
            
            it("should accept a field nameand direction", function() {
                store.sort('name', 'DESC');
                expectSorter(store.getSorters().getAt(0), 'name', 'DESC');
            });
            
            it("should toggle the direction if we pass a string name and no direction for an existing sorter", function() {
                store.sort('name');
                store.sort('name');
                expectSorter(store.getSorters().getAt(0), 'name', 'DESC');
            });
            
            it("should clear any existing sorters", function() {
                store.sort('name');
                store.sort('evilness');
                expect(store.getSorters().getCount()).toBe(1);
                expectSorter(store.getSorters().getAt(0), 'evilness', 'ASC');
            });

            it("should not throw an error when the store has no model", function() {
                store.destroy();
                
                // Silence console warning
                spyOn(Ext.log, 'warn');
                
                store = new Ext.data.Store();
                expect(function() {
                    store.sort('something', 'ASC');
                }).not.toThrow();
            });
        });
        
        describe("isSorted", function() {
            beforeEach(function() {
                createStore();
            });
            
            it("should default to false", function() {
                expect(store.isSorted()).toBe(false);
            });
            
            it("should return true when sorters are added", function() {
                store.sort('evilness');
                expect(store.isSorted()).toBe(true);
            });
            
            it("should return false when all sorters are removed", function() {
                store.sort('evilness');
                store.getSorters().remove('evilness');
                expect(store.isSorted()).toBe(false);
            });
            
            it("should return true if there are groupers and no sorters", function() {
                store.setGrouper({
                    property: 'group'
                });
                expect(store.isSorted()).toBe(true);
            });
        });

        describe("setRemoteSort", function() {
            describe("setting to true", function() {
                beforeEach(function() {
                    createStore({
                        remoteSort: false
                    });
                    addStoreData();
                    spyOn(store.getProxy(), 'read').andCallThrough();
                });

                describe("with sorters", function() {
                    it("should not trigger a load and not alter the sort order", function() {
                        store.getSorters().add('name');
                        store.setRemoteSort(true);
                        expect(store.getProxy().read).not.toHaveBeenCalled();
                        expect(store.getAt(0)).toBe(aaronRec);
                        expect(store.getAt(1)).toBe(abeRec);
                        expect(store.getAt(2)).toBe(edRec);
                        expect(store.getAt(3)).toBe(tommyRec);
                    });

                    it("should use the order provided by the server", function() {
                        store.getSorters().add('name');
                        store.setRemoteSort(true);
                        store.load();
                        completeWithData([{
                            name: 'Z'
                        }, {
                            name: 'Y'
                        }, {
                            name: 'A'
                        }]);
                        expect(store.getAt(0).get('name')).toBe('Z');
                        expect(store.getAt(1).get('name')).toBe('Y');
                        expect(store.getAt(2).get('name')).toBe('A');
                    });
                });

                describe("with no sorters", function() {
                    it("should not trigger a load", function() {
                        store.setRemoteSort(true);
                        expect(store.getProxy().read).not.toHaveBeenCalled();
                    });
                }); 
            });

            describe("setting to false", function() {
                describe("with sorters", function() {
                    it("should sort the local data", function() {
                        createStore({
                            remoteSort: true,
                            sorters: 'name'
                        });
                        addStoreData();

                        store.setRemoteSort(false);
                        expect(store.getAt(0)).toBe(aaronRec);
                        expect(store.getAt(1)).toBe(abeRec);
                        expect(store.getAt(2)).toBe(edRec);
                        expect(store.getAt(3)).toBe(tommyRec);
                    });
                });

                describe("with no sorters", function() {
                    it("should not sort the data", function() {
                        createStore({
                            remoteSort: true
                        });
                        addStoreData();
                        store.setRemoteSort(false);
                        expect(store.getAt(0)).toBe(edRec);
                        expect(store.getAt(1)).toBe(abeRec);
                        expect(store.getAt(2)).toBe(aaronRec);
                        expect(store.getAt(3)).toBe(tommyRec);
                    });
                }); 
            });
        });
        
        describe("local", function() {
            describe("during construction", function() {
                it("should sort an initial data set", function() {
                    createStore({
                        remoteSort: false,
                        sorters: [{
                            property: 'email'
                        }],
                        data: [edRaw, tommyRaw, aaronRaw, abeRaw]
                    });
                    expect(store.first().get('email')).toBe('aaron@sencha.com');
                });
            });
            
            describe("dynamic sorters", function() {
                beforeEach(function() {
                    createStore({
                        remoteSort: false
                    });
                    addStoreData();
                });
                it("should sort the dataset when adding sorters", function() {
                    store.sort('email');
                    expect(store.first().get('email')).toBe('aaron@sencha.com');
                });
            
                it("should be able to use multiple sorters", function() {
                    store.getSorters().add({
                        property: 'group'
                    }, {
                        property: 'evilness',
                        direction: 'DESC'
                    });
                    expect(store.first().get('email')).toBe('abe@sencha.com');
                });
                
                it("should trigger a sort when removing a sorter that is not the final sorter", function() {
                     store.getSorters().add({
                        property: 'group'
                    }, {
                        property: 'evilness',
                        direction: 'DESC'
                    });
                    store.getSorters().remove('group');
                    expect(store.first().get('email')).toBe('ed@sencha.com');
                });
                
                it("should ignore invalid fields", function() {
                    //first we'll sort by name to give some reference sorting
                    store.sort('name', 'ASC');

                    //this field does not exist
                    store.sort('someUnknownField');

                    //make sure the original sorting was preserved
                    expect(store.getAt(0).get('name')).toBe('Aaron Conran');
                    expect(store.getAt(1).get('name')).toBe('Abe Elias');
                    expect(store.getAt(2).get('name')).toBe('Ed Spencer');
                    expect(store.getAt(3).get('name')).toBe('Tommy Maintz');
                });
                
                describe("sortType", function(){
                    it("should not pass the default sortType for the field", function(){
                        store.sort('name', 'ASC');
                        var sorter = store.getSorters().first();
                        expect(sorter.getTransform()).toBe(Ext.data.SortTypes.asUCString);
                    }); 
                
                    it("should pass any custom sort for the field", function(){
                        store.sort('age', 'ASC');
                        var sorter = store.getSorters().first();
                        expect(sorter.getTransform()).toBe(customSort);
                    });  
                
                    it("should not apply a transform if the field doesn't exist", function(){
                        store.sort('someUnknownField');
                        var sorter = store.getSorters().first();
                        expect(sorter.getTransform()).toBeNull();
                    });   
                });
                
                describe("with loadData", function() {
                    it("should sort data", function() {
                        store.sort('email');
                        store.loadData([tommyRaw, abeRaw, edRaw, aaronRaw]);
                        expect(store.first().get('email')).toBe('aaron@sencha.com');
                    });
                    
                    it("should not fire extra datachanged/refresh events", function() {
                        var spy = jasmine.createSpy();
                        store.sort('email');
                        store.on('refresh', spy);
                        store.on('datachanged', spy);
                        store.loadData([tommyRaw, abeRaw, edRaw, aaronRaw]);
                        // Once for refresh, once for datachanged
                        expect(spy.callCount).toBe(2);
                    });
                    
                    it("should not sort the data with sortOnLoad: false", function() {
                        store.sort('email');
                        store.setSortOnLoad(false);
                        store.loadData([tommyRaw, abeRaw, edRaw, aaronRaw]);
                        expect(store.first().get('email')).toBe('tommy@sencha.com');
                    });
                });
                
                describe("with add", function() {
                    it("should sort data", function() {
                        store.sort('email');
                        store.add({
                            email: 'aaa@sencha.com'
                        });
                        expect(store.first().get('email')).toBe('aaa@sencha.com');
                    });
                    
                    it("should not fire extra datachanged events", function() {
                        var spy = jasmine.createSpy();
                        store.sort('email');
                        store.on('datachanged', spy);
                        store.add({
                            email: 'aaa@sencha.com'
                        });
                        expect(spy.callCount).toBe(1);
                    });
                });
                
                describe("when the field changes", function() {
                    it("should move the record to the correct place when the sorted field is modified", function() {
                        store.sort('evilness', 'DESC');
                        tommyRec.set('evilness', 1234);
                        expect(store.indexOf(tommyRec)).toBe(0);
                    });
                });

                describe("the sort method", function() {
                    it("should sort the data after toggling an existing sorter", function() {
                        store.getSorters().add('name');
                        var data = store.getRange();
                        data.reverse();
                        store.sort('name');
                        // Toggled now
                        expect(store.getRange()).toEqual(data);
                        expect(store.getSorters().getCount()).toBe(1);
                    });

                    it("shouldsort the data when adding a new sorter", function() {
                        store.getSorters().add('group');
                        store.sort('name', 'DESC');
                        expect(store.getSorters().getCount()).toBe(1);
                        expect(store.getAt(0)).toBe(tommyRec);
                        expect(store.getAt(1)).toBe(edRec);
                        expect(store.getAt(2)).toBe(abeRec);
                        expect(store.getAt(3)).toBe(aaronRec);
                    });
                });
            });
        });
        
        describe("remote", function() {
            describe("during construction", function() {
                it("should not trigger a load when creating with sorters", function() {
                    var spy = spyOn(Ext.data.Store.prototype, 'load');
                    createStore({
                        remoteSort: true,
                        sorters: [{
                            property: 'evilness'
                        }]
                    });
                    expect(spy).not.toHaveBeenCalled();
                });
            });
            
            describe("addSorted", function() {
                it("should insert the record into the correct position", function() {
                    createStore({
                        remoteSort: true
                    });
                    store.sort('email');
                    store.loadData([aaronRaw, abeRaw, edRaw, tommyRaw]);
                    store.addSorted(makeUser('aaz@sencha.com'));
                    expect(store.getAt(1).get('email')).toBe('aaz@sencha.com');
                });
            });
            
            describe("modifying the sorters", function() {
                beforeEach(function() {
                    createStore({
                        remoteSort: true
                    });
                });
                
                describe("the sorter collection", function() {
                    it("should trigger a load when adding a sorter", function() {
                        spyOn(store, 'load');
                        store.getSorters().add('name');
                        expect(store.load.callCount).toBe(1);
                    });

                    it("should trigger a load when adding to an existing sorter", function() {
                        store.getSorters().add('name');
                        spyOn(store, 'load');
                        store.getSorters().add('evilness');
                        expect(store.load.callCount).toBe(1);
                    });

                    it("should not trigger a load when removing the only sorter", function() {
                        store.getSorters().add('name');
                        spyOn(store, 'load');
                        store.getSorters().remove('name');
                        expect(store.load).not.toHaveBeenCalled();
                    });

                    it("should trigger a load when removing a sorter and there are others remaining", function() {
                        store.getSorters().add('name');
                        store.getSorters().add('evilness');
                        spyOn(store, 'load');
                        store.getSorters().remove('name');
                        expect(store.load.callCount).toBe(1);
                    });
                });
                
                describe("the sort method", function() {
                    it("should trigger a load without modifying the sorters if called with no params", function() {
                        store.getSorters().add('name');
                        spyOn(store, 'load');
                        store.sort();
                        expect(store.load.callCount).toBe(1);
                        expect(store.getSorters().getCount()).toBe(1);
                    });

                    it("should trigger a load when toggling an existing sorter", function() {
                        store.getSorters().add('name');
                        spyOn(store, 'load');
                        store.sort('name');
                        expect(store.load.callCount).toBe(1);
                        expect(store.getSorters().getCount()).toBe(1);
                    });

                    it("should trigger a load when adding a new sorter", function() {
                        store.getSorters().add('name');
                        spyOn(store, 'load');
                        store.sort('age', 'DESC');
                        expect(store.load.callCount).toBe(1);
                        expect(store.getSorters().getCount()).toBe(1);
                    });
                });
            });
            
            describe("store data", function() {
                it("should ignore sortOnLoad", function() {
                    createStore({
                        remoteSort: true,
                        sorters: ['name'],
                        sortOnLoad: false,
                        proxy: {
                            type: 'ajax',
                            url: 'fakeurl'
                        }
                    }); 
                    store.load();
                    completeWithData([{
                        name: 'ZZZ'
                    }, {
                        name: 'AAA'
                    }]);
                
                    expect(store.first().get('name')).toBe('ZZZ');
                });
                
                it("should not sort the data when the store load has completed", function() {
                    createStore({
                        remoteSort: true,
                        proxy: {
                            type: 'ajax',
                            url: 'fakeurl'
                        }
                    }); 
                    store.getSorters().add('name');
                    completeWithData([{
                        name: 'ZZZ'
                    }, {
                        name: 'AAA'
                    }]);
                
                    expect(store.first().get('name')).toBe('ZZZ');
                });
                
                it("should not sort the data when adding a record", function() {
                    createStore({
                        remoteSort: true,
                        proxy: {
                            type: 'ajax',
                            url: 'fakeurl'
                        }
                    }); 
                    store.getSorters().add('name');
                    addStoreData();
                    expect(store.first().get('name')).toBe('Ed Spencer');
                });
            });
        });
        
        describe("events", function() {
            var spy;
            beforeEach(function() {
                createStore({
                    proxy:  'memory',
                    remoteSort: true
                });
                spy = jasmine.createSpy();
            });

            it("should fire the sort event when adding a sorter to an empty collection", function() {
                store.on('sort', spy);
                store.getSorters().add('name');
                expect(spy.callCount).toBe(1);
                var args = spy.mostRecentCall.args;
                expect(args[0]).toBe(store);
                expect(args[1].length).toBe(1);
                expect(args[1][0].getProperty()).toBe('name');
                expect(args[1][0].getDirection()).toBe('ASC');
            });

            it("should fire the sort event when adding a sorter to existing sorters", function() {
                store.getSorters().add('name');
                store.on('sort', spy);
                store.getSorters().add('evilness');
                expect(spy.callCount).toBe(1);
                var args = spy.mostRecentCall.args;
                expect(args[0]).toBe(store);
                expect(args[1].length).toBe(2);
                expect(args[1][0].getProperty()).toBe('name');
                expect(args[1][0].getDirection()).toBe('ASC');
                expect(args[1][1].getProperty()).toBe('evilness');
                expect(args[1][1].getDirection()).toBe('ASC');
            });

            it("should fire when removing a sorter from existing sorters", function() {
                store.getSorters().add('name');
                store.getSorters().add('evilness');
                store.on('sort', spy);
                store.getSorters().remove('name');
                expect(spy.callCount).toBe(1);
                var args = spy.mostRecentCall.args;
                expect(args[0]).toBe(store);
                expect(args[1].length).toBe(1);
                expect(args[1][0].getProperty()).toBe('evilness');
                expect(args[1][0].getDirection()).toBe('ASC');
            });

            it("should fire when removing the last sorter", function() {
                store.getSorters().add('name');
                store.on('sort', spy);
                store.getSorters().remove('name');
                expect(spy.callCount).toBe(1);
                var args = spy.mostRecentCall.args;
                expect(args[0]).toBe(store);
                expect(args[1].length).toBe(0);
            });
            
            describe("local", function() {
                beforeEach(function() {
                    store.setRemoteSort(false);
                });
                
                describe("adding", function() {
                    it("should fire the refresh event", function() {
                        store.on('refresh', spy);
                        store.getSorters().add('name');
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe(store);
                    });

                    it("should fire the datachanged event", function() {
                        store.on('datachanged', spy);
                        store.getSorters().add('name');
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe(store);
                    });
                });
                
                describe("removing", function() {
                    it("should fire the refresh event when we remove the non-last sorter", function() {
                        store.getSorters().add('name');
                        store.getSorters().add('evilness');
                        store.on('refresh', spy);
                        store.getSorters().remove('name');
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe(store);
                    });
                    
                    it("should fire the datachanged event when we remove the non-last sorter", function() {
                        store.getSorters().add('name');
                        store.getSorters().add('evilness');
                        store.on('datachanged', spy);
                        store.getSorters().remove('name');
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe(store);
                    });
                    
                    
                    it("should not fire either event if we remove the last sorter", function() {
                        store.getSorters().add('name');
                        store.on('refresh', spy);
                        store.on('datachanged', spy);
                        store.getSorters().remove('name');
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });

            describe("remote", function() {

                // Remote loads synchronously from memory proxy, so refresh and datachanged events fire synchronously
                describe("adding", function() {
                    it("should fire refresh when adding a sorter", function() {
                        store.on('refresh', spy);
                        store.sort('email');
                        expect(spy.callCount).toBe(1);
                    });
                
                    it("should fire datachanged when adding a sorter", function() {
                        store.on('datachanged', spy);
                        store.sort('email');
                        expect(spy.callCount).toBe(1);
                    });
                });
                
                describe("removing", function() {
                    it("should fire refresh when removing a the non-last sorter", function() {
                        store.sort('email');

                        // MUST use append mode, otherwise store replaces the existing sorter, and the remove will not do anything
                        store.sort('evilness', null, 'append');
                        store.on('refresh', spy);
                        store.getSorters().remove('email');
                        expect(spy.callCount).toBe(1);
                    });
                
                    it("should fire datachanged when removing the non-last sorter", function() {
                        store.sort('email');

                        // MUST use append mode, otherwise store replaces the existing sorter, and the remove will not do anythin
                        store.sort('evilness', null, 'append');
                        store.on('datachanged', spy);
                        store.getSorters().remove('email');
                        expect(spy.callCount).toBe(1);
                    });
                });
            });

            describe("remote async", function() {
                beforeEach(function() {
                    createStore({
                        remoteSort: true
                    });
                    spy = jasmine.createSpy();
                });

                // Remote loads asynchronously from ajax proxy here, so refresh and datachaged events will not fire synchronously
                describe("adding", function() {
                    it("should not fire refresh when adding a sorter", function() {
                        store.on('refresh', spy);
                        store.sort('email');
                        expect(spy).not.toHaveBeenCalled();
                    });
                
                    it("should not fire datachanged when adding a sorter", function() {
                        store.on('datachanged', spy);
                        store.sort('email');
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
                
                describe("removing", function() {
                    it("should not fire refresh when removing a the non-last sorter", function() {
                        store.sort('email');
                        store.sort('evilness');
                        store.on('refresh', spy);
                        store.getSorters().remove('email');
                        expect(spy).not.toHaveBeenCalled();
                    });
                
                    it("should not fire datachanged when removing the non-last sorter", function() {
                        store.sort('email');
                        store.sort('evilness');
                        store.on('datachanged', spy);
                        store.getSorters().remove('email');
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });
        });
    });
    
    describe("grouping", function() {
        var groups;
            
        function groupBy(property, direction) {
            store.setGrouper({
                property: property || 'group',
                direction: direction
            });
        }
        
        function clearGroup() {
            store.setGrouper(null);
        }
        
        function sortBy(property, direction) {
            store.getSorters().add({
                property: property,
                direction: direction
            });
        }
        
        function filterBy(property, value) {
            store.getFilters().add({
                property: property,
                value: value
            });
        }

        describe('groupDir and the group() method', function () {
            it('should default to "ASC"', function () {
                createStore();

                expect(store.getGroupDir()).toBe('ASC');
            });

            it('should default to "ASC" when calling group()', function () {
                createStore();

                store.group('name');

                expect(store.getGrouper().getDirection()).toBe('ASC');
            });

            it('should use whatever was set in the config when calling group()', function () {
                createStore({
                    groupDir: 'DESC'
                });

                store.group('email');

                expect(store.getGrouper().getDirection()).toBe('DESC');
            });
        });
        
        describe("getGroupField", function() {
            beforeEach(function() {
                createStore();
            });
            
            it("should default to ''", function() {
                expect(store.getGroupField()).toBe('');
            });
            
            it("should return the field name when grouped", function() {
                store.group('evilness');
                expect(store.getGroupField()).toBe('evilness');
            });
            
            it("should return '' when grouping is cleared", function() {
                store.group('evilness');
                store.clearGrouping();
                expect(store.getGroupField()).toBe('');
            });
        });
        
        describe("group method", function() {
            beforeEach(function() {
                createStore();
            });
            
            it("should accept a field name & direction", function() {
                store.group('group', 'DESC');
                var grouper = store.getGrouper();
                expect(grouper.getProperty()).toBe('group');
                expect(grouper.getDirection()).toBe('DESC');
            });
            
            it("should overwrite an existing grouper", function() {
                store.group('group', 'ASC');
                store.group('evilness', 'DESC');
                
                var grouper = store.getGrouper();
                expect(grouper.getProperty()).toBe('evilness');
                expect(grouper.getDirection()).toBe('DESC');
            });
        });
        
        describe("clearGrouping method", function() {
            it("should clear existing groupers", function() {
                createStore();
                store.group('evilness');
                store.clearGrouping();
                expect(store.getGrouper()).toBe(null);
            });
        });
        
        describe("isGrouped", function() {
            beforeEach(function() {
                createStore();
            });
            
            it("should default to false", function() {
                expect(store.isGrouped()).toBe(false);
            });
            
            it("should return true when the store has a grouper", function() {
                store.group('evilness');
                expect(store.isGrouped()).toBe(true);
            });
            
            it("should return false when the grouper is removed", function() {
                store.group('evilness');
                store.setGrouper(null);
                expect(store.isGrouped()).toBe(false);
            });
        });
        
        describe("local", function() {
            beforeEach(function() {
                createStore({
                    remoteSort: false
                });
                addStoreData();
            });

            describe("during construction", function() {
                it("should create groups", function() {
                    createStore({
                        remoteSort: false,
                        grouper: {
                            property: 'group'
                        }
                    });
                    addStoreData();
                    groups = store.getGroups();
                    expect(groups.getCount()).toBe(2);
                });
            });

            it("should group by the specified key", function() {
                groupBy();
                groups = store.getGroups();
                expect(groups.getCount()).toBe(2);
            });

            it("should have the appropriate item in each group", function() {
                groupBy();
                groups = store.getGroups();
                expect(groups.first().getGroupKey()).toBe('admin');
                expect(groups.last().getGroupKey()).toBe('code');
            });

            describe("clearing groups", function() {
                it("should return no groups by default", function() {
                    expect(store.getGroups()).toBeNull();
                }); 

                it("should return no groups once the grouper has cleared", function() {
                    groupBy();
                    store.getGroups();
                    clearGroup();
                    expect(store.getGroups()).toBeNull();
                });
            });

            describe("dynamic manipulation", function() {
                describe("adding", function() {
                    it("should add to an existing group", function() {
                        groupBy();

                        store.add({
                            email: 'new@sencha.com',
                            group: 'admin'
                        });

                        var admins = store.getGroups().get('admin');
                        expect(admins.getCount()).toBe(3);
                        expect(admins.indexOfKey('new@sencha.com')).toBe(2);
                    });

                    it("should create a new group", function() {
                        groupBy();
                        expect(store.getGroups().get('test')).toBeUndefined();                    
                        store.add({
                            email: 'new@sencha.com',
                            group: 'test'
                        });
                        var tests = store.getGroups().get('test');
                        expect(tests.getCount()).toBe(1);
                        expect(tests.indexOfKey('new@sencha.com')).toBe(0);
                    });

                    it("should add to an existing group before add event", function() {
                        groupBy();

                        var admins = store.getGroups().get('admin');

                        store.on({
                            add: function () {
                                expect(admins.getCount()).toBe(3);
                                expect(admins.indexOfKey('new@sencha.com')).toBe(2);
                            }
                        });

                        store.add({
                            email: 'new@sencha.com',
                            group: 'admin'
                        });
                    });

                    it("should position items correctly when adding multiple items", function() {
                        groupBy();
                        var new1 = makeUser('new1@sencha.com', {
                            group: 'code'
                        }), new2 = makeUser('new2@sencha.com', {
                            group: 'admin'
                        });
                        store.add([new1, new2]);
                        expect(store.indexOf(new1)).toBe(5);
                        expect(store.indexOf(new2)).toBe(2);
                    });
                });

                describe("removing", function() {
                    it("should remove from an existing group", function() {
                        groupBy();
                        store.remove(abeRec);
                        var admins = store.getGroups().get('admin');
                        expect(admins.getCount()).toBe(1);
                        expect(admins.contains(abeRec)).toBe(false);
                    });

                    it("should remove a group", function() {
                        store.remove(abeRec);
                        groupBy();
                        store.remove(aaronRec);
                        expect(store.getGroups().get('admin')).toBeUndefined();
                    });

                    it("should remove from an existing group before remove event", function() {
                        groupBy();

                        var admins = store.getGroups().get('admin');

                        store.on({
                            remove: function () {
                                expect(admins.getCount()).toBe(1);
                                expect(admins.contains(abeRec)).toBe(false);
                            }
                        });

                        store.remove(abeRec);
                    });

                    describe('using removeAt', function () {
                        it('should remove the record from its group', function () {
                            var admins;

                            groupBy();
                            admins = store.getGroups().get('admin');

                            expect(admins.contains(abeRec)).toBe(true);

                            store.removeAt(0);

                            expect(admins.contains(abeRec)).toBe(false);
                        });

                        it('should remove a range of records from their groups', function () {
                            var admins, codes;

                            groupBy();
                            admins = store.getGroups().get('admin');
                            codes = store.getGroups().get('code');

                            expect(codes.contains(edRec)).toBe(true);
                            expect(codes.contains(tommyRec)).toBe(true);
                            expect(admins.contains(aaronRec)).toBe(true);

                            store.removeAt(1, 3);

                            expect(codes.contains(edRec)).toBe(false);
                            expect(codes.contains(tommyRec)).toBe(false);
                            expect(admins.contains(aaronRec)).toBe(false);
                            // The second group has been removed because all its items were removed.
                            expect(store.getGroups().length).toBe(1);
                        });
                    });

                    describe('using removeAll', function () {
                        it('should remove the groups', function () {
                            var admins, groups;

                            groupBy();
                            groups = store.getGroups();

                            admins = groups.get('admin');

                            expect(groups.length).toBe(2);

                            store.removeAll();

                            expect(groups.length).toBe(0);
                        });
                    });

                    describe('phantom group records', function () {
                        it('should remove phantoms from their groups', function () {
                            var admins;

                            groupBy();
                            admins = store.getGroups().get('admin');

                            var data = [
                                { name: 'Phil' },
                                { name: 'Evan' },
                                { name: 'Nige' },
                                { name: 'Alex' }
                            ],
                            record;

                            // Destroy the store created in the beforeEach(). We need a store of phantom records.
                            store.destroy();

                            // Use an ajax proxy with local data to so it doesn't go through the reader and marked as non-phantom.
                            store = new Ext.data.Store({
                                fields: ['name'],
                                data: data,
                                groupField: 'name',
                                proxy: {
                                    type: 'ajax'
                                }
                            });

                            record = store.getAt(0);

                            expect(record.phantom).toBe(true);

                            store.remove(record);

                            expect(store.getGroups().getAt(0).contains(record)).toBe(false);
                        });
                    });
                });

                describe("updating", function() {
                    it("should move the item if the group changes but the record does not change position", function() {
                        groupBy();

                        var index = store.indexOf(aaronRec);
                        aaronRec.set('group', 'code');

                        var admins = store.getGroups().get('admin'),
                            coders = store.getGroups().get('code');

                        expect(admins.getCount()).toBe(1);
                        expect(admins.contains(aaronRec)).toBe(false);
                        expect(coders.getCount()).toBe(3);
                        expect(coders.contains(aaronRec)).toBe(true);
                        expect(store.indexOf(aaronRec)).toBe(index);
                    });

                    it("should move the item if the group changes and the record changes position", function() {
                        groupBy();
                        var index = store.indexOf(abeRec);
                        abeRec.set('group', 'code');

                        var admins = store.getGroups().get('admin'),
                            coders = store.getGroups().get('code');

                        expect(admins.getCount()).toBe(1);
                        expect(admins.contains(abeRec)).toBe(false);
                        expect(coders.getCount()).toBe(3);
                        expect(coders.contains(abeRec)).toBe(true);
                        expect(store.indexOf(abeRec)).not.toBe(index);
                    });
                });
            });

            describe("sorting", function() {
                function expectOrder(recs, s) {
                    var len = recs.length,
                        i;

                    s = s || store;
                    for (i = 0; i < len; ++i) {
                        expect(s.getAt(i)).toBe(recs[i]);
                    }
                }

                it("should sort the items in the collection by group", function() {
                    store.removeAll();
                    store.add(tommyRec, aaronRec, edRec, abeRec);
                    groupBy('group', 'ASC');
                    expectOrder([aaronRec, abeRec, tommyRec, edRec]);
                });

                it("should sort the groups according to the group direction", function() {
                    store.removeAll();
                    store.add(abeRec, aaronRec, tommyRec, edRec);
                    groupBy('group', 'DESC');
                    expectOrder([tommyRec, edRec, abeRec, aaronRec]);
                });

                it("should use the natural order inside the groups", function() {
                    store.removeAll();
                    store.add(tommyRec, aaronRec, edRec, abeRec);
                    groupBy();
                    expectOrder([aaronRec, abeRec, tommyRec, edRec]);
                    var groups = store.getGroups();
                    expectOrder([aaronRec, abeRec], groups.get('admin'));
                    expectOrder([tommyRec, edRec], groups.get('code'));
                });

                it("should insert the record into the correct collection position", function() {
                    store.removeAll();
                    store.add(aaronRec, tommyRec);
                    groupBy('email');
                    store.add(edRec);
                    expect(store.indexOf(edRec)).toBe(1);
                });

                it("should sort the groups by the sorterFn", function() {
                    store.setGrouper({
                        property: 'group',
                        sorterFn: function(a, b) {
                            a = a.get('group');
                            b = b.get('group');

                            if (a === b) {
                                return 0;
                            }
                            // Inverted on purpose to test sorter
                            return a < b ? 1 : -1;
                        }
                    });
                    var groups = store.getGroups();
                    expect(groups.getAt(0).getGroupKey()).toBe('code');
                    expect(groups.getAt(1).getGroupKey()).toBe('admin');
                });

                describe("with sorters", function() {
                    it("should sort the collection by grouper first", function() {
                        sortBy('evilness');
                        groupBy();
                        expectOrder([aaronRec, abeRec, tommyRec, edRec]);
                    });

                    it("should sort the new groups by the sorter", function() {
                        sortBy('evilness', 'DESC');
                        groupBy();
                        var groups = store.getGroups();
                        expectOrder([abeRec, aaronRec], groups.get('admin'));
                        expectOrder([edRec, tommyRec], groups.get('code'));
                    });

                    it("should sort existing groups by the sorter", function() {
                        groupBy();
                        sortBy('evilness', 'DESC');
                        var groups = store.getGroups();
                        expectOrder([abeRec, aaronRec], groups.get('admin'));
                        expectOrder([edRec, tommyRec], groups.get('code'));
                    });

                    it("should sort by the sorter after the groups have been cleared", function() {
                        sortBy('evilness');
                        groupBy();
                        clearGroup();
                        expectOrder([tommyRec, aaronRec, abeRec, edRec]);
                    });
                });
            });

            describe("filters", function() {
                it("should respect existing filters while grouping", function() {
                    filterBy('old', true);
                    groupBy();

                    var admins = store.getGroups().get('admin'),
                        coders = store.getGroups().get('code');

                    expect(admins.getCount()).toBe(1);
                    expect(admins.first()).toBe(aaronRec);

                    expect(coders.getCount()).toBe(1);
                    expect(coders.first()).toBe(tommyRec);
                });

                it("should filter existing groups", function() {
                    groupBy();
                    filterBy('old', true);

                    var admins = store.getGroups().get('admin'),
                        coders = store.getGroups().get('code');

                    expect(admins.getCount()).toBe(1);
                    expect(admins.first()).toBe(aaronRec);

                    expect(coders.getCount()).toBe(1);
                    expect(coders.first()).toBe(tommyRec);
                });

                it("should update groups when filters are cleared", function() {
                    filterBy('old', true);
                    groupBy();

                    store.clearFilter();

                    var groups = store.getGroups();

                    expect(groups.get('admin').getCount()).toBe(2);
                    expect(groups.get('code').getCount()).toBe(2);
                });

                it("should remove groups when required", function() {
                    groupBy();
                    store.getFilters().add({
                        filterFn: function(rec) {
                            return rec.get('name') === 'Ed Spencer';
                        }
                    });

                    var groups = store.getGroups();

                    expect(groups.get('admin')).toBeUndefined();
                    expect(groups.get('code').getCount()).toBe(1);
                });

                it("should add groups when required", function() {
                    groupBy();
                    var filters = store.getFilters();
                    filters.add({
                        filterFn: function(rec) {
                            return Ext.Array.indexOf(['Ed Spencer', 'Aaron Conran'], rec.get('name')) > -1;
                        }
                    }, {
                        filterFn: function(rec) {
                            return rec.get('name') === 'Aaron Conran';
                        }
                    });

                    var groups = store.getGroups();

                    expect(groups.get('admin').getCount()).toBe(1);
                    expect(groups.get('code')).toBeUndefined();

                    filters.remove(filters.last());

                    groups = store.getGroups();
                    expect(groups.get('admin').getCount()).toBe(1);
                    expect(groups.get('code').getCount()).toBe(1);
                });
            });
        });
        
        describe("remote", function() {
            describe("during construction", function() {
                it("should not trigger a load", function() {
                    var spy = spyOn(Ext.data.Store.prototype, 'load');
                    createStore({
                        remoteSort: true,
                        grouper: {
                            property: 'group'
                        }
                    });
                    expect(spy).not.toHaveBeenCalled();
                });
            });
            
            describe("dynamic groupers", function() {
                beforeEach(function() {
                    createStore({
                        remoteSort: true
                    });
                });
                
                describe("via group", function() {
                    it("should trigger a load when adding a grouper", function() {
                        spyOn(store, 'load');
                        store.group('group');
                        expect(store.load.callCount).toBe(1);
                    });

                    it("should not trigger a load when removing the grouper", function() {
                        store.group('group');
                        spyOn(store, 'load');
                        store.group(null);
                        expect(store.load).not.toHaveBeenCalled();
                    });

                    describe("with sorters", function() {
                        it("should only load once when adding a grouper and there are sorters", function() {
                            store.sort('name');
                            spyOn(store, 'load');
                            store.group('group');
                            expect(store.load.callCount).toBe(1);
                        });

                        it("should trigger a load when removing the grouper", function() {
                            store.getSorters().add('name');
                            store.group('group');
                            spyOn(store, 'load');
                            store.group(null);
                            expect(store.load.callCount).toBe(1);
                        });
                    });

                    
                });
                
                describe("via setGrouper", function() {
                    it("should trigger a load when adding a grouper", function() {
                        spyOn(store, 'load');
                        store.setGrouper({
                            property: 'group'
                        });
                        expect(store.load.callCount).toBe(1);
                    });

                    it("should not trigger a load when removing the grouper", function() {
                        store.setGrouper({
                            property: 'group'
                        });
                        spyOn(store, 'load');
                        store.setGrouper(null);
                        expect(store.load).not.toHaveBeenCalled();
                    });

                    describe("with sorters", function() {
                        it("should only load once when adding a grouper and there are sorters", function() {
                            store.getSorters().add('name');
                            spyOn(store, 'load');
                            store.setGrouper({
                                property: 'group'
                            });
                            expect(store.load.callCount).toBe(1);
                        });

                        it("should trigger a load when removing the grouper", function() {
                            store.getSorters().add('name');
                            store.setGrouper({
                                property: 'group'
                            });
                            spyOn(store, 'load');
                            store.setGrouper(null);
                            expect(store.load.callCount).toBe(1);
                        });
                    });
                });
            });

            describe("with remoteSort", function() {
                beforeEach(function() {
                    createStore({
                        remoteSort: true,
                        groupField: 'group'
                    });
                    edRaw.group = 'bots';
                });

                it("should leave the items in group order", function() {
                    store.load();
                    completeWithData([edRaw, tommyRaw, abeRaw, aaronRaw]);
                    expect(store.getAt(0).getId()).toBe('ed@sencha.com');
                    expect(store.getAt(1).getId()).toBe('tommy@sencha.com');
                    expect(store.getAt(2).getId()).toBe('abe@sencha.com');
                    expect(store.getAt(3).getId()).toBe('aaron@sencha.com');
                });

                it("should leave groups in order", function() {
                    store.load();
                    completeWithData([edRaw, tommyRaw, abeRaw, aaronRaw]);

                    var groups = store.getGroups(),
                        group;
                    
                    expect(groups.getCount()).toBe(3);

                    group = groups.getAt(0);
                    expect(group.getGroupKey()).toBe('bots');
                    expect(group.getCount()).toBe(1);
                    expect(group.getAt(0).getId()).toBe('ed@sencha.com');

                    group = groups.getAt(1);
                    expect(group.getGroupKey()).toBe('code');
                    expect(group.getCount()).toBe(1);
                    expect(group.getAt(0).getId()).toBe('tommy@sencha.com');

                    group = groups.getAt(2);
                    expect(group.getGroupKey()).toBe('admin');
                    expect(group.getCount()).toBe(2);
                    expect(group.getAt(0).getId()).toBe('abe@sencha.com');
                    expect(group.getAt(1).getId()).toBe('aaron@sencha.com');
                });
            })
        });
        
        describe("events", function() {
            var spy;
            
            beforeEach(function() {
                spy = jasmine.createSpy();
            });

            afterEach(function() {
                spy = null;
            });
            
            describe("local", function() {
                beforeEach(function() {
                    createStore({
                        remoteSort: false
                    });
                });
                
                describe("adding", function() {
                    describe("with no sorters", function() {
                        it("should trigger the groupchange event and pass the store & grouper", function() {
                            store.on('groupchange', spy);
                            store.group('group');
                            expect(spy.callCount).toBe(1);
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(store);
                            expect(args[1].getProperty()).toBe('group');
                            expect(args[1].getDirection()).toBe('ASC');
                        });

                        it("should trigger the refresh event", function() {
                            store.on('refresh', spy);
                            store.group('group');
                            expect(spy.callCount).toBe(1);
                            expect(spy.mostRecentCall.args[0]).toBe(store);
                        });
                
                        it("should trigger the datachanged event", function() {
                            store.on('datachanged', spy);
                            store.group('group');
                            expect(spy.callCount).toBe(1);
                            expect(spy.mostRecentCall.args[0]).toBe(store);
                        });

                        it("should not trigger the sort event", function() {
                            store.on('sort', spy);
                            store.group('group');
                            expect(spy).not.toHaveBeenCalled();
                        });
                    });

                    describe("with sorters", function() {
                        beforeEach(function() {
                            store.getSorters().add('name');
                        });

                        it("should trigger the groupchange event and pass the store & grouper", function() {
                            store.on('groupchange', spy);
                            store.group('group');
                            expect(spy.callCount).toBe(1);
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(store);
                            expect(args[1].getProperty()).toBe('group');
                            expect(args[1].getDirection()).toBe('ASC');
                        });

                        it("should trigger the refresh event", function() {
                            store.on('refresh', spy);
                            store.group('group');
                            expect(spy.callCount).toBe(1);
                            expect(spy.mostRecentCall.args[0]).toBe(store);
                        });
                
                        it("should trigger the datachanged event", function() {
                            store.on('datachanged', spy);
                            store.group('group');
                            expect(spy.callCount).toBe(1);
                            expect(spy.mostRecentCall.args[0]).toBe(store);
                        });

                        it("should not trigger the sort event", function() {
                            store.on('sort', spy);
                            store.group('group');
                            expect(spy).not.toHaveBeenCalled();
                        });
                    });
                });
                
                describe("removing", function() {
                    describe("with no sorters", function() {
                        it("should trigger the groupchange event", function() {
                            store.group('group');
                            store.on('groupchange', spy);
                            store.group(null);
                            expect(spy.callCount).toBe(1);
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(store);
                            expect(args[1]).toBeNull();
                        });

                        it("should not trigger the refresh event", function() {
                            store.group('group');
                            store.on('refresh', spy);
                            store.group(null);
                            expect(spy).not.toHaveBeenCalled();
                        });
                
                        it("should trigger the datachanged event", function() {
                            store.group('group');
                            store.on('datachanged', spy);
                            store.group(null);
                            expect(spy).not.toHaveBeenCalled();
                        });

                        it("should not trigger the sort event", function() {
                            store.group('group');
                            store.on('sort', spy);
                            store.group(null);
                            expect(spy).not.toHaveBeenCalled();
                        });
                    });

                    describe("with sorters", function() {
                        beforeEach(function() {
                            store.getSorters().add('email');
                        });

                        it("should trigger the groupchange event", function() {
                            store.group('group');
                            store.on('groupchange', spy);
                            store.group(null);
                            expect(spy.callCount).toBe(1);
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(store);
                            expect(args[1]).toBeNull();
                        })

                        it("should trigger the refresh event", function() {
                            store.group('group');
                            store.on('refresh', spy);
                            store.group(null);
                            expect(spy.callCount).toBe(1);
                            expect(spy.mostRecentCall.args[0]).toBe(store);
                        });
                
                        it("should trigger the datachanged event", function() {
                            store.group('group');
                            store.on('datachanged', spy);
                            store.group(null);
                            expect(spy.callCount).toBe(1);
                            expect(spy.mostRecentCall.args[0]).toBe(store);
                        });

                        it("should not trigger the sort event", function() {
                            store.group('group');
                            store.on('sort', spy);
                            store.group(null);
                            expect(spy).not.toHaveBeenCalled();
                        });
                    });
                });
            });
            
            describe("remote", function() {
                describe("with a synchronous proxy", function() {
                    beforeEach(function() {
                        createStore({
                            remoteSort: true,
                            proxy: {
                                type: 'memory'
                            }
                        });
                    });
                    describe("adding", function() {
                        describe("with no sorters", function() {
                            it("should trigger the groupchange event and pass the store & grouper", function() {
                                store.on('groupchange', spy);
                                store.group('group');
                                expect(spy.callCount).toBe(1);
                                var args = spy.mostRecentCall.args;
                                expect(args[0]).toBe(store);
                                expect(args[1].getProperty()).toBe('group');
                                expect(args[1].getDirection()).toBe('ASC');
                            });

                            it("should trigger the refresh event", function() {
                                store.on('refresh', spy);
                                store.group('group');
                                expect(spy.callCount).toBe(1);
                                expect(spy.mostRecentCall.args[0]).toBe(store);
                            });
                    
                            it("should trigger the datachanged event", function() {
                                store.on('datachanged', spy);
                                store.group('group');
                                expect(spy.callCount).toBe(1);
                                expect(spy.mostRecentCall.args[0]).toBe(store);
                            });

                            it("should not trigger the sort event", function() {
                                store.on('sort', spy);
                                store.group('group');
                                expect(spy).not.toHaveBeenCalled();
                            });
                        });

                        describe("with sorters", function() {
                            beforeEach(function() {
                                store.getSorters().add('name');
                            });

                            it("should trigger the groupchange event and pass the store & grouper", function() {
                                store.on('groupchange', spy);
                                store.group('group');
                                expect(spy.callCount).toBe(1);
                                var args = spy.mostRecentCall.args;
                                expect(args[0]).toBe(store);
                                expect(args[1].getProperty()).toBe('group');
                                expect(args[1].getDirection()).toBe('ASC');
                            });

                            it("should trigger the refresh event", function() {
                                store.on('refresh', spy);
                                store.group('group');
                                expect(spy.callCount).toBe(1);
                                expect(spy.mostRecentCall.args[0]).toBe(store);
                            });
                    
                            it("should trigger the datachanged event", function() {
                                store.on('datachanged', spy);
                                store.group('group');
                                expect(spy.callCount).toBe(1);
                                expect(spy.mostRecentCall.args[0]).toBe(store);
                            });

                            it("should not trigger the sort event", function() {
                                store.on('sort', spy);
                                store.group('group');
                                expect(spy).not.toHaveBeenCalled();
                            });
                        });
                    });
                    
                    describe("removing", function() {
                        describe("with no sorters", function() {
                            it("should trigger the groupchange event", function() {
                                store.group('group');
                                store.on('groupchange', spy);
                                store.group(null);
                                expect(spy.callCount).toBe(1);
                                var args = spy.mostRecentCall.args;
                                expect(args[0]).toBe(store);
                                expect(args[1]).toBeNull();
                            });

                            it("should not trigger the refresh event", function() {
                                store.group('group');
                                store.on('refresh', spy);
                                store.group(null);
                                expect(spy).not.toHaveBeenCalled();
                            });
                    
                            it("should trigger the datachanged event", function() {
                                store.group('group');
                                store.on('datachanged', spy);
                                store.group(null);
                                expect(spy).not.toHaveBeenCalled();
                            });

                            it("should not trigger the sort event", function() {
                                store.group('group');
                                store.on('sort', spy);
                                store.group(null);
                                expect(spy).not.toHaveBeenCalled();
                            });
                        });

                        describe("with sorters", function() {
                            beforeEach(function() {
                                store.getSorters().add('email');
                            });

                            it("should trigger the groupchange event", function() {
                                store.group('group');
                                store.on('groupchange', spy);
                                store.group(null);
                                expect(spy.callCount).toBe(1);
                                var args = spy.mostRecentCall.args;
                                expect(args[0]).toBe(store);
                                expect(args[1]).toBeNull();
                            })

                            it("should trigger the refresh event", function() {
                                store.group('group');
                                store.on('refresh', spy);
                                store.group(null);
                                expect(spy.callCount).toBe(1);
                                expect(spy.mostRecentCall.args[0]).toBe(store);
                            });
                    
                            it("should trigger the datachanged event", function() {
                                store.group('group');
                                store.on('datachanged', spy);
                                store.group(null);
                                expect(spy.callCount).toBe(1);
                                expect(spy.mostRecentCall.args[0]).toBe(store);
                            });

                            it("should not trigger the sort event", function() {
                                store.group('group');
                                store.on('sort', spy);
                                store.group(null);
                                expect(spy).not.toHaveBeenCalled();
                            });
                        });
                    });
                });

                describe("with an asynchronous proxy", function() {
                    beforeEach(function() {
                        createStore({
                            remoteSort: true,
                            proxy: {
                                type: 'ajax',
                                url: 'foo'
                            }
                        });
                    });
                    describe("adding", function() {
                        describe("with no sorters", function() {
                            it("should trigger the groupchange event and pass the store & grouper after the load completes", function() {
                                store.on('groupchange', spy);
                                store.group('group');
                                expect(spy).not.toHaveBeenCalled();
                                completeWithData([]);
                                expect(spy.callCount).toBe(1);
                                var args = spy.mostRecentCall.args;
                                expect(args[0]).toBe(store);
                                expect(args[1].getProperty()).toBe('group');
                                expect(args[1].getDirection()).toBe('ASC');
                            });

                            it("should trigger the refresh event after the load completes", function() {
                                store.on('refresh', spy);
                                store.group('group');
                                expect(spy).not.toHaveBeenCalled();
                                completeWithData([]);
                                expect(spy.callCount).toBe(1);
                                expect(spy.mostRecentCall.args[0]).toBe(store);
                            });
                    
                            it("should trigger the datachanged event after the load completes", function() {
                                store.on('datachanged', spy);
                                store.group('group');
                                expect(spy).not.toHaveBeenCalled();
                                completeWithData([]);
                                expect(spy.callCount).toBe(1);
                                expect(spy.mostRecentCall.args[0]).toBe(store);
                            });

                            it("should not trigger the sort event", function() {
                                store.on('sort', spy);
                                store.group('group');
                                expect(spy).not.toHaveBeenCalled();
                                completeWithData([]);
                                expect(spy).not.toHaveBeenCalled();
                            });
                        });

                        describe("with sorters", function() {
                            beforeEach(function() {
                                store.getSorters().add('name');
                                completeWithData([]);
                            });

                            it("should trigger the groupchange event and pass the store & grouper after the load completes", function() {
                                store.on('groupchange', spy);
                                store.group('group');
                                expect(spy).not.toHaveBeenCalled();
                                completeWithData([]);
                                expect(spy.callCount).toBe(1);
                                var args = spy.mostRecentCall.args;
                                expect(args[0]).toBe(store);
                                expect(args[1].getProperty()).toBe('group');
                                expect(args[1].getDirection()).toBe('ASC');
                            });

                            it("should trigger the refresh event", function() {
                                store.on('refresh', spy);
                                store.group('group');
                                expect(spy).not.toHaveBeenCalled();
                                completeWithData([]);
                                expect(spy.callCount).toBe(1);
                                expect(spy.mostRecentCall.args[0]).toBe(store);
                            });
                    
                            it("should trigger the datachanged event", function() {
                                store.on('datachanged', spy);
                                store.group('group');
                                expect(spy).not.toHaveBeenCalled();
                                completeWithData([]);
                                expect(spy.callCount).toBe(1);
                                expect(spy.mostRecentCall.args[0]).toBe(store);
                            });

                            it("should not trigger the sort event", function() {
                                store.on('sort', spy);
                                store.group('group');
                                expect(spy).not.toHaveBeenCalled();
                                completeWithData([]);
                                expect(spy).not.toHaveBeenCalled();
                            });
                        });
                    });
                    
                    describe("removing", function() {
                        beforeEach(function() {
                            store.group('group');
                            completeWithData([]);
                        });
                        describe("with no sorters", function() {
                            it("should trigger the groupchange event without loading", function() {
                                store.on('groupchange', spy);
                                store.group(null);
                                expect(spy.callCount).toBe(1);
                                var args = spy.mostRecentCall.args;
                                expect(args[0]).toBe(store);
                                expect(args[1]).toBeNull();
                            });

                            it("should not trigger the refresh event without loading", function() {
                                store.on('refresh', spy);
                                store.group(null);
                                expect(spy).not.toHaveBeenCalled();
                            });
                    
                            it("should trigger the datachanged event without loading", function() {
                                store.on('datachanged', spy);
                                store.group(null);
                                expect(spy).not.toHaveBeenCalled();
                            });

                            it("should not trigger the sort event", function() {
                                store.on('sort', spy);
                                store.group(null);
                                expect(spy).not.toHaveBeenCalled();
                            });
                        });

                        describe("with sorters", function() {
                            beforeEach(function() {
                                store.getSorters().add('email');
                                completeWithData([]);
                            });

                            it("should trigger the groupchange event after the load completes", function() {
                                store.on('groupchange', spy);
                                store.group(null);
                                expect(spy).not.toHaveBeenCalled();
                                completeWithData([]);
                                expect(spy.callCount).toBe(1);
                                var args = spy.mostRecentCall.args;
                                expect(args[0]).toBe(store);
                                expect(args[1]).toBeNull();
                            })

                            it("should trigger the refresh event after the load completes", function() {
                                store.on('refresh', spy);
                                store.group(null);
                                expect(spy).not.toHaveBeenCalled();
                                completeWithData([]);
                                expect(spy.callCount).toBe(1);
                                expect(spy.mostRecentCall.args[0]).toBe(store);
                            });
                    
                            it("should trigger the datachanged event after the load completes", function() {
                                store.on('datachanged', spy);
                                store.group(null);
                                expect(spy).not.toHaveBeenCalled();
                                completeWithData([]);
                                expect(spy.callCount).toBe(1);
                                expect(spy.mostRecentCall.args[0]).toBe(store);
                            });

                            it("should not trigger the sort event", function() {
                                store.on('sort', spy);
                                store.group(null);
                                expect(spy).not.toHaveBeenCalled();
                                completeWithData([]);
                                expect(spy).not.toHaveBeenCalled();
                            });
                        });
                    });
                });
            });
        });
    });
    
    describe("filtering", function() {
        describe("the filter collection", function() {
            it("should be an instance of Ext.util.FilterCollection", function() {
                createStore();
                expect(store.getFilters() instanceof Ext.util.FilterCollection).toBe(true);
            });

            it("should be empty by default", function() {
                createStore();
                expect(store.getFilters().getCount()).toBe(0);
            });

            it("should add any filters passed in the constructor", function() {
                createStore({
                    filters: [{
                        property: 'foo',
                        value: 'a'
                    }, {
                        property: 'bar',
                        value: 'b'
                    }]
                });
                var filter = store.getFilters().getAt(0);
                expect(filter.getProperty()).toBe('foo');
                expect(filter.getValue()).toBe('a');

                filter = store.getFilters().getAt(1);
                expect(filter.getProperty()).toBe('bar');
                expect(filter.getValue()).toBe('b');
            });

            it("should not set the rootProperty as data on the filter collection", function() {
                createStore();
                expect(store.getFilters().getRootProperty()).not.toBe('data');
            });

            it("should not trigger events when asking for the collection and it has not been created", function () {
                var spy = jasmine.createSpy();
                createStore({
                    listeners: {
                        filterchange: spy
                    }
                });
                store.getFilters();
                expect(spy).not.toHaveBeenCalled();
            });
        });

        describe("filter method", function() {
            beforeEach(function() {
                createStore();
            });
            
            it("should accept a field name & value", function() {
                store.filter('name', 'Ed Spencer');
                var filter = store.getFilters().first();
                expect(filter.getProperty()).toBe('name');
                expect(filter.getValue()).toBe('Ed Spencer');
            });
            
            it("should add to existing filters", function() {
                store.filter('group', 'code');
                store.filter('evilness', 100);
                var filter = store.getFilters().first();
                
                expect(store.getFilters().getCount()).toBe(2); 
                expect(filter.getProperty()).toBe('group');
                expect(filter.getValue()).toBe('code');
                
                filter = store.getFilters().last();
                expect(filter.getProperty()).toBe('evilness');
                expect(filter.getValue()).toBe(100);
            });
        });
        
        describe("filterBy", function() {
            var spy;
            beforeEach(function() {
                createStore();
                addStoreData();
                spy = jasmine.createSpy();
            });
            
            it("should add a persistent filter", function() {
                store.filterBy(spy);
                expect(store.getFilters().getCount()).toBe(1);
            });
            
            it("should pass along the filter fn", function() {
                store.filterBy(spy);
                expect(store.getFilters().first().getFilterFn()).toBe(spy);
            });
            
            it("should execute in the passed scope", function() {
                store.filterBy(spy, fakeScope);
                expect(spy.mostRecentCall.object).toBe(fakeScope);
            });
            
            it("should default the scope to the store", function() {
                store.filterBy(spy);
                expect(spy.mostRecentCall.object).toBe(store);
            });
        });
        
        describe("clearFilter method", function() {
            beforeEach(function() {
                createStore();
            });
            
            it("should remove all filters", function() {
                store.filter('evilness', 100);
                store.clearFilter();
                expect(store.getFilters().getCount()).toBe(0);
            });
            
            it("should trigger a load when using remoteFilter: true", function() {
                store.setRemoteFilter(true);
                store.filter('evilness', 100);
                spyOn(store, 'load');
                store.clearFilter();
                expect(store.load.callCount).toBe(1);
            });
            
            it("should trigger a load when using remoteFilter: true & passing suppressEvent", function() {
                store.setRemoteFilter(true);
                store.filter('evilness', 100);
                spyOn(store, 'load');
                store.clearFilter(true);
                expect(store.load).not.toHaveBeenCalled();
            });
            
            describe("events", function() {
                it("should not fire datachanged and refresh when suppress is passed", function() {
                    var spy = jasmine.createSpy();
                    store.filter('evilness', 100);
                    store.on('refresh', spy);
                    store.on('datachanged', spy);
                    store.clearFilter(true);
                    expect(spy).not.toHaveBeenCalled();
                });
            });
        });
        
        describe("isFiltered", function() {
            beforeEach(function() {
                createStore();
            });
            
            it("should default to false", function() {
                expect(store.isFiltered()).toBe(false);
            });
            
            it("should return true when filters are added", function() {
                store.filter('evilness', 100);
                expect(store.isFiltered()).toBe(true);
            });
            
            it("should return false when all filters are removed", function() {
                store.filter('evilness', 100);
                store.getFilters().remove('evilness');
                expect(store.isFiltered()).toBe(false);
            });
        });
        
        describe("local", function() {
            describe("during construction", function() {
                it("should filter an initial data set", function() {
                    createStore({
                        remoteFilter: false,
                        filters: [{
                            property: 'group',
                            value: 'code'
                        }],
                        data: [aaronRaw, edRaw, tommyRaw, abeRaw]
                    });
                    expect(store.getCount()).toBe(2);
                    expect(store.first().get('email')).toBe('ed@sencha.com');
                });
            });
            
            describe("dynamic filters", function() {
                beforeEach(function() {
                    createStore({
                        remoteFilter: false
                    });
                    addStoreData();
                });
                it("should filter the dataset when adding filters", function() {
                    store.filter('evilness', 100);
                    expect(store.first().get('email')).toBe('ed@sencha.com');
                    expect(store.getCount()).toBe(1);
                });
            
                it("should be able to use multiple filter", function() {
                    store.getFilters().add({
                        property: 'group',
                        value: 'code'
                    }, {
                        property: 'evilness',
                        value: 100
                    });
                    expect(store.first().get('email')).toBe('ed@sencha.com');
                    expect(store.getCount()).toBe(1);
                });
                
                it("should unfilter when removing a filter", function() {
                     store.getFilters().add({
                        property: 'group',
                        value: 'code'
                    }, {
                        property: 'evilness',
                        value: 100
                    });
                    store.getFilters().remove('evilness');
                    expect(store.getCount()).toBe(2);
                });
                
                it("should push records that are changed to match the filter to the end with no sort", function() {
                    store.removeAll();
                    store.add(aaronRec, abeRec, edRec, tommyRec);
                    store.filter('group', 'code');
                    aaronRec.set('group', 'code');
                    abeRec.set('group', 'code');
                    expect(store.indexOf(aaronRec)).toBe(2);
                    expect(store.indexOf(abeRec)).toBe(3);
                });
                
                describe("store methods while filtered", function() {
                    describe("getCount", function() {
                        it("should update the count to the filtered count", function() {
                            store.filter('group', 'code');
                            expect(store.getCount()).toBe(2);
                        });
                    });
                    
                    describe("indexOf", function() {
                        it("should report filtered out records as not being in the store", function() {
                            store.filter('group', 'admin');
                            expect(store.indexOf(edRec)).toBe(-1);
                        });
                    });
                    
                    describe("getRange", function() {
                        it("should only return the filtered records", function() {
                            store.filter('group', 'admin');
                            expect(store.getRange().length).toBe(2);
                        });
                    });
                    
                    describe("each", function() {
                        it("should only iterate the filtered items", function() {
                            store.filter('evilness', 100);
                            var spy = jasmine.createSpy();
                            store.each(spy);
                            expect(spy.callCount).toBe(1);
                        });
                    });
                    
                    describe("add", function() {
                        it("should be included in the active set if it matches the filter", function() {
                            store.filter('group', 'code');
                            store.add(makeUser('foo@sencha.com', {
                                group: 'code'
                            }));
                            expect(store.getCount()).toBe(3);
                            expect(store.indexOfId('foo@sencha.com')).toBe(2);
                        });
                        
                        it("should not be included in the active set if it doesn't match the filter or fire the add event", function() {
                            var spy = jasmine.createSpy();
                            store.filter('group', 'code');
                            store.on('add', spy);
                            store.add(makeUser('foo@sencha.com', {
                                group: 'admin'
                            }));
                            expect(store.getCount()).toBe(2);
                            expect(store.indexOfId('foo@sencha.com')).toBe(-1);
                            expect(spy).not.toHaveBeenCalled();
                        });
                        
                        it("should include unmatched added records when removing the filter", function() {
                            store.filter('group', 'code');
                            store.add(makeUser('foo@sencha.com', {
                                group: 'admin'
                            }));
                            store.clearFilter();
                            expect(store.getCount()).toBe(5);
                            expect(store.indexOfId('foo@sencha.com')).toBe(4);
                        });
                    });
                    
                    describe("remove", function() {
                        it("should not include a removed record after a filter is cleared", function() {
                            store.filter('group', 'code');
                            store.remove(edRec);
                            store.clearFilter();
                            expect(store.indexOf(edRec)).toBe(-1);
                        });
                        
                        it("should not remove records filtered out", function() {
                            store.filter('group', 'code');
                            store.remove(abeRec);
                            store.clearFilter();
                            expect(store.indexOf(abeRec)).toBe(1);
                        });
                    });
                    
                    describe("removeAll", function() {
                        it("should only remove the filtered items", function() {
                            store.filter('group', 'code');
                            store.removeAll();
                            store.clearFilter();
                            expect(store.getCount()).toBe(2);
                        });
                    });
                });
                
                describe("sorting", function() {
                    it("should restore any sort order when clearing a filter", function() {
                        store.sort('email', 'DESC');
                        store.getFilters().add({
                            filterFn: function(rec) {
                                // Includes Tommy/Ed
                                return rec.get('group') === 'code';
                            }
                        });
                        store.clearFilter();
                        expect(store.indexOf(tommyRec)).toBe(0);
                        expect(store.indexOf(edRec)).toBe(1);
                        expect(store.indexOf(abeRec)).toBe(2);
                        expect(store.indexOf(aaronRec)).toBe(3);
                    });
                });
            });

            describe("removal from collection", function() {
                beforeEach(function() {
                    createStore();
                    addStoreData();
                });

                it("should not add records to the removed collection when filtering the store", function() {
                    store.filter('group', 'code');
                    expect(store.getRemovedRecords()).toEqual([]);
                });

                it("should not add records to the removed collection when changing an item to be filtered", function() {
                    store.filter('group', 'code');
                    edRec.set('group', 'admin');
                    expect(store.getRemovedRecords()).toEqual([]);
                });
            });

            describe("joined status", function() {
                beforeEach(function() {
                    createStore();
                    addStoreData();
                });

                it("should remain joined when filtering the store", function() {
                    store.filter('group', 'code');
                    expect(abeRec.joined).toEqual([store]);
                });

                it("should remain joined when changing an item to be filtered", function() {
                    store.filter('group', 'code');
                    edRec.set('group', 'admin');
                    expect(edRec.joined).toEqual([store]);
                });

                it("should be joined when adding to the store but the item will be filtered", function() {
                    store.filter('group', 'code');
                    var rec = makeUser('new@sencha.com', {
                        group: 'admin'
                    });
                    store.add(rec);
                    expect(rec.joined).toEqual([store]);
                });
            });
        });
        
        describe("remote", function() {
            describe("errors", function() {
                beforeEach(function() {
                    createStore({
                        remoteFilter: true
                    });
                    addStoreData();
                });

                it("should raise an exception when calling filterBy", function() {
                    expect(function() {
                        store.filterBy(function() {});
                    }).toThrow();
                });

                it("should raise an exception when calling addFilter with a filterFn", function() {
                    expect(function() {
                        store.addFilter({
                            filterFn: function() {}
                        });
                    }).toThrow();
                });

                it("should raise an exception when adding a filter with a filterFn", function() {
                    expect(function() {
                        store.getFilters().add({
                            filterFn: function() {}
                        });
                    }).toThrow();
                });
            });

            describe("during construction", function() {
                it("should not trigger a load when applying initial filters", function() {
                    var spy = spyOn(Ext.data.Store.prototype, 'load');
                    createStore({
                        remoteFilter: true,
                        filters: [{
                            property: 'group',
                            value: 'code'
                        }]
                    });
                    expect(spy).not.toHaveBeenCalled();
                });
            });
            
            describe("modifying the filters", function() {
                beforeEach(function() {
                    createStore({
                        remoteFilter: true
                    });
                });
                
                describe("the filter collection", function() {
                    it("should trigger a load when adding a filter", function() {
                        spyOn(store, 'load');
                        store.getFilters().add({
                            property: 'group',
                            value: 'code'
                        });
                        expect(store.load.callCount).toBe(1);
                    });

                    it("should trigger a load when adding to an existing filter", function() {
                        store.getFilters().add({
                            property: 'group',
                            value: 'code'
                        });
                        spyOn(store, 'load');
                        store.getFilters().add({
                            property: 'evilness',
                            value: 100
                        });
                        expect(store.load.callCount).toBe(1);
                    });

                    it("should trigger a load when removing the only filter", function() {
                        store.getFilters().add({
                            property: 'group',
                            value: 'code'
                        });
                        spyOn(store, 'load');
                        store.getFilters().remove('group');
                        expect(store.load.callCount).toBe(1);
                    });

                    it("should trigger a load when removing a filter and there are others remaining", function() {
                        store.getFilters().add({
                            property: 'group',
                            value: 'code'
                        });
                        store.getFilters().add({
                            property: 'evilness',
                            value: 100
                        });
                        spyOn(store, 'load');
                        store.getFilters().remove('evilness');
                        expect(store.load.callCount).toBe(1);
                    });
                });
            });
            
            describe("store data", function() {
                beforeEach(function() {
                    createStore({
                        remoteFilter: true,
                        proxy: {
                            type: 'ajax',
                            url: 'fakeurl'
                        }
                    });    
                });
                
                it("should not filter the data when the store load has completed", function() {
                    store.getFilters().add({
                        property: 'group',
                        value: 'code'
                    });
                    completeWithData([aaronRaw, abeRaw]);
                    expect(store.getCount()).toBe(2);
                });
                
                it("should not filter the data when adding a record", function() {
                    store.getFilters().add({
                        property: 'group',
                        value: 'admin'
                    });
                    store.add(edRaw);
                    expect(store.getCount()).toBe(1);
                });
            });
        });
        
        describe("events", function() {
            beforeEach(function() {
                createStore({
                    remoteFilter: true
                });
            });

            it("should fire when adding a filter to an empty collection", function() {
                var spy = jasmine.createSpy();
                store.on('filterchange', spy);
                store.getFilters().add({
                    property: 'group',
                    value: 'code'
                });
                expect(spy.callCount).toBe(1);
                var args = spy.mostRecentCall.args;
                expect(args[0]).toBe(store);
                expect(args[1].length).toBe(1);
                expect(args[1][0].getProperty()).toBe('group');
                expect(args[1][0].getValue()).toBe('code');
            });

            it("should fire when adding a filter to existing filters", function() {
                var spy = jasmine.createSpy();
                store.getFilters().add({
                    property: 'group',
                    value: 'code'
                });
                store.on('filterchange', spy);
                store.getFilters().add({
                    property: 'evilness',
                    value: 100
                });
                expect(spy.callCount).toBe(1);
                var args = spy.mostRecentCall.args;
                expect(args[0]).toBe(store);
                expect(args[1].length).toBe(2);
                expect(args[1][0].getProperty()).toBe('group');
                expect(args[1][0].getValue()).toBe('code');
                expect(args[1][1].getProperty()).toBe('evilness');
                expect(args[1][1].getValue()).toBe(100);
            });

            it("should fire when removing a filter from existing filter", function() {
                var spy = jasmine.createSpy();
                store.getFilters().add({
                    property: 'group',
                    value: 'code'
                });
                store.getFilters().add({
                    property: 'evilness',
                    value: 100
                });
                store.on('filterchange', spy);
                store.getFilters().remove('group');
                expect(spy.callCount).toBe(1);
                var args = spy.mostRecentCall.args;
                expect(args[0]).toBe(store);
                expect(args[1].length).toBe(1);
                expect(args[1][0].getProperty()).toBe('evilness');
                expect(args[1][0].getValue()).toBe(100);
            });

            it("should fire when removing the last sorter", function() {
                var spy = jasmine.createSpy();
                store.getFilters().add({
                    property: 'group',
                    value: 'admin'
                });
                store.on('filterchange', spy);
                store.getFilters().remove('group');
                expect(spy.callCount).toBe(1);
                var args = spy.mostRecentCall.args;
                expect(args[0]).toBe(store);
                expect(args[1].length).toBe(0);
            });
            
            describe("local only", function() {
                beforeEach(function() {
                    store.setRemoteFilter(false);
                });
                
                describe("adding", function() {
                    it("should fire the refresh event", function() {
                        var spy = jasmine.createSpy();
                        store.on('refresh', spy);
                        store.getFilters().add({
                            property: 'group',
                            value: 'code'
                        });
                        expect(spy.callCount).toBe(1);
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(store);
                    });

                    it("should fire the datachanged event", function() {
                        var spy = jasmine.createSpy();
                        store.on('datachanged', spy);
                        store.getFilters().add({
                            property: 'group',
                            value: 'code'
                        });
                        expect(spy.callCount).toBe(1);
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(store);
                    });
                });
                
                describe("removing", function() {
                    it("should fire the refresh event", function() {
                        var spy = jasmine.createSpy();
                        store.getFilters().add({
                            property: 'group',
                            value: 'code'
                        });
                        store.on('refresh', spy);
                        store.getFilters().remove('group');
                        expect(spy.callCount).toBe(1);
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(store);
                    });

                    it("should fire the datachanged event", function() {
                        var spy = jasmine.createSpy();
                        store.getFilters().add({
                            property: 'group',
                            value: 'code'
                        });
                        store.on('datachanged', spy);
                        store.getFilters().remove('group');
                        expect(spy.callCount).toBe(1);
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(store);
                    });
                });
            });
        });
    });
    
    describe("aggregation", function(){     
    
        beforeEach(function() {
            createStore({
                remoteSort: false,
                grouper: {
                    property: 'group'
                },
                sorters: [{
                    property: 'email'
                }]
            });
            addStoreData();
            aaronRec = store.getAt(0);
            abeRec = store.getAt(1);
            edRec = store.getAt(2);
            tommyRec = store.getAt(3);
        });
       
        describe("first", function(){            
            it("should ignore the grouped parameter if there's no group field", function(){
                store.clearGrouping();
                expect(store.first(true)).toBe(aaronRec);
            });
            
            it("should return in the correct grouped format", function(){
                expect(store.first(true)).toEqual({
                    admin: aaronRec,
                    code: edRec
                });
            });
            
            it("should return an empty object if grouped and no items", function(){
                store.removeAll();
                expect(store.first(true)).toEqual({});
            });
        });
        
        describe("last", function(){
            it("should ignore the grouped parameter if there's no group field", function(){
                store.clearGrouping();
                expect(store.last(true)).toBe(tommyRec);
            });
            
            it("should return in the correct grouped format", function(){
                expect(store.last(true)).toEqual({
                    admin: abeRec,
                    code: tommyRec
                });
            });
            
            it("should return an empty object if grouped and no items", function(){
                store.removeAll();
                expect(store.last(true)).toEqual({});
            });
        });
        
        describe("sum", function(){
            it("should return 0 if the store is empty", function(){
                store.removeAll();
                expect(store.sum('evilness')).toBe(0);
            });
            
            it("should sum the values specified by the property", function(){
                expect(store.sum('evilness')).toBe(160);
            });
            
            it("should ignore the grouped parameter if there's no group field", function(){
                store.clearGrouping();
                expect(store.sum('evilness', true)).toBe(160);
            });
            
            it("should return in the correct grouped format", function(){
                expect(store.sum('evilness', true)).toEqual({
                    admin: 75,
                    code: 85
                });
            });
            
            it("should return an empty object if grouped and no items", function(){
                store.removeAll();
                expect(store.sum('evilness', true)).toEqual({});
            });
        });
        
        describe("count", function(){
            it("should return 0 if the store is empty", function(){
                store.removeAll();
                expect(store.count()).toBe(0);
            });
            
            it("should count the values in the store", function(){
                expect(store.count()).toBe(4);
            });
            
            it("should ignore the grouped parameter if there's no group field", function(){
                store.clearGrouping();
                expect(store.count(true)).toBe(4);
            });
            
            it("should return in the correct grouped format", function(){
                expect(store.count(true)).toEqual({
                    admin: 2,
                    code: 2
                });
            });
            
            it("should return an empty object if grouped and no items", function(){
                store.removeAll();
                expect(store.count(true)).toEqual({});
            });
        });
        
        describe("min", function(){
            it("should return undefined if there are no items", function(){
                store.removeAll();
                expect(store.min('age')).toBeUndefined();
            });
            
            it("should return the minimum value", function(){
                expect(store.min('age')).toBe(20);
            });
            
            it("should ignore the grouped parameter if there's no group field", function(){
                store.clearGrouping();
                expect(store.min('age', true)).toBe(20);
            });
            
            it("should return in the correct grouped format", function(){
                expect(store.min('age', true)).toEqual({
                    admin: 20,
                    code: 25
                });
            });
            
            it("should return an empty object if grouped and no items", function(){
                store.removeAll();
                expect(store.min('age', true)).toEqual({});
            });
        });
        
        describe("max", function(){
            it("should return undefined if there are no items", function(){
                store.removeAll();
                expect(store.max('age')).toBeUndefined();
            });
            
            it("should return the maximum value", function(){
                expect(store.max('age')).toBe(70);
            });
            
            it("should ignore the grouped parameter if there's no group field", function(){
                store.clearGrouping();
                expect(store.max('age', true)).toBe(70);
            });
            
            it("should return in the correct grouped format", function(){
                expect(store.max('age', true)).toEqual({
                    admin: 26,
                    code: 70
                });
            });
            
            it("should return an empty object if grouped and no items", function(){
                store.removeAll();
                expect(store.max('age', true)).toEqual({});
            });
        });
        
        describe("average", function(){
            it("should return 0 if there are no items", function(){
                store.removeAll();
                expect(store.average('evilness')).toBe(0);
            });
            
            it("should return the correct average", function(){
                expect(store.average('evilness')).toBe(40);
            });
            
            it("should ignore the grouped parameter if there's no groupField", function(){
                store.clearGrouping();
                expect(store.average('evilness')).toBe(40);
            });
            
            it("should return in the correct grouped format", function(){
                expect(store.average('evilness', true)).toEqual({
                    admin: 37.5,
                    code: 42.5
                });
            });
            
            it("should return an empty object if grouped and no items", function(){
                store.removeAll();
                expect(store.average('evilness', true)).toEqual({});
            });
        });
        
        describe("aggregate", function(){
            it("should default the scope to the store", function(){
                var spy = jasmine.createSpy();
                store.aggregate(spy);
                expect(spy.mostRecentCall.object).toBe(store);
            });
            
            it("should use any custom scope", function(){
                var spy = jasmine.createSpy();
                store.aggregate(spy, fakeScope);
                expect(spy.mostRecentCall.object).toBe(fakeScope);
            });
            
            it("should call the custom function with an array of values & records", function(){
                var isArray = true;
                store.aggregate(function(records, values){
                    isArray = isArray && Ext.isArray(values) && Ext.isArray(records);
                }, null, false, 'email');
                expect(isArray).toBe(true);
            });
            
            it("should allow the field parameter to be optional", function(){
                var value;
                    
                store.aggregate(function(records, values){
                    value = values[0];
                });
                expect(value).toBeUndefined();
            });
            
            it("should pass the field values", function(){
                var emails;
                store.aggregate(function(records, values) {
                    emails = values;
                }, null, true, 'email');
                expect(emails).toEqual(['ed@sencha.com', 'tommy@sencha.com']);
            });
            
            describe("grouped", function(){
                it("should return an empty object if there are no groups", function(){
                    store.removeAll();
                    expect(store.aggregate(Ext.emptyFn, null, true)).toEqual({});
                });
            
                it("should return undefined if there is no groupField", function(){
                    store.clearGrouping();
                    expect(store.aggregate(Ext.emptyFn, null, true)).toBeUndefined();
                });

                it("should return the groups with the aggregated value", function(){
                    var result = store.aggregate(function(records, values){
                        return values.join('');
                    }, null, true, 'email');
                    expect(result).toEqual({
                        admin: 'aaron@sencha.comabe@sencha.com',
                        code: 'ed@sencha.comtommy@sencha.com'
                    });
                });
            });
        });
    });
    
    describe("updating records", function() {
        var spy;
        beforeEach(function() {
            createStore();
            addStoreData();
            spy = jasmine.createSpy();
        });
        
        describe("via set", function() {
            describe("a single value", function() {
                it("should fire the update event but not the datachanged event", function() {
                    var datachangedSpy = jasmine.createSpy();

                    store.on('update', spy);
                    store.on('datachanged', datachangedSpy);
                    edRec.set('name', 'Ned Spencer');
                    expect(spy.callCount).toBe(1);

                    // datachanged is only for record additions/removals
                    expect(datachangedSpy).not.toHaveBeenCalled();
                });
                
                it("should pass the store, model, type & modified field", function() {
                    store.on('update', spy);
                    edRec.set('name', 'Ned Spencer');
                    var args = spy.mostRecentCall.args;
                    expect(args[0]).toBe(store);
                    expect(args[1]).toBe(edRec);
                    expect(args[2]).toBe(Ext.data.Model.EDIT);
                    expect(args[3]).toEqual(['name']);
                });

                it("should not fire an event if the record was removed from the store", function() {
                    store.on('update', spy);
                    store.remove(edRec);
                    edRec.set('name', 'Ned Spencer');
                    expect(spy).not.toHaveBeenCalled();
                });
            });
            
            describe("multiple values", function() {
                it("should fire update once but not the datachanged event", function() {
                    var datachangedSpy = jasmine.createSpy();

                    store.on('update', spy);
                    store.on('datachanged', datachangedSpy);
                    edRec.set({
                        name: 'Ned Spencer',
                        evilness: 9000
                    });
                    expect(spy.callCount).toBe(1);

                    // datachanged is only for record additions/removals
                    expect(datachangedSpy).not.toHaveBeenCalled();
                });
                
                it("should pass the store, model, type & modified fields", function() {
                    store.on('update', spy);
                    edRec.set({
                        name: 'Ned Spencer',
                        evilness: 9000
                    });
                    var args = spy.mostRecentCall.args;
                    expect(args[0]).toBe(store);
                    expect(args[1]).toBe(edRec);
                    expect(args[2]).toBe(Ext.data.Model.EDIT);
                    expect(args[3]).toEqual(['name', 'evilness']);
                });

                it("should not fire an event if the record was removed from the store", function() {
                    store.on('update', spy);
                    store.remove(edRec);
                    edRec.set({
                        name: 'Ned Spencer',
                        evilness: 9000
                    });
                    expect(spy).not.toHaveBeenCalled();
                });
            });
            
            describe("changing the id", function() {
                it("should remap the id value", function() {
                    edRec.setId('ted@sencha.com');
                    expect(store.getById('ted@sencha.com')).toBe(edRec);
                });
                
                it("should remap the id even when filtered out", function() {
                    store.filterBy(function(rec) {
                        return rec !== edRec;
                    });
                    edRec.setId('red@sencha.com');
                    store.clearFilter();
                    expect(store.getById('red@sencha.com')).toBe(edRec);
                });
            });
            
            describe("when sorted", function() {
                it("should move the record into the correct position", function() {
                    store.sort('email');
                    tommyRec.set('email', 'aaa@sencha.com');
                    expect(store.indexOf(tommyRec)).toBe(0);
                });

                it("should not be moving if the position is changed", function() {
                    store.on('add', spy);
                    store.on('remove', spy);
                    store.sort('email');
                    tommyRec.set('name', 'Foo');
                    expect(spy).not.toHaveBeenCalled();
                });

                it("should be moving in the add/remove event if changing position", function() {
                    var add, remove;

                    store.on('remove', function() {
                        remove = store.isMoving(tommyRec);
                    });

                    store.on('add', function() {
                        add = store.isMoving(tommyRec);
                    })
                    store.sort('email');
                    tommyRec.set('email', 'aaa@sencha.com');
                    expect(remove).toBe(1);
                    expect(add).toBe(1);
                });
            });
            
            describe("when filtered", function() {
                describe("change causes the record to be excluded", function() {
                    it("should remove the record active set", function() {
                        store.filter('group', 'code');
                        edRec.set('group', 'admin');
                        expect(store.indexOf(edRec)).toBe(-1);
                    });
                    
                    it("should still fire the update event", function() {
                        store.on('update', spy);
                        store.filter('group', 'code');
                        edRec.set('group', 'admin');

                        // Data events still apply even when nodes are filtered from visibility
                        expect(spy.callCount).toBe(1);
                    });
                });
                
                describe("change causes the record to be included", function() {
                    it("should add the record to the active set if changed to match", function() {
                        store.filter('group', 'code');
                        aaronRec.set('group', 'code');
                        expect(store.indexOf(aaronRec)).toBe(2);
                    });
                    
                    it("should fire the update event", function() {
                        store.on('update', spy);
                        store.filter('group', 'code');
                        aaronRec.set('group', 'code');
                        expect(spy.callCount).toBe(1);
                    });
                });
            });
        });
        
        describe("via commit", function() {
            it("should fire the update event", function() {
                edRec.set('name', 'Foo');
                store.on('update', spy);
                edRec.commit();
                expect(spy.callCount).toBe(1);
            });
            
            it("should pass the store, model, type & null (modified fields)", function() {
                edRec.set('name', 'Foo');
                edRec.set('age', 40);
                store.on('update', spy);
                edRec.commit();
                var args = spy.mostRecentCall.args;
                expect(args[0]).toBe(store);
                expect(args[1]).toBe(edRec);
                expect(args[2]).toBe(Ext.data.Model.COMMIT);
                // Modified will be null, since we pass nothing to commit
                expect(args[3]).toBeNull();
            });

            it("should still fire the update event if the record is filtered out", function() {
                edRec.set('name', 'Foo');
                store.on('update', spy);
                store.filter('name', 'Aaron');
                edRec.commit();
                expect(spy.callCount).toBe(1);
            });

            it("should not fire the update event when removed", function() {
                edRec.set('name', 'Foo');
                store.on('update', spy);
                store.remove(edRec);
                edRec.commit();
                expect(spy).not.toHaveBeenCalled();
            });
        });
        
        describe("via reject", function() {
            it("should fire the update event", function() {
                edRec.set('name', 'Foo');
                store.on('update', spy);
                edRec.reject();
                expect(spy.callCount).toBe(1);
            });
            
            it("should pass the store, model, type & null (modified fields)", function() {
                edRec.set('name', 'Foo');
                store.on('update', spy);
                edRec.reject();
                var args = spy.mostRecentCall.args;
                expect(args[0]).toBe(store);
                expect(args[1]).toBe(edRec);
                expect(args[2]).toBe(Ext.data.Model.REJECT);
                expect(args[3]).toBeNull();
            });
            
            it("should still fire the update event if the record is filtered out", function() {
                edRec.set('name', 'Foo');
                store.on('update', spy);
                store.filter('name', 'Aaron');
                edRec.reject();
                expect(spy.callCount).toBe(1);
            });

            it("should not fire the update event when removed", function() {
                edRec.set('name', 'Foo');
                store.on('update', spy);
                store.remove(edRec);
                edRec.reject();
                expect(spy).not.toHaveBeenCalled();
            });
        });
        
        describe("via erase", function() {
            it("should remove the record from the store", function() {
                edRec.erase();
                expect(store.indexOf(edRec)).toBe(-1);

                // Because the erase operation communicates the destruction to the server,
                // it should not trigger the store to need a sync, and should not add to the to remove stack.
                expect(store.needsSync).toBe(false);
                expect(store.getRemovedRecords().length).toBe(0);
            });

            it("should fire the remove event", function() {
                store.on('remove', spy);
                edRec.erase();
                expect(spy.callCount).toBe(1);
            });
        });

        describe("via drop", function() {
            it("should remove the record from the store", function() {
                edRec.drop();
                expect(store.indexOf(edRec)).toBe(-1);
            });

            it("should remove the record from the store", function() {
                store.on('remove', spy);
                edRec.drop();
                expect(spy.callCount).toBe(1);
            });
        });
    });

    describe("commitChanges", function() {
        beforeEach(function() {
            createStore();
            addStoreData();
        });

        describe("committing records", function() {
            it("should commit valid phantoms", function() {
                var phantom = store.add({
                    validField: 'Foo'
                })[0];
                spyOn(phantom, 'commit');
                store.commitChanges();
                expect(phantom.commit.callCount).toBe(1);
            });

            it("should not commit invalid phantoms", function() {
                var phantom = store.add({
                    validField: null
                })[0];
                spyOn(phantom, 'commit');
                store.commitChanges();
                expect(phantom.commit).not.toHaveBeenCalled();
            });

            it("should commit valid dirty non-phantoms", function() {
                edRec.set('validField', 'Foo');
                spyOn(edRec, 'commit');
                store.commitChanges();
                expect(edRec.commit.callCount).toBe(1);
            });

            it("should not commit invalid dirty non-phantoms", function() {
                edRec.set('validField', null);
                spyOn(edRec, 'commit');
                store.commitChanges();
                expect(edRec.commit).not.toHaveBeenCalled();
            });

            it("should not commit non-dirty records", function() {
                edRec.set('validField', 'foo');
                edRec.commit();
                spyOn(edRec, 'commit');
                store.commitChanges();
                expect(edRec.commit).not.toHaveBeenCalled();

            });
        });
        
        describe("removed collection", function() {
            it("should clear the removed collection", function() {
                store.remove(abeRec);
                store.remove(aaronRec);
                expect(store.getCount()).toBe(2);
                expect(store.removed.length).toBe(2);
                store.commitChanges();
                expect(store.removed.length).toBe(0);
                expect(store.getCount()).toBe(2);
            });
        });

        describe("events", function() {
            it("should fire an update event for each record", function() {
                var spy = jasmine.createSpy();
                edRec.set('validField', 'A');
                aaronRec.set('validField', 'B');
                tommyRec.set('validField', 'C');
                store.on('update', spy);
                store.commitChanges();
                expect(spy.callCount).toBe(3);
                expect(spy.calls[0].args[1]).toBe(edRec);
                expect(spy.calls[1].args[1]).toBe(aaronRec);
                expect(spy.calls[2].args[1]).toBe(tommyRec);
            });
        });
    });

    describe("rejectChanges", function() {
        beforeEach(function() {
            createStore();
            addStoreData();
        });

        describe("rejecting records", function() {
            it("should reject dirty records", function() {
                edRec.set('name', 'Foo');
                var spy = spyOn(edRec, 'reject');
                store.rejectChanges();
                expect(spy.callCount).toBe(1);
            });

            it("should reject phantom records", function() {
                var phantom = store.add({
                    name: 'X'
                })[0];
                var spy = spyOn(phantom, 'reject');
                store.rejectChanges();
                expect(spy.callCount).toBe(1);
            });

            it("should reject phantom + dirty records", function() {
                var phantom = store.add({
                    name: 'X'
                })[0];
                phantom.set('name', 'Y');
                var spy = spyOn(phantom, 'reject');
                store.rejectChanges();
                expect(spy.callCount).toBe(1);
            });

            it("should not reject non-phantom non-dirty records", function() {
                var edSpy = spyOn(edRec, 'reject'),
                    abeSpy = spyOn(abeRec, 'reject'),
                    aaronSpy = spyOn(aaronRec, 'reject'),
                    tommySpy = spyOn(tommyRec, 'reject');

                store.rejectChanges();
                expect(edSpy).not.toHaveBeenCalled();
                expect(abeSpy).not.toHaveBeenCalled();
                expect(aaronSpy).not.toHaveBeenCalled();
                expect(tommySpy).not.toHaveBeenCalled();
            });
        });

        describe("removing phantoms", function() {
            it("should remove phantoms", function() {
                var phantom1 = store.insert(2, {
                    name: 'X'
                })[0];

                var phantom2 = store.add({
                    name: 'Y'
                })[0];

                expect(store.getCount()).toBe(6);
                store.rejectChanges();
                expect(store.getCount()).toBe(4);
                expect(store.indexOf(phantom1)).toBe(-1);
                expect(store.indexOf(phantom2)).toBe(-1);
            });
        });

        describe("re-adding removed records", function() {
            it("should re-insert removed records", function() {
                store.remove(abeRec);
                expect(store.getCount()).toBe(3);
                store.rejectChanges();
                expect(store.getAt(1)).toBe(abeRec);
            });

            it("should clear the removed queue", function() {
                store.remove(abeRec);
                expect(store.removed.length).toBe(1);
                store.rejectChanges();
                expect(store.removed.length).toBe(0);
            });

            describe('with and without sorters', function () {
                function doTests(sorter) {
                    var count;

                    beforeEach(function () {
                        if (sorter) {
                            store.sort(sorter);
                        }

                        count = store.count;
                    });

                    afterEach(function () {
                        count = null;
                    });

                    it('should reject dropped records', function () {
                        store.getAt(0).drop();
                        store.rejectChanges();
                        expect(store.count).toBe(count);
                    });

                    it('should reject erased records', function () {
                        store.getAt(0).erase();
                        store.rejectChanges();
                        expect(store.count).toBe(count);
                    });
                }

                doTests(null);
                doTests({property: 'name', direction: 'DESC'});
            });
        });

        describe("events", function() {
            it("should not fire an update event for phantom records", function() {
                var phantom1 = store.insert(2, {
                    name: 'X'
                })[0];
                var spy = jasmine.createSpy();
                store.on('update', spy);
                store.rejectChanges();
                expect(spy).not.toHaveBeenCalled();
            });

            it("should fire a remove event for phantom records", function() {
                var phantom1 = store.insert(0, {
                    name: 'X'
                })[0];

                var phantom2 = store.add({
                    name: 'Y'
                })[0];
                var spy = jasmine.createSpy();
                store.on('remove', spy);
                store.rejectChanges();
                expect(spy.callCount).toBe(2);
                expect(spy.calls[0].args[1]).toEqual([phantom2]);
                expect(spy.calls[1].args[1]).toEqual([phantom1]);
            });

            it("should fire an update event for non-phantom records", function() {
                edRec.set('name', 'A');
                tommyRec.set('name', 'B');
                var spy = jasmine.createSpy();
                store.on('update', spy);
                store.rejectChanges();
                expect(spy.callCount).toBe(2);
                expect(spy.calls[0].args[1]).toBe(edRec);
                expect(spy.calls[1].args[1]).toBe(tommyRec);
            });

            it("should not fire an update event for removed records", function() {
                var spy = jasmine.createSpy();
                store.remove(edRec);
                store.on('update', spy);
                store.rejectChanges();
                expect(spy).not.toHaveBeenCalled();
            });

            it("should not fire an update event for removed records, with sorters", function() {
                var spy = jasmine.createSpy();
                store.sort('name', 'DESC');
                store.remove(edRec);
                store.on('update', spy);
                store.rejectChanges();
                expect(spy).not.toHaveBeenCalled();
            });

            it("should fire add events for readded records", function() {
                var spy = jasmine.createSpy();
                store.remove(edRec);
                store.on('add', spy);
                store.rejectChanges();
                expect(spy.callCount).toBe(1);
                expect(spy.mostRecentCall.args[1]).toEqual([edRec]);
            });
        });
    });

    describe("metachange event", function () {
        var wasCalled = false,
            successData = {
                success: true,
                data: [
                    {name: 'alex'},
                    {name: 'ben'},
                    {name: 'don'},
                    {name: 'evan'},
                    {name: 'nige'},
                    {name: 'phil'}
                ],
                metaData: {
                    root: 'data'
                }
            },
            args, storeArg, metaArg;

        beforeEach(function () {
            createStore({
                proxy: {
                    type: "ajax",
                    url: "foo"
                },
                listeners: {
                    metachange: function (store, meta) {
                        wasCalled = true;
                        args = arguments;
                        storeArg = store;
                        metaArg = meta;
                    }
                }
            });

            store.load();
            completeWithData(successData);
        });

        afterEach(function () {
            wasCalled = false;
            args = storeArg = metaArg = null;
        });

        it("should call the listener", function () {
            expect(wasCalled).toBe(true);
        });

        it("should return the store", function () {
            expect(storeArg).toBe(store);
        });

        it("should return the meta data", function () {
            expect(metaArg).toEqual(successData.metaData);
        });

        it("should return the store as the first arg", function () {
            expect(args[0]).toBe(store);
        });

        it("should return the meta data as the second arg", function () {
            expect(args[1]).toBe(metaArg);
        });

        describe("disableMetaChangeEvent (for associated models)", function () {
            var wasCalled = false;

            afterEach(function () {
                wasCalled = false;
            });

            it("should not be set by default", function () {
                createStore({
                    proxy: {
                        type: "ajax",
                        url: "foo"
                    },
                    listeners: {
                        metachange: function (store, meta) {
                            wasCalled = true;
                        }
                    }
                });

                store.load();
                completeWithData(successData);

                expect(wasCalled).toBe(true);
            });

            it("should not fire the event if `true`", function () {
                createStore({
                    disableMetaChangeEvent: true,
                    proxy: {
                        type: "ajax",
                        url: "foo"
                    },
                    listeners: {
                        metachange: function (store, meta) {
                            wasCalled = true;
                        }
                    }
                });

                store.load();
                completeWithData(successData);

                expect(wasCalled).toBe(false);
            });

            it("should fire the event if `false`", function () {
                createStore({
                    disableMetaChangeEvent: false,
                    proxy: {
                        type: "ajax",
                        url: "foo"
                    },
                    listeners: {
                        metachange: function (store, meta) {
                            wasCalled = true;
                        }
                    }
                });

                store.load();
                completeWithData(successData);

                expect(wasCalled).toBe(true);
            });
        });
    });

    describe("autoSync", function() {
        beforeEach(function() {
            createStore({
                autoSync: true
            }, true);
            spyOn(store, 'sync').andCallFake(function() {
                store.needsSync = false;
            });
        });
        describe("adding", function() {
            it("should trigger a sync if the record is a phantom", function() {
                store.add({});
                expect(store.sync.callCount).toBe(1);
            });

            it("should trigger a sync if the record is dirty", function() {
                var rec = makeUser('foo@sencha.com');
                rec.set('name', 'foo');
                store.add(rec);
                expect(store.sync.callCount).toBe(1);
            });

            it("should not trigger a sync if the record is not a phantom or dirty", function() {
                var rec = makeUser('foo@sencha.com');
                store.add(rec);
                expect(store.sync).not.toHaveBeenCalled();
            });

            it("should only trigger a single sync when adding multiple records", function() {
                store.add([{}, {}, {}, {}]);
                expect(store.sync.callCount).toBe(1);
            });

            describe("with sorting", function() {
                it("should only trigger a single sync when adding multiple records in a discontiguous range", function() {
                    store.sort('email');
                    var recs = [makeUser('aaa@sencha.com'), makeUser('foo@sencha.com'), makeUser('zzz@sencha.com')];
                    Ext.Array.forEach(recs, function(rec, i) {
                        rec.set('name', 'foo' + i);
                    });
                    store.add(recs);
                    expect(store.sync.callCount).toBe(1);
                });
            });

            describe("with filtering", function() {
                it("should trigger a sync if the record is filtered out", function() {
                    store.filter('name', 'Foo');
                    store.add({
                        name: 'Bar'
                    });
                    expect(store.sync.callCount).toBe(1);
                });
            });
        });

        describe("removing", function() {
            it("should not trigger a sync if the record is a phantom", function() {
                var rec = store.add({})[0];
                store.sync.reset();
                store.remove(rec);
                expect(store.sync).not.toHaveBeenCalled();
            });

            it("should trigger when removing a record", function() {
                store.remove(edRec);
                expect(store.sync.callCount).toBe(1);
            });

            it("should only trigger a single sync when removing multiple records", function() {
                store.remove([edRec, tommyRec]);
                expect(store.sync.callCount).toBe(1);
            });
        });

        describe("updating", function() {
            it("should not trigger a sync if the record is not dirty", function() {
                edRec.set('name', 'Foo');
                store.sync.reset();
                edRec.set('name', 'Ed Spencer');
                expect(store.sync).not.toHaveBeenCalled();
            });

            it("should trigger a sync if the record is dirty", function() {
                edRec.set('name', 'Foo');
                expect(store.sync.callCount).toBe(1);
            });
        });
    });

    describe("joining/unjoining the the store", function() {
        function expectJoined(rec) {
            var joined = rec.joined || [];
            expect(Ext.Array.indexOf(joined, store)).not.toBe(-1);
        }

        function expectNotJoined(rec) {
            var joined = rec.joined || [];
            expect(Ext.Array.indexOf(joined, store)).toBe(-1);
        }

        describe("loading", function () {
            it("should join when loaded as part of the constructor", function() {
                createStore({
                    data: [abeRaw]
                });    
                expectJoined(store.getAt(0));
            });

            it("should join when loading records", function() {
                createStore();
                store.loadData([edRaw, tommyRaw]);
                expectJoined(store.getAt(0));
                expectJoined(store.getAt(1));
            });

            it("should unjoin existing records when loading a new data set", function() {
                createStore();
                store.loadData([edRaw, tommyRaw]);
                edRec = store.getAt(0);
                tommyRec = store.getAt(1);
                store.loadData([abeRaw, aaronRaw]);
                expectNotJoined(edRec);
                expectNotJoined(tommyRec);
            });
        });

        describe("adding", function() {
            beforeEach(function() {
                createStore();
            });

            it("should join when adding model data", function() {
                edRec = store.add(edRaw)[0];
                expectJoined(edRec);
            });

            it("should join when adding a model instance", function() {
                edRec = makeUser(edRaw);
                store.add(edRec);
                expectJoined(edRec);
            });

            it("should join inserting adding model data", function() {
                edRec = store.insert(0, edRaw)[0];
                expectJoined(edRec);
            });

            it("should join when inserting a model instance", function() {
                edRec = makeUser(edRaw);
                store.insert(0, edRec);
                expectJoined(edRec);
            });

            it("should join even when filtered out", function() {
                store.filter('group', 'admin');
                edRec = store.add(edRaw)[0];
                expectJoined(edRec);
            });
        });

        describe("removing", function() {
            describe("with trackRemoved: true", function() {
                beforeEach(function() {
                    createStore({
                        trackRemoved: true
                    });
                    addStoreData();
                });

                it("should not unjoin when removing a non phantom record", function() {
                    store.removeAt(0);
                    // Pushed into the removed collection
                    expectJoined(edRec);
                });

                it("should unjoin when removing a phantom", function() {
                    var rec = store.add({})[0];
                    store.remove(rec);
                    // Won't be in the removed collection
                    expectNotJoined(rec);
                });

                it("should only unjoin items not in the removed collection when calling removeAll", function() {
                    var rec = store.add({})[0];
                    store.removeAll();
                    expectJoined(edRec);
                    expectJoined(abeRec);
                    expectJoined(aaronRec);
                    expectJoined(tommyRec);
                    expectNotJoined(rec);
                });
            });

            describe("with trackRemoved: false", function() {
                beforeEach(function() {
                    createStore({
                        trackRemoved: false
                    });
                    addStoreData();
                });

                it("should unjoin when removing a non phantom record", function() {
                    store.removeAt(0);
                    expectNotJoined(edRec);
                });

                it("should unjoin when removing a phantom", function() {
                    var rec = store.add({})[0];
                    store.remove(rec);
                    expectNotJoined(rec);
                });

                it("should unjoin when calling removeAll", function() {
                    var rec = store.add({})[0];
                    store.removeAll();
                    expectNotJoined(edRec);
                    expectNotJoined(abeRec);
                    expectNotJoined(aaronRec);
                    expectNotJoined(tommyRec);
                    expectNotJoined(rec);
                });
            });
        });

        describe("via record changes", function() {
            describe("with trackRemoved: true", function() {
                it("should keep the record joined until erased", function() {
                    createStore({
                        trackRemoved: true
                    });
                    addStoreData();

                    edRec.drop();
                    expectJoined(edRec);
                    edRec.erase();
                    completeWithData({
                        success: true
                    });
                    expectNotJoined(edRec);
                });
            });

            describe("with trackRemoved: false", function() {
                it("should not keep the record joined when dropped", function() {
                    createStore({
                        trackRemoved: false
                    });
                    addStoreData();

                    edRec.drop();
                    expectNotJoined(edRec);
                });
            });
        });

        describe("destroying", function() {
            beforeEach(function() {
                createStore();
                addStoreData();
            });

            it("should unjoin all records", function() {
                store.destroy();
                expectNotJoined(edRec);
                expectNotJoined(abeRec);
                expectNotJoined(aaronRec);
                expectNotJoined(tommyRec);
            });

            it("should unjoin all records even when filtered", function() {
                store.filter('group', 'code');
                store.destroy();
                expectNotJoined(edRec);
                expectNotJoined(abeRec);
                expectNotJoined(aaronRec);
                expectNotJoined(tommyRec);
            });
        });
    });

    describe("with a session", function() {
        var session;

        beforeEach(function() {
            session = new Ext.data.Session();
        });

        afterEach(function () {
            session.destroy();
            session = null;
        });

        function createSessionStore(cfg) {
            cfg = Ext.apply({
                session: session
            }, cfg);
            createStore(cfg);
        }

        describe("loading data", function() {
            it("should pass the session record creator when using load", function() {
                createSessionStore({
                    proxy: {
                        type: 'ajax'
                    }
                });
                var spy = spyOn(store.getProxy(), 'read').andReturn();
                store.load();
                expect(spy.mostRecentCall.args[0].getRecordCreator()).toBe(session.recordCreator);
            });
            
            it("should pass the record creator when using loadRawData", function() {
                createSessionStore({
                    proxy: {
                        type: 'ajax'
                    }
                });
                var spy = spyOn(store.getProxy().getReader(), 'read').andCallThrough();
                store.loadRawData([]);
                expect(spy.mostRecentCall.args[1].recordCreator).toBe(session.recordCreator);
            });
        });

        describe("for records", function() {
            function expectSession(rec) {
                expect(rec.session).toBe(session);
            }

            describe("loading", function () {
                it("should set the session when loaded as part of the constructor", function() {
                    createSessionStore({
                        data: [abeRaw]
                    });    
                    expectSession(store.getAt(0));
                });

                it("should set the session when loading records", function() {
                    createSessionStore();
                    store.loadData([edRaw, tommyRaw]);
                    expectSession(store.getAt(0));
                    expectSession(store.getAt(1));
                });

                it("should not clear the session when loading a new data set", function() {
                    createSessionStore();
                    store.loadData([edRaw, tommyRaw]);
                    edRec = store.getAt(0);
                    tommyRec = store.getAt(1);
                    store.loadData([abeRaw, aaronRaw]);
                    expectSession(edRec);
                    expectSession(tommyRec);
                });
            });

            describe("adding", function() {
                beforeEach(function() {
                    createSessionStore();
                });

                it("should set the session when adding model data", function() {
                    edRec = store.add(edRaw)[0];
                    expectSession(edRec);
                });

                it("should set the session when adding a model instance", function() {
                    edRec = makeUser(edRaw);
                    store.add(edRec);
                    expectSession(edRec);
                });

                it("should set the session inserting adding model data", function() {
                    edRec = store.insert(0, edRaw)[0];
                    expectSession(edRec);
                });

                it("should set the session when inserting a model instance", function() {
                    edRec = makeUser(edRaw);
                    store.insert(0, edRec);
                    expectSession(edRec);
                });

                it("should set the session even when filtered out", function() {
                    store.filter('group', 'admin');
                    edRec = store.add(edRaw)[0];
                    expectSession(edRec);
                });
            });

            describe("removing", function() {
                beforeEach(function() {
                    createSessionStore();
                    addStoreData();
                });

                it("should not clear the session when removing a record", function() {
                    store.removeAt(0);
                    expectSession(edRec);
                });

                it("should not clear the session when calling removeAll", function() {
                    store.removeAll();
                    expectSession(edRec);
                    expectSession(abeRec);
                    expectSession(aaronRec);
                    expectSession(tommyRec);
                });
            });

            describe("destroying", function() {
                beforeEach(function() {
                    createSessionStore();
                    addStoreData();
                });

                it("should not clear the session on any records", function() {
                    store.destroy();
                    expectSession(edRec);
                    expectSession(abeRec);
                    expectSession(aaronRec);
                    expectSession(tommyRec);
                });
            });
        });
    }); 

    describe("destroying", function() {
        it("should cancel a pending autoLoad", function() {
            createStore({
                autoLoad: true
            });
            spyOn(store, 'load').andReturn();
            store.destroy();
            waits(50);
            runs(function() {
                expect(store.load).not.toHaveBeenCalled();
            });
        });

        it("should not fire a remove or clear event", function() {
            createStore();
            addStoreData();

            var spy = jasmine.createSpy();
            store.on('remove', spy);
            store.on('clear', spy);
            store.destroy();
            expect(spy).not.toHaveBeenCalled();
        });

        describe("proxy", function() {
            function getKeys(proxy) {
                var items = proxy.hasListeners,
                    o = {},
                    key;

                for (key in items) {
                    if (items.hasOwnProperty(key)) {
                        o[key] = items[key];
                    }
                }
                return o;
            }

            describe("proxy created by the store", function() {
                it("should destroy a stringified proxy and clear it from the store", function() {
                    createStore({
                        proxy: 'ajax'
                    });
                    var proxy = store.getProxy(),
                        spy = spyOn(proxy, 'destroy').andCallThrough();

                    store.destroy();
                    expect(spy).toHaveBeenCalled();
                    expect(store.getProxy()).toBeNull();
                });

                it("should destroy an object config proxy and clear it from the store", function() {
                    createStore({
                        proxy: {
                            type: 'ajax'
                        }
                    });
                    var proxy = store.getProxy(),
                        spy = spyOn(proxy, 'destroy').andCallThrough();

                    store.destroy();
                    expect(spy).toHaveBeenCalled();
                    expect(store.getProxy()).toBeNull();
                });
            });

            describe("proxy from model", function() {
                it("should clear any listeners and detach from the store, but not destroy it", function() {
                    var proxy = User.getProxy(),
                        hasListeners = getKeys(proxy),
                        spy;

                    createStore();
                    spy = spyOn(proxy, 'destroy').andCallThrough();
                    store.destroy();
                    expect(spy).not.toHaveBeenCalled();
                    expect(store.getProxy()).toBeNull();
                    expect(getKeys(proxy.hasListeners)).toEqual(hasListeners);
                });
            });

            describe("proxy instance", function() {
                it("should clear any listeners and detach from the store, but not destroy it", function() {
                    var proxy = new Ext.data.proxy.Ajax(),
                        hasListeners = getKeys(proxy),
                        spy;

                    createStore({
                        proxy: proxy
                    });
                    spy = spyOn(proxy, 'destroy').andCallThrough();
                    store.destroy();
                    expect(spy).not.toHaveBeenCalled();
                    expect(store.getProxy()).toBeNull();
                    expect(getKeys(proxy.hasListeners)).toEqual(hasListeners);
                });
            });
        });
    });

    describe("extraKeys", function() {
        describe("setting after initialization", function() {
            beforeEach(function() {
                createStore();
                addStoreData();
                store.setExtraKeys({
                    byAge: {
                        property: 'age',
                        rootProperty: 'data'
                    }
                });
            });

            it("should have the extraKeys updated when add fires", function() {
                var rec = makeUser('foo@sencha.com', {
                    age: 100
                });

                store.on('add', function() {
                    expect(store.byAge.get(100)).toBe(rec);
                });
                store.add(rec);
            });

            it("should have the extraKeys updated when remove fires", function() {
                store.on('remove', function() {
                    expect(store.byAge.get(25)).toBeNull();
                });
                store.remove(edRec);
            });

            it("should have the extraKeys updated when update fires", function() {
                store.on('update', function() {
                    expect(store.byAge.get(1)).toBe(edRec);
                });
                edRec.set('age', 1);
            });

            it("should have the extraKeys updated when clear fires", function() {
                store.on('clear', function() {
                    expect(store.byAge.get(20)).toBeNull();
                    expect(store.byAge.get(25)).toBeNull();
                    expect(store.byAge.get(26)).toBeNull();
                    expect(store.byAge.get(70)).toBeNull();
                });
                store.removeAll();
            });
        });
    })

    /*
     * edRaw    = {name: 'Ed Spencer',   email: 'ed@sencha.com',    evilness: 100, group: 'code',  old: false, age: 25, valid: 'yes'};
     * abeRaw   = {name: 'Abe Elias',    email: 'abe@sencha.com',   evilness: 70,  group: 'admin', old: false, age: 20, valid: 'yes'};
     * aaronRaw = {name: 'Aaron Conran', email: 'aaron@sencha.com', evilness: 5,   group: 'admin', old: true,  age: 26, valid: 'yes'};
     * tommyRaw = {name: 'Tommy Maintz', email: 'tommy@sencha.com', evilness: -15, group: 'code',  old: true,  age: 70, valid: 'yes'};
     * 
     * NOTE: The age field has a custom sorter which inverts the specified order.
     */
    describe('Reactive grouping', function() {
        var groups,
            sorters,
            counter;

        function checkCorrectness(store, sorters, options, controller) {
            // For checking whether all three events: datachanged, refresh and sort have been fired.
            counter++;

            // Check descending age order.   [Aaron=26, Abe=20, Tommy=70, ed=25]
            expect(store.getRange()).toEqual([aaronRec, abeRec, tommyRec, edRec]);

            // Cache the Sorters that the store is using
            sorters = store.getSorters();

            // Cache the GroupCollection
            groups = store.getGroups();

            // The two groups must have inherited the 'age' sorter used by the store
            expect(groups.items[0].getSorters().items.length).toBe(1);
            expect(groups.items[0].getSorters().items[0].getProperty()).toBe('age');
            expect(groups.items[0].getSorters().items[0] === sorters.items[0]).toBe(true);
            expect(groups.items[1].getSorters().items[0] === sorters.items[0]).toBe(true);

            // Admin should be [Aaron=26,Abe=20]
            expect(groups.items[0].items).toEqual([aaronRec, abeRec]);

            // Coded should be [Tommy=70,ed=25]
            expect(groups.items[1].items).toEqual([tommyRec, edRec]);
        }

        function checkNewGrouping() {
            // For checking whether the add event has been fired.
            counter++;

            // Check descending order.       [Aaron=26, ed=25, Abe=20, Tommy=70]
            expect(store.getRange()).toEqual([aaronRec, edRec, abeRec, tommyRec]);

            // Admin should be [Aaron=26,ed=25,Abe=20]
            expect(groups.items[0].items).toEqual([aaronRec, edRec, abeRec]);

            // Coded should be [Tommy=70]
            expect(groups.items[1].items).toEqual([tommyRec]);
        }

        describe('Test state of groups\' sort at the time the sort event fires', function() {
            it('should work going from no sorters to some sorters', function() {
                createStore({
                    groupField: 'group',
                    data: [abeRaw, edRaw, tommyRaw, aaronRaw]
                });
                aaronRec = store.getById('aaron@sencha.com');
                abeRec = store.getById('abe@sencha.com');
                edRec = store.getById('ed@sencha.com');
                tommyRec = store.getById('tommy@sencha.com');

                expect(store.getRange()).toEqual([abeRec, aaronRec, edRec, tommyRec]);

                // Check for everything to be sorted and in sync at the time the sort event fires
                counter = 0;
                store.on({
                    datachanged: checkCorrectness,
                    refresh: checkCorrectness,
                    sort: checkCorrectness,
                    single: true
                });

                // This will sort into *DESCENDING* order because of the custom sorter on the age field
                store.sort('age');

                // All events have fired.
                expect(counter).toBe(3);

                // Check that new orders are synched in main collection and groups at the time the re-insertion of the record is broadcast
                counter = 0;
                store.on({
                    add: checkNewGrouping,
                    single: true
                });

                // Move Ed into the admin group.
                // Admin group should become [Aaron=26,ed=25,Abe=20]
                edRec.set('group', 'admin');

                // add event has fired.
                expect(counter).toBe(1);
            });

            it('should work changing sorters', function() {
                createStore({
                    groupField: 'group',
                    data: [abeRaw, edRaw, tommyRaw, aaronRaw],
                    sorters: [{
                        property: 'evilness',
                        direction: 'DESC'
                    }]
                });
                aaronRec = store.getById('aaron@sencha.com');
                abeRec = store.getById('abe@sencha.com');
                edRec = store.getById('ed@sencha.com');
                tommyRec = store.getById('tommy@sencha.com');

                // Check descending order.       [Abe=70, Aaron=5,  ed=100,Tommy=-15]
                expect(store.getRange()).toEqual([abeRec, aaronRec, edRec, tommyRec]);

                // Cache the Sorters that the store is using
                sorters = store.getSorters();

                // Cache the GroupCollection
                groups = store.getGroups();

                // The two groups must have inherited the sorter used by the store from the outset, before any sort has been performed.
                expect(groups.items[0].getSorters().items.length).toBe(1);
                expect(groups.items[0].getSorters().items[0].getProperty()).toBe('evilness');
                expect(groups.items[0].getSorters().items[0] === sorters.items[0]).toBe(true);
                expect(groups.items[1].getSorters().items[0] === sorters.items[0]).toBe(true);

                // Admin should be [Abe=70,Aaron=5]
                expect(groups.items[0].items).toEqual([abeRec, aaronRec]);

                // Coded should be [ed=100,Tommy=-15]
                expect(groups.items[1].items).toEqual([edRec, tommyRec]);

                // Check for everything to be sorted and in sync at the time the sort event fires
                counter = 0;
                store.on({
                    datachanged: checkCorrectness,
                    refresh: checkCorrectness,
                    sort: checkCorrectness,
                    single: true
                });

                // This will sort into *DESCENDING* order because of the custom sorter on the age field
                // Conditions will now be the same as the spec above
                store.sort('age');

                // All events have fired.
                expect(counter).toBe(3);

                // Check that new orders are synched in main collection and groups at the time the re-insertion of the record is broadcast
                counter = 0;
                store.on({
                    add: checkNewGrouping,
                    single: true
                });

                // Move Ed into the admin group.
                // Admin group should become [Aaron=26,ed=25,Abe=20]
                edRec.set('group', 'admin');

                // add event has fired.
                expect(counter).toBe(1);
            });
        });
    });
});
