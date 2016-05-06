describe("Ext.data.Model", function() {
    
    beforeEach(function() {
        Ext.ClassManager.enableNamespaceParseCache = false;
        Ext.data.Model.schema.setNamespace('spec');
    });
    
    afterEach(function() {
        Ext.ClassManager.enableNamespaceParseCache = true; 
        Ext.data.Model.schema.clear(true);
    });

    describe('use of raw Model class', function() {
        it("should be able to use Ext.data.Model directly on a store", function() {
            var data = [
                { forename: 'Nige', surname: 'White' },
                { forename: 'Don', surname: 'Griffin' },
                { forename: 'Phil', surname: 'Guerrant' },
                { forename: 'Kevin', surname: 'Krohe' },
                { forename: 'Evan', surname: 'Trimboli' }
            ];

            var store = new Ext.data.Store({
                model: Ext.data.Model,
                data: data
            });

            // The raw data object should be inported directly as the records' data objects
            expect(store.getAt(0).data).toEqual(data[0]);
            expect(store.getAt(1).data).toEqual(data[1]);
            expect(store.getAt(2).data).toEqual(data[2]);
            expect(store.getAt(3).data).toEqual(data[3]);
            expect(store.getAt(4).data).toEqual(data[4]);

            // Set functionality should work
            store.getAt(0).set('forename', 'Nigel');
            expect(store.getAt(0).get('forename')).toBe('Nigel');
        });
    });
    
    describe("getField/getFields", function() {
        var A;
        
        beforeEach(function() {
            A = Ext.define('spec.A', {
                extend: Ext.data.Model,
                fields: ['id', 'name', 'key']
            });
        });
        
        afterEach(function() {
            Ext.undefine('spec.A');
            A = null;
        });
        
        describe("getFields", function() {
            it("should return an array", function() {
                expect(Ext.isArray(A.getFields())).toBe(true);    
            });
            
            it("should return all fields in the model", function() {
                expect(A.getFields().length).toBe(3);    
            });
            
            it("should be able to be called on an instance", function() {
                var o = new A();
                expect(o.getFields().length).toBe(3);    
            });
        });
        
        describe("getField", function() {
            it("should return null if no field with a matching name is found", function() {
                expect(A.getField('foo')).toBeNull();    
            });
            
            it("should return the field", function() {
                expect(A.getField('key').isField).toBe(true);    
            });
            
            it("should be able to be called on an instance", function() {
                var o = new A();
                expect(o.getField('name').isField).toBe(true);  
            });
        });
    });
    
    describe("defining models", function() {
        var A, B;
        
        afterEach(function() {
            Ext.undefine('specModel');
            Ext.undefine('spec.A');
            Ext.undefine('spec.B');
            Ext.undefine('spec.model.sub.C');
            A = B = null;
        });

        describe('entityName', function () {
            beforeEach(function () {
                Ext.define('specModel', {
                    extend: 'Ext.data.Model'
                });
                Ext.define('spec.A', {
                    extend: 'Ext.data.Model'
                });
                Ext.define('spec.B', {
                    extend: 'Ext.data.Model'
                });
                Ext.define('spec.model.sub.C', {
                    extend: 'Ext.data.Model'
                });
            });

            it('should generate proper default entityName for top-level', function () {
                expect(specModel.entityName).toBe('specModel');
            });

            it('should generate proper default entityName for namespaced entity', function () {
                expect(spec.A.entityName).toBe('A');
                expect(spec.B.entityName).toBe('B');
            });

            it('should generate proper default entityName for a deep namespaced entity', function () {
                expect(spec.model.sub.C.entityName).toBe('model.sub.C');
            });
        });

        describe("fields", function() {
            afterEach(function() {
                Ext.undefine('spec.A');
                Ext.undefine('spec.B');
                A = B = null;
            });
            
            function defineA(fields, cfg) {
                cfg = Ext.apply({
                    extend: Ext.data.Model,
                    fields: fields
                }, cfg);
                A = Ext.define('spec.A', cfg);
            }
            
            function defineB(fields, cfg) {
                cfg = Ext.apply({
                    extend: A,  
                    fields: fields
                }, cfg);
                
                // This will warn about redefining field 'id'
                spyOn(Ext.log, 'warn');
                
                B = Ext.define('spec.B', cfg);
            }
            
            it("should be able to define a string name field and default the type to auto", function() {
                defineA(['id']);
                var field = A.getField('id');
                expect(field.isField).toBe(true);
                expect(field.getType()).toBe('auto');
                expect(A.getFields().length).toBe(1);
            });  
            
            it("should be able to define an object field and default the type to auto", function() {
                defineA([{
                    name: 'id'
                }]);
                var field = A.getField('id');
                expect(field.isField).toBe(true);
                expect(field.getType()).toBe('auto');
                expect(A.getFields().length).toBe(1);
            });
            
            it("should read the type parameter from the field", function() {
                defineA([{
                    name: 'id',
                    type: 'int'
                }]); 
                expect(A.getField('id').getType()).toBe('int');
            });
            
            it("should retain the field definition order", function() {
                defineA(['id', 'd', 'a', 'c', 'b']   );
                var fields = A.getFields(),
                    names = [];
                Ext.Array.forEach(fields, function(field) {
                    names.push(field.getName());
                });
                expect(names).toEqual(['id', 'd', 'a', 'c', 'b']);
                expect(fields.length).toBe(5);
            });

            it("should be able to define a field with a - in the name", function() {
                defineA(['the-field']);
                var field = A.getField('the-field');
                expect(field.isField);
            });
            
            describe("id field", function() {
                it("should create a field matching the idProperty if it doesn't exist", function() {
                    defineA([]);
                    var fields = A.getFields();
                    expect(fields.length).toBe(1);
                    expect(fields[0].getName()).toBe(A.prototype.idProperty);
                });  
                
                it("should append the id field to the end if it doesn't exist", function() {
                    defineA(['a', 'b']);
                    var fields = A.getFields();
                    expect(fields[2].getName()).toBe('id');
                });
                
                it("should not create an extra field if the idProperty field is already defined", function() {
                    defineA([{
                        name: 'id',
                        type: 'int'
                     }]);  
                     var field = A.getField('id');
                     expect(field.getType()).toBe('int');
                });
                
                it("should create an idField when the name isn't the default", function() {
                    defineA([], {
                        idProperty: 'name'
                    });
                    expect(A.getField('name').isField).toBe(true);
                });
                
                it("should clear any defaultValue on the idField", function() {
                    defineA([{
                        name: 'id',
                        type: 'int'
                    }]);    
                    expect(A.getField('id').defaultValue).toBeNull();
                });

                it("should set allowNull on the idField", function() {
                    defineA([{
                        name: 'id',
                        type: 'int'
                    }]);  
                    expect(A.getField('id').allowNull).toBe(true);
                });
            });
            
            describe("subclassing", function() {
                it("should inherit the fields from the superclass", function() {
                    defineA(['id', 'name']);
                    defineB([]);
                    expect(B.getFields().length).toBe(2);
                });
                
                it("should append new fields to the end", function() {
                    defineA(['id', 'name']);
                    defineB(['foo', 'bar']);
                    
                    var fields = B.getFields();
                    expect(fields.length).toBe(4);
                    expect(fields[2].getName()).toBe('foo');
                    expect(fields[3].getName()).toBe('bar');    
                });
                
                it("should not modify the fields in the superclass", function() {
                    defineA(['id', 'name']);
                    defineB(['foo', 'bar']);
                    
                    var fields = A.getFields();
                    expect(fields.length).toBe(2);
                    expect(fields[0].getName()).toBe('id');
                    expect(fields[1].getName()).toBe('name');
                });
                
                it("should be able to override a field in the base", function() {
                    defineA(['id']);
                    defineB([{
                        name: 'id',
                        type: 'int'
                    }]);
                    
                    expect(A.getField('id').getType()).toBe('auto');
                    expect(B.getField('id').getType()).toBe('int');
                    
                });
                
                it("should copy fields for deep subclasses", function() {
                    defineA(['id']);
                    defineB(['bField']);    
                    Ext.define('spec.C', {
                        extend: B,
                        fields: ['cField']
                    });
                    Ext.define('spec.D', {
                        extend: spec.C,
                        fields: ['dField']
                    });
                    
                    var fields = spec.C.getFields();
                    expect(fields.length).toBe(3);
                    expect(fields[2].getName()).toBe('cField');
                    
                    fields = spec.D.getFields();
                    expect(fields.length).toBe(4);
                    expect(fields[2].getName()).toBe('cField');
                    expect(fields[3].getName()).toBe('dField');
                    
                    Ext.undefine('spec.C');
                    Ext.undefine('spec.D');
                });

                describe("id field", function() {
                    describe("not changing the idProperty", function() {
                        it("should inherit the idProperty & keep the generated idField in position", function() {
                            defineA(['foo', 'bar']);
                            defineB(['baz']);

                            var fields = spec.A.getFields();
                            expect(fields.length).toBe(3);
                            expect(fields[0].name).toBe('foo');
                            expect(fields[1].name).toBe('bar');
                            expect(fields[2].name).toBe('id');
                            expect(spec.A.getField('id')).toBe(fields[2]);

                            fields = spec.B.getFields();
                            expect(fields.length).toBe(4);
                            expect(fields[0].name).toBe('foo');
                            expect(fields[1].name).toBe('bar');
                            expect(fields[2].name).toBe('id');
                            expect(fields[3].name).toBe('baz');
                            expect(spec.B.getField('id')).toBe(fields[2]);

                            expect(spec.A.idField.name).toBe('id');
                            expect(spec.B.idField.name).toBe('id');
                        });

                        it("should inherit the idProperty & keep a defined idField in position", function() {
                            defineA(['foo', 'id', 'bar']);
                            defineB(['baz']);

                            var fields = spec.A.getFields();
                            expect(fields.length).toBe(3);
                            expect(fields[0].name).toBe('foo');
                            expect(fields[1].name).toBe('id');
                            expect(fields[2].name).toBe('bar');
                            expect(spec.A.getField('id')).toBe(fields[1]);

                            fields = spec.B.getFields();
                            expect(fields.length).toBe(4);
                            expect(fields[0].name).toBe('foo');
                            expect(fields[1].name).toBe('id');
                            expect(fields[2].name).toBe('bar');
                            expect(fields[3].name).toBe('baz');
                            expect(spec.B.getField('id')).toBe(fields[1]);

                            expect(spec.A.idField.name).toBe('id');
                            expect(spec.B.idField.name).toBe('id');
                        });
                    });

                    describe("changing the idProperty", function() {
                        describe("id declared as a field in superclass & subclass", function() {
                            it("should keep both idFields in the defined order", function() {
                                defineA(['foo', 'id', 'bar']);
                                defineB(['customId', 'baz'], {idProperty: 'customId'});

                                var fields = spec.A.getFields();
                                expect(fields.length).toBe(3);
                                expect(fields[0].name).toBe('foo');
                                expect(fields[1].name).toBe('id');
                                expect(fields[2].name).toBe('bar');

                                expect(spec.A.getField('id')).toBe(fields[1]);

                                fields = spec.B.getFields();
                                expect(fields.length).toBe(5);
                                expect(fields[0].name).toBe('foo');
                                expect(fields[1].name).toBe('id');
                                expect(fields[2].name).toBe('bar');
                                expect(fields[3].name).toBe('customId');
                                expect(fields[4].name).toBe('baz');

                                expect(spec.B.getField('id')).toBe(fields[1]);
                                expect(spec.B.getField('customId')).toBe(fields[3]);

                                expect(spec.A.idField.name).toBe('id');
                                expect(spec.B.idField.name).toBe('customId');
                            });
                        });

                        describe("id declared as field only in superclass", function() {
                            it("should keep a defined idField from the parent, but it should not be the idField", function() {
                                defineA(['foo', 'id', 'bar']);
                                defineB(['baz'], {idProperty: 'customId'});

                                var fields = spec.A.getFields();
                                expect(fields.length).toBe(3);
                                expect(fields[0].name).toBe('foo');
                                expect(fields[1].name).toBe('id');
                                expect(fields[2].name).toBe('bar');

                                expect(spec.A.getField('id')).toBe(fields[1]);

                                fields = spec.B.getFields();
                                expect(fields.length).toBe(5);
                                expect(fields[0].name).toBe('foo');
                                expect(fields[1].name).toBe('id');
                                expect(fields[2].name).toBe('bar');
                                expect(fields[3].name).toBe('baz');
                                expect(fields[4].name).toBe('customId');

                                expect(spec.B.getField('id')).toBe(fields[1]);
                                expect(spec.B.getField('customId')).toBe(fields[4]);

                                expect(spec.A.idField.name).toBe('id');
                                expect(spec.B.idField.name).toBe('customId');
                            });
                        });

                        describe("id declared as a field only in subclass", function() {
                            it("should remove the generated id field and leave the declared idField in place", function() {
                                defineA(['foo']);
                                defineB(['bar', 'customId', 'baz'], {idProperty: 'customId'});

                                var fields = spec.A.getFields();
                                expect(fields.length).toBe(2);
                                expect(fields[0].name).toBe('foo');
                                expect(fields[1].name).toBe('id');

                                fields = spec.B.getFields();
                                expect(fields.length).toBe(4);
                                expect(fields[0].name).toBe('foo');
                                expect(fields[1].name).toBe('bar');
                                expect(fields[2].name).toBe('customId');
                                expect(fields[3].name).toBe('baz');

                                expect(spec.B.getField('id')).toBeNull();

                                expect(spec.A.idField.name).toBe('id');
                                expect(spec.B.idField.name).toBe('customId');
                            });
                        });

                        describe("id not declared as a field", function() {
                            it("should replace a generated idField from the parent", function() {
                                defineA(['foo', 'bar']);
                                defineB(['baz'], {idProperty: 'customId'});

                                var fields = spec.A.getFields();
                                expect(fields.length).toBe(3);
                                expect(fields[0].name).toBe('foo');
                                expect(fields[1].name).toBe('bar');
                                expect(fields[2].name).toBe('id');

                                fields = spec.B.getFields();
                                expect(fields.length).toBe(4);
                                expect(fields[0].name).toBe('foo');
                                expect(fields[1].name).toBe('bar');
                                expect(fields[2].name).toBe('customId');
                                expect(fields[3].name).toBe('baz');

                                expect(spec.B.getField('id')).toBeNull();

                                expect(spec.A.idField.name).toBe('id');
                                expect(spec.B.idField.name).toBe('customId');
                            });
                        });
                    });
                });

                describe("versionProperty", function() {
                    it("should append versionProperty if it's not declared as a field", function() {
                        defineA(['foo'], {
                            versionProperty: 'version'
                        });

                        var fields = spec.A.getFields(),
                            version = fields[2];

                        expect(fields.length).toBe(3);
                        expect(fields[0].name).toBe('foo');
                        expect(fields[1].name).toBe('id');
                        expect(fields[2].name).toBe('version');

                        expect(version.critical).toBe(true);
                        expect(version.defaultValue).toBe(1);
                    });

                    it("should leave a declared versionProperty in position", function() {
                        defineA(['foo', {
                            name: 'version',
                            type: 'int'
                        }, 'bar'], {
                            versionProperty: 'version'
                        });

                        var fields = spec.A.getFields(),
                            version = fields[1];

                        expect(fields.length).toBe(4);
                        expect(fields[0].name).toBe('foo');
                        expect(fields[1].name).toBe('version');
                        expect(fields[2].name).toBe('bar');
                        expect(fields[3].name).toBe('id');

                        expect(version.critical).toBe(true);
                        expect(version.defaultValue).toBe(1);
                    });
                });
            });
            
            describe("configs the model sets on the field", function() {
                describe("ordinal", function() {
                    function expectOrdinal(name, ordinal, cls) {
                        cls = cls || A;
                        var field = cls.getField(name);
                        expect(field.ordinal).toBe(ordinal);    
                    }
                    
                    it("should set the ordinal for each field in order", function() {
                        defineA(['foo', 'bar', 'baz']);
                        var fields = A.getFields();
                        expectOrdinal('foo', 0);
                        expectOrdinal('bar', 1);
                        expectOrdinal('baz', 2);
                    });
                    
                    it("should append the id field to the end", function() {
                        defineA(['foo', 'bar', 'baz']);
                        expectOrdinal('id', 3);    
                    });
                    
                    it("should not move the id field if it exists", function() {
                        defineA(['id', 'foo', 'bar', 'baz']);
                        expectOrdinal('id', 0);    
                    });
                    
                    describe("subclassing", function() {
                        it("should append field to the end", function() {
                            defineA(['id', 'foo']);
                            defineB(['bar', 'baz']);
                            expectOrdinal('bar', 2, B);
                            expectOrdinal('baz', 3, B);
                        });  
                        
                        it("should not move a field if redefined", function() {
                            defineA(['id', 'foo']);
                            defineB(['bar', 'baz', {
                                name: 'foo',
                                type: 'int'
                            }]);
                            expectOrdinal('foo', 1, B);
                        });
                        
                        it("should append a custom id field to the end", function() {
                            defineA(['id', 'foo']);
                            defineB(['bar'], {
                                idProperty: 'customId'
                            });
                            expectOrdinal('customId', 3, B);
                        });
                    });
                });
                
                describe("definedBy", function() {
                    it("should set the defined class on all fields", function() {
                        defineA(['foo', 'bar']);
                        expect(A.getField('foo').definedBy).toBe(A);
                        expect(A.getField('bar').definedBy).toBe(A);
                    });
                    
                    it("should set the defined class on an id field", function() {
                        defineA(['foo', 'bar']);
                        expect(A.getField('id').definedBy).toBe(A);
                    });
                    
                    describe("subclassing", function() {
                        it("should set the subclass on the field", function() {
                            defineA(['foo']);
                            defineB(['bar']);
                            expect(B.getField('bar').definedBy).toBe(B);    
                        });
                        
                        it("should retain the superclass on the field", function() {
                            defineA(['foo']);
                            defineB(['bar']);
                            expect(B.getField('foo').definedBy).toBe(A);    
                        });
                        
                        it("should set the if the field is redefined", function() {
                            defineA(['foo']);
                            defineB(['bar', {
                                name: 'foo',
                                type: 'int'
                            }]);
                            expect(B.getField('foo').definedBy).toBe(B); 
                        });
                    });
                });    
            });

            describe("calculated fields", function() {
                describe("subclassing", function() {
                    it("should inherit calculated fields", function() {
                        defineA(['foo', {
                            name: 'bar',
                            calculate: function(data) {
                                return data.foo * 2;
                            }
                        }]);

                        defineB();
                        var rec = new B({
                            foo: 10
                        });
                        expect(rec.get('bar')).toBe(20);
                    });

                    // This tests the initialization order of the field rankings on the Model
                    it("should inherit calculated fields when the parent has been instanced first", function() {
                        defineA(['foo', {
                            name: 'bar',
                            calculate: function(data) {
                                return data.foo * 2;
                            }
                        }]);

                        defineB();
                        var rec = new A({
                            foo: 10
                        });
                        expect(rec.get('bar')).toBe(20);
                        rec = new B({
                            foo: 20
                        });
                        expect(rec.get('bar')).toBe(40);
                    });
                })
            });
        });
        
        describe("proxy", function() {
            function defineA(proxy, cfg) {
                cfg = Ext.apply({
                    extend: Ext.data.Model,
                    fields: ['id'],
                    proxy: proxy
                }, cfg);
                A = Ext.define('spec.A', cfg);
            }
            
            it("should ask the schema to construct a proxy by default", function() {
                defineA();
                var schema = A.schema,
                    schemaConfig = schema.constructProxy(A),
                    proxy = A.getProxy();

                expect(proxy.alias).toEqual(['proxy.' + schemaConfig.type]);
                expect(proxy.getUrl()).toBe(schemaConfig.url);
            });
            
            it("should create a proxy type string", function() {
                defineA('jsonp');
                expect(A.getProxy() instanceof Ext.data.proxy.JsonP).toBe(true);
            });
            
            it("should create a proxy from a config", function() {
                defineA({
                    type: 'ajax',
                    url: '/foo'
                });
                expect(A.getProxy().getUrl()).toBe('/foo');
            });

            it("should infer the reader type from the proxy", function() {
                Ext.define('spec.CustomReader', {
                    extend: 'Ext.data.reader.Json',
                    alias: 'reader.custom'
                });

                Ext.define('spec.CustomProxy', {
                    extend: 'Ext.data.proxy.Ajax',
                    alias: 'proxy.custom',
                    reader: 'custom'
                });

                defineA('custom');
                expect(A.getProxy().getReader().$className).toBe('spec.CustomReader');
                Ext.undefine('spec.CustomReader');
                Ext.undefine('spec.CustomProxy');
            });
            
            it("should use a passed instance", function() {
                var proxy = new Ext.data.proxy.Ajax();
                defineA(proxy);
                expect(A.getProxy()).toBe(proxy);
                proxy = null;
            });
            
            describe("subclassing", function() {
                function defineB(proxy, cfg) {
                    cfg = Ext.apply({
                        extend: A
                    }, cfg);
                    
                    if (proxy) {
                        cfg.proxy = proxy;
                    }
                    
                    B = Ext.define('spec.B', cfg);
                }
                
                it("should inherit a config from the parent", function() {
                    defineA({
                        type: 'ajax',
                        url: '/foo'
                    });    
                    defineB();
                    expect(B.getProxy().getUrl()).toBe('/foo');
                });  
                
                it("should override anything on the parent", function() {
                    defineA({
                        type: 'ajax',
                        url: '/foo'
                    });
                    defineB({
                        type: 'ajax',
                        url: '/bar'
                    });   
                    expect(B.getProxy().getUrl()).toBe('/bar');
                });
                
                it("should clone an existing instance", function() {
                    defineA({
                        type: 'ajax',
                        url: '/foo'
                    });    
                    // trigger creation
                    A.getProxy();
                    defineB();
                    expect(B.getProxy()).not.toBe(A.getProxy());
                    expect(B.getProxy().getUrl()).toBe('/foo');
                });
                
                it("should not modify the super instance", function() {
                    defineA({
                        type: 'ajax',
                        url: '/foo'
                    });    
                    defineB();
                    B.getProxy().setUrl('/bar');
                    expect(A.getProxy().getUrl()).toBe('/foo');
                });
            });
        });
        
        // TODO:
        describe("associations", function() {
            
        });
        
        describe("identifier", function() {
            var idgen;
            
            function defineA(identifier, fields, cfg) {
                cfg = Ext.apply({
                    extend: Ext.data.Model,
                    fields: fields || ['id', 'name'],
                    identifier: identifier
                }, cfg);
                A = Ext.define('spec.A', cfg);
            }
            
            afterEach(function() {
                idgen = null;
                var Generator = Ext.data.identifier.Generator;
                Generator.all = {
                    uuid: Generator.all.uuid
                }; // clear generator id map
            });
            
            it("should default to identifier.Sequential", function() {
                defineA();

                var r = new A();
                expect(r.getId()).toBe('A-1');

                r = new A();
                expect(r.getId()).toBe('A-2');
            });
            
            it("should create an identifier from a type string", function() {
                defineA('negative');

                var r = new A();
                expect(r.getId()).toBe(-1);

                r = new A();
                expect(r.getId()).toBe(-2);

            });
            
            it("should create an identifier from a config object", function() {
                defineA({
                    type: 'sequential',
                    prefix: 'foo'
                });

                var r = new A();
                expect(r.getId()).toBe('foo1');

                r = new A();
                expect(r.getId()).toBe('foo2');
            });

            it("should share an instance across models using an id", function() {
                var B = Ext.define('spec.B', {
                    extend: Ext.data.Model,
                    identifier: {
                        // sequential is the default
                        id: 'x',
                        prefix: 'ID_',
                        seed: 1000
                    }
                });
                defineA('x');

                var a = new A();
                var b = new B();

                expect(a.id).toBe('ID_1000');
                expect(b.id).toBe('ID_1001');
            });

            describe("subclassing", function() {
                function defineB (identifier, cfg) {
                    cfg = Ext.apply({
                        extend: A,
                        identifier: identifier
                    }, cfg);
                    
                    B = Ext.define('spec.B', cfg);
                }
                
                describe("defined on the subclass", function() {
                    it("should use a string type", function() {
                        defineA({
                            type: 'negative'
                        });
                    
                        defineB('sequential');

                        var a = new A();
                        var b = new B();

                        expect(a.id).toBe(-1);
                        expect(b.id).toBe(1);
                    });
                    
                    it("should use an object type", function() {
                        defineA({
                            type: 'negative'
                        });
                    
                        defineB({
                            type: 'sequential'
                        });

                        var a = new A();
                        var b = new B();

                        expect(a.id).toBe(-1);
                        expect(b.id).toBe(1);
                    });
                    
                    it("should use an instance", function() {
                        idgen = new Ext.data.identifier.Sequential();
                        defineA({
                            type: 'sequential'
                        });
                    
                        defineB(idgen);
                        expect(B.identifier).toBe(idgen);
                    });
                });
                
                describe("inheriting from parent", function() {
                    it("should clone an instance if it's cloneable", function() {
                        defineA({
                            type: 'sequential',
                            prefix: 'foo'
                        });
                        defineB();
                        idgen = B.identifier;
                        expect(idgen).not.toBe(A.identifier);
                        expect(idgen.getPrefix()).toBe('foo');
                    });
                    
                    it("should not clone the instance if it's not cloneable", function() {
                        defineA('uuid');
                        defineB();
                        expect(B.identifier).toBe(A.identifier);
                    });
                    
                    it("should not clone if an id is specified", function() {
                        defineA({
                            type: 'sequential',
                            prefix: 'ID_',
                            seed: 1000,
                            id: 'xxx'
                        });
                        defineB();
                        expect(B.identifier).toBe(A.identifier);

                        var a = new A();
                        var b = new B();

                        expect(a.id).toBe('ID_1000');
                        expect(b.id).toBe('ID_1001');
                    });
                });
            });
        });
        
        describe("validators", function() {
            function validate(cls, fieldName, value) {
                var field = cls.getField(fieldName);
                return field.validate(value, '|');
            }

            function expectError(cls, fieldName, value, expected) {
                var msg = validate(cls, fieldName, value);
                if (msg === true) {
                    msg = [];
                } else {
                    msg = msg.split('|');
                }
                expect(msg).toEqual(expected);
            }

            var presenceMsg = 'Must be present',
                formatMsg = 'Is in the wrong format',
                emailMsg = 'Is not a valid email address';

            describe("on the field", function() {
                function defineA(validatorCfg, fields, cfg) {
                    cfg = Ext.apply({
                        extend: Ext.data.Model,
                        fields: fields || [{
                            name: 'name',
                            validators: validatorCfg
                        }]
                    }, cfg);
                    A = Ext.define('spec.A', cfg);
                }

                it("should accept a validator string name", function() {
                    defineA('presence');
                    expectError(A, 'name', null, [presenceMsg]);
                });

                it("should accept an object configuration", function() {
                    defineA({
                        type: 'format',
                        matcher: /foo/
                    });
                    expectError(A, 'name', null, [formatMsg]);
                });

                it("should accept a function", function() {
                    defineA(function() {
                        return 'Fail';
                    });
                    expectError(A, 'name', null, ['Fail']);
                });

                it("should accept an array of strings", function() {
                    defineA(['presence', 'email']);
                    expectError(A, 'name', null, [presenceMsg, emailMsg]);
                });

                it("should accept an array of configs", function() {
                    defineA([{
                        type: 'presence'
                    }, {
                        type: 'format',
                        matcher: /foo/
                    }]);
                    expectError(A, 'name', null, [presenceMsg, formatMsg]);
                });

                it("should accept an array of functions", function() {
                    defineA([function() {
                        return 'Fail1';
                    }, function() {
                        return 'Fail2';
                    }]);
                    expectError(A, 'name', null, ['Fail1', 'Fail2']);
                });

                it("should be able to define multiple fields", function() {
                    defineA(null, [{
                        name: 'name',
                        validators: 'presence'
                    }, {
                        name: 'email',
                        validators: 'email'
                    }]);
                    expectError(A, 'name', null, [presenceMsg]);
                    expectError(A, 'email', null, [emailMsg]);
                });
            });
            
            describe("on the model", function() {
                function defineA(validators, fields, cfg) {
                    cfg = Ext.apply({
                        extend: Ext.data.Model,
                        fields: fields || ['id', 'name', 'rank', 'email'],
                        validators: validators
                    }, cfg);
                    A = Ext.define('spec.A', cfg);
                }

                describe("array style", function() {
                    it("should accept an array of validators", function() {
                        defineA([{
                            field: 'name',
                            type: 'presence'
                        }]);     
                        expectError(A, 'name', null, [presenceMsg]);
                    });
                    
                    it("should accept multiple validators for a single field", function() {
                        defineA([{
                            field: 'name',
                            type: 'presence'
                        }, {
                            field: 'name',
                            type: 'format',
                            matcher: /foo/
                        }]);
                        expectError(A, 'name', null, [presenceMsg, formatMsg]);
                    });
                    
                    it("should be able to pass validators for multiple fields", function() {
                        defineA([{
                            field: 'name',
                            type: 'presence'
                        }, {
                            field: 'email',
                            type: 'email'
                        }]);         
                        
                        expectError(A, 'name', null, [presenceMsg]);
                        expectError(A, 'email', null, [emailMsg]);
                    });
                    
                    it("should accept a function validator", function() {
                        var fn = function() {
                            return 'Failed';
                        };

                        defineA([{
                            field: 'name',
                            fn: fn
                        }]);

                        expectError(A, 'name', null, ['Failed']);
                    });
                });
                
                describe("object style", function() {
                    it("should accept a string", function() {
                        defineA({
                            name: 'presence'
                        });
                        expectError(A, 'name', null, [presenceMsg]);
                    });  
                    
                    it("should accept a function", function() {
                        var fn = function() {
                            return 'Failed';
                        };
                        defineA({
                            name: fn
                        });
                        expectError(A, 'name', null, ['Failed']);
                    });
                    
                    it("should accept config object", function() {
                        defineA({
                            name: {
                                type: 'format',
                                matcher: /foo/
                            }
                        });
                        expectError(A, 'name', null, [formatMsg]);
                    }); 
                    
                    it("should accept an array of strings", function() {
                        defineA({
                            name: ['presence', 'email']
                        });
                        expectError(A, 'name', null, [presenceMsg, emailMsg]);
                    });
                    
                    it("should accept an array of functions", function() {
                        var fn1 = function(){
                            return 'Fail1';
                        },
                            fn2 = function(){
                                return 'Fail2'
                            };
                            
                        defineA({
                            name: [fn1, fn2]
                        });
                        expectError(A, 'name', null, ['Fail1', 'Fail2']);
                    });
                    
                    it("should accept an array of objects", function() {
                        defineA({
                            name: [{
                                type: 'format',
                                matcher: /foo/
                            }, {
                                type: 'length',
                                min: 3
                            }]
                        });
                        expectError(A, 'name', 'x', [formatMsg, 'Length must be at least 3']);
                    });
                    
                    
                    it("should accept a mixed array", function() {
                        var fn = function(){
                            return 'Fail';
                        };

                        defineA({
                            name: ['email', {
                                type: 'length',
                                min: 3
                            }, fn]
                        });
                        expectError(A, 'name', 'x', [emailMsg, 'Length must be at least 3', 'Fail']);
                    });
                    
                    it("should be able to declare multiple fields at once", function() {
                        defineA({
                            name: 'presence',
                            email: 'email'
                        });
                        
                        expectError(A, 'name', null, [presenceMsg]);
                        expectError(A, 'email', null, [emailMsg]);
                    });
                });
            });

            describe("on both the field and model", function() {
                function defineA(validators, fields, cfg) {
                    cfg = Ext.apply({
                        extend: Ext.data.Model,
                        fields: fields,
                        validators: validators
                    }, cfg);
                    A = Ext.define('spec.A', cfg);
                }

                describe("model array style", function() {
                    it("should merge with a string", function() {
                        defineA([{
                            field: 'name',
                            type: 'presence'
                        }], [{
                            name: 'name',
                            validators: 'email'
                        }]);
                        expectError(A, 'name', null, [presenceMsg, emailMsg]);
                    });

                    it("should merge with an object", function() {
                        defineA([{
                            field: 'name',
                            type: 'presence'
                        }], [{
                            name: 'name',
                            validators: {
                                type: 'format',
                                matcher: /foo/
                            }
                        }]);
                        expectError(A, 'name', null, [presenceMsg, formatMsg]);
                    });

                    it("should merge with an array", function() {
                        defineA([{
                            field: 'name',
                            type: 'presence'
                        }], [{
                            name: 'name',
                            validators: ['email', function() {
                                return 'Fail';
                            }]
                        }]);
                        expectError(A, 'name', null, [presenceMsg, emailMsg, 'Fail']);
                    });
                });

                describe("model object style", function() {
                    describe("model object with string", function() {
                        it("should merge with a string", function() {
                            defineA({
                                name: 'presence'
                            }, [{
                                name: 'name',
                                validators: 'email'
                            }]);
                            expectError(A, 'name', null, [presenceMsg, emailMsg]);
                        });

                        it("should merge with an object", function() {
                            defineA({
                                name: 'presence'
                            }, [{
                                name: 'name',
                                validators: {
                                    type: 'format',
                                    matcher: /foo/
                                }
                            }]);
                            expectError(A, 'name', null, [presenceMsg, formatMsg]);
                        });

                        it("should merge with an array", function() {
                            defineA({
                                name: 'presence'
                            }, [{
                                name: 'name',
                                validators: ['email']
                            }]);
                            expectError(A, 'name', null, [presenceMsg, emailMsg]);
                        });
                    });

                    describe("model object with object", function() {
                        it("should merge with a string", function() {
                            defineA({
                                name: {
                                    type: 'presence'
                                }
                            }, [{
                                name: 'name',
                                validators: 'email'
                            }]);
                            expectError(A, 'name', null, [presenceMsg, emailMsg]);
                        });

                        it("should merge with an object", function() {
                            defineA({
                                name: {
                                    type: 'presence'
                                }
                            }, [{
                                name: 'name',
                                validators: {
                                    type: 'format',
                                    matcher: /foo/
                                }
                            }]);
                            expectError(A, 'name', null, [presenceMsg, formatMsg]);
                        });

                        it("should merge with an array", function() {
                            defineA({
                                name: {
                                    type: 'presence'
                                }
                            }, [{
                                name: 'name',
                                validators: ['email']
                            }]);
                            expectError(A, 'name', null, [presenceMsg, emailMsg]);
                        });
                    });

                    describe("model object with array", function() {
                        it("should merge with a string", function() {
                            defineA({
                                name: ['presence']
                            }, [{
                                name: 'name',
                                validators: 'email'
                            }]);
                            expectError(A, 'name', null, [presenceMsg, emailMsg]);
                        });

                        it("should merge with an object", function() {
                            defineA({
                                name: ['presence']
                            }, [{
                                name: 'name',
                                validators: {
                                    type: 'format',
                                    matcher: /foo/
                                }
                            }]);
                            expectError(A, 'name', null, [presenceMsg, formatMsg]);
                        });

                        it("should merge with an array", function() {
                            defineA({
                                name: ['presence']
                            }, [{
                                name: 'name',
                                validators: ['email']
                            }]);
                            expectError(A, 'name', null, [presenceMsg, emailMsg]);
                        });
                    });
                });
            });
            
            describe("subclassing", function() {
                function defineA(validators, fields, cfg) {
                    cfg = Ext.apply({
                        extend: Ext.data.Model,
                        fields: fields || ['name', 'email'],
                        validators: validators
                    }, cfg);
                    A = Ext.define('spec.A', cfg);
                }

                function defineB(validators, fields, cfg) {
                    cfg = Ext.apply({
                        extend: A,  
                        fields: fields || [],
                        validators: validators
                    }, cfg);
                    
                    B = Ext.define('spec.B', cfg);
                }

                describe("not redefining the field", function() {
                    it("should use the field validator", function() {
                        defineA(null, [{
                            name: 'name',
                            validators: 'presence'
                        }]);
                        defineB();
                        expectError(B, 'name', null, [presenceMsg]);
                    });

                    it("should use the superclass model validator", function() {
                        defineA({
                            name: 'presence'
                        });
                        defineB();
                        expectError(B, 'name', null, [presenceMsg]);
                    });

                    it("should use the subclass model validator", function() {
                        defineA();
                        defineB({
                            name: 'presence'
                        });
                        expectError(B, 'name', null, [presenceMsg]);
                    });

                    it("should combine a field validator & a superclass model validator", function() {
                        defineA({
                            name: 'email'
                        }, [{
                            name: 'name',
                            validators: 'presence'
                        }]);
                        defineB();
                        expectError(B, 'name', null, [emailMsg, presenceMsg]);
                    });

                    it("should combine a field validator & a subclass model validator", function() {
                        defineA(null, [{
                            name: 'name',
                            validators: 'presence'
                        }]);
                        defineB({
                            name: 'email'
                        });
                        expectError(B, 'name', null, [emailMsg, presenceMsg]);
                    });

                    it("should combine a superclass model validator & subclass model validator", function() {
                        defineA({
                            name: 'presence'
                        });
                        defineB({
                            name: 'email'
                        });
                        expectError(B, 'name', null, [presenceMsg, emailMsg]);
                    });

                    it("should combine a field validator, superclass model validator & subclass model validator", function() {
                        defineA({
                            name: 'presence'
                        }, [{
                            name: 'name',
                            validators: {
                                type: 'format',
                                matcher: /foo/
                            }
                        }]);

                        defineB({
                            name: 'email'
                        });

                        expectError(B, 'name', null, [presenceMsg, emailMsg, formatMsg]);
                    });

                    describe("not modifying the superclass", function() {
                        it("should not push subclass validators onto the superclass", function() {
                            defineA();
                            defineB({
                                name: 'presence'
                            });
                            expectError(A, 'name', null, []);
                            expectError(B, 'name', null, [presenceMsg]);
                        });

                        it("should retain superclass validators", function() {
                            defineA({
                                name: 'presence'
                            });
                            defineB({
                                name: 'email'
                            });
                            expectError(A, 'name', null, [presenceMsg]);
                            expectError(B, 'name', null, [presenceMsg, emailMsg]);
                        });
                    });
                });

                describe("redefining the field", function() {
                    beforeEach(function() {
                        spyOn(Ext.log, 'warn');
                    });
                    
                    it("should not inherit a field validator", function() {
                        defineA(null, [{
                            name: 'name',
                            validators: 'presence'
                        }]);
                        defineB(null, ['name']);
                        expectError(B, 'name', null, []);
                    });

                    it("should overwrite a field validator", function() {
                        defineA(null, [{
                            name: 'name',
                            validators: 'presence'
                        }]);
                        defineB(null, [{
                            name: 'name',
                            validators: 'email'
                        }]);
                        expectError(B, 'name', null, [emailMsg]);
                    });

                    it("should inherit a superclass model validator", function() {
                        defineA({
                            name: 'presence'
                        });
                        defineB(['name']);
                        expectError(B, 'name', null, [presenceMsg]);
                    });

                    it("should use a subclass model validator", function() {
                        defineA();
                        defineB({
                            name: 'presence'
                        }, ['name']);
                        expectError(B, 'name', null, [presenceMsg]);
                    });

                    it("should combine a field validator & a superclass model validator", function() {
                        defineA({
                            name: 'presence'
                        });
                        defineB(null, [{
                            name: 'name',
                            validators: 'email'
                        }]);
                        expectError(B, 'name', null, [presenceMsg, emailMsg]);
                    });

                    it("should combine a field validator & a subclass model validator", function() {
                        defineA();
                        defineB({
                            name: 'presence'
                        }, [{
                            name: 'name',
                            validators: 'email'
                        }]);
                        expectError(B, 'name', null, [presenceMsg, emailMsg]);
                    });

                    it("should combine a superclass model validator & a subclass model validator", function() {
                        defineA({
                            name: 'presence'
                        });
                        defineB({
                            name: 'email'
                        }, ['name']);
                        expectError(B, 'name', null, [presenceMsg, emailMsg]);
                    });

                    it("should combine a field validator, superclass model validator & subclass model validator", function() {
                        defineA({
                            name: 'presence'
                        });

                        defineB({
                            name: 'email'
                        }, [{
                            name: 'name',
                            validators: {
                                type: 'format',
                                matcher: /foo/
                            }
                        }]);

                        expectError(B, 'name', null, [presenceMsg, emailMsg, formatMsg]);
                    });

                    describe("not modifying the superclass", function() {
                        it("should not add a subclass field validator to the parent", function() {
                            defineA();
                            defineB(null, [{
                                name: 'name',
                                validators: 'presence'
                            }]);

                            expectError(A, 'name', null, []);
                            expectError(B, 'name', null, [presenceMsg]);
                        });

                        it("should not modify the superclass when overwriting a field validator", function() {
                            defineA(null, [{
                                name: 'name',
                                validators: 'presence'
                            }]);
                            defineB(null, [{
                                name: 'name',
                                validators: 'email'
                            }]);

                            expectError(A, 'name', null, [presenceMsg]);
                            expectError(B, 'name', null, [emailMsg]);
                        });

                        it("should not push subclass validators into the superclass", function() {
                            defineA();
                            defineB({
                                name: 'presence'
                            }, ['name']);

                            expectError(A, 'name', null, []);
                            expectError(B, 'name', null, [presenceMsg]);
                        });

                        it("should retain superclass validators", function() {
                            defineA({
                                name: 'presence'
                            });
                            defineB({
                                name: 'email'
                            }, ['name']);
                            expectError(A, 'name', null, [presenceMsg]);
                            expectError(B, 'name', null, [presenceMsg, emailMsg]);
                        });
                    });
                });
            });
        });
    });
    
    describe("get/setProxy", function() {
        var A;
        
        afterEach(function() {
            A = null;
            Ext.undefine('spec.A');
        });
        
        function defineA(proxy, cfg) {
            cfg = Ext.apply({
                extend: Ext.data.Model,
                fields: ['id'],
                proxy: proxy
            }, cfg);
            A = Ext.define('spec.A', cfg);
        }
        
        it("should be able to set a string type", function() {
            defineA();
            A.setProxy('ajax');
            expect(A.getProxy() instanceof Ext.data.proxy.Ajax).toBe(true);
        });
        
        it("should be able to set a config", function() {
            defineA();
            A.setProxy({
                type: 'ajax',
                url: '/foo'
            });
            expect(A.getProxy().getUrl()).toBe('/foo');
        });
        
        it("should be able to set an instance", function() {
            var proxy = new Ext.data.proxy.Ajax({
                url: '/foo'
            });
            defineA();
            A.setProxy(proxy);
            expect(A.getProxy()).toBe(proxy);
            proxy = null;
        });
        
        it("should have the instance method call the static method", function() {
            defineA({
                type: 'ajax',
                url: '/foo'
            });
            var proxy = A.getProxy();
            
            var o = new A();   
            expect(o.getProxy()).toBe(proxy);
            proxy = null;
        });
    });
    
    describe("remote calls", function() {
        var A, theOperation, rec;
            
        function defineA(proxy, cfg) {
            cfg = Ext.apply({
                extend: Ext.data.Model,
                fields: ['id', 'name', 'age'],
                proxy: proxy || {
                    type: 'ajax',
                    url: '/foo'
                }
            }, cfg);
            A = Ext.define('spec.A', cfg);
        }

        function make(id, loadOptions, session) {
            rec = new A({
                id: id
            }, session);
            if (loadOptions) {
                rec.load(loadOptions);
            }
            return rec;
        }

        beforeEach(function() {
            MockAjaxManager.addMethods();
        });
        
        afterEach(function() {
            MockAjaxManager.removeMethods();
            theOperation = A = null;
            Ext.undefine('spec.A');
        });
        
        describe("load", function() {
            var readSpy;
            beforeEach(function() {
                defineA();
                readSpy = spyOn(A.getProxy(), 'read').andCallFake(function(operation) {
                    theOperation = operation;
                    return readSpy.originalValue.apply(this, arguments);
                }); 
            });

            function complete(data, status) {
                Ext.Ajax.mockComplete({
                    status: status || 200,
                    responseText: Ext.JSON.encode(data)
                });
            }

            it("should throw if the returned id is different", function() {
                make(3, {});
                expect(function() {
                    complete({
                        id: 100
                    });
                }).toThrow();
            });
            
            it("should pass the id as part of the operation", function() {
                make(3, {});
                expect(theOperation.getId()).toBe(3);
            });

            it("should return the operation", function() {
                make(3);
                expect(rec.load().isOperation).toBe(true);
            });

            describe("with phantoms", function() {
                it("should not be a phantom after loading", function() {
                    make();
                    expect(rec.phantom).toBe(true);
                    rec.load();
                    complete({id: 1});
                    expect(rec.phantom).toBe(false);
                });

                it("should set the id on the new record", function() {
                    make();
                    rec.load();
                    complete({id: 200});
                    expect(rec.getId()).toBe(200);
                });
            });

            describe("while loading", function() {
                it("should return the operation", function() {
                    var op = rec.load();
                    expect(rec.load()).toBe(op);
                });

                it("should not trigger a second load", function() {
                    make(3, {});
                    readSpy.reset();
                    rec.load();
                    expect(readSpy).not.toHaveBeenCalled();
                });

                describe("callbacks", function() {
                    it("should call success & callback if successful", function() {
                        var successSpy = jasmine.createSpy(),
                            callbackSpy = jasmine.createSpy();

                        make(3, {});
                        rec.load({
                            success: successSpy,
                            callback: callbackSpy
                        });
                        complete({});
                        expect(successSpy).toHaveBeenCalled();
                        expect(callbackSpy).toHaveBeenCalled();
                    });

                    it("should be able to call success/callback multiple times", function() {
                        var successSpy = jasmine.createSpy(),
                            callbackSpy = jasmine.createSpy(),
                            i = 0;

                        make(3, {});
                        for (i = 0; i < 3; ++i) {
                            rec.load({
                                success: successSpy,
                                callback: callbackSpy
                            });
                        }
                        complete({});
                        expect(successSpy.callCount).toBe(3);
                        expect(callbackSpy.callCount).toBe(3);
                    });

                    it("should be able to call success/callback in conjunction with the original callbacks", function() {
                        var firstSuccess = jasmine.createSpy(),
                            firstCallback = jasmine.createSpy(),
                            secondSuccess = jasmine.createSpy(),
                            secondCallback = jasmine.createSpy();

                        make(3, {
                            success: firstSuccess,
                            callback: firstCallback
                        });
                        rec.load({
                            success: secondSuccess,
                            callback: secondCallback
                        });
                        complete({});
                        expect(firstSuccess).toHaveBeenCalled();
                        expect(firstCallback).toHaveBeenCalled();
                        expect(secondSuccess).toHaveBeenCalled();
                        expect(secondCallback).toHaveBeenCalled();
                    });

                    it("should call failure & callback if failed", function() {
                        var failureSpy = jasmine.createSpy(),
                            callbackSpy = jasmine.createSpy();

                        make(3, {});
                        rec.load({
                            failure: failureSpy,
                            callback: callbackSpy
                        });
                        complete(null, 500);
                        expect(failureSpy).toHaveBeenCalled();
                        expect(callbackSpy).toHaveBeenCalled();
                    });

                    it("should be able to call failure/callback multiple times", function() {
                        var failureSpy = jasmine.createSpy(),
                            callbackSpy = jasmine.createSpy(),
                            i = 0;

                        make(3, {});
                        for (i = 0; i < 3; ++i) {
                            rec.load({
                                failure: failureSpy,
                                callback: callbackSpy
                            });
                        }
                        complete(null, 500);
                        expect(failureSpy.callCount).toBe(3);
                        expect(callbackSpy.callCount).toBe(3);
                    });
                });
            });

            describe("setting data", function() {
                it("should set the data on the model", function() {
                    make(3, {});
                    complete({
                        name: 'foo',
                        age: 20
                    });
                    expect(rec.get('name')).toBe('foo');
                    expect(rec.get('age')).toBe(20);
                });

                it("should only set returned data", function() {
                    make(2, {});
                    complete({
                        name: 'foo'
                    });
                    expect(rec.get('name')).toBe('foo');
                    expect(rec.get('age')).toBeUndefined();
                });

                it("should overwrite local data", function() {
                    make(2);
                    rec.set('name', 'bar');
                    rec.load();
                    complete({
                        name: 'foo',
                        age: 20
                    });
                    expect(rec.get('name')).toBe('foo');
                    expect(rec.get('age')).toBe(20);
                });

                it("should commit the data", function() {
                    make(3, {});
                    complete({
                        name: 'foo',
                        age: 20
                    });
                    expect(rec.dirty).toBe(false);
                });

                describe("associations", function() {
                    beforeEach(function() {
                        Ext.define('spec.Post', {
                            extend: 'Ext.data.Model',
                            entityName: 'Post',
                            fields: ['id', 'content', {
                                name: 'aId',
                                reference: 'A'
                            }]
                        });
                    });

                    afterEach(function() {
                        Ext.undefine('spec.Post');
                    });

                    it("should be able to load associations", function() {
                        make(3, {});
                        complete({
                            posts: [{id: 1}, {id: 2}, {id: 3}]
                        });

                        var posts = rec.posts();
                        expect(posts.getCount()).toBe(3);
                        expect(posts.getAt(0).getId()).toBe(1);
                        expect(posts.getAt(1).getId()).toBe(2);
                        expect(posts.getAt(2).getId()).toBe(3);

                        
                    });

                    describe("with a session", function() {
                        it("should ensure the session is consulted when constructing nested records", function() {
                            Ext.define('spec.Comment', {
                                extend: 'Ext.data.Model',
                                entityName: 'Comment',
                                fields: ['id', 'content', {
                                    name: 'postId',
                                    reference: 'Post'
                                }]
                            });

                            var session = new Ext.data.Session(),
                                post = session.createRecord('Post', {
                                    id: 2,
                                    aId: 3,
                                    content: 'Foo'
                                }),
                                comment = session.createRecord('Comment', {
                                    id: 132,
                                    postId: 3,
                                    content: 'Bar'
                                });

                            make(3, {}, session);
                            complete({
                                posts: [{id: 1, aId: 3}, {id: 2, aId: 3}, {
                                    id: 3,
                                    aId: 3,
                                    comments: [{
                                        id: 132
                                    }]
                                }]
                            });

                            var posts = rec.posts();
                            expect(posts.getAt(1)).toBe(post);
                            expect(posts.getAt(2).comments().first()).toBe(comment);
                            session.destroy();
                            Ext.undefine('spec.Comment');
                        });
                    });
                });
            });

            describe("via the static load call", function() {
                it("should return the created model instance", function() {
                    rec = A.load(1);
                    expect(rec.getId()).toBe(1);
                    expect(rec.self).toBe(A);
                });

                it("should call the instance load method and pass options", function() {
                    var options = {},
                        spy = spyOn(A.prototype, 'load');
                    
                    A.load(1, options);
                    expect(spy).toHaveBeenCalledWith(options);
                });
 
                it("should create the record in the session if passed", function() {
                    var session = new Ext.data.Session();
                    rec = A.load(12, null, session);
                    expect(rec.session).toBe(session);
                    expect(session.getRecord('A', 12)).toBe(rec);
                    session.destroy();
                });

                it("should set a custom idProperty", function() {
                    var CustomId = Ext.define('spec.CustomId', {
                        extend: 'Ext.data.Model',
                        idProperty: 'foo'
                    });
                    
                    rec = CustomId.load(1);
                    expect(rec.get('foo')).toBe(1);
                    Ext.undefine('spec.CustomId');
                });
            });

            describe("isLoading", function() {
                it("should not be loading by default", function() {
                    make(100);
                    expect(rec.isLoading()).toBe(false);
                });

                it("should be loading when a load is initiated", function() {
                    make(100, {});
                    expect(rec.isLoading()).toBe(true);
                });

                it("should not be loading when a load has completed", function() {
                    make(100, {});
                    complete({});
                    expect(rec.isLoading()).toBe(false);
                });

                it("should not be loading when a load is aborted", function() {
                    make(100, {});
                    rec.abort();
                    expect(rec.isLoading()).toBe(false);
                });
            });

            describe("abort", function() {
                it("should do nothing if not loading", function() {
                    make(100);
                    expect(function() {
                        rec.abort();
                    }).not.toThrow();
                });

                it("should abort a load operation", function() {
                    make(100, {});
                    var op = rec.loadOperation;
                    spyOn(op, 'abort');
                    rec.abort();
                    expect(op.abort).toHaveBeenCalled();
                });
            });
            
            describe("operation successful", function() {
                
                it("should trigger the success callback", function() {
                    var spy = jasmine.createSpy();
                    make(17, {
                        success: spy
                    });

                    complete({
                        id: 17,
                        name: 'TheName'
                    });

                    expect(spy).toHaveBeenCalled();
                });
                
                it("should pass a record and the operation", function() {
                    var spy = jasmine.createSpy();                    
                    make(17, {
                        success: spy
                    });
                    complete({
                        id: 17,
                        name: 'TheName'
                    });
                    var args = spy.mostRecentCall.args;
                    expect(args[0]).toBe(rec);
                    expect(args[1]).toBe(theOperation);
                });
                
                it("should only pass the first record if the server returns multiple", function() {
                    var spy = jasmine.createSpy();
                    
                    make(17, {
                        success: spy
                    });
                    complete([{
                        id: 17,
                        name: 'Foo'
                    }, {
                        id: 107,
                        name: 'Bar'
                    }]);
                    expect(spy.mostRecentCall.args[0]).toBe(rec);
                    expect(spy.callCount).toBe(1);
                });
                
                it("should default the scope to the instance", function() {
                    var spy = jasmine.createSpy();
                    make(100, {
                        success: spy
                    });
                    complete({});
                    expect(spy.mostRecentCall.object).toBe(rec);
                });
                
                it("should use a passed scope", function() {
                    var o = {},
                        spy = jasmine.createSpy();
                        
                    make(100, {
                        scope: o,
                        success: spy
                    });
                    complete({});
                    expect(spy.mostRecentCall.object).toBe(o);
                });
                
                it("should also fire the callback", function() {
                    var callbackSpy = jasmine.createSpy(),
                        successSpy = jasmine.createSpy();
                        
                    make(100, {
                        success: successSpy,
                        callback: callbackSpy
                    });
                    complete({});
                    expect(successSpy).toHaveBeenCalled();
                    expect(callbackSpy).toHaveBeenCalled(); 
                });
                
                describe("with no record returned", function() {
                    it("should fire the failure callback, not success", function() {
                        var successSpy = jasmine.createSpy(),
                            failureSpy = jasmine.createSpy();
                            
                        make(100, {
                            failure: failureSpy,
                            success: successSpy
                        });
                        complete([]);
                        expect(successSpy).not.toHaveBeenCalled();
                        expect(failureSpy).toHaveBeenCalled();
                    });
                });
            });
            
            describe("operation failure", function() {
                it("should trigger the failure callback", function() {
                    var spy = jasmine.createSpy();
                    make(17, {
                        failure: spy
                    });
                    complete(null, 500);
                    expect(spy).toHaveBeenCalled();
                });
                
                it("should pass the record and the operation", function() {
                    var spy = jasmine.createSpy();
                    
                    make(17, {
                        failure: spy   
                    });
                    complete(null, 500);
                    var args = spy.mostRecentCall.args;
                    expect(args[0]).toBe(rec);
                    expect(args[1]).toBe(theOperation);
                });
                
                it("should default the scope to the instance", function() {
                    var spy = jasmine.createSpy();

                    make(100, {
                        failure: spy
                    });
                    complete(null, 500);
                    expect(spy.mostRecentCall.object).toBe(rec);
                });
                
                it("should use a passed scope", function() {
                    var o = {},
                        spy = jasmine.createSpy();
                        
                    make(100, {
                        scope: o,
                        failure: spy
                    });
                    complete(null, 500);
                    expect(spy.mostRecentCall.object).toBe(o);
                });
                
                it("should also fire the callback", function() {
                    var callbackSpy = jasmine.createSpy(),
                        failureSpy = jasmine.createSpy();
                        
                    make(100, {
                        failure: failureSpy,
                        callback: callbackSpy
                    });
                    complete(null, 500);
                    expect(failureSpy).toHaveBeenCalled();
                    expect(callbackSpy).toHaveBeenCalled(); 
                });
            });
            
            describe("callback", function() {
                it("should default the scope to the instance", function() {
                    var spy = jasmine.createSpy();

                    make(100, {
                        callback: spy
                    });
                    complete({});
                    expect(spy.mostRecentCall.object).toBe(rec);
                });  
                
                it("should use a passed scope", function() {
                    var o = {}, 
                        spy = jasmine.createSpy();
                        
                    make(100, {
                        scope: o,
                        callback: spy
                    });
                    complete({});
                    expect(spy.mostRecentCall.object).toBe(o);
                }); 
                
                it("should receive the model, operation & success=true when successful", function() {                    
                    var spy = jasmine.createSpy();
                    make(17, {
                        callback: spy   
                    });
                    complete({});
                    var args = spy.mostRecentCall.args;
                    expect(args[0]).toBe(rec);
                    expect(args[1]).toBe(theOperation);
                    expect(args[2]).toBe(true);
                });
                
                it("should receive rec, operation & success=false when failed", function() {
                    var spy = jasmine.createSpy();
                    make(17, {
                        callback: spy    
                    });
                    complete(null, 500);
                    var args = spy.mostRecentCall.args;
                    expect(args[0]).toBe(rec);
                    expect(args[1]).toBe(theOperation);
                    expect(args[2]).toBe(false);
                });

                it("should be called last when successful", function() {
                    var order = [];
                    make(17, {
                        success: function() { order.push('success'); },
                        callback: function() { order.push('callback'); }
                    });
                    complete({});
                    expect(order).toEqual(['success', 'callback']);
                });

                it("should be called last when failed", function() {
                    var order = [];
                    make(17, {
                        failure: function() { order.push('fail'); },
                        callback: function() { order.push('callback'); }
                    });
                    complete(null, 500);
                    expect(order).toEqual(['fail', 'callback']);
                });
            });
        });
        
        describe("save", function() {
            var rec, spy;
            
            function setupCallback(success) {
                spyOn(A.getProxy(), 'doRequest').andCallFake(function(op) {
                    theOperation = op;
                    if (success) {
                        op.process(new Ext.data.ResultSet({
                            success: true
                        }));
                    } else {
                        op.setException('Failed');
                    }
                });
            }
            
            beforeEach(function() {
                defineA();
                rec = new A({
                    id: 17
                });
                spy = jasmine.createSpy();
            });
            
            describe("operation types", function() {
                it("should create a destroy operation if the record is dropped", function() {
                    rec = new A();
                    rec.drop();
                    var operation = rec.save();
                    expect(operation instanceof Ext.data.operation.Destroy).toBe(true);
                });
                
                it("should create a create operation if the record is a phantom", function() {
                    rec = new A();
                    var operation = rec.save();
                    expect(operation instanceof Ext.data.operation.Create).toBe(true);
                });
                
                it("should create an update operation if the record is not phantom and not dropped", function() {
                    var operation = rec.save();
                    expect(operation instanceof Ext.data.operation.Update).toBe(true);
                });
            });

            describe("callbacks", function() {
                describe("success", function() {                        
                    beforeEach(function() {
                        setupCallback(true);
                    });

                    it("should pass the record and the operation", function() {
                        rec.save({
                            success: spy
                        });
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(rec);
                        expect(args[1]).toBe(theOperation);
                        expect(theOperation.wasSuccessful()).toBe(true);
                    });

                    it("should default the scope to the model", function() {
                        rec.save({
                            success: spy
                        });
                        expect(spy.mostRecentCall.object).toBe(rec);
                    });

                    it("should use the passed scope", function() {
                        var o = {};
                        rec.save({
                            success: spy,
                            scope: o
                        });
                        expect(spy.mostRecentCall.object).toBe(o);
                    });

                    it("should not call failure", function() {
                        rec.save({
                            failure: spy
                        });
                        expect(spy).not.toHaveBeenCalled();
                    });
                });

                describe("failure", function() {
                    beforeEach(function() {
                        setupCallback(false);
                    });

                    it("should pass the record and the operation", function() {
                        rec.save({
                            failure: spy
                        });
                        var args = spy.mostRecentCall.args;
                        expect(args[0]).toBe(rec);
                        expect(args[1]).toBe(theOperation);
                        expect(theOperation.wasSuccessful()).toBe(false);
                    });

                    it("should default the scope to the model", function() {
                        rec.save({
                            failure: spy
                        });
                        expect(spy.mostRecentCall.object).toBe(rec);
                    });

                    it("should use the passed scope", function() {
                        var o = {};
                        rec.save({
                            failure: spy,
                            scope: o
                        });
                        expect(spy.mostRecentCall.object).toBe(o);
                    });

                    it("should not call success", function() {
                        rec.save({
                            success: spy
                        });
                        expect(spy).not.toHaveBeenCalled();
                    });
                });

                describe("callback", function() {
                    describe("on success", function() {            
                        it("should pass the record, operation & success", function() {
                            setupCallback(true);
                            rec.save({
                                callback: spy
                            });
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(rec);
                            expect(args[1]).toBe(theOperation);
                            expect(theOperation.wasSuccessful()).toBe(true);
                            expect(args[2]).toBe(true);
                        });
                    });

                    describe("on failure", function() {            
                        it("should pass the record, operation & success", function() {
                            setupCallback(false);
                            rec.save({
                                callback: spy
                            });
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(rec);
                            expect(args[1]).toBe(theOperation);
                            expect(theOperation.wasSuccessful()).toBe(false);
                            expect(args[2]).toBe(false);
                        });
                    });

                    it("should default the scope to the model", function() {
                        setupCallback(true);
                        rec.save({
                            callback: spy
                        });
                        expect(spy.mostRecentCall.object).toBe(rec);
                    });

                    it("should use the passed scope", function() {
                        setupCallback(true);
                        var o = {};
                        rec.save({
                            callback: spy,
                            scope: o
                        });
                        expect(spy.mostRecentCall.object).toBe(o);
                    });
                });
            });
        });
        
        describe("erase", function() {
            var spy, rec;
            
            beforeEach(function() {
                defineA();
                spy = jasmine.createSpy();
            });
            
            
            describe("phantom", function() {
                beforeEach(function() {
                    rec = new A();
                });
                
                it("should not make a call to the proxy", function() {
                    var proxy = A.getProxy();
                    spyOn(proxy, 'erase');
                    rec.erase();
                    expect(proxy.erase).not.toHaveBeenCalled();
                });
                
                it("should return an operation, it should be completed", function() {
                    var op = rec.erase();
                    expect(op.isOperation).toBe(true);
                    expect(op.isComplete()).toBe(true);
                });
                
                it("should call afterErase", function() {
                    spyOn(rec, 'callJoined');
                    rec.erase();
                    expect(rec.callJoined).toHaveBeenCalled();
                    expect(rec.callJoined.mostRecentCall.args[0]).toBe('afterErase');
                });
                
                it("should set the erased property", function() {
                    rec.erase();
                    expect(rec.erased).toBe(true);
                });
                
                describe("callbacks", function() {
                    describe("success", function() {
                        it("should fire before the function returns", function() {
                            var after = false,
                                val;
                            rec.erase({
                                success: function() {
                                    val = after;
                                }
                            });
                            after = true;
                            expect(val).toBe(false);
                        });
                        
                        it("should pass the record and the operation", function() {
                            rec.erase({
                                success: spy
                            });
                            var args = spy.mostRecentCall.args,
                                op = args[1];
                            expect(args[0]).toBe(rec);
                            expect(op instanceof Ext.data.operation.Destroy).toBe(true);
                            expect(op.getRecords()).toEqual([rec]);
                            expect(op.wasSuccessful()).toBe(true);
                        });
                        
                        it("should default the scope to the model", function() {
                            rec.erase({
                                success: spy
                            });
                            expect(spy.mostRecentCall.object).toBe(rec);
                        });
                        
                        it("should use the passed scope", function() {
                            var o = {};
                            rec.erase({
                                success: spy,
                                scope: o
                            });
                            expect(spy.mostRecentCall.object).toBe(o);
                        });
                    });
                    
                    describe("failure", function() {
                        it("should never call this", function() {
                            rec.erase({
                                failure: spy
                            });
                            expect(spy).not.toHaveBeenCalled();
                        });
                    });
                    
                    describe("callback", function() {
                        it("should fire before the function returns", function() {
                            var after = false,
                                val;
                            rec.erase({
                                callback: function() {
                                    val = after;
                                }
                            });
                            after = true;
                            expect(val).toBe(false);
                        });
                        
                        it("should pass the record, operation & success", function() {
                            rec.erase({
                                callback: spy
                            });
                            var args = spy.mostRecentCall.args,
                                op = args[1];
                            expect(args[0]).toBe(rec);
                            expect(op instanceof Ext.data.operation.Destroy).toBe(true);
                            expect(op.getRecords()).toEqual([rec]);
                            expect(op.wasSuccessful()).toBe(true);
                            expect(args[2]).toBe(true);
                        });
                        
                        it("should default the scope to the model", function() {
                            rec.erase({
                                callback: spy
                            });
                            expect(spy.mostRecentCall.object).toBe(rec);
                        });
                        
                        it("should use the passed scope", function() {
                            var o = {};
                            rec.erase({
                                callback: spy,
                                scope: o
                            });
                            expect(spy.mostRecentCall.object).toBe(o);
                        });
                    });
                });
            });
            
            describe("non-phantom", function() {
                function setupCallback(success) {
                    spyOn(A.getProxy(), 'erase').andCallFake(function(op) {
                        theOperation = op;
                        if (success) {
                            op.process(new Ext.data.ResultSet({
                                success: true
                            }));
                        } else {
                            op.setException('Failed');
                        }
                    });
                }
                
                beforeEach(function() {
                    rec = new A({
                        id: 17
                    });
                });
                
                it("should call the proxy erase method", function() {
                    spy = spyOn(A.getProxy(), 'erase').andReturn();
                    rec.erase();
                    expect(spy).toHaveBeenCalled();
                });
                
                it("should return an operation, it should not be completed", function() {
                    var op = rec.erase();
                    expect(op.isOperation).toBe(true);
                    expect(op.isComplete()).toBe(false);
                });
                
                describe("when successful", function() {
                    it("should call afterErase", function() {
                        spyOn(rec, 'callJoined');
                        setupCallback(true);
                        rec.erase();
                        expect(rec.callJoined).toHaveBeenCalled();
                        expect(rec.callJoined.mostRecentCall.args[0]).toBe('afterErase');
                    });
                
                    it("should set the erased property", function() {
                        setupCallback(true);
                        rec.erase();
                        expect(rec.erased).toBe(true);
                    });
                });
                
                describe("when not successful", function() {
                    it("should not call afterErase", function() {
                        spyOn(rec, 'callJoined');
                        setupCallback(false);
                        rec.erase();
                        expect(rec.callJoined).not.toHaveBeenCalledWith('afterErase');
                    });
                
                    it("should not set the erased property", function() {
                        setupCallback(false);
                        rec.erase();
                        expect(rec.erased).toBe(false);
                    });
                });
                
                describe("callbacks", function() {
                    describe("success", function() {                        
                        beforeEach(function() {
                            setupCallback(true);
                        });
                        
                        it("should pass the record and the operation", function() {
                            rec.erase({
                                success: spy
                            });
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(rec);
                            expect(args[1]).toBe(theOperation);
                            expect(theOperation.wasSuccessful()).toBe(true);
                        });
                        
                        it("should default the scope to the model", function() {
                            rec.erase({
                                success: spy
                            });
                            expect(spy.mostRecentCall.object).toBe(rec);
                        });
                        
                        it("should use the passed scope", function() {
                            var o = {};
                            rec.erase({
                                success: spy,
                                scope: o
                            });
                            expect(spy.mostRecentCall.object).toBe(o);
                        });
                        
                        it("should not call failure", function() {
                            rec.erase({
                                failure: spy
                            });
                            expect(spy).not.toHaveBeenCalled();
                        });
                    });
                    
                    describe("failure", function() {
                        beforeEach(function() {
                            setupCallback(false);
                        });
                        
                        it("should pass the record and the operation", function() {
                            rec.erase({
                                failure: spy
                            });
                            var args = spy.mostRecentCall.args;
                            expect(args[0]).toBe(rec);
                            expect(args[1]).toBe(theOperation);
                            expect(theOperation.wasSuccessful()).toBe(false);
                        });
                        
                        it("should default the scope to the model", function() {
                            rec.erase({
                                failure: spy
                            });
                            expect(spy.mostRecentCall.object).toBe(rec);
                        });
                        
                        it("should use the passed scope", function() {
                            var o = {};
                            rec.erase({
                                failure: spy,
                                scope: o
                            });
                            expect(spy.mostRecentCall.object).toBe(o);
                        });
                        
                        it("should not call success", function() {
                            rec.erase({
                                success: spy
                            });
                            expect(spy).not.toHaveBeenCalled();
                        });
                    });
                    
                    describe("callback", function() {
                        describe("on success", function() {            
                            it("should pass the record, operation & success", function() {
                                setupCallback(true);
                                rec.erase({
                                    callback: spy
                                });
                                var args = spy.mostRecentCall.args;
                                expect(args[0]).toBe(rec);
                                expect(args[1]).toBe(theOperation);
                                expect(theOperation.wasSuccessful()).toBe(true);
                                expect(args[2]).toBe(true);
                            });
                        });
                        
                        describe("on failure", function() {            
                            it("should pass the record, operation & success", function() {
                                setupCallback(false);
                                rec.erase({
                                    callback: spy
                                });
                                var args = spy.mostRecentCall.args;
                                expect(args[0]).toBe(rec);
                                expect(args[1]).toBe(theOperation);
                                expect(theOperation.wasSuccessful()).toBe(false);
                                expect(args[2]).toBe(false);
                            });
                        });
                        
                        it("should default the scope to the model", function() {
                            setupCallback(true);
                            rec.erase({
                                callback: spy
                            });
                            expect(spy.mostRecentCall.object).toBe(rec);
                        });
                        
                        it("should use the passed scope", function() {
                            setupCallback(true);
                            var o = {};
                            rec.erase({
                                callback: spy,
                                scope: o
                            });
                            expect(spy.mostRecentCall.object).toBe(o);
                        });
                    });
                });
            });
        });
    });

    describe("the initial id", function() {
        var A, rec;
        function defineA(type, dateFormat) {
            A = Ext.define(null, {  
                extend: 'Ext.data.Model',
                fields: [{
                    name: 'id',
                    type: type || 'auto',
                    dateFormat: dateFormat
                }]
            });
        }

        afterEach(function() {
            A = null;
        });

        describe("auto", function() {
            beforeEach(function() {
                defineA();
            });

            it("should auto generate an id when not specified and be phantom", function() {
                rec = new A();
                var prefix = rec.self.identifier.getPrefix();
                expect(rec.id).toBe(prefix + '1');
                expect(rec.phantom).toBe(true);
            });

            it("should use a specified idand not be phantom", function() {
                rec = new A({
                    id: 'foo'
                });
                expect(rec.id).toBe('foo');
                expect(rec.phantom).toBe(false);
            });
        });

        describe("string", function() {
            beforeEach(function() {
                defineA('string');
            });

            it("should auto generate an id when not specified and be phantom", function() {
                rec = new A();
                var prefix = rec.self.identifier.getPrefix();
                expect(rec.id).toBe(prefix + '1');
                expect(rec.phantom).toBe(true);
            });

            it("should use a specified id and not be phantom", function() {
                rec = new A({
                    id: 'foo'
                });
                expect(rec.id).toBe('foo');
                expect(rec.phantom).toBe(false);
            });

            it("should run the converter and not be phantom", function() {
                rec = new A({
                    id: 2
                });
                expect(rec.id).toBe('2');
                expect(rec.phantom).toBe(false);
            });
        });

        describe("int", function() {
            beforeEach(function() {
                defineA('int');
            });

            it("should auto generate an id when not specified and be phantom", function() {
                rec = new A();
                var prefix = rec.self.identifier.getPrefix();
                expect(rec.id).toBe(prefix + '1');
                expect(rec.phantom).toBe(true);
            });

            it("should use a specified id and not be phantom", function() {
                rec = new A({
                    id: 32
                });
                expect(rec.id).toBe(32);
                expect(rec.phantom).toBe(false);
            });

            it("should run the converter and not be phantom", function() {
                rec = new A({
                    id: '600'
                });
                expect(rec.id).toBe(600);
                expect(rec.phantom).toBe(false);
            });
        });

        describe("date", function() {
            beforeEach(function() {
                defineA('date', 'Y-m-d');
            });

            it("should auto generate an id when not specified and be phantom", function() {
                rec = new A();
                var prefix = rec.self.identifier.getPrefix();
                expect(rec.id).toBe(prefix + '1');
                expect(rec.phantom).toBe(true);
            });

            it("should use a specified id and not be phantom", function() {
                var d = new Date();
                rec = new A({
                    id: d
                });
                expect(rec.id).toBe(d);
                expect(rec.phantom).toBe(false);
            });

            it("should run the converter and not be phantom", function() {
                var now = new Date().getTime();
                rec = new A({
                    id: '2012-01-01'
                });

                expect(Ext.Date.format(rec.id, 'Y-m-d')).toBe('2012-01-01');
                expect(rec.phantom).toBe(false);
            });
        });
    });
    
    describe("constructing", function() {
        var now = new Date(),
            myArr = [],
            myObj = {},
            A, B, o,
            convertOnlyCalled, 
            convertAndDefaultValueCalled,
            returnFromConvert,
            useReturnFromConvert;
            
        beforeEach(function() {
            useReturnFromConvert = false;
            A = Ext.define('spec.A', {
                extend: Ext.data.Model,
                fields: ['nothing', {
                    name: 'convertOnly',
                    convert: function(v) {
                        convertOnlyCalled = true;
                        if (useReturnFromConvert) {
                            return returnFromConvert;
                        } else {
                            return v;
                        }
                    }
                }, {
                    name: 'convertAndDefaultValue',
                    convert: function(v) {
                        convertAndDefaultValueCalled = true;
                        if (useReturnFromConvert) {
                            return returnFromConvert;
                        } else {
                            return v;
                        }
                    },
                    defaultValue: 16
                }, {
                    name: 'defaultOnly',
                    defaultValue: 'foo'
                }, {
                    name: 'objField',
                    defaultValue: {}
                }, {
                    name: 'arrField',
                    defaultValue: []
                }, {
                    name: 'dateField',
                    defaultValue: now
                }]
            });
            convertAndDefaultValueCalled = convertOnlyCalled = false;
        });
        
        afterEach(function() {
            Ext.undefine('spec.A');
            A = B = o = null;
            returnFromConvert = undefined;
        });
        
        it("should accept no params", function() {
            expect(function() {
                o = new A();
            }).not.toThrow();
        });
        
        it("should assign an underlying data object", function() {
            o = new A({
                nothing: 'Foo'
            });    
            expect(o.get('nothing')).toBe('Foo');
        });

        it("should read the field if it has a hyphen in the name", function() {
            var TheModel = Ext.define(null, {
                extend: 'Ext.data.Model',
                fields: [{
                    name: 'the-field',
                    convert: Ext.identityFn
                }]
            });

            o = new TheModel({
                'the-field': 'foo'
            });
            expect(o.get('the-field')).toBe('foo');
        });
        
        describe("id", function() {
            describe("with no value", function() {
                describe("with no identifier config", function() {
                    it("should generate a new id", function() {
                        spyOn(A.identifier, 'generate').andReturn('x');
                        o = new A();
                        expect(o.id).toBe('x');    
                    });
            
                    it("should set phantom: true", function() {
                        o = new A();
                        expect(o.phantom).toBe(true);    
                    });

                    it("should put the id on the idProperty field", function() {
                        spyOn(A.identifier, 'generate').andReturn('x');
                        o = new A();
                        expect(o.get('id')).toBe('x');    
                    });
                });
                
                describe("with identifier config", function() {
                    it("should generate an id", function() {
                        spyOn(A.identifier, 'generate').andReturn('Foo');
                        o = new A();
                        expect(o.id).toBe('Foo');
                    });
                    
                    it("should set phantom: true", function() {
                        spyOn(A.identifier, 'generate').andReturn('Foo');
                        o = new A();
                        expect(o.phantom).toBe(true);
                    });

                    it("should put the id on the idProperty field", function() {
                        spyOn(A.identifier, 'generate').andReturn('Foo');
                        o = new A();
                        expect(o.get('id')).toBe('Foo');    
                    });
                });
            });  
            
            describe("with a value", function() {
                it("should set the id", function() {
                    o = new A({
                        id: 3
                    });    
                    expect(o.id).toBe(3);
                });  
                
                it("should set phantom: false", function() {
                    o = new A({
                        id: 3
                    });    
                    expect(o.phantom).toBe(false);
                });
                
                it("should modify the idProperty field", function() {
                    o = new A({
                        id: 3
                    });
                    expect(o.get('id')).toBe(3);
                });
                
                it("should not call the id generator", function() {
                    spyOn(A.identifier, 'generate');
                    o = new A({
                        id: 1
                    });
                    expect(A.identifier.generate).not.toHaveBeenCalled();
                });
            });

            it("should convert the ID according to the idField's convert function", function() {
                var Record = Ext.define(null, {
                    extend: 'Ext.data.Model',
                    fields: [{
                        name: 'pageId'
                    }, {
                        name: 'browserId'
                    }, {
                        name: 'id',
                        convert: function(v, rec) {
                            return rec.get('pageId') + rec.get('browserId');
                        }
                    }]
                });
 
                var t = new Record({pageId: 'foo', browserId: 'bar', id: 'xx' });
                expect(t.getId()).toBe('foobar');
            });
        });
        
        describe("convert", function() {
            it("should call the convert method", function() {
                useReturnFromConvert = true;
                returnFromConvert = 10;
                o = new A({});
                expect(convertOnlyCalled).toBe(true);
                expect(o.get('convertOnly')).toBe(10);
            });
            
            it("should ignore the value from convert if it returns undefined", function() {
                useReturnFromConvert = true;
                returnFromConvert = undefined;
                o = new A({
                    convertOnly: 'foo'
                });
                expect(convertOnlyCalled).toBe(true);
                expect(o.get('convertOnly')).toBe('foo');
            });
        });  
            
        describe("defaultValue", function() {
            it("should assign the defaultValue", function() {
                o = new A({});
                expect(o.get('defaultOnly')).toBe('foo');   
            });
            
            it("should only assign the defaultValue if the value is undefined", function() {
                o = new A({
                    defaultOnly: null
                });
                expect(o.get('defaultOnly')).toBeNull(); 
                o = new A({
                    defaultOnly: ''
                });
                expect(o.get('defaultOnly')).toBe('');   
                o = new A({
                    defaultOnly: false
                });
                expect(o.get('defaultOnly')).toBe(false);   
                o = new A({
                    defaultOnly: 0
                });
                expect(o.get('defaultOnly')).toBe(0);     
            });    
            
            describe("object types", function() {
                it("should copy objects", function() {
                    o = new A({});
                    var val = o.get('objField');
                    expect(val).not.toBe(myObj);
                    expect(val).toEqual(myObj);
                });
                
                it("should copy dates", function() {
                    o = new A({});
                    var val = o.get('dateField');
                    expect(val).not.toBe(now);
                    expect(val).toEqual(now);
                });
                
                it("should copy arrays", function() {
                    o = new A({});
                    var val = o.get('arrField');
                    expect(val).not.toBe(myArr);
                    expect(val).toEqual(myArr);
                });
            });
        });
        
        describe("both", function() {
            it("should call convert if the value is defined", function() {
                o = new A({
                    convertAndDefaultValue: 11
                });
                expect(convertAndDefaultValueCalled).toBe(true);
                expect(o.get('convertAndDefaultValue')).toBe(11);
            });
            
            it("should not call convert if the value is undefined", function() {
                o = new A({});
                expect(convertAndDefaultValueCalled).toBe(false);    
            });
            
            it("should assign the default if the value is undefined", function() {
                o = new A({});
                expect(o.get('convertAndDefaultValue')).toBe(16);
            });
            
            it("should assign the defaultValue if convert returns null", function() {
                useReturnFromConvert = true;
                returnFromConvert = undefined;
                o = new A({
                    convertAndDefaultValue: 11
                });
                expect(convertAndDefaultValueCalled).toBe(true);
                expect(o.get('convertAndDefaultValue')).toBe(16);
            });
        });
    });
    
    describe("getting values", function() {
        var A,
            o;
            
        beforeEach(function() {
            A = Ext.define('spec.A', {
                extend: Ext.data.Model,
                fields: ['aField']
            });
        });
        
        afterEach(function() {
            Ext.undefine('spec.A');
            A = o = null;
        });
        
        it("should return a value that was in the fields collection", function() {
            o = new A({
                aField: 'foo'
            });
            expect(o.get('foo'));
        });  
        
        it("should return a value not in the fields collection", function() {
            o = new A({
                other: 'foo'
            });
            expect(o.get('other'));    
        });
        
        it("should return the value unchanged", function() {
            var v = {};
            o = new A({
                aField: v
            });    
            expect(o.get('aField')).toBe(v);
        });
    });
    
    describe("setting values", function() {
        var Person,
            o;
            
        var definePerson = function(cfg) {
            cfg = Ext.apply({
                extend: Ext.data.Model,
                fields: [{
                    name: 'id',
                    type: 'int'
                }, 'name', {
                    name: 'dob',
                    type: 'date'
                }, {
                    name: 'rank',
                    type: 'int'
                }]
            }, cfg);
            Person = Ext.define('spec.Person', cfg); 
        };
        
        afterEach(function() {
            Ext.undefine('spec.Person');
            Person = o = null;
        });
        
        describe("without dependencies", function() {
            it("should set a single key/value", function() {
                definePerson();
                o = new Person();
                var result = o.set('rank', 3);
                expect(o.get('rank')).toBe(3);
                expect(result).toEqual(['rank']);
            });

            it("should set a key value pairs", function() {
                definePerson();
                o = new Person();
                var result = o.set({
                    name: 'Foo',
                    rank: 4
                });    
                expect(o.get('name')).toBe('Foo');
                expect(o.get('rank')).toBe(4);
                expect(result).toEqual(['name', 'rank']);
            });
            
            it("should set a value not in the fields collection", function() {
                definePerson();
                o = new Person();
                var result = o.set('other', 1);
                expect(o.get('other')).toBe(1);
                expect(result).toEqual(['other']);    
            });
            
            it("should only return fields that were modified", function() {
                definePerson();
                o = new Person({
                    name: 'Foo',
                    rank: 3
                });
                var result = o.set({
                    name: 'Bar',
                    rank: 3
                });
                expect(result).toEqual(['name']);
            });

        });
        
        describe("with dependencies", function() {
            var A;
            var defineA = function(fields, cfg) {
                cfg = Ext.apply({
                    extend: Ext.data.Model,
                    fields: fields
                }, cfg);
                A = Ext.define('spec.A', cfg);
            };
            
            afterEach(function() {
                Ext.undefine('spec.A');
                A = null;
            });
            
            it("should not trigger any dependencies if setting a field that doesn't require it", function() {
                var spy = jasmine.createSpy();
                defineA(['name', 'age', {
                    name: 'doubleAge',
                    depends: 'age',
                    convert: spy
                }]);
                o = new A();
                spy.reset();
                var result = o.set('name', 'foo');
                expect(spy).not.toHaveBeenCalled();
                expect(result).toEqual(['name']);
            });
            
            it("should not trigger the dependency if the value doesn't change", function() {
                var spy = jasmine.createSpy();
                defineA(['a', {
                    name: 'b',
                    depends: 'a',
                    convert: spy
                }]);
                o = new A({
                    a: 1
                });
                spy.reset();
                o.set('a', 1);
                expect(spy).not.toHaveBeenCalled();
            });
            
            it("should trigger a simple dependency", function() {
                var called = false;
                defineA(['name', 'age', {
                    name: 'doubleAge',
                    depends: 'age',
                    convert: function(v, rec) {
                        called = true;
                        return rec.get('age') * 2;
                    }
                }]);
                o = new A();
                var result = o.set('age', 10);
                expect(called).toBe(true);
                expect(o.get('doubleAge')).toBe(20);
                expect(result).toEqual(['age', 'doubleAge']);
            });
            
            it("should not trigger the convert until all dependent fields are set", function() {
                defineA(['a', 'b', {
                    name: 'c',
                    depends: ['a', 'b'],
                    convert: function(v, rec) {
                        return rec.get('a') + rec.get('b');
                    }
                }]);
                o = new A();
                var result = o.set({
                    a: 1,
                    b: 3
                });
                expect(o.get('c')).toBe(4);
                expect(result).toEqual(['a', 'b', 'c']);
            });
            
            it("should trigger the convert function if either of the dependent fields are set", function() {
                defineA(['a', 'b', {
                    name: 'c',
                    depends: ['a', 'b'],
                    convert: function(v, rec) {
                        return rec.get('a') + rec.get('b');
                    }
                }]);
                o = new A({
                    a: 1,
                    b: 1
                });
                var result = o.set('a', 2);
                expect(o.get('c')).toBe(3);
                expect(result).toEqual(['a', 'c']);
                result = o.set('b', 2);
                expect(o.get('c')).toBe(4);
                expect(result).toEqual(['b', 'c']);
            });
            
            it("should trigger cascading converts", function() {
                defineA(['a', {
                    name: 'b',
                    depends: 'a',
                    convert: function(v, rec) {
                        return rec.get('a') + 1;
                    } 
                }, {
                    name: 'c',
                    depends: 'b',
                    convert: function(v, rec) {
                        return rec.get('b') + 1;
                    } 
                }, {
                    name: 'd',
                    depends: 'c',
                    convert: function(v, rec) {
                        return rec.get('c') + 1;
                    } 
                }]);
                o = new A();
                var result = o.set('a', 1);
                expect(o.get('b')).toBe(2);
                expect(o.get('c')).toBe(3);
                expect(o.get('d')).toBe(4);
                expect(result).toEqual(['a', 'b', 'c', 'd']);
            });
            
            it("should allow setting a calculated value", function() {
                defineA(['a', {
                    name: 'b',
                    depends: 'a',
                    convert: function(v, rec) {
                        return rec.get('a') + 1;
                    } 
                }, {
                    name: 'c',
                    depends: 'b',
                    convert: function(v, rec) {
                        return rec.get('b') + 1;
                    } 
                }]);
                o = new A();
                var result = o.set('b', 3, {
                    convert: false
                });
                expect(o.get('c')).toBe(4);
                expect(result).toEqual(['b', 'c']);
            });
            
            it("should be able to set independent calculated fields at once", function() {
                defineA(['a', {
                    name: 'b',
                    depends: 'a',
                    convert: function(v, rec) {
                        return rec.get('a') + 1;
                    } 
                }, 'c', {
                    name: 'd',
                    depends: 'c',
                    convert: function(v, rec) {
                        return rec.get('c') + 1;
                    } 
                }]);
                o = new A();
                var result = o.set({
                    a: 1,
                    c: 1
                });
                expect(o.get('b')).toBe(2);
                expect(o.get('d')).toBe(2);
                expect(result).toEqual(['a', 'c', 'b', 'd']);
            });
            
            it("should allow setting a value its calculated dependent", function() {
                defineA(['a', {
                    name: 'b',
                    depends: 'a',
                    convert: function(v, rec) {
                        return rec.get('a') + 1;
                    } 
                }, {
                    name: 'c',
                    depends: 'b',
                    convert: function(v, rec) {
                        return rec.get('b') + 1;
                    } 
                }]);
                o = new A();
                o.set({
                    a: 1,
                    b: 100
                });
                expect(o.get('b')).toBe(2);
                expect(o.get('c')).toBe(3);
            });
        });

        describe("associations", function() {
            it("should be able to set a foreign key value for a not-loaded association", function() {
                // Create an unloaded association, spec.Address doesn't exist
                definePerson({
                    fields: [{
                        name: 'addressId',
                        reference: 'Address',
                        unique: true
                    }]
                });
                o = new Person();
                expect(function() {
                    o.set('addressId', 1);
                }).not.toThrow();
            })
        });
        
        it("should update the id property if the id changes", function() {
            definePerson();
            o = new Person();
            o.set('id', 1);
            expect(o.id).toBe(1);
        });
        
        it("should not call the store while the editing flag is set", function() {
            definePerson();
            o = new Person();
            spyOn(o, 'callJoined');
            o.beginEdit();
            o.set('rank', 1);
            expect(o.callJoined).not.toHaveBeenCalled();    
        });
        
        it("should not call the store if there are no modified fields", function() {
            definePerson();
            o = new Person({
                rank: 1
            });
            spyOn(o, 'callJoined');
            o.set('rank', 1);
            expect(o.callJoined).not.toHaveBeenCalled();    
        });
        
        describe("options", function() {
            describe("convert", function() {
                it("should convert by default", function() {
                    definePerson();    
                    o = new Person();
                    o.set('rank', '1');
                    expect(o.get('rank')).toBe(1);
                });
                
                it("should be convert when passed into the method", function() {
                    definePerson();    
                    o = new Person();
                    o.set('rank', '1', {
                        convert: true
                    });
                    expect(o.get('rank')).toBe(1);
                });
                
                it("should not convert when passed false", function() {
                    definePerson();    
                    o = new Person();
                    o.set('rank', '1', {
                        convert: false
                    });
                    expect(o.get('rank')).toBe('1');
                });
                
                it("should accept options when using the object form", function() {
                    definePerson();
                    o = new Person();
                    o.set({
                        rank: '1'
                    }, {
                        convert: true
                    });
                    expect(o.get('rank')).toBe(1);    
                });
            });
            
            describe("commit", function() {
                beforeEach(function() {
                    definePerson();
                });
                
                var opt = {
                    commit: true
                };
                
                it("should default to false", function() {
                    o = new Person();
                    o.set('rank', 1);
                    expect(o.dirty).toBe(true);    
                });
                
                it("should have no modified fields", function() {
                    o = new Person({
                        rank: 1
                    });
                    o.set('rank', 2, opt);
                    expect(o.isModified('rank')).toBe(false);
                });
                
                it("should not be dirty", function() {
                    o = new Person({
                        rank: 1
                    });
                    o.set('rank', 2, opt);
                    expect(o.dirty).toBe(false);   
                });
                
                it("should call commit even if no fields were modified", function() {
                    o = new Person({
                        rank: 1
                    });
                    spyOn(o, 'commit');
                    o.set('rank', 1, opt);
                    expect(o.commit).toHaveBeenCalled();
                });
                
                it("should pass the modified fields to commit", function() {
                    o = new Person({
                        rank: 1
                    });    
                    spyOn(o, 'commit');
                    o.set({
                        name: 'Foo',
                        rank: 2
                    }, opt);
                    expect(o.commit.mostRecentCall.args[1]).toEqual(['name', 'rank']);
                });
                
                it("should call commit with silent: true if the silent option is passed", function() {
                    o = new Person({
                        rank: 1
                    });    
                    spyOn(o, 'commit');
                    o.set('rank', 2, {
                        commit: true,
                        silent: true
                    });
                    expect(o.commit.mostRecentCall.args[0]).toBe(true);
                });
                
                it("should not trigger the normal after edit call", function() {
                    o = new Person({
                        rank: 1
                    });    
                    spyOn(o, 'callJoined');
                    o.set('rank', 2, opt);
                    expect(o.callJoined).not.toHaveBeenCalledWith('afterEdit');
                });
            });
            
            // We will cover most of the dirty option under value tracking.
            describe("dirty", function() {
                it("should still return fields in the modified collection with dirty: false", function() {
                    definePerson();
                    o = new Person();
                    var result = o.set('rank', 1, {
                        dirty: false
                    });
                    expect(result).toEqual(['rank']);
                });
            });
            
            describe("silent", function() {
                it("should not trigger the store if the silent flag is set", function() {
                    definePerson();
                    o = new Person();
                    spyOn(o, 'callJoined');
                    o.set('rank', 1, {
                        silent: true
                    });
                    expect(o.callJoined).not.toHaveBeenCalled();
                });  
            });
        });
    });

    describe('calculated fields', function () {
        // We have coverage of "convert" so here we just focus on the conversion of the
        // "calculate" config to its proper "convert" equivalent.
        var Type,
            field,
            rec;

        beforeEach(function() {
            Type = Ext.define(null, {
                extend: 'Ext.data.Model',

                fields: [
                    'name',
                    'rank',
                    'serialNumber',

                    {
                        name: 'calc',
                        calculate: function (data) {
                            return data.name + data.rank + data.serialNumber;
                        }
                    }
                ]
            });

            field = Type.getField('calc');
            rec = new Type({
                name: 'Don',
                rank: 'Peon',
                serialNumber: '1234'
            });
        });

        it('should determine the depends by parsing the method', function () {
            expect(field.depends).toEqual(['name', 'rank', 'serialNumber']);
            expect(rec.data.calc).toBe('DonPeon1234');
        });

        it('should react to changes in dependent fields', function () {
            var record, modifiedFieldNames;

            rec.join({
                afterEdit: function (rec, mods) {
                    record = rec;
                    modifiedFieldNames = mods;
                    mods.sort(); // ensure consistent order
                }
            });

            rec.set({
                name: 'Evan',
                serialNumber: '4321'
            });

            expect(record).toBe(rec);
            expect(modifiedFieldNames).toEqual(['calc', 'name', 'serialNumber']);
            expect(rec.data.calc).toBe('EvanPeon4321');

            expect(rec.getPrevious('name')).toBe('Don');
            expect(rec.getPrevious('calc')).toBe('DonPeon1234');
        });
    });

    describe("value tracking", function() {
        var Person, o;
        
        beforeEach(function() {
            Person = Ext.define('spec.Person', {
                extend: Ext.data.Model,
                fields: [{
                    name: 'id',
                    type: 'int'
                }, 'name', {
                    name: 'dob',
                    type: 'date'
                }, {
                    name: 'rank',
                    type: 'int'
                }, {
                    name: 'active',
                    persist: false
                }]
            }); 
        });
        
        afterEach(function() {
            Ext.undefine('spec.Person');
            Person = o = null;
        });
        
        describe("simple modifications", function() {
            describe("dirty", function() {
                it("should not be dirty when constructed", function() {
                    o = new Person();
                    expect(o.dirty).toBe(false);    
                });
                
                it("should not be dirty when constructed with values", function() {
                    o = new Person({
                        id: 1,
                        name: 'Foo',
                        rank: 3
                    });
                    expect(o.dirty).toBe(false);
                });
                
                it("should not be dirty when setting a value and it doesn't change", function() {
                    o = new Person({
                        rank: 1
                    });    
                    o.set('rank', 1);
                    expect(o.dirty).toBe(false);
                });
                
                it("should not be dirty if setting a non-persistent field", function() {
                    o = new Person();
                    o.set('active', false);
                    expect(o.dirty).toBe(false);    
                });
                
                it("should be dirty if a field changes value", function() {
                    o = new Person();
                    o.set('rank', 1);
                    expect(o.dirty).toBe(true);    
                });
                
                it("should be dirty if a non-field changes value", function() {
                    o = new Person();
                    o.set('notField', 2);
                    expect(o.dirty).toBe(true);    
                });
                
                it("should be dirty when setting multiple fields", function() {
                    o = new Person();
                    o.set({
                        name: 'X',
                        rank: 17
                    });
                    expect(o.dirty).toBe(true);
                });
                
                it("should be dirty when reverting only a single modified field", function() {
                    o = new Person({
                        rank: 1,
                        name: 'Foo'
                    });  
                    o.set({
                        rank: 2,
                        name: 'Bar'
                    }); 
                    o.set('rank', 1);
                    expect(o.dirty).toBe(true);
                });
                
                it("should be not dirty when reverting all modified fields", function() {
                    o = new Person({
                        rank: 1,
                        name: 'Foo'
                    });  
                    o.set({
                        rank: 2,
                        name: 'Bar'
                    }); 
                    o.set('rank', 1);
                    o.set('name', 'Foo');
                    expect(o.dirty).toBe(false);
                });
                
                it("should not set dirty if the dirty: false option is passed", function() {
                    o = new Person();
                    o.set('rank', 1, {
                        dirty: false
                    });
                    expect(o.dirty).toBe(false);
                });
            });
            
            describe("modified", function() {
                describe("isModified", function() {
                    it("should not have modified fields when constructed with no vales", function() {
                        o = new Person();
                        expect(o.isModified('name')).toBe(false);
                        expect(o.isModified('rank')).toBe(false);    
                    });
                
                    it("should not have modified fields when constructed with data", function() {
                        o = new Person({
                            name: 'Foo',
                            rank: 1
                        });
                        expect(o.isModified('name')).toBe(false);
                        expect(o.isModified('rank')).toBe(false);   
                    });
                
                    it("should not have a modified field if the value doesn't change", function() {
                        o = new Person({
                            name: 'Foo',
                            rank: 1
                        });
                        o.set('name', 'Foo');
                        expect(o.isModified('name')).toBe(false);   
                    });
                
                    it("should not have a modified field if it's persist: false", function() {
                        o = new Person();
                        o.set('active', 'true');
                        expect(o.isModified('active')).toBe(false);    
                    });            
                
                    it("should have a modified field if a field changes value", function() {
                        o = new Person();
                        o.set('rank', 1);
                        expect(o.isModified('rank')).toBe(true);    
                    });
                    
                    it("should have modified fields if multiple fields change", function() {
                        o = new Person();
                        o.set({
                            name: 'Foo',
                            rank: 3
                        });
                        expect(o.isModified('name')).toBe(true);
                        expect(o.isModified('rank')).toBe(true);  
                    });
                    
                    it("should have a modified field if a non-field changes", function() {
                        o = new Person();
                        o.set('other', 'foo');
                        expect(o.isModified('other')).toBe(true);    
                    }); 
                    
                    it("should not be modified when reverting a field", function() {
                        o = new Person({
                            name: 'Foo',
                            rank: 1
                        });
                        o.set({
                            name: 'Bar',
                            rank: 3
                        });
                        o.set('name', 'Foo');
                        expect(o.isModified('name')).toBe(false);
                        expect(o.isModified('rank')).toBe(true);
                    });
                    
                    it("should not be modified when passing dirty: false", function() {
                        o = new Person();
                        o.set('rank', 1, {
                            dirty: false
                        });
                        expect(o.isModified('rank')).toBe(false);
                    });
                });
                
                describe("getModified", function() {
                    it("should return undefined if there's no modified value", function() {
                        o = new Person();
                        expect(o.getModified('name')).toBeUndefined();
                    });
                    
                    it("should return the previous value when modified", function() {
                        o = new Person({
                            rank: 1
                        });    
                        o.set('rank', 2);
                        expect(o.getModified('rank')).toBe(1);
                    });
                    
                    it("should return the original value when modified", function() {
                        o = new Person({
                            rank: 1
                        });    
                        o.set('rank', 2);
                        o.set('rank', 3);
                        o.set('rank', 4);
                        expect(o.getModified('rank')).toBe(1);
                    });
                    
                    it("should return undefined if the modified value is set back to the original", function() {
                        o = new Person({
                            rank: 1
                        });    
                        o.set('rank', 2);
                        o.set('rank', 1);
                        expect(o.getModified('rank')).toBeUndefined();
                    });
                });
            });
            
            describe("previousValue", function() {
                it("should return undefined if there's no previous value", function() {
                    o = new Person();
                    expect(o.getPrevious('name')).toBeUndefined();
                });
                
                it("should return the previous value when the value changes", function() {
                    o = new Person({
                        name: 'Foo'
                    });    
                    o.set('name', 'Bar');
                    expect(o.getPrevious('name')).toBe('Foo');
                });
                
                it("should return the most recent previous value when the value changes", function() {
                    o = new Person({
                        name: 'Foo'
                    });    
                    o.set('name', 'Bar');
                    o.set('name', 'Baz');
                    expect(o.getPrevious('name')).toBe('Bar');
                    o.set('name', 'Blah');
                    expect(o.getPrevious('name')).toBe('Baz');
                });
                
                it("should not update the previousValue if the value doesn't change", function() {
                    o = new Person({
                        name: 'Foo'
                    });    
                    o.set('name', 'Bar');
                    o.set('name', 'Bar');
                    expect(o.getPrevious('name')).toBe('Foo');
                });
            });
        });
        
        
        describe("editing", function() {
            it("should set the editing flag when beginEdit is called", function() {
                o = new Person();
                o.beginEdit();
                expect(o.editing).toBe(true);
            });
            
            it("should update the modified values during editing", function() {
                o = new Person({
                    name: 'Foo',
                    rank: 1
                });
                o.beginEdit();
                o.set('name', 'Bar');
                expect(o.getModified('name')).toBe('Foo');    
            });
            
            it("should update the previous values during editing", function() {
                o = new Person({
                    name: 'Foo',
                    rank: 1
                });
                o.beginEdit();
                o.set('name', 'Bar');
                expect(o.getPrevious('name')).toBe('Foo');    
            });
            
            it("should update the dirty state during editing", function() {
                o = new Person();
                o.beginEdit();
                o.set('name', 'Foo');
                expect(o.dirty).toBe(true);    
            });
            
            describe("cancelEdit", function() {
                it("should clear the editing flag when cancelEdit is called", function() {
                    o = new Person();
                    o.beginEdit();
                    o.cancelEdit();
                    expect(o.editing).toBe(false);
                });
                
                it("should restore data values to the previous state", function() {
                    o = new Person({
                        name: 'Name1',
                        rank: 1
                    });
                    o.beginEdit();
                    o.set({
                        name: 'Name2',
                        rank: 2
                    });
                    o.cancelEdit();
                    expect(o.get('name')).toBe('Name1');
                    expect(o.get('rank')).toBe(1);
                });
                
                it("should restore modified values to the previous state", function() {
                    o = new Person({
                        name: 'Name1',
                        rank: 1
                    });
                    o.set('name', 'Name2');
                    o.beginEdit();
                    o.set('rank', 2);
                    o.cancelEdit();
                    expect(o.getModified('name')).toBe('Name1');
                    expect(o.isModified('rank')).toBe(false);
                });
                
                it("should restore the previousValues state", function() {
                    o = new Person({
                        name: 'Name1',
                        rank: 1
                    });
                    o.set('name', 'Name2');
                    o.set({
                        name: 'Name3',
                        rank: 3
                    });
                    o.beginEdit();
                    o.set({
                        name: 'Name4',
                        rank: 4
                    });
                    o.set({
                        name: 'Name5',
                        rank: 5
                    });
                    o.cancelEdit();
                    expect(o.getPrevious('Name2'));
                    expect(o.getPrevious('rank')).toBe(1);
                });
                
                it("should restore the dirty state", function() {
                    o = new Person();
                    o.beginEdit();
                    o.set('name', 'Foo');
                    o.cancelEdit();
                    expect(o.dirty).toBe(false);
                });
            });
            
            describe("endEdit", function() {
                it("should clear the editing flag when endEdit is called", function() {
                    o = new Person();
                    o.beginEdit();
                    o.endEdit();
                    expect(o.editing).toBe(false);
                });
                
                it("should not modify the data values", function() {
                    o = new Person({
                        name: 'Name1',
                        rank: 1
                    });
                    o.beginEdit();
                    o.set({
                        name: 'Name2',
                        rank: 2
                    });
                    o.endEdit();
                    expect(o.get('name')).toBe('Name2');
                    expect(o.get('rank')).toBe(2);
                });
                
                it("should not modify the modified values", function() {
                    o = new Person({
                        name: 'Name1',
                        rank: 1
                    });
                    o.set('name', 'Name2');
                    o.beginEdit();
                    o.set('rank', 2);
                    o.endEdit();
                    expect(o.getModified('name')).toBe('Name1');
                    expect(o.getModified('rank')).toBe(1);
                });
                
                it("should restore the previousValues", function() {
                    o = new Person({
                        name: 'Name1',
                        rank: 1
                    });    
                    o.set('name', 'Name2');
                    o.beginEdit();
                    o.set({
                        name: 'Name3',
                        rank: 3
                    });
                    o.set({
                        name: 'Name4',
                        rank: 4
                    });
                    o.endEdit();
                    expect(o.getPrevious('name')).toBe('Name1');
                    expect(o.getPrevious('rank')).toBeUndefined();
                });
                
                it("should not modify the dirty state", function() {
                    o = new Person({
                        name: 'Name1',
                        rank: 1
                    });  
                    o.beginEdit();
                    o.set('rank', 2);
                    o.endEdit();
                    expect(o.dirty).toBe(true);
                });
                
                it("should call the store if the record is dirty with the modified fields", function() {
                    var record, modifiedFieldNames;

                    o = new Person();
                    o.join({
                        afterEdit: function (rec, mods) {
                            record = rec;
                            modifiedFieldNames = mods;
                            mods.sort(); // to ensure order
                        }
                    });

                    o.beginEdit();
                    o.set('name', 'Foo');
                    o.set('rank', 1);
                    o.endEdit();

                    expect(record).toBe(o);
                    expect(modifiedFieldNames).toEqual(['name', 'rank']);
                });
                
                it("should not call the store if the record is not dirty", function() {
                    o = new Person();
                    o.beginEdit();
                    spyOn(o, 'callJoined');
                    o.endEdit();
                    expect(o.callJoined).not.toHaveBeenCalled();
                });
                
                describe("options", function() {
                    it("should not call the store if silent is passed & it's dirty", function() {
                        o = new Person();
                        o.beginEdit();
                        o.set('name', 'Foo');
                        spyOn(o, 'callJoined');
                        o.endEdit(true);
                        expect(o.callJoined).not.toHaveBeenCalled();
                    });
                    
                    it("should not call the store if silent is modified fields are passed", function() {
                        o = new Person();
                        o.beginEdit();
                        o.set('name', 'Foo');
                        spyOn(o, 'callJoined');
                        o.endEdit(true, ['foo']);
                        expect(o.callJoined).not.toHaveBeenCalled();
                    });
                    
                    it("should call the store even if not dirty if modified fields are passed", function() {
                        var record, modifiedFieldNames;

                        o = new Person();
                        o.join({
                            afterEdit: function (rec, mods) {
                                record = rec;
                                modifiedFieldNames = mods;
                            }
                        });

                        o.beginEdit();
                        o.endEdit(false, ['foo']);

                        expect(record).toBe(o);
                        expect(modifiedFieldNames).toEqual(['foo']);
                    });
                });
            });
        });
        
        describe("commit", function() {
            it("should clear the dirty state", function() {
                o = new Person();
                o.set('rank', 1);
                o.commit();
                expect(o.dirty).toBe(false);    
            });
            
            it("should clear the editing flag", function() {
                o = new Person();
                o.beginEdit();
                o.set('rank', 1);
                o.commit();
                expect(o.editing).toBe(false);
            });
            
            it("should have no modified fields", function() {
                o = new Person({
                    name: 'Name1',
                    rank: 1
                });
                o.set({
                    name: 'Name2',
                    rank: 2
                });
                o.commit();
                expect(o.isModified('name')).toBe(false);
                expect(o.isModified('rank')).toBe(false);
            });
            
            it("should have no effect on previous values", function() {
                o = new Person({
                    name: 'Name1',
                    rank: 1
                });
                expect(o.getPrevious('name')).toBeUndefined();
                expect(o.getPrevious('rank')).toBeUndefined();

                o.set({
                    name: 'Name2',
                    rank: 2
                });

                expect(o.getPrevious('name')).toBe('Name1');
                expect(o.getPrevious('rank')).toBe(1);

                o.commit();

                expect(o.getPrevious('name')).toBe('Name1');
                expect(o.getPrevious('rank')).toBe(1);
            });
            
            describe("calling the store with afterCommit", function() {
                it("should be called", function() {
                    o = new Person();
                    spyOn(o, 'callJoined');
                    o.commit();
                    expect(o.callJoined).toHaveBeenCalled();
                    expect(o.callJoined.mostRecentCall.args[0]).toBe('afterCommit');
                });
            
                it("should not be called if silent is passed", function() {
                    o = new Person();
                    spyOn(o, 'callJoined');
                    o.commit(true);
                    expect(o.callJoined).not.toHaveBeenCalled();
                });
            
                it("should pass the modified fields if passed", function() {
                    var record, modifiedFieldNames;

                    o = new Person();
                    o.join({
                        afterCommit: function (rec, mods) {
                            record = rec;
                            modifiedFieldNames = mods;
                        }
                    });

                    o.commit(false, ['foo']);

                    expect(record).toBe(o);
                    expect(modifiedFieldNames).toEqual(['foo']);
                });
            });
        });
        
        describe("reject", function() {
            it("should clear the dirty state", function() {
                o = new Person();
                o.set('rank', 1);
                o.reject();
                expect(o.dirty).toBe(false);    
            });
            
            it("should clear the editing flag", function() {
                o = new Person();
                o.beginEdit();
                o.set('rank', 1);
                o.reject();
                expect(o.editing).toBe(false);
            });
            
            it("should have no modified fields", function() {
                o = new Person({
                    name: 'Name1',
                    rank: 1
                });
                o.set({
                    name: 'Name2',
                    rank: 2
                });
                o.reject();
                expect(o.isModified('name')).toBe(false);
                expect(o.isModified('rank')).toBe(false);
            });
            
            it("should update previous values", function() {
                o = new Person({
                    name: 'Name1',
                    rank: 1
                });
                expect(o.getPrevious('name')).toBeUndefined();
                expect(o.getPrevious('rank')).toBeUndefined();

                o.set({
                    name: 'Name2',
                    rank: 2
                });

                expect(o.getPrevious('name')).toBe('Name1');
                expect(o.getPrevious('rank')).toBe(1);

                o.reject();

                expect(o.getPrevious('name')).toBe('Name2');
                expect(o.getPrevious('rank')).toBe(2);
            });

            it("should retain the phantom state", function() {
                o = new Person();
                o.set('name', 'Foo');
                o.reject();
                expect(o.phantom).toBe(true);

                o = new Person({
                    id: 1
                });
                o.set('name', 'Foo');
                o.reject();
                expect(o.phantom).toBe(false);
            });
            
            describe("after reject", function() {
                it("should be called", function() {
                    o = new Person();
                    spyOn(o, 'callJoined');
                    o.reject();
                    expect(o.callJoined).toHaveBeenCalled();
                    expect(o.callJoined.mostRecentCall.args[0]).toBe('afterReject');
                });
            
                it("should not be called if silent is passed", function() {
                    o = new Person();
                    spyOn(o, 'callJoined');
                    o.reject(true);
                    expect(o.callJoined).not.toHaveBeenCalled();
                });
            });

            describe("other callbacks", function() {
                it("should not call afterEdit/afterCommit", function() {
                    o = new Person();
                    o.set('name', 'Foo');
                    spyOn(o, 'callJoined');
                    o.reject();
                    expect(o.callJoined.callCount).toBe(1);
                    expect(o.callJoined.mostRecentCall.args[0]).toBe('afterReject');
                });
            });
        });
    });

    describe("model state", function() {
        var User, convertSpy;

        beforeEach(function() {
            convertSpy = jasmine.createSpy();
            User = Ext.define('spec.User', {
                extend: 'Ext.data.Model',
                fields: ['name', 'age', {
                    name: 'withConvert',
                    convert: convertSpy
                }]
            });
        });

        afterEach(function() {
            Ext.undefine('spec.User');
            convertSpy = User = null;
        });

        describe("commit", function() {
            it("should clear the dirty state", function() {
                var rec = new User();
                rec.set('name', 'Foo');
                expect(rec.dirty).toBe(true);
                rec.commit();
                expect(rec.dirty).toBe(false);
            });

            it("should not modify any field values", function() {
                var rec = new User();
                rec.set('name', 'Foo');
                rec.set('age', 100);
                rec.commit();
                expect(rec.get('name')).toBe('Foo');
                expect(rec.get('age')).toBe(100);
            });

            it("should clear the modified state", function() {
                var rec = new User();
                rec.set('name', 'Foo');
                expect(rec.isModified('name')).toBe(true);
                rec.commit();
                expect(rec.isModified('name')).toBe(false);
            });

            it("should clear any editing state", function() {
                var rec = new User();
                rec.beginEdit();
                expect(rec.editing).toBe(true);
                rec.commit();
                expect(rec.editing).toBe(false);
            });

            it("should clear the phantom state", function() {
                var rec = new User();
                expect(rec.phantom).toBe(true);
                rec.commit();
                expect(rec.phantom).toBe(false);
            });

            it("should set dropped records to be erased", function() {
                var rec = new User({
                    id: 1
                });
                rec.drop();
                expect(rec.erased).toBe(false);
                rec.commit();
                expect(rec.erased).toBe(true);
            });

            describe("notifying joined parties", function() {
                describe("data commits", function() {
                    it("should notify after a commit", function() {
                        var rec = new User(),
                            spy = spyOn(rec, 'callJoined');

                        rec.commit();
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe('afterCommit');
                    });

                    it("should pass along any modified fields", function() {
                        var rec = new User(),
                            spy = spyOn(rec, 'callJoined');

                        rec.commit(false, ['foo', 'bar']);
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[1]).toEqual([['foo', 'bar']]);
                    });

                    it("should not notify with silent: true", function() {
                        var rec = new User(),
                            spy = spyOn(rec, 'callJoined');

                        rec.commit(true);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });

                describe("via an erase", function() {
                    it("should notify after an erase", function() {
                        var rec = new User(),
                            spy;

                        rec.drop();
                        spy = spyOn(rec, 'callJoined');
                        rec.commit();
                        expect(spy.callCount).toBe(1);
                        expect(spy.mostRecentCall.args[0]).toBe('afterErase');
                    });

                    it("should not notify with silent: true", function() {
                        var rec = new User(),
                            spy;

                        rec.drop();
                        spy = spyOn(rec, 'callJoined');
                        rec.commit(true);
                        expect(spy).not.toHaveBeenCalled();
                    });
                });
            });
        });

        describe("reject", function() {
            it("should clear the dirty state", function() {
                var rec = new User();
                rec.set('name', 'Foo');
                expect(rec.dirty).toBe(true);
                rec.reject();
                expect(rec.dirty).toBe(false);
            });

            it("should return field values to their original states", function() {
                var rec = new User({
                    name: 'Foo',
                    age: 1
                });
                rec.set('name', 'Bar');
                rec.set('age', 100);
                rec.reject();
                expect(rec.get('name')).toBe('Foo');
                expect(rec.get('age')).toBe(1);
            });

            it("should not run converters when restoring data", function() {
                var rec = new User({
                    name: 'Foo',
                    age: 1
                });
                rec.set('name', 'Bar');
                rec.set('age', 100);
                convertSpy.reset();
                rec.reject();
                expect(convertSpy).not.toHaveBeenCalled();
            });

            it("should clear the modified state", function() {
                var rec = new User();
                rec.set('name', 'Foo');
                expect(rec.isModified('name')).toBe(true);
                rec.reject();
                expect(rec.isModified('name')).toBe(false);
            });

            it("should clear any editing state", function() {
                var rec = new User();
                rec.beginEdit();
                expect(rec.editing).toBe(true);
                rec.reject();
                expect(rec.editing).toBe(false);
            });

            it("should clear the dropped state", function() {
                var rec = new User({
                    id: 1
                });
                rec.drop();
                rec.reject();
                expect(rec.dropped).toBe(false);
            });

            describe("notifying joined parties", function() {
                it("should not call afterEdit when restoring values", function() {
                    var rec = new User({
                        name: 'Foo'
                    }), spy;
                    rec.set('name', 'Bar');
                    spy = spyOn(rec, 'callJoined');
                    rec.reject();
                    expect(spy.callCount).toBe(1);
                    expect(spy.mostRecentCall.args[0]).not.toBe('afterEdit');
                });

                it("should call afterReject", function() {
                    var rec = new User({
                        name: 'Foo'
                    }), spy;
                    rec.set('name', 'Bar');
                    spy = spyOn(rec, 'callJoined');
                    rec.reject();
                    expect(spy.callCount).toBe(1);
                    expect(spy.mostRecentCall.args[0]).toBe('afterReject');
                });

                it("should not call afterReject with silent: true", function() {
                    var rec = new User({
                        name: 'Foo'
                    }), spy;
                    rec.set('name', 'Bar');
                    spy = spyOn(rec, 'callJoined');
                    rec.reject(true);
                    expect(spy).not.toHaveBeenCalled();
                });
            });
        });
    });
    
    describe("getData", function() {
        var A; 
        beforeEach(function() {
            A = Ext.define(null, {
                extend: 'Ext.data.Model',
                fields: ['id', 'name']
            });
        });
        
        afterEach(function() {
            A = null;
        });
        
        it("should return all the fields in the model", function() {
            var rec = new A({
                id: 1,
                name: 'Foo'
            });
            expect(rec.getData()).toEqual({
                id: 1,
                name: 'Foo'
            });
        });
        
        it("should include non-field data", function() {
            var rec = new A({
                id: 1,
                other: 'val'
            });
            expect(rec.getData().other).toBe('val');
        });

        describe("options", function() {
            var User, rec;

            beforeEach(function() {
                User = Ext.define('spec.User', {
                    extend: 'Ext.data.Model',
                    fields: ['id', 'name', {
                        name: 'age', 
                        persist: false
                    }, {
                        name: 'created',
                        serialize: function(v) {
                            return Ext.Date.format(v, 'Y-m-d');
                        }
                    }, {
                        name: 'addressId',
                        reference: 'Address'
                    }]
                });

                rec = new User({
                    id: 1,
                    age: 100,
                    created: new Date(2000, 6, 15),
                    name: 'Foo'
                });
            });
            
            afterEach(function() {
                Ext.undefine('spec.User');
                rec = User = null;
            });

            describe("associated", function() {
                var Post, Address;

                beforeEach(function() {
                    Post = Ext.define('spec.Post', {
                        extend: 'Ext.data.Model',
                        fields: ['id', 'title', {
                            name: 'content', 
                            persist: false
                        }, {
                            name: 'userId',
                            reference: 'User'
                        }, {
                            name: 'created',
                            serialize: function(v) {
                                return Ext.Date.format(v, 'Y-m-d');
                            }
                        }]
                    });

                    Address = Ext.define('spec.Address', {
                        extend: 'Ext.data.Model',
                        fields: ['id', {
                            name: 'street',
                            persist: false
                        }, 'city', {
                            name: 'created',
                            serialize: function(v) {
                                return Ext.Date.format(v, 'Y-m-d');
                            }
                        }]
                    });
                });

                afterEach(function() {
                    Ext.undefine('spec.Address');
                    Ext.undefine('spec.Post');
                    Address = Post = null;
                });

                it("should not include associated data by default", function() {
                    expect(rec.getData({})).toEqual({
                        id: 1,
                        age: 100,
                        created: new Date(2000, 6, 15),
                        name: 'Foo'
                    });
                });

                it("should not include associated data with associated: false", function() {
                    expect(rec.getData({
                        associated: false
                    })).toEqual({
                        id: 1,
                        age: 100,
                        created: new Date(2000, 6, 15),
                        name: 'Foo'
                    });
                });

                it("should include associated data with associated: true", function() {
                    rec.posts().add({
                        id: 101,
                        content: 'X'
                    });

                    expect(rec.getData({
                        associated: true
                    })).toEqual({
                        id: 1,
                        age: 100,
                        created: new Date(2000, 6, 15),
                        name: 'Foo',
                        posts: [{
                            id: 101,
                            content: 'X',
                            userId: 1
                        }]
                    });
                });

                describe("passing options down to associated records", function() {
                    describe("changes", function() {
                        it("should only include changes with changes: true", function() {
                            rec.posts().add({
                                id: 1001,
                                content: 'A',
                                title: 'B',
                                userId: 1,
                                created: new Date(2005, 3, 22)
                            });
                            rec.posts().first().set('title', 'X');
                            rec.setAddress(new Address({
                                id: 2001,
                                street: 'B',
                                city: 'C',
                                created: new Date(2008, 10, 3)
                            }));
                            rec.getAddress().set('city', 'Q');

                            expect(rec.getData({
                                associated: true,
                                changes: true
                            })).toEqual({
                                addressId: 2001,
                                address: {
                                    city: 'Q'
                                },
                                posts: [{
                                    title: 'X'
                                }]
                            });
                        });
                    });

                    describe("critical", function() {
                        it("should include critical fields with critical: true", function() {
                            rec.posts().add({
                                id: 1001,
                                content: 'A',
                                title: 'B',
                                userId: 1,
                                created: new Date(2005, 3, 22)
                            });
                            rec.posts().first().set('title', 'X');
                            rec.setAddress(new Address({
                                id: 2001,
                                street: 'B',
                                city: 'C',
                                created: new Date(2008, 10, 3)
                            }));
                            rec.getAddress().set('city', 'Q');

                            expect(rec.getData({
                                associated: true,
                                changes: true,
                                critical: true
                            })).toEqual({
                                id: 1,
                                addressId: 2001,
                                address: {
                                    id: 2001,
                                    city: 'Q'
                                },
                                posts: [{
                                    id: 1001,
                                    title: 'X'
                                }]
                            });
                        });
                    });

                    describe("persist", function() {
                        it("should only include persist fields with persist: true", function() {
                            rec.posts().add({
                                id: 1001,
                                content: 'A',
                                title: 'B',
                                userId: 1,
                                created: new Date(2005, 3, 22)
                            });
                            rec.posts().first().set('title', 'X');
                            rec.posts().first().set('content', 'Y');
                            rec.setAddress(new Address({
                                id: 2001,
                                street: 'B',
                                city: 'C',
                                created: new Date(2008, 10, 3)
                            }));
                            rec.getAddress().set('city', 'Q');
                            rec.getAddress().set('street', 'Z');
                            
                            expect(rec.getData({
                                associated: true,
                                changes: true,
                                critical: true
                            })).toEqual({
                                id: 1,
                                addressId: 2001,
                                address: {
                                    id: 2001,
                                    city: 'Q'
                                },
                                posts: [{
                                    id: 1001,
                                    title: 'X'
                                }]
                            });
                        });
                    });

                    describe("serialize", function() {
                        it("should serialize with serialize: true", function() {
                            rec.posts().add({
                                id: 1001,
                                content: 'A',
                                title: 'B',
                                userId: 1,
                                created: new Date(2005, 3, 22)
                            });
                            rec.setAddress(new Address({
                                id: 2001,
                                street: 'B',
                                city: 'C',
                                created: new Date(2008, 10, 3)
                            }));
                            
                            expect(rec.getData({
                                associated: true,
                                serialize: true
                            })).toEqual({
                                id: 1,
                                age: 100,
                                created: '2000-07-15',
                                name: 'Foo',
                                addressId: 2001,
                                address: {
                                    id: 2001,
                                    street: 'B',
                                    city: 'C',
                                    created: '2008-11-03'
                                },
                                posts: [{
                                    id: 1001,
                                    content: 'A',
                                    title: 'B',
                                    userId: 1,
                                    created: '2005-04-22'
                                }]
                            });
                        });
                    });
                });
            });

            describe("changes", function() {
                it("should include all fields by default", function() {
                    rec.set('age', 20);

                    expect(rec.getData({})).toEqual({
                        id: 1,
                        age: 20,
                        created: new Date(2000, 6, 15),
                        name: 'Foo'
                    });
                });

                it("should include all fields with changes: false", function() {
                    rec.set('age', 20);

                    expect(rec.getData({
                        changes: false
                    })).toEqual({
                        id: 1,
                        age: 20,
                        created: new Date(2000, 6, 15),
                        name: 'Foo'
                    });
                });

                it("should include all fields with changes: true", function() {
                    rec.set('name', 'Bar');

                    expect(rec.getData({
                        changes: true
                    })).toEqual({
                        name: 'Bar'
                    });
                });
            });

            describe("critical", function() {
                it("should not include critical fields by default", function() {
                    rec.set('name', 'Bar');

                    expect(rec.getData({
                        changes: true
                    })).toEqual({
                        name: 'Bar'
                    });
                });

                it("should not include critical fields with critical: false", function() {
                    rec.set('name', 'Bar');

                    expect(rec.getData({
                        changes: true,
                        critical: false
                    })).toEqual({
                        name: 'Bar'
                    });
                });

                it("should include critical fields with critical: true", function() {
                    rec.set('name', 'Bar');

                    expect(rec.getData({
                        changes: true,
                        critical: true
                    })).toEqual({
                        id: 1,
                        name: 'Bar'
                    });
                });
            });

            describe("persist", function() {
                it("should include all fields by default", function() {
                    expect(rec.getData({})).toEqual({
                        id: 1,
                        age: 100,
                        created: new Date(2000, 6, 15),
                        name: 'Foo'
                    });
                });

                it("should include all fields with persist: false", function() {
                    expect(rec.getData({
                        persist: false
                    })).toEqual({
                        id: 1,
                        age: 100,
                        created: new Date(2000, 6, 15),
                        name: 'Foo'
                    });
                });

                it("should include only persist fields with persist: true", function() {
                    expect(rec.getData({
                        persist: true
                    })).toEqual({
                        id: 1,
                        name: 'Foo',
                        created: new Date(2000, 6, 15)
                    });
                });
            });

            describe("serialize", function() {
                it("should not serialize by default", function() {
                    expect(rec.getData({})).toEqual({
                        id: 1,
                        name: 'Foo',
                        age: 100,
                        created: new Date(2000, 6, 15)
                    });
                });

                it("should not serialize with serialize: false", function() {
                    expect(rec.getData({
                        serialize: false
                    })).toEqual({
                        id: 1,
                        name: 'Foo',
                        age: 100,
                        created: new Date(2000, 6, 15)
                    });
                });

                it("should serialize with serialize: true", function() {
                    expect(rec.getData({
                        serialize: true
                    })).toEqual({
                        id: 1,
                        name: 'Foo',
                        age: 100,
                        created: '2000-07-15'
                    });
                });
            });
        });
        
        describe("with associations", function() {
            var rec;
            function read(Model, data) {
                var reader = new Ext.data.reader.Json({
                    model: Model
                });
                return reader.read(data).getRecords()[0];
            }
            
            describe("basic many to one", function() {
                var Comment, User, Post;

                beforeEach(function() {
                    User = Ext.define('spec.User', {
                        extend: 'Ext.data.Model',
                        fields: ['id', 'name']
                    });

                    Post = Ext.define('spec.Post', {
                        extend: 'Ext.data.Model',
                        fields: ['id', 'content', {
                            name: 'userId',
                            reference: 'User'
                        }]
                    });

                    Comment = Ext.define('spec.Comment', {
                        extend: 'Ext.data.Model',
                        fields: ['id', 'content', {
                            name: 'postId',
                            reference: 'Post'
                        }]
                    });
                });
                
                afterEach(function() {
                    Ext.undefine('spec.User');
                    Ext.undefine('spec.Post');
                    Ext.undefine('spec.Comment');
                    Comment = User = Post = null;
                });
                
                
                describe("the one", function() {
                    it("should not include the key if the item does not exist", function() {
                        rec = read(Post, {
                            id: 1
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({});
                    });
                    
                    it("should not trigger the item to load", function() {
                        rec = read(Post, {
                            id: 1
                        });
                        // Trigger it the first time, second time we ask it shouldn't be there
                        rec.getAssociatedData();
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({});
                    });
                    
                    it("should include the single record", function() {
                        rec = read(Post, {
                            id: 1,
                            user: {
                                id: 17,
                                name: 'Foo'
                            }
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            user: {
                                id: 17,
                                name: 'Foo'
                            }
                        });
                    });
                    
                    it("should not include the many on each item", function() {
                        rec = read(Post, {
                            id: 1,
                            user: {
                                id: 17,
                                name: 'Foo'
                            }
                        });
                        expect(rec.getAssociatedData().user.posts).toBeUndefined();
                    });
                });

                describe("the many", function() {
                    it("should not include the key if the store does not exist", function() {
                        rec = read(User, {
                            id: 1
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({});
                    });

                    it("should not trigger the item to load", function() {
                        rec = read(User, {
                            id: 1
                        });
                        // Trigger it the first time, second time we ask it shouldn't be there
                        rec.getAssociatedData();
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({});
                    });

                    it("should include the key if the store exists but is empty", function() {
                        rec = read(User, {
                            id: 1,
                            posts: []
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            posts: []
                        });
                    });

                    it("should include the many records", function() {
                        rec = read(User, {
                            id: 17,
                            posts: [{
                                id: 1,
                                content: 'PostA',
                                userId: 17
                            }, {
                                id: 2,
                                content: 'PostB',
                                userId: 17
                            }, {
                                id: 3,
                                content: 'PostC',
                                userId: 17
                            }]
                        });

                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            posts: [{
                                id: 1,
                                content: 'PostA',
                                userId: 17
                            }, {
                                id: 2,
                                content: 'PostB',
                                userId: 17
                            }, {
                                id: 3,
                                content: 'PostC',
                                userId: 17
                            }]
                        });
                    });

                    it("should not include the one on each many", function() {
                        rec = read(User, {
                            id: 17,
                            posts: [{
                                id: 1,
                                content: 'PostA',
                                userId: 17
                            }, {
                                id: 2,
                                content: 'PostB',
                                userId: 17
                            }]
                        });

                        var postsStore = rec.posts(),
                            post1 = postsStore.getAt(0),
                            post2 = postsStore.getAt(1),
                            userName = Post.associations.user.getInstanceName();

                        expect(post1[userName]).toBe(rec);
                        expect(post2[userName]).toBe(rec);

                        var posts = rec.getAssociatedData().posts;
                        expect(posts[0].user).toBeUndefined();
                        expect(posts[1].user).toBeUndefined();
                    });

                    it("should not recurse from many to one to many", function() {
                        rec = read(User, {
                            id: 17,
                            posts: [{
                                id: 1,
                                content: 'PostA',
                                userId: 17
                            }, {
                                id: 2,
                                content: 'PostB',
                                userId: 17
                            }]
                        });

                        var postsStore = rec.posts();
                        var post1 = postsStore.getAt(0);

                        var data = post1.getData({
                            associated: true
                        });  // same as getData(true)

                        expect(data).toEqual({
                            id: 1,
                            content: 'PostA',
                            userId: 17,
                            user: {
                                id: 17,
                                // Even though we started at post1 we cannot simply skip
                                // it as a member of the store. But both posts have the
                                // same "user" association and since we already have that
                                // fellow we should neither of them recurse back to it.
                                posts: [{
                                    id: 1,
                                    content: 'PostA',
                                    userId: 17
                                }, {
                                    id: 2,
                                    content: 'PostB',
                                    userId: 17
                                }]
                            }
                        });
                    });
                });  // the many

                describe("deeply nested", function() {
                    var nestedData = {
                        id: 17,
                        posts: [{
                            id: 1,
                            content: 'PostA',
                            userId: 17,
                            comments: [{
                                id: 42,
                                content: 'This is wrong!'
                            },{
                                id: 427,
                                content: 'No, you are wrong!'
                            }]
                        }, {
                            id: 2,
                            content: 'PostB',
                            comments: [{
                                id: 420,
                                content: 'This is wrong too!'
                            },{
                                id: 4270,
                                content: 'No, you are wrong again!'
                            },{
                                id: 4271,
                                content: 'Yeah, you are wrong again!'
                            }]
                        }]
                    };

                    beforeEach(function () {
                        // reader / records will claim the data and mutate it, so we need
                        // to clone it for them:
                        rec = read(User, Ext.clone(nestedData));
                    });

                    it('should not include associations in data object', function () {
                        expect(rec.data).toEqual({
                            id: 17
                        });
                    });

                    it("should include the first level of child records", function() {
                        var posts = rec.posts();
                        expect(posts.getCount()).toBe(nestedData.posts.length);
                    });

                    it('should produce all levels in getData(true)', function () {
                        var data = rec.getData(true);

                        expect(data).toEqual({
                            id: 17,
                            posts: [{
                                id: 1,
                                content: 'PostA',
                                userId: 17,
                                comments: [{
                                    id: 42,
                                    content: 'This is wrong!',
                                    postId: 1
                                },{
                                    id: 427,
                                    content: 'No, you are wrong!',
                                    postId: 1
                                }]
                            }, {
                                id: 2,
                                content: 'PostB',
                                userId: 17,
                                comments: [{
                                    id: 420,
                                    content: 'This is wrong too!',
                                    postId: 2
                                },{
                                    id: 4270,
                                    content: 'No, you are wrong again!',
                                    postId: 2
                                },{
                                    id: 4271,
                                    content: 'Yeah, you are wrong again!',
                                    postId: 2
                                }]
                            }]
                        });
                    });

                    //----

                    it("should have PostA first", function() {
                        var posts = rec.posts();
                        expect(posts.getAt(0).data).toEqual({
                            id: 1,
                            content: 'PostA',
                            userId: 17
                        });
                    });

                    it('should return the proper data for PostA.getData(true)', function () {
                        var post = rec.posts().getAt(0);
                        var data = post.getData(true);

                        // This is interesting because we are starting in the middle
                        // with PostA so we will climb up to the user and back down to
                        // the posts. Our recursion check should mean PostA is only
                        // reproduced shallowly but PostB will be deep.
                        expect(data).toEqual({
                            id: 1,
                            content: 'PostA',
                            userId: 17,
                            user: {
                                id: 17,
                                posts: [{
                                    id: 1,
                                    content: 'PostA',
                                    userId: 17
                                    // this recursion should be skipped
                                }, {
                                    id: 2,
                                    content: 'PostB',
                                    userId: 17,
                                    comments: [{
                                        id: 420,
                                        content: 'This is wrong too!',
                                        postId: 2
                                    },{
                                        id: 4270,
                                        content: 'No, you are wrong again!',
                                        postId: 2
                                    },{
                                        id: 4271,
                                        content: 'Yeah, you are wrong again!',
                                        postId: 2
                                    }]
                                }]
                            },
                            comments: [{
                                id: 42,
                                content: 'This is wrong!',
                                postId: 1,
                                post: {
                                    id: 1,
                                    content: 'PostA',
                                    userId: 17,
                                    user: {
                                        id: 17,
                                        posts: [{
                                            id: 1,
                                            content: 'PostA',
                                            userId: 17
                                            // this recursion should be skipped
                                        }, {
                                            id: 2,
                                            content: 'PostB',
                                            userId: 17,
                                            comments: [{
                                                id: 420,
                                                content: 'This is wrong too!',
                                                postId: 2
                                            },{
                                                id: 4270,
                                                content: 'No, you are wrong again!',
                                                postId: 2
                                            },{
                                                id: 4271,
                                                content: 'Yeah, you are wrong again!',
                                                postId: 2
                                            }]
                                        }]
                                    }
                                }
                            },{
                                id: 427,
                                content: 'No, you are wrong!',
                                postId: 1,
                                post: {
                                    id: 1,
                                        content: 'PostA',
                                        userId: 17,
                                        user: {
                                        id: 17,
                                            posts: [{
                                            id: 1,
                                            content: 'PostA',
                                            userId: 17
                                            // this recursion should be skipped
                                        }, {
                                            id: 2,
                                            content: 'PostB',
                                            userId: 17,
                                            comments: [{
                                                id: 420,
                                                content: 'This is wrong too!',
                                                postId: 2
                                            },{
                                                id: 4270,
                                                content: 'No, you are wrong again!',
                                                postId: 2
                                            },{
                                                id: 4271,
                                                content: 'Yeah, you are wrong again!',
                                                postId: 2
                                            }]
                                        }]
                                    }
                                }
                            }]
                        });
                    });

                    it('should return the proper data for PostA.comments[0].getData(true)', function () {
                        var post = rec.posts().getAt(0);
                        var comment = post.comments().getAt(0);
                        var data = comment.getData(true);

                        // We are starting at the Comment, climbing to its Post and then
                        // its User. We also descend from the Post to its comments and
                        // from the User to its posts, but the recursion checks should
                        // prevent infinite expansion.
                        expect(data).toEqual({
                            id: 42,
                            content: "This is wrong!",
                            postId: 1,
                            post: {
                                id: 1,
                                content: "PostA",
                                userId: 17,
                                user: {
                                    id: 17,
                                    posts: [{
                                        id: 1,
                                        content: "PostA",
                                        userId: 17
                                    },{
                                        id: 2,
                                        content: "PostB",
                                        userId: 17,
                                        comments: [{
                                            id: 420,
                                            content: "This is wrong too!",
                                            postId: 2
                                        },{
                                            id: 4270,
                                            content: "No, you are wrong again!",
                                            postId: 2
                                        },{
                                            id: 4271,
                                            content: "Yeah, you are wrong again!",
                                            postId: 2
                                        }]
                                    }]
                                },
                                comments: [{
                                    id: 42,
                                    content: "This is wrong!",
                                    postId: 1
                                    // back to where we started, so only shallow
                                }, {
                                    id: 427,
                                    content: "No, you are wrong!",
                                    postId: 1,
                                    post: {
                                        id: 1,
                                        content: "PostA",
                                        userId: 17,
                                        user: {
                                            id: 17,
                                            posts: [{
                                                id: 1,
                                                content: "PostA",
                                                userId: 17
                                            },{
                                                id: 2,
                                                content: "PostB",
                                                userId: 17,
                                                comments: [{
                                                    id: 420,
                                                    content: "This is wrong too!",
                                                    postId: 2
                                                },{
                                                    id: 4270,
                                                    content: "No, you are wrong again!",
                                                    postId: 2
                                                },{
                                                    id: 4271,
                                                    content: "Yeah, you are wrong again!",
                                                    postId: 2
                                                }]
                                            }]
                                        }
                                    }
                                }]
                            }
                        });
                    });

                    it('should link PostA to the proper user', function () {
                        var post = rec.posts().getAt(0);
                        expect(post.getUser()).toBe(rec);
                    });

                    it('should load comments for PostA', function () {
                        var post = rec.posts().getAt(0);
                        var comments = post.comments();
                        expect(comments.getCount()).toBe(nestedData.posts[0].comments.length);
                    });

                    it('should load proper first comment for PostA', function () {
                        var post = rec.posts().getAt(0);
                        var comments = post.comments();
                        expect(comments.getAt(0).data).toEqual({
                            id: 42,
                            content: 'This is wrong!',
                            postId: 1 // filled in by loading
                        });
                    });

                    it('should load proper second comment for PostA', function () {
                        var post = rec.posts().getAt(0);
                        var comments = post.comments();
                        expect(comments.getAt(1).data).toEqual({
                            id: 427,
                            content: 'No, you are wrong!',
                            postId: 1 // filled in by loading
                        });
                    });

                    it('should link the first comment for PostA to its Post', function () {
                        var post = rec.posts().getAt(0);
                        var comments = post.comments();
                        expect(comments.getAt(0).getPost()).toBe(post);
                    });

                    it('should link the second comment for PostA to its Post', function () {
                        var post = rec.posts().getAt(0);
                        var comments = post.comments();
                        expect(comments.getAt(1).getPost()).toBe(post);
                    });

                    //-----

                    it("should have PostB second", function() {
                        var posts = rec.posts();
                        expect(posts.getAt(1).data).toEqual({
                            id: 2,
                            content: 'PostB',
                            userId: 17
                        });
                    });

                    it('should link PostA to the proper user', function () {
                        var post = rec.posts().getAt(0);
                        expect(post.getUser()).toBe(rec);
                    });


                    it('should load comments for PostB', function () {
                        var post = rec.posts().getAt(1);
                        var comments = post.comments();
                        expect(comments.getCount()).toBe(nestedData.posts[1].comments.length);
                    });
                    it('should load proper first comment for PostB', function () {
                        var post = rec.posts().getAt(1);
                        var comments = post.comments();
                        expect(comments.getAt(0).data).toEqual({
                            id: 420,
                            content: 'This is wrong too!',
                            postId: 2 // filled in by loading
                        });
                    });

                    it('should load proper second comment for PostB', function () {
                        var post = rec.posts().getAt(1);
                        var comments = post.comments();
                        expect(comments.getAt(1).data).toEqual({
                            id: 4270,
                            content: 'No, you are wrong again!',
                            postId: 2 // filled in by loading
                        });
                    });

                    it('should load proper third comment for PostB', function () {
                        var post = rec.posts().getAt(1);
                        var comments = post.comments();
                        expect(comments.getAt(2).data).toEqual({
                            id: 4271,
                            content: 'Yeah, you are wrong again!',
                            postId: 2 // filled in by loading
                        });
                    });

                    it('should link the first comment for PostB to its Post', function () {
                        var post = rec.posts().getAt(1);
                        var comments = post.comments();
                        expect(comments.getAt(0).getPost()).toBe(post);
                    });

                    it('should link the second comment for PostB to its Post', function () {
                        var post = rec.posts().getAt(1);
                        var comments = post.comments();
                        expect(comments.getAt(1).getPost()).toBe(post);
                    });

                    it('should link the third comment for PostA to its Post', function () {
                        var post = rec.posts().getAt(1);
                        var comments = post.comments();
                        expect(comments.getAt(2).getPost()).toBe(post);
                    });
                });  // deeply nested
            }); // basic many to one
            
            describe("basic one to one", function() {
                var Person, Passport;
                beforeEach(function() {
                    Person = Ext.define('spec.Person', {
                        extend: 'Ext.data.Model',
                        fields: ['id', 'name', {
                            name: 'passportId',
                            unique: true,
                            reference: 'Passport'
                        }]
                    });

                    Passport = Ext.define('spec.Passport', {
                        extend: 'Ext.data.Model',
                        fields: ['id', 'expires']
                    });
                });
                
                afterEach(function() {
                    Ext.undefine('spec.Person');
                    Ext.undefine('spec.Passport');
                    Person = Passport = null;
                });
                
                describe("the key holder", function() {
                     it("should not include the key if the item does not exist", function() {
                        rec = read(Person, {
                            id: 1
                        });
                         var data = rec.getAssociatedData();
                         expect(data).toEqual({});
                    });
                    
                    it("should not trigger the item to load", function() {
                        rec = read(Person, {
                            id: 1
                        });
                        // Trigger it the first time, second time we ask it shouldn't be there
                        rec.getAssociatedData();
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({});
                    });
                    
                    it("should include the single record", function() {
                        rec = read(Person, {
                            id: 1,
                            passport: {
                                id: 22,
                                expires: '2000-01-01'
                            }
                        });

                        // Inline associations should *not* arrive on the "data" object:
                        expect(rec.data.passport).toBeUndefined();

                        var passport = rec.getPassport();
                        expect(passport.getPerson()).toBe(rec);

                        var data = rec.getData(true);
                        expect(data).toEqual({
                            id: 1,
                            passportId: 22,
                            passport: {
                                id: 22,
                                expires: '2000-01-01'
                            }
                        });
                    });
                    
                    it("should not include the key holder on each non-key holder", function() {
                        rec = read(Person, {
                            id: 1,
                            passport: {
                                id: 22,
                                expires: '2000-01-01'
                            }
                        });
                        var data = rec.getAssociatedData();
                        expect(data.passport.user).toBeUndefined();
                    });
                });
                
                describe("the non key holder", function() {
                    it("should not include the key if the item does not exist", function() {
                        rec = read(Passport, {
                            id: 1
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({});
                    });
                    
                    it("should not trigger the item to load", function() {
                        rec = read(Passport, {
                            id: 1
                        });
                        // Trigger it the first time, second time we ask it shouldn't be there
                        rec.getAssociatedData();
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({});
                    });
                    
                    it("should include the single record", function() {
                        rec = read(Passport, {
                            id: 1,
                            person: {
                                id: 45,
                                name: 'Foo'
                            }
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            person: {
                                id: 45,
                                name: 'Foo'
                            }
                        });
                    });
                    
                    it("should not include the non-key holder on each key holder", function() {
                        rec = read(Passport, {
                            id: 1,
                            person: {
                                id: 45,
                                name: 'Foo'
                            }
                        });

                        // Connect the records to each other so that the association is
                        // traversable. This forces getAssociatetdData to either recurse
                        // (forever) or detect the cycle.
                        var personName = Passport.associations.person.getInstanceName(),
                            passportName = Person.associations.passport.getInstanceName();

                        rec.getPerson().setPassport(rec);

                        var data = rec.getAssociatedData();
                        expect(data.person.passport).toBeUndefined();
                    });
                });
            });

            describe("basic many to many", function() {
                var User, Group, Profile;
                beforeEach(function() {
                    User = Ext.define('spec.User', {
                        extend: 'Ext.data.Model',
                        fields: ['id', 'name', {
                            name: 'profileId',
                            reference: 'Profile',
                            unique: true
                        }],
                        manyToMany: 'Group'
                    });

                    Group = Ext.define('spec.Group', {
                        extend: 'Ext.data.Model',
                        fields: ['id', 'name', {
                            name: 'profileId',
                            reference: 'Profile',
                            unique: true
                        }]
                    });

                    Profile = Ext.define('spec.Profile', {
                        extend: 'Ext.data.Model',
                        fields: ['id', 'content']
                    });
                });

                afterEach(function() {
                    Ext.undefine('spec.User');
                    Ext.undefine('spec.Group');
                    Ext.undefine('spec.Profile');
                    Profile = User = Group = null;
                });

                describe("the left", function() {
                    it("should not include the key if the item is not loaded", function() {
                        rec = read(User, {
                            id: 1
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({});
                    });
                    
                    it("should not trigger the item to load", function() {
                        rec = read(User, {
                            id: 1
                        });
                        // Trigger it the first time, second time we ask it shouldn't be there
                        rec.getAssociatedData();
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({});
                    });
                    
                    it("should include the key if the store exists but is empty", function() {
                        rec = read(User, {
                            id: 1,
                            groups: []
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            groups: []
                        });
                    });
                    
                    it("should include the child records", function() {
                        rec = read(User, {
                            id: 100,
                            groups: [{
                                id: 1,
                                name: 'GroupA'
                            }, {
                                id: 2,
                                name: 'GroupB'
                            }, {
                                id: 3,
                                name: 'GroupC'
                            }]
                        });

                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            groups: [{
                                id: 1,
                                name: 'GroupA'
                            }, {
                                id: 2,
                                name: 'GroupB'
                            }, {
                                id: 3,
                                name: 'GroupC'
                            }]
                        });
                    });
                    
                    it("should not include the inverse on each child", function() {
                        rec = read(User, {
                            id: 100,
                            groups: [{
                                id: 1,
                                name: 'GroupA'
                            }, {
                                id: 2,
                                name: 'GroupB'
                            }]
                        });

                        // Inline associations should *not* arrive on the "data" object:
                        expect(rec.data.groups).toBeUndefined();

                        var groups = rec.groups(),
                            groupAUsers = groups.first().users(),
                            groupBUsers = groups.last().users();

                        // This presents the opportunity to infinitely recurse.
                        groupAUsers.add(rec);
                        groupBUsers.add(rec);

                        // Since each Group has its users association loaded, we need to
                        // enumerate the members (the top-level User), but that User
                        // must be processed "shallow" and only provide its fields.

                        groups = rec.getAssociatedData().groups;
                        expect(groups[0].users.length).toBe(1);
                        expect(groups[0].users[0].id).toBe(rec.id);
                        expect(groups[0].users[0].groups).toBeUndefined();

                        expect(groups[1].users.length).toBe(1);
                        expect(groups[1].users[0].id).toBe(rec.id);
                        expect(groups[1].users[0].groups).toBeUndefined();
                    });

                    it("should include other associations on the children", function() {
                        rec = read(User, {
                            id: 100,
                            groups: [{
                                id: 1,
                                name: 'GroupA',
                                profile: {
                                    id: 22,
                                    content: 'Foo'
                                }
                            }, {
                                id: 2,
                                name: 'GroupB',
                                profile: {
                                    id: 33,
                                    content: 'Bar'
                                }
                            }]
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            groups: [{
                                id: 1,
                                name: 'GroupA',
                                profileId: 22,
                                profile: {
                                    id: 22,
                                    content: 'Foo'
                                }
                            }, {
                                id: 2,
                                name: 'GroupB',
                                profileId: 33,
                                profile: {
                                    id: 33,
                                    content: 'Bar'
                                }
                            }]
                        });
                    });
                });

                describe("the right", function() {
                    it("should not include the key if the item is not loaded", function() {
                        rec = read(Group, {
                            id: 1
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({});
                    });
                    
                    it("should not trigger the item to load", function() {
                        rec = read(Group, {
                            id: 1
                        });
                        // Trigger it the first time, second time we ask it shouldn't be there
                        rec.getAssociatedData();
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({});
                    });
                    
                    it("should include the key if the store exists but is empty", function() {
                        rec = read(Group, {
                            id: 1,
                            users: []
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            users: []
                        });
                    });
                    
                    it("should include the child records", function() {
                        rec = read(Group, {
                            id: 100,
                            users: [{
                                id: 1,
                                name: 'UserA'
                            }, {
                                id: 2,
                                name: 'UserB'
                            }, {
                                id: 3,
                                name: 'UserC'
                            }]
                        });

                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            users: [{
                                id: 1,
                                name: 'UserA'
                            }, {
                                id: 2,
                                name: 'UserB'
                            }, {
                                id: 3,
                                name: 'UserC'
                            }]
                        });
                    });
                    
                    it("should not include the inverse on each child", function() {
                        rec = read(Group, {
                            id: 100,
                            users: [{
                                id: 1,
                                name: 'UserA'
                            }, {
                                id: 2,
                                name: 'UserB'
                            }]
                        });

                        // Inline associations should *not* arrive on the "data" object:
                        expect(rec.data.users).toBeUndefined();

                        var users = rec.users(),
                            userAGroups = users.first().groups(),
                            userBGroups = users.last().groups();

                        // This presents the opportunity to infinitely recurse.
                        userAGroups.add(rec);
                        userBGroups.add(rec);

                        users = rec.getAssociatedData().users;

                        // Since each User has its groups association loaded, we need to
                        // enumerate the members (the top-level Group), but that Group
                        // must be processed "shallow" and only provide its fields.

                        expect(users[0].groups.length).toBe(1);
                        expect(users[0].groups[0].id).toBe(rec.id);
                        expect(users[0].groups[0].users).toBeUndefined();

                        expect(users[1].groups.length).toBe(1);
                        expect(users[1].groups[0].id).toBe(rec.id);
                        expect(users[1].groups[0].users).toBeUndefined();
                    });

                    it("should include other associations on the children", function() {
                        rec = read(Group, {
                            id: 100,
                            users: [{
                                id: 1,
                                name: 'UserA',
                                profile: {
                                    id: 22,
                                    content: 'Foo'
                                }
                            }, {
                                id: 2,
                                name: 'UserB',
                                profile: {
                                    id: 33,
                                    content: 'Bar'
                                }
                            }]
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            users: [{
                                id: 1,
                                name: 'UserA',
                                profileId: 22,
                                profile: {
                                    id: 22,
                                    content: 'Foo'
                                }
                            }, {
                                id: 2,
                                name: 'UserB',
                                profileId: 33,
                                profile: {
                                    id: 33,
                                    content: 'Bar'
                                }
                            }]
                        });
                    });
                });
            });

            describe("complex cases", function() {
                describe("nested data", function() {
                    var User;
                    beforeEach(function() {
                        User = Ext.define('spec.User', {
                            extend: 'Ext.data.Model',
                            fields: ['id', 'name']
                        });
                        
                        Ext.define('spec.Order', {
                            extend: 'Ext.data.Model',
                            fields: ['id', 'date', {
                                name: 'userId',
                                reference: 'User'
                            }]
                        });
                        
                        Ext.define('spec.OrderItem', {
                            extend: 'Ext.data.Model',
                            fields: ['id', 'price', {
                                name: 'orderId',
                                reference: 'Order'
                            }, {
                                name: 'productId',
                                unique: true,
                                reference: 'Product'
                            }]
                        });
                        
                        Ext.define('spec.Product', {
                            extend: 'Ext.data.Model',
                            fields: ['id', 'name']
                        });
                    });
                    
                    afterEach(function() {
                        User = null;
                        Ext.undefine('spec.User');
                        Ext.undefine('spec.Order');
                        Ext.undefine('spec.OrderItem');
                        Ext.undefine('spec.Product');
                    });
                    
                    it("should load nested associations", function() {
                        rec = read(User, {
                            id: 1,
                            orders: [{
                                id: 1,
                                date: '2010-01-01',
                                orderItems: [{
                                    id: 1,
                                    price: 20,
                                    productId: 1,
                                    product: {
                                        id: 1,
                                        name: 'Product1'
                                    }
                                }, {
                                    id: 2,
                                    price: 30,
                                    productId: 2,
                                    product: {
                                        id: 2,
                                        name: 'Product2'
                                    }
                                }, {
                                    id: 3,
                                    price: 40,
                                    productId: 1,
                                    product: {
                                        id: 1,
                                        name: 'Product1'
                                    }
                                }]
                            }, {
                                id: 2,
                                date: '2008-01-01',
                                orderItems: [{
                                    id: 4,
                                    price: 50,
                                    productId: 2,
                                    product: {
                                        id: 2,
                                        name: 'Product2'
                                    }
                                }, {
                                    id: 5,
                                    price: 60,
                                    productId: 3,
                                    product: {
                                        id: 3,
                                        name: 'Product3'
                                    }
                                }, {
                                    id: 6,
                                    price: 70,
                                    productId: 1,
                                    product: {
                                        id: 1,
                                        name: 'Product1'
                                    }
                                }]
                            }]
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            orders: [{
                                id: 1,
                                date: '2010-01-01',
                                userId: 1,
                                orderItems: [{
                                    id: 1,
                                    price: 20,
                                    productId: 1,
                                    orderId: 1,
                                    product: {
                                        id: 1,
                                        name: 'Product1'
                                    }
                                }, {
                                    id: 2,
                                    price: 30,
                                    productId: 2,
                                    orderId: 1,
                                    product: {
                                        id: 2,
                                        name: 'Product2'
                                    }
                                }, {
                                    id: 3,
                                    price: 40,
                                    productId: 1,
                                    orderId: 1,
                                    product: {
                                        id: 1,
                                        name: 'Product1'
                                    }
                                }]
                            }, {
                                id: 2,
                                date: '2008-01-01',
                                userId: 1,
                                orderItems: [{
                                    id: 4,
                                    price: 50,
                                    productId: 2,
                                    orderId: 2,
                                    product: {
                                        id: 2,
                                        name: 'Product2'
                                    }
                                }, {
                                    id: 5,
                                    price: 60,
                                    productId: 3,
                                    orderId: 2,
                                    product: {
                                        id: 3,
                                        name: 'Product3'
                                    }
                                }, {
                                    id: 6,
                                    price: 70,
                                    productId: 1,
                                    orderId: 2,
                                    product: {
                                        id: 1,
                                        name: 'Product1'
                                    }
                                }]
                            }]
                        });
                    });
                });
                
                describe("multiple associations of the same type", function() {
                    var Ticket;
                    beforeEach(function() {
                        Ext.define('spec.User', {
                            extend: 'Ext.data.Model'
                        });
                        
                        Ticket = Ext.define('spec.Ticket', {
                            extend: 'Ext.data.Model',
                            fields: ['id', {
                                name: 'creatorId',
                                unique: true,
                                reference: {
                                    type: 'User',
                                    role: 'creator'
                                }
                            }, {
                                name: 'ownerId',
                                unique: true,
                                reference: {
                                    type: 'User',
                                    role: 'owner'
                                }
                            }]
                        });
                    });
                    
                    afterEach(function() {
                        Ticket = null;
                        Ext.undefine('spec.User');
                        Ext.undefine('spec.Ticket');
                    });
                    
                    it("should be able to have multiple associations of the same type", function() {
                        rec = read(Ticket, {
                            id: 1,
                            creator: {
                                id: 1,
                                name: 'Foo'
                            },
                            owner: {
                                id: 2,
                                name: 'Bar'
                            }
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            creator: {
                                id: 1,
                                name: 'Foo'
                            },
                            owner: {
                                id: 2,
                                name: 'Bar'
                            }
                        });
                    });
                });
                
                describe("recursive associations", function() {
                    var Node;
                    beforeEach(function() {
                        Node = Ext.define('spec.Node', {
                            extend: 'Ext.data.Model',
                            fields: ['id', 'text', {
                                name: 'parentId',
                                reference: {
                                    type: 'Node',
                                    role: 'parent',
                                    inverse: {
                                        role: 'children'
                                    }
                                }
                            }]
                        });
                    });
                    
                    it("should read recursive associations", function() {
                        rec = read(Node, {
                            id: 1,
                            text: 'Root',
                            children: [{
                                id: 2,
                                text: 'Child1',
                                children: [{
                                    id: 5,
                                    text: 'Child1.1'
                                }, {
                                    id: 6,
                                    text: 'Child1.2'
                                }]
                            }, {
                                id: 3,
                                text: 'Child2',
                                children: [{
                                    id: 7,
                                    text: 'Child2.1'
                                }]
                            }, {
                                id: 4,
                                text: 'Child3',
                                children: [{
                                    id: 8,
                                    text: 'Child3.1'
                                }, {
                                    id: 9,
                                    text: 'Child3.2'
                                }, {
                                    id: 10,
                                    text: 'Child3.3'
                                }]
                            }]
                        });
                        var data = rec.getAssociatedData();
                        expect(data).toEqual({
                            children: [{
                                id: 2,
                                parentId: 1,
                                text: 'Child1',
                                children: [{
                                    id: 5,
                                    parentId: 2,
                                    text: 'Child1.1'
                                }, {
                                    id: 6,
                                    parentId: 2,
                                    text: 'Child1.2'
                                }]
                            }, {
                                id: 3,
                                parentId: 1,
                                text: 'Child2',
                                children: [{
                                    id: 7,
                                    parentId: 3,
                                    text: 'Child2.1'
                                }]
                            }, {
                                id: 4,
                                parentId: 1,
                                text: 'Child3',
                                children: [{
                                    id: 8,
                                    parentId: 4,
                                    text: 'Child3.1'
                                }, {
                                    id: 9,
                                    parentId: 4,
                                    text: 'Child3.2'
                                }, {
                                    id: 10,
                                    parentId: 4,
                                    text: 'Child3.3'
                                }]
                            }]
                        });
                    });
                });
                
                describe("repeating records", function() {
                    var Organization;
                    beforeEach(function() {
                        Organization = Ext.define('spec.Organization', {
                            extend: 'Ext.data.Model',
                            fields: ['id', 'name']
                        });

                        Ext.define('spec.Group', {
                            extend: 'Ext.data.Model',
                            fields: ['id', 'name', {
                                name: 'organizationId',
                                reference: 'Organization'
                            }]
                        });

                        Ext.define('spec.User', {
                            extend: 'Ext.data.Model',
                            fields: ['id', 'name', {
                                name: 'groupId',
                                reference: 'Group'
                            }]
                        });
                    });
                    
                    afterEach(function() {
                        Organization = null;
                        Ext.undefine('spec.Organization');
                        Ext.undefine('spec.Group');
                        Ext.undefine('spec.User');
                    });
                    
                    it("should be able to repeat records with the same id", function() {
                        rec = read(Organization, {
                            id: 1,
                            name: 'Org',
                            groups: [{
                                id: 1,
                                name: 'Group1',
                                users: [{
                                    id: 1,
                                    name: 'Foo'
                                }]
                            }, {
                                id: 2,
                                name: 'Group2',
                                users: [{
                                    id: 1,
                                    name: 'Foo'
                                }]
                            }, {
                                id: 3,
                                name: 'Group3',
                                users: [{
                                    id: 1,
                                    name: 'Foo'
                                }]
                            }]
                        });
                        
                        var groups = rec.getAssociatedData().groups;
                            
                        expect(groups[0].users[0]).toEqual({
                            id: 1,
                            groupId: 1,
                            name: 'Foo'
                        });
                        expect(groups[1].users[0]).toEqual({
                            id: 1,
                            groupId: 2,
                            name: 'Foo'
                        });
                        expect(groups[2].users[0]).toEqual({
                            id: 1,
                            groupId: 3,
                            name: 'Foo'
                        });
                    });
                });
            });
        });
    });
    
    describe("validation", function() {
        
        var A, o;
        
        function defineA(validators, fields, cfg) {
            cfg = Ext.apply({
                extend: Ext.data.Model,
                fields: fields || ['id', 'name', 'rank'],
                validators: validators
            }, cfg);
            A = Ext.define('spec.A', cfg);
        }
        
        afterEach(function() {
            A = o = null;
            Ext.undefine('spec.A');
        });

        var presenceMsg = 'Must be present',
            formatMsg = 'Is in the wrong format',
            emailMsg = 'Is not a valid email address';

        describe("validate", function() {
            it("should call the validate method for each field and pass the current value", function() {
                defineA();
                o = new A({
                    id: 100,
                    name: 'Foo',
                    rank: 1234
                });

                var idSpy = spyOn(o.getField('id'), 'validate'),
                    nameSpy = spyOn(o.getField('name'), 'validate'),
                    rankSpy = spyOn(o.getField('rank'), 'validate');

                o.validate();
                expect(idSpy.mostRecentCall.args[0]).toBe(100);
                expect(nameSpy.mostRecentCall.args[0]).toBe('Foo');
                expect(rankSpy.mostRecentCall.args[0]).toBe(1234);
            });

            describe("when valid", function() {
                beforeEach(function() {
                    defineA({
                        name: 'presence'
                    });
                    o = new A({
                        name: 'x'
                    });
                });

                it("should return an ErrorCollection", function() {
                    var errors = o.validate();
                    expect(errors instanceof Ext.data.ErrorCollection).toBe(true);
                });

                it("should have no items in the error collection", function() {
                    var errors = o.validate();
                    expect(errors.getCount()).toBe(0);
                    expect(errors.isValid()).toBe(true);
                });
            });

            describe("when not valid", function() {
                it("should return an ErrorCollection", function() {
                    defineA({
                        name: 'presence'
                    });
                    o = new A();
                    var errors = o.validate();
                    expect(errors instanceof Ext.data.ErrorCollection).toBe(true);
                });

                it("should put an error for each invalid field", function() {
                    defineA(null, [{
                        name: 'name',
                        validators: 'presence'
                    }, {
                        name: 'rank',
                        validators: {
                            type: 'format',
                            matcher: /\d+/
                        }
                    }, {
                        name: 'email',
                        validators: 'email'
                    }]);

                    o = new A({
                        name: 'X'
                    });

                    var errors = o.validate(),
                        rank = errors.get('rank'),
                        email = errors.get('email');

                    expect(errors.getCount()).toBe(2);
                    expect(errors.isValid()).toBe(false);

                    expect(rank.field).toBe('rank');
                    expect(rank.message).toBe(formatMsg);

                    expect(email.field).toBe('email');
                    expect(email.message).toBe(emailMsg);
                });

                it("should return multiple errors for a field", function() {
                    defineA(null, [{
                        name: 'name',
                        validators: ['presence', 'email']
                    }])

                    o = new A();

                    var errors = o.validate(),
                        name = errors.get('name');

                    expect(errors.getCount()).toBe(1);
                    expect(errors.isValid()).toBe(false);

                    expect(name[0].field).toBe('name');
                    expect(name[0].message).toBe(presenceMsg);

                    expect(name[1].field).toBe('name');
                    expect(name[1].message).toBe(emailMsg);
                });
            })
        });
        
        describe("isValid", function() {
            it("should return true if all fields in the model are valid", function() {
                defineA({
                    name: 'presence'
                });
                
                var o = new A({
                    name: 'Foo'
                });
                expect(o.isValid()).toBe(true);
            });

            it("should return false if only some fields are valid", function() {
                defineA({
                    name: 'presence',
                    rank: 'presence'
                });

                var o = new A({
                    name: 'foo',
                    rank: null
                });
                expect(o.isValid()).toBe(false);
            });
            
            it("should return false if all fields in the model are not valid", function() {
                defineA({
                    name: 'presence'
                });
                
                var o = new A({
                    name: null
                });
                expect(o.isValid()).toBe(false);
            });
        });

        describe("validation via getValidation", function() {
            it("should return true if all fields in the model are valid", function() {
                defineA({
                    name: 'presence'
                });
                
                var o = new A({
                    name: 'Foo'
                });
                expect(o.getValidation().isValid()).toBe(true);
            });

            it("should return false if only some fields are valid", function() {
                defineA({
                    name: 'presence',
                    rank: 'presence'
                });

                var o = new A({
                    name: 'foo',
                    rank: null
                });
                expect(o.getValidation().isValid()).toBe(false);
            });
            
            it("should return false if all fields in the model are not valid", function() {
                defineA({
                    name: 'presence'
                });
                
                var o = new A({
                    name: null
                });
                expect(o.getValidation().isValid()).toBe(false);
            });
        });
    });

    describe("synchronize validators with the Validation record", function() {
        var User,
            instance;

        beforeEach(function() {
            User = Ext.define(null, {
                extend: Ext.data.Model,

                fields: [
                    { name: 'first',       type: 'string' },
                    { name: 'last',        type: 'string', convert: null },
                    { name: 'email',       type: 'string' },
                    { name: 'formatField', type: 'string' },
                    { name: 'phone',       type: 'string', convert: null },
                    { name: 'color',       type: 'string' },
                    { name: 'description', type: 'string' },
                    { name: 'initial',     type: 'string' }
                ],

                validators: {
                    last:        'presence',
                    description: { type: 'length', min: 10, max: 200 },
                    color:       { type: 'inclusion', list: [ 'red', 'white', 'blue' ] },
                    first:       { type: 'exclusion', list: [ 'Ed' ] },
                    formatField: { type: 'format', matcher: /123/ },
                    email:       'email',
                    phone:       { type: 'presence', message: 'Phone number required' }
                },

                doValidate: function () {
                    //
                }
            });

//            instance = new User({
//                id: 10,
//                first: 'Ed',
//                formatField: 'ed@sencha.com',
//                email: 'ed@sencha',
//                description: 'Test',
//                color: 'red'
//            });
//
//            instance.validate();
        });

        describe("the legacy Errors object", function() {
            var Val = Ext.data.validator.Validator.all,
                errors;

            beforeEach(function() {
                instance = new User({
                    description: 'too short',
                    color: 'not a valid color',
                    first: 'Ed',
                    formatField: 'abc',
                    email: 'abc'
                });

                errors = instance.validate();
            });

            it('should report valid object as having no errors', function () {
                instance = new User({
                    description: 'long enough',
                    color: 'red',
                    first: 'Don',
                    last: 'Griffin',
                    formatField: '123',
                    email: 'don@sencha.com',
                    phone: '555-1212'
                });

                errors = instance.validate();
                expect(errors.length).toEqual(0);
            });

            it("should collect failing validations into an Errors object", function() {
                expect(errors instanceof Ext.data.Errors).toBe(true);
            });

            it("should produce ErrorCollection as an alias for Errors", function() {
                expect(errors instanceof Ext.data.ErrorCollection).toBe(true);
            });

            it("should have the correct number of error messages", function() {
                expect(errors.length).toEqual(7);
            });

            it("should hold Errors in an items array", function() {
                expect(errors.items.length).toEqual(7);
            });

            it("should have the correct non-presence message", function() {
                var error = errors.getByField('last')[0];
                expect(error.message).toEqual(Val.presence.config.message);
            });

            it("should have the correct bad length message", function() {
                var error = errors.getByField('description')[0];
                expect(error.message).toEqual('Length must be between 10 and 200');
            });

            it("should have the correct bad format message", function() {
                var error = errors.getByField('formatField')[0];
                expect(error.message).toEqual(Val.format.config.message);
            });

            it("should have the correct non-inclusion message", function() {
                var error = errors.getByField('color')[0];
                expect(error.message).toEqual(Val.inclusion.config.message);
            });

            it("should have the correct non-exclusion message", function() {
                var error = errors.getByField('first')[0];
                expect(error.message).toEqual(Val.exclusion.config.message);
            });

            it("should have the correct bad email format message", function() {
                var error = errors.getByField('email')[0];
                expect(error.message).toEqual(Val.email.config.message);
            });

            it("should allow user-defined error messages", function() {
                var error = errors.getByField('phone')[0];
                expect(error.message).toEqual('Phone number required');
            });
        });
    }); // synchronize validators

    describe("support for legacy validations", function() {
        var User,
            instance,
            convert1 = function (value) {
                return value;
            },
            convert2 = function (value) {
                return value;
            },
            convert3 = function (value) {
                return value;
            },
            convert4 = function (value) {
                return value ? value.toUpperCase() : '';
            };

        beforeEach(function() {
            spyOn(Ext.log, 'warn');
            User = Ext.define(null, {
                extend: Ext.data.Model,

                fields: [
                    {name: 'id'},
                    {name: 'first',       type: 'string', convert: convert1},
                    {name: 'last',        type: 'string', convert: null},
                    {name: 'email',       type: 'string'},
                    {name: 'formatField', type: 'string'},
                    {name: 'phone',       type: 'string', convert: convert2},
                    {name: 'color',       type: 'string'},
                    {name: 'description', type: 'string', convert: convert3},
                    {name: 'nopersist',   type: 'string', persist: false},
                    {
                        name: 'initial',
                        type: 'string',
                        convert: convert4
                    }
                ],

                validations: [
                    { type: 'presence',  field: 'last' },
                    { type: 'length',    field: 'description', min: 10, max: 200 },
                    { type: 'inclusion', field: 'color', list: ['red', 'white', 'blue'] },
                    { type: 'exclusion', field: 'first', list: ['Ed']} ,

                    { type: 'format',    field: 'formatField', matcher: /123/ },
                    { type: 'email',     field: 'email' },

                    { type: 'presence',  field: 'phone', message: 'Phone number required' }
                ],

                doValidate: function () {
                    //
                }
            });

//            instance = new User({
//                id: 10,
//                first: 'Ed',
//                formatField: 'ed@sencha.com',
//                email: 'ed@sencha',
//                description: 'Test',
//                color: 'red'
//            });
//
//            instance.validate();
        });

        describe("the Errors object", function() {
            var Val = Ext.data.validator.Validator.all,
                errors;

            // NOTE: Ext.data.validator.Validator is new to v5 but we need to consult it
            // to see if the proper results are being returned from the legacy API.
            beforeEach(function() {
                instance = new User({
                    description: 'too short',
                    color: 'not a valid color',
                    first: 'Ed',
                    formatField: 'abc',
                    email: 'abc'
                });

                errors = instance.validate();
            });

            it('should report valid object as having no errors', function () {
                instance = new User({
                    description: 'long enough',
                    color: 'red',
                    first: 'Don',
                    last: 'Griffin',
                    formatField: '123',
                    email: 'don@sencha.com',
                    phone: '555-1212'
                });

                errors = instance.validate();
                expect(errors.length).toEqual(0);
            });

            it("should collect failing validations into an Errors object", function() {
                expect(errors instanceof Ext.data.Errors).toBe(true);
            });

            it("should produce ErrorCollection as an alias for Errors", function() {
                expect(errors instanceof Ext.data.ErrorCollection).toBe(true);
            });

            it("should have the correct number of error messages", function() {
                expect(errors.length).toEqual(7);
            });

            it("should hold Errors in an items array", function() {
                expect(errors.items.length).toEqual(7);
            });

            it("should have the correct non-presence message", function() {
                var error = errors.getByField('last')[0];
                expect(error.message).toEqual(Val.presence.config.message);
            });

            it("should have the correct bad length message", function() {
                var error = errors.getByField('description')[0];
                expect(error.message).toEqual('Length must be between 10 and 200');
            });

            it("should have the correct bad format message", function() {
                var error = errors.getByField('formatField')[0];
                expect(error.message).toEqual(Val.format.config.message);
            });

            it("should have the correct non-inclusion message", function() {
                var error = errors.getByField('color')[0];
                expect(error.message).toEqual(Val.inclusion.config.message);
            });

            it("should have the correct non-exclusion message", function() {
                var error = errors.getByField('first')[0];
                expect(error.message).toEqual(Val.exclusion.config.message);
            });

            it("should have the correct bad email format message", function() {
                var error = errors.getByField('email')[0];
                expect(error.message).toEqual(Val.email.config.message);
            });

            it("should allow user-defined error messages", function() {
                var error = errors.getByField('phone')[0];
                expect(error.message).toEqual('Phone number required');
            });
        });
    }); // legacy validations

    describe("copy/clone", function() {
        var User, user, other, session;
        beforeEach(function() {
            User = Ext.define('spec.User', {
                extend: 'Ext.data.Model',
                fields: ['name', 'age', 'startDate']
            });
        });

        afterEach(function() {
            Ext.destroy(session);
            Ext.undefine('spec.User');
            User = user = other = session = null;
        });

        describe("copy", function() {
            it("should return a model of the same type", function() {
                user = new User();
                other = user.copy();

                expect(other.self).toBe(user.self);
            });

            it("should copy data across and retain types, but the data object should be different", function() {
                var aDate = new Date();
                user = new User({
                    name: 'Foo',
                    age: 12,
                    startDate: aDate
                });
                other = user.copy();
                expect(other.get('name')).toBe('Foo');
                expect(other.get('age')).toBe(12);
                expect(other.get('startDate')).toBe(aDate);
                expect(other.data).not.toBe(user.data);
            });

            it("should copy across non-fields", function() {
                user = new User({
                    nonField: 100
                });
                other = user.copy();
                expect(other.get('nonField')).toBe(100);
            });

            it("should not be dirty/phantom/modified", function() {
                user = new User({
                    name: 'Foo'
                });
                user.set('name', 'Bar');
                other = user.copy();
                expect(other.phantom).toBe(false);
                expect(other.dirty).toBe(false);
                expect(other.isModified('name')).toBe(false);
            });

            describe("the id", function() {
                it("should copy the id", function() {
                    user = new User({
                        id: 1
                    });
                    other = user.copy();
                    expect(other.id).toBe(1);
                });

                it("should generate a new id when null is passed", function() {
                    user = new User();
                    other = user.copy(null);
                    expect(other.id).not.toBe(user.id);
                });

                it("should use a passed id", function() {
                    user = new User({
                        id: 10
                    });
                    other = user.copy(20);
                    expect(other.id).toBe(20);
                });

                it("should allow an id of 0", function() {
                    user = new User({
                        id: 1
                    });
                    other = user.copy(0);
                    expect(other.id).toBe(0);
                });
            });

            describe("session", function() {
                beforeEach(function() {
                    session = new Ext.data.Session();
                });

                it("should add the record to the passed session", function() {
                    user = new User();
                    other = user.copy(null, session);
                    expect(session.peekRecord('User', other.id)).toBe(other);
                });

                it("should not copy a session by default", function() {
                    user = new User({id: 1}, session);
                    other = user.copy();
                    expect(other.session).toBeNull();
                });
            });
        });

        describe("clone", function() {
            it("should return a model of the same type", function() {
                user = new User();
                other = user.clone();

                expect(other.self).toBe(user.self);
            });

            it("should copy data across and retain types, but the data object should be different", function() {
                var aDate = new Date();
                user = new User({
                    name: 'Foo',
                    age: 12,
                    startDate: aDate
                });
                other = user.clone();
                expect(other.get('name')).toBe('Foo');
                expect(other.get('age')).toBe(12);
                expect(other.get('startDate')).toBe(aDate);
                expect(other.data).not.toBe(user.data);
            });

            it("should copy across non-fields", function() {
                user = new User({
                    nonField: 100
                });
                other = user.clone();
                expect(other.get('nonField')).toBe(100);
            });

            describe("model states", function() {
                it("should copy across phantom state", function() {
                    user = new User();
                    other = user.clone();
                    expect(other.phantom).toBe(true);
                });

                it("should copy across the modified state", function() {
                    user = new User({
                        name: 'Foo'
                    });
                    user.set('name', 'Bar');
                    other = user.clone();
                    expect(other.isModified('name')).toBe(true);
                });

                it("should copy across the dirty state", function() {
                    user = new User({
                        name: 'Foo'
                    });
                    user.set('name', 'Bar');
                    other = user.clone();
                    expect(other.dirty).toBe(true);
                });

                it("should copy the dropped state", function() {
                    user = new User();
                    user.drop();
                    other = user.clone();
                    expect(other.dropped).toBe(true);
                });
            });

            describe("session", function() {
                beforeEach(function() {
                    session = new Ext.data.Session();
                });

                it("should add the record to the passed session", function() {
                    user = new User();
                    other = user.clone(session);
                    expect(session.peekRecord('User', other.id)).toBe(other);
                });

                it("should not copy a session by default", function() {
                    user = new User({id: 1}, session);
                    other = user.clone();
                    expect(other.session).toBeNull();
                });
            });
        });
    });

    describe("drop", function() {
        var A;

        beforeEach(function() {
            A = Ext.define('spec.A', {
                extend: 'Ext.data.Model',
                fields: ['id', 'name']
            })
        });

        afterEach(function() {
            Ext.undefine('spec.A');
            A = null;
        });

        it("should mark the record as dropped", function() {
            var rec = new A({
                id: 1
            });

            rec.drop();
            expect(rec.dropped).toBe(true);
        });

        it("should not erase the record if it is not a phantom", function() {
            var rec = new A({
                id: 1
            });

            rec.drop();
            expect(rec.dropped).toBe(true);
            expect(rec.erased).toBe(false);
        });

        it("should erase the record if it is a phantom", function() {
            var rec = new A();
            rec.drop();
            expect(rec.dropped).toBe(true);
            expect(rec.erased).toBe(true);
        })

        it("should call afterDrop", function() {
            var rec = new A({
                id: 1
            });
            spyOn(rec, 'callJoined');
            rec.drop();
            expect(rec.callJoined).toHaveBeenCalled();
            expect(rec.callJoined.mostRecentCall.args[0]).toBe('afterDrop');
        });

        describe("associations", function() {
            // The specifics of this are tested in the associations themselves.
            // Here we just want to test the cascade flag works correctly.
            
            var order, address, orderItems, orderItem;
            beforeEach(function() {
                Ext.define('spec.Order', {
                    extend: 'Ext.data.Model',
                    fields: ['id', 'date', {
                        name: 'addressId',
                        unique: true,
                        reference: {
                            child: 'Address'
                        }
                    }]
                });

                Ext.define('spec.Address', {
                    extend: 'Ext.data.Model',
                    fields: ['id', 'city']
                });

                Ext.define('spec.OrderItem', {
                    extend: 'Ext.data.Model',
                    fields: ['id', 'price', 'qty', {
                        name: 'orderId',
                        reference: {
                            parent: 'Order'
                        }
                    }]
                });

                order = new spec.Order({
                    id: 1
                });

                address = new spec.Address({
                    id: 201
                });
                order.setAddress(address);

                orderItems = order.orderItems();
                orderItem = orderItems.add({
                    id: 101,
                    orderId: 1
                })[0];
            });

            afterEach(function() {
                Ext.undefine('spec.Order');
                Ext.undefine('spec.Address');
                Ext.undefine('spec.OrderItem');
                order = address = orderItems = orderItem = null;
            });

            it("should cascade by default", function() {
                order.drop();
                Ext.data.Model.schema.processKeyChecks(true);
                expect(address.dropped).toBe(true);
                expect(orderItem.dropped).toBe(true);
            });

            it("should cascade with cascade: true", function() {
                order.drop(true);
                Ext.data.Model.schema.processKeyChecks(true);
                expect(address.dropped).toBe(true);
                expect(orderItem.dropped).toBe(true);
            });

            it("should not cascade with cascade: false", function() {
                order.drop(false);
                Ext.data.Model.schema.processKeyChecks(true);
                expect(address.dropped).toBe(false);
                expect(orderItem.dropped).toBe(false);
            });
        });
    });

    describe("versionProperty", function() {
        var User;

        beforeEach(function() {
            User = Ext.define('spec.User', {
                extend: 'Ext.data.Model',
                fields: ['name'],
                versionProperty: 'version'
            })
        });

        afterEach(function() {
            Ext.undefine('spec.User');
            User = null;
        });

        it("should increment the versionProperty when commiting", function() {
            var user = new User({
                id: 1,
                name: 'Foo',
                version: 5
            });
            user.set('name', 'Bar');
            user.commit();
            expect(user.get('version')).toBe(6);
        });

        it("should not increment the versionProperty when committing a phantom", function() {
            var user = new User({
                name: 'Foo'
            });
            expect(user.get('version')).toBe(1);
            user.set('name', 'Bar');
            user.commit();
            expect(user.get('version')).toBe(1);
        });

        it("should not increment the versionProperty when rejecting", function() {
            var user = new User({
                id: 1,
                name: 'X'
            });
            user.set('name', 'Bar');
            user.reject();
            expect(user.get('version')).toBe(1);
        });
    });
});
