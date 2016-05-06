describe("Ext.data.schema.Schema", function() {
    
    var M = Ext.data.Model,
        schema;
        
    beforeEach(function() {
        schema = Ext.data.Model.schema;
    });
    
    afterEach(function() {
        schema = Ext.data.Model.schema;
        schema.clear(true);
        schema = null;   
    });
    
    describe("entity names", function() {
        function makeCls(name) {
            return {
                $className: name
            };
        }
        
        describe("without namespace", function() {
            it("should return null if there is no className", function() {
                expect(schema.getEntityName(makeCls())).toBeNull(); 
            });
            
            it("should return a simple name", function() {
                expect(schema.getEntityName(makeCls('User'))).toBe('User');
            });
            
            it("should return the full classname", function() {
                expect(schema.getEntityName(makeCls('Foo.bar.baz.User'))).toBe('Foo.bar.baz.User');
            });
        });
        
        describe("with namespace", function() {            
            it("should return null if there is no className", function() {
                schema.setNamespace('spec.model');
                expect(schema.getEntityName(makeCls())).toBeNull(); 
            });
            
            it("should return the model name sans the namespace", function() {
                schema.setNamespace('spec.model');
                expect(schema.getEntityName(makeCls('spec.model.User'))).toBe('User'); 
            });
            
            it("should return the other parts of model name sans the namespace", function() {
                schema.setNamespace('spec.model');
                expect(schema.getEntityName(makeCls('spec.model.trading.Bid'))).toBe('trading.Bid'); 
            });
            
            it("should support putting the . at the end of the namespace", function() {
                schema.setNamespace('spec.model.');
                expect(schema.getEntityName(makeCls('spec.model.User'))).toBe('User'); 
            });
            
            it("should not remove an unrelated namespace", function() {
                schema.setNamespace('spec.model.');
                expect(schema.getEntityName(makeCls('spec.wodel.User'))).toBe('spec.wodel.User');
            });
        });
    });

    describe("hasAssociations", function() {
        beforeEach(function() {
            schema.setNamespace('spec');
        });

        describe("one to one", function() {
            afterEach(function() {
                Ext.undefine('spec.User');
                Ext.undefine('spec.Address');
            });

            it("should have associations when the key holder is declared first", function() {
                Ext.define('spec.User', {
                    extend: 'Ext.data.Model',
                    fields: [{
                        name: 'addressId',
                        reference: 'Address',
                        unique: true
                    }]
                });
                Ext.define('spec.Address', {
                    extend: 'Ext.data.Model'
                });

                expect(schema.hasAssociations(spec.User)).toBe(true);
                expect(schema.hasAssociations(spec.Address)).toBe(true);
            });

            it("should have associations when the non-key holder is declared first", function() {
                Ext.define('spec.Address', {
                    extend: 'Ext.data.Model'
                });
                Ext.define('spec.User', {
                    extend: 'Ext.data.Model',
                    fields: [{
                        name: 'addressId',
                        reference: 'Address',
                        unique: true
                    }]
                });

                expect(schema.hasAssociations(spec.User)).toBe(true);
                expect(schema.hasAssociations(spec.Address)).toBe(true);
            });
        });

        describe("one to many", function() {
            afterEach(function() {
                Ext.undefine('spec.User');
                Ext.undefine('spec.Post');
            });

            it("should have associations when declaring the one first", function() {
                Ext.define('spec.User', {
                    extend: 'Ext.data.Model'
                });
                Ext.define('spec.Post', {
                    extend: 'Ext.data.Model',
                    fields: [{
                        name: 'userId',
                        reference: 'User'
                    }]
                });

                expect(schema.hasAssociations(spec.User)).toBe(true);
                expect(schema.hasAssociations(spec.Post)).toBe(true);
            });

            it("should have associations when declaring the many first", function() {
                Ext.define('spec.Post', {
                    extend: 'Ext.data.Model',
                    fields: [{
                        name: 'userId',
                        reference: 'User'
                    }]
                });
                Ext.define('spec.User', {
                    extend: 'Ext.data.Model'
                });

                expect(schema.hasAssociations(spec.User)).toBe(true);
                expect(schema.hasAssociations(spec.Post)).toBe(true);
            });
        });

        describe("many to many", function() {
            afterEach(function() {
                Ext.undefine('spec.User');
                Ext.undefine('spec.Group');
            });

            describe("association on the left", function() {
                it("should have associations when declaring the right first", function() {
                    Ext.define('spec.User', {
                        extend: 'Ext.data.Model'
                    });
                    Ext.define('spec.Group', {
                        extend: 'Ext.data.Model',
                        manyToMany: 'User'
                    });

                    expect(schema.hasAssociations(spec.User)).toBe(true);
                    expect(schema.hasAssociations(spec.Group)).toBe(true);
                });

                it("should have associations when declaring the left first", function() {
                    Ext.define('spec.Group', {
                        extend: 'Ext.data.Model',
                        manyToMany: 'User'
                    });
                    Ext.define('spec.User', {
                        extend: 'Ext.data.Model'
                    });

                    expect(schema.hasAssociations(spec.User)).toBe(true);
                    expect(schema.hasAssociations(spec.Group)).toBe(true);
                });
            });

            describe("association on the right", function() {
                it("should have associations when declaring the right first", function() {
                    Ext.define('spec.User', {
                        extend: 'Ext.data.Model',
                        manyToMany: 'Group'
                    });
                    Ext.define('spec.Group', {
                        extend: 'Ext.data.Model'
                    });

                    expect(schema.hasAssociations(spec.User)).toBe(true);
                    expect(schema.hasAssociations(spec.Group)).toBe(true);
                });

                it("should have associations when declaring the left first", function() {
                    Ext.define('spec.Group', {
                        extend: 'Ext.data.Model'
                    });
                    Ext.define('spec.User', {
                        extend: 'Ext.data.Model',
                        manyToMany: 'Group'
                    });

                    expect(schema.hasAssociations(spec.User)).toBe(true);
                    expect(schema.hasAssociations(spec.Group)).toBe(true);
                });
            });
        });
    });
    
    describe("legacy associations", function() {
        describe('inherited associations', function () {
            beforeEach(function () {
                schema.setNamespace('spec');
                Ext.define('spec.AssociatedModel', {
                    extend: 'Ext.data.Model'
                });

                Ext.define('spec.ParentModel', {
                    extend: 'Ext.data.Model',

                    associations: [{
                        type: 'hasOne',
                        model: 'spec.AssociatedModel',
                        getterName: 'getAssocModel',
                        setterName: 'setAssocModel',
                        name: 'associatedModel',
                        associationKey: 'associatedModel',
                        foreignKey: 'id'
                    }]
                });

                Ext.define('spec.ChildModel', {
                    extend: 'spec.ParentModel'
                });
            });

            afterEach(function () {
                Ext.undefine('spec.AssociatedModel');
                Ext.undefine('spec.ParentModel');
                Ext.undefine('spec.ChildModel');
            });

            it('should convert the association', function () {
                var associatedModel = spec.ParentModel.associations.associatedModel;

                expect(!associatedModel).toBe(false);

                // See if getter/setter names are respected:
                expect(typeof spec.ParentModel.prototype.getAssocModel).toBe('function');
                expect(typeof spec.ParentModel.prototype.setAssocModel).toBe('function');

                // See if roles are assigned properly:
                expect(associatedModel.cls.$className).toBe('spec.AssociatedModel');
                expect(associatedModel.inverse.cls.$className).toBe('spec.ParentModel');
            });

            it('should decorate AssociatedModel with ParentModel association', function () {
                var association = spec.AssociatedModel.associations.parentModel;

                expect(!association).toBe(false);

                // See if roles are assigned properly:
                expect(association.cls.$className).toBe('spec.ParentModel');
                expect(association.inverse.cls.$className).toBe('spec.AssociatedModel');
            });

            xit('should inherit the association', function () {
                // See https://sencha.jira.com/browse/EXTJSIV-12979
                var associatedModel = spec.ChildModel.associations.associatedModel;

                expect(!associatedModel).toBe(false);

                // See if roles are assigned properly:
                expect(associatedModel.cls.$className).toBe('spec.AssociatedModel');
                expect(associatedModel.inverse.cls.$className).toBe('spec.ChildModel');
            });

            xit('should decorate AssociatedModel with ChildModel association', function () {
                // See https://sencha.jira.com/browse/EXTJSIV-12979
                var association = spec.AssociatedModel.associations.childModel;

                expect(!association).toBe(false);

                // See if roles are assigned properly:
                expect(association.cls.$className).toBe('spec.ChildModel');
                expect(association.inverse.cls.$className).toBe('spec.AssociatedModel');
            });
        });
    });
});
