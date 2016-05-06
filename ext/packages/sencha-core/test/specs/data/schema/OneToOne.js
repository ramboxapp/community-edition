describe("Ext.data.schema.OneToOne", function() {
    
    var schema, User, Address, userRole, addressRole, assoc,
        userCalled = false, 
        addressCalled = false;
    
    function defineUser(refCfg) {
        User = Ext.define('spec.User', {
            extend: 'Ext.data.Model',
            fields: ['id', 'name', {
                name: 'addressId',
                unique: true,
                reference: Ext.apply({
                    type: 'Address'
                }, refCfg)
            }],

            constructor: function() {
                userCalled = true;
                this.callParent(arguments);
            }
        });
        userRole = Address.associations.user;
        addressRole = User.associations.address;
        if (userRole) {
            assoc = userRole.association;
        } else if (addressRole) {
            assoc = addressRole.association;
        }
    }

    function complete(data, status) {
        Ext.Ajax.mockComplete({
            status: status || 200,
            responseText: Ext.JSON.encode(data)
        });
    }
    
    beforeEach(function() {
        addressCalled = userCalled = false;
        MockAjaxManager.addMethods();
        schema = Ext.data.Model.schema;
        schema.setNamespace('spec');
        
        Address = Ext.define('spec.Address', {
            extend: 'Ext.data.Model',
            fields: ['id', 'street', 'city', 'zip'],

            constructor: function() {
                addressCalled = true;
                this.callParent(arguments);
            }
        });
        
    });
    
    afterEach(function() {
        MockAjaxManager.removeMethods();
        Ext.undefine('spec.User');
        Ext.undefine('spec.Address');
        
        schema.clear(true);
        assoc = User = userRole = Address = addressRole = schema = null;   
        addressCalled = userCalled = false;
    });
    
    describe("Model.associations", function() {
        it("should have an association role on each model", function() {
            defineUser();
            expect(User.associations.address).toBeDefined();
            expect(Address.associations.user).toBeDefined();
        });
        
        it("should have a reference back to the association for each role", function() {
            defineUser();
            expect(Address.associations.user.association).toBe(User.associations.address.association);
            expect(Address.associations.user.association.isOneToOne).toBe(true);
        });     
    });
    
    describe("association default config", function() {
        
        beforeEach(function() {
            defineUser();
        });
        
        it("should have a schema set", function() {
            expect(assoc.schema).toBe(schema);    
        });
        
        it("should have the reference field set", function() {
            expect(assoc.field).toBe(User.getField('addressId'));
        });  
        
        it("should have the left part be set to the key holder", function() {
            expect(assoc.left).toBe(userRole);
        });
        
        it("should set definedBy to the key holder", function() {
            expect(assoc.definedBy).toBe(User);    
        });
        
        it("should have the right part be set to the non key holder", function() {
            expect(assoc.right).toBe(addressRole);
        });
        
        it("should have the owner as null", function() {
            expect(assoc.owner).toBeNull();
        });
        
        it("should set the assoc name to {SingularRight}{SingularLeft}", function() {
            expect(assoc.name).toBe('AddressUser');
        });
    });
    
    describe("left", function() {
        beforeEach(function() {
            defineUser();
        });
        
        it("should set the role to be singular lowercase & the type to be the entity name", function() {
            expect(userRole.role).toBe('user');
            expect(userRole.type).toBe('User');
        });
        
        it("should set the inverse role to the right", function() {
            expect(userRole.inverse).toBe(addressRole);    
        });    
        
        it("should set the entity", function() {
            expect(userRole.cls).toBe(User);    
        });
    });
    
    describe("right", function() {
        beforeEach(function() {
            defineUser();
        });
        
        it("should set the role to be singular lowercase & the type to be the entity name", function() {
            expect(addressRole.role).toBe('address');
            expect(addressRole.type).toBe('Address');
        });
        
        it("should set the inverse role to the left", function() {
            expect(addressRole.inverse).toBe(userRole);    
        });    
        
        it("should set the entity", function() {
            expect(addressRole.cls).toBe(Address);    
        });
    });
    
    describe("configuring", function() {
        it("should set an association name", function() {
            defineUser({
                association: 'CustomName'
            });    
            expect(assoc.name).toBe('CustomName');
        });
        
        it("should set the owner based on the child param", function() {
            defineUser({
                child: true
            });
            expect(assoc.owner).toBe(userRole);
            expect(userRole.owner).toBe(true);
            expect(addressRole.owner).toBe(false);
        });
        
        it("should set the owner based on the parent param", function() {
            defineUser({
                parent: true
            });
            expect(assoc.owner).toBe(addressRole);
            expect(addressRole.owner).toBe(true);
            expect(userRole.owner).toBe(false);
        });
        
        it("should be able to set a custom role", function() {
            defineUser({
                role: 'foo'
            });
            addressRole = User.associations.foo;
            assoc = addressRole.association;
            expect(assoc.name).toBe('AddressFooUser');
            expect(addressRole.role).toBe('foo');
        });
        
        describe("inverse", function() {
            it("should set with a string", function() {
                defineUser({
                    inverse: 'foo'
                });
                expect(assoc.name).toBe('AddressFoo');
                userRole = Address.associations.foo;
                expect(userRole.role).toBe('foo');
            });
            
            it("should set with an object", function() {
                defineUser({
                    inverse: {
                        role: 'foo'
                    }
                });
                expect(assoc.name).toBe('AddressFoo');
                userRole = Address.associations.foo;
                expect(userRole.role).toBe('foo');
            });
        });
    });
    
    describe("model decoration", function() {
        function expectFn(Type, member) {
            expect(typeof Type.prototype[member]).toBe('function');
        }
        
        it("should generate a getter on the key holder", function() {
            defineUser();
            expectFn(User, 'getAddress');  
        });
        
        it("should generate a setter on the key holder", function() {
            defineUser();
            expectFn(User, 'setAddress');  
        });
        
        it("should define a getter on the inverse", function() {
            defineUser();
            expectFn(Address, 'getUser');  
        });
        
        it("should allow a custom getter name on the key holder", function() {
            defineUser({
                getterName: 'getCoolUser'
            });
            expectFn(User, 'getCoolUser');  
        });
        
        it("should allow a custom setter name on the key holder", function() {
            defineUser({
                setterName: 'setCoolUser'
            });
            expectFn(User, 'setCoolUser');      
        });
        
        it("should allow a custom getter name on the inverse", function() {
            defineUser({
                inverse: {
                    getterName: 'getCoolAddress'
                }
            });
            expectFn(Address, 'getCoolAddress');
        });
        
        it("should decorate the model based on the role", function() {
            Ext.define('spec.OtherUser', {
                extend: 'Ext.data.Model',
                fields: ['id', 'name', {
                    name: 'useralAddressId',
                    reference: {
                        type: 'Address',
                        role: 'useralAddress'
                    }
                }, {
                    name: 'homeAddressId',
                    reference: {
                        type: 'Address',
                        role: 'homeAddress'
                    }
                }]
            });
            
            expectFn(spec.OtherUser, 'getUseralAddress');
            expectFn(spec.OtherUser, 'getHomeAddress');
            
            Ext.undefine('spec.OtherUser');
        });
    });

    describe("subclasing", function() {
        // User
        describe("the left", function() {
            var SubUser;

            beforeEach(function() {
                defineUser();
                SubUser = Ext.define('spec.SubUser', {
                    extend: 'spec.User'
                });
            });

            afterEach(function() {
                Ext.undefine('spec.SubUser');
            });

            it("should still have the original association", function() {
                var inverse = User.associations.address.inverse;
                expect(inverse.role).toBe('user');
                expect(inverse.cls).toBe(User);
            });

            it("should inherit the association from the parent and modify the relevant classes", function() {
                var inverse = SubUser.associations.address.inverse;
                expect(inverse.role).toBe('subUser');
                expect(inverse.cls).toBe(SubUser);
            });
        });

        // Address
        describe("the right", function() {
            var SubAddress;

            beforeEach(function() {
                defineUser();
                SubAddress = Ext.define('spec.SubAddress', {
                    extend: 'spec.Address'
                })
            });

            it("should not have any associations", function() {
                expect(SubAddress.associations).toEqual({});
            });
        });
    });

    describe("nested loading", function() {
        beforeEach(function() {
            defineUser();
        });

        it("should delete the non-key holder from the data collection", function() {
            var user = User.load(1);
            complete({
                id: 1,
                address: {
                    id: 101
                }
            });
            expect(user.get('address')).toBeUndefined();
            expect(user.getAddress().getId()).toBe(101);
        });

        it("should delete the key holder from the data collection", function() {
            var address = Address.load(101);
            complete({
                id: 101,
                user: {
                    id: 1
                }
            });
            expect(address.get('user')).toBeUndefined();
            expect(address.getUser().getId()).toBe(1);
        });

        describe("key inference", function() {
            describe("without session", function() {
                it("should infer the key from the parent", function() {
                    var user = User.load(1);
                    complete({
                        id: 1,
                        address: {
                            id: 101
                        }
                    });
                    expect(user.getAddress().getId()).toBe(101);
                    expect(user.get('addressId')).toBe(101);
                    expect(user.dirty).toBe(false);
                });
            });

            describe("with session", function() {
                var session;

                beforeEach(function() {
                    session = new Ext.data.Session();
                });

                afterEach(function() {
                    session.destroy();
                    session = null;
                });

                it("should favour an existing reference", function() {
                    var user = session.createRecord('User', {
                        id: 1,
                        addressId: 201
                    });

                    user.load();
                    complete({
                        id: 1,
                        address: {
                            id: 101
                        }
                    });

                    var address101 = session.peekRecord('Address', 101);

                    expect(user.getAddress().getId()).toBe(201);
                    expect(user.get('addressId')).toBe(201);
                    expect(user.dirty).toBe(false);
                    expect(address101).not.toBeNull();
                    expect(user.getAddress()).not.toBe(address101);
                });

                it("should infer the key from the parent if not specified", function() {
                    var user = User.load(1, null, session);
                    complete({
                        id: 1,
                        address: {
                            id: 101
                        }
                    });
                    expect(user.getAddress().getId()).toBe(101);
                    expect(user.get('addressId')).toBe(101);
                    expect(user.dirty).toBe(false);
                });

                it("should not infer the key from the parent if a key is specified", function() {
                    var user = User.load(1, null, session);
                    complete({
                        id: 1,
                        // Essentially the same as favour an existing reference, just at load time
                        addressId: 201,
                        address: {
                            id: 101
                        }
                    });

                    expect(user.getAddress().getId()).toBe(201);
                    expect(user.get('addressId')).toBe(201);
                    expect(user.dirty).toBe(false);
                });
            });
        });
    });
    
    describe("getters/setters", function() {
        function createSuite(withSession) {
            describe(withSession ? "with session" : "without session", function() {
                var session, user, address, spy;

                beforeEach(function() {
                    defineUser();
                    spy = jasmine.createSpy();
                    if (withSession) {
                        session = new Ext.data.Session();
                    }
                });
                
                afterEach(function() {
                    if (withSession) {
                        session.destroy();
                    }
                    session = spy = user = address = null;
                });
                
                describe("the key holder", function() {
                    describe("getter", function() {
                        beforeEach(function() {
                            user = new User({
                                id: 4
                            }, session);
                            
                        });
                        describe("without an instance", function() {
                            describe("with no foreign key value", function() {
                                it("should return null", function() {
                                    expect(user.getAddress()).toBeNull();
                                });

                                it("should not make any request", function() {
                                    spy = spyOn(Address.getProxy(), 'read');
                                    user.getAddress();
                                    expect(spy).not.toHaveBeenCalled();
                                });

                                describe("callbacks", function() {
                                    it("should call the callbacks before the function returns", function() {
                                        user.getAddress(spy);
                                        expect(spy).toHaveBeenCalled();
                                        spy.reset();
                                        user.getAddress({
                                            success: spy
                                        });
                                        expect(spy).toHaveBeenCalled();
                                        spy.reset();
                                        user.getAddress({
                                            callback: spy
                                        });
                                        expect(spy).toHaveBeenCalled();
                                    });

                                    it("should accept a function as the callback and default the scope to the model", function() {
                                        user.getAddress(spy);
                                        var call = spy.mostRecentCall;
                                        expect(call.args[0]).toBe(address);
                                        expect(call.args[1]).toBeNull();
                                        expect(call.args[2]).toBe(true);
                                        expect(call.object).toBe(user);
                                    });
                                    
                                    it("should accept a function with a scope", function() {
                                        var o = {};
                                        user.getAddress(spy, o);
                                        expect(spy.mostRecentCall.object).toBe(o);   
                                    });
                                    
                                    it("should accept an options object with success and default the scope to the model", function() {
                                        user.getAddress({
                                            success: spy
                                        });  
                                        var call = spy.mostRecentCall; 
                                        expect(call.args[0]).toBe(address);
                                        expect(call.args[1]).toBeNull();
                                        expect(call.object).toBe(user);  
                                    });

                                    it("should accept an options object with success and a scope", function() {
                                        var o = {},
                                            call;

                                        user.getAddress({
                                            scope: o,
                                            success: spy
                                        });  
                                        call = spy.mostRecentCall; 
                                        expect(call.object).toBe(o);  
                                    });

                                    it("should accept an options object with callback and default the scope to the model", function() {
                                        user.getAddress({
                                            callback: spy
                                        });  
                                        var call = spy.mostRecentCall; 
                                        expect(call.args[0]).toBe(address);
                                        expect(call.args[1]).toBeNull();
                                        expect(call.args[2]).toBe(true);
                                        expect(call.object).toBe(user); 
                                    });
                                    
                                    it("should accept an options object with callback and a scope", function() {
                                        var o = {},
                                            call;

                                        user.getAddress({
                                            scope: o,
                                            callback: spy
                                        });  
                                        call = spy.mostRecentCall; 
                                        expect(call.object).toBe(o); 
                                    });
                                });
                            });

                            describe("with a foreign key value", function() {
                                beforeEach(function() {
                                    user.set('addressId', 17);
                                });

                                if (withSession) {
                                    it("should create an instance in the session", function() {
                                        expect(user.getAddress()).toBe(session.getRecord('Address', 17, false));
                                    });

                                    it("should use an existing record instance", function() {
                                        address = session.getRecord('Address', 17, false);
                                        expect(user.getAddress()).toBe(address);
                                    });

                                    it("should not load an existing instance", function() {
                                        address = session.getRecord('Address', {
                                            id: 17
                                        }, false);
                                        user.getAddress();
                                        expect(address.isLoading()).toBe(false);
                                    });
                                }

                                it("should return an instance with the matching id", function() {
                                    expect(user.getAddress().getId()).toBe(17);
                                });

                                it("should be in a loading state", function() {
                                    expect(user.getAddress().isLoading()).toBe(true);
                                });

                                it("should trigger a load for the record", function() {
                                    spy = spyOn(Address.getProxy(), 'read');
                                    user.getAddress();
                                    expect(spy.mostRecentCall.args[0].getId()).toBe(17);
                                });

                                describe("calling while during a load", function() {
                                    it("should return the same record", function() {
                                        var rec = user.getAddress();
                                        expect(user.getAddress()).toBe(rec);
                                    });

                                    it("should not trigger a second load", function() {
                                        user.getAddress();
                                        spy = spyOn(Address.getProxy(), 'read');
                                        user.getAddress();
                                        expect(spy).not.toHaveBeenCalled();
                                    });

                                    it("should not trigger any callback until load completes", function() {
                                        user.getAddress();
                                        user.getAddress({
                                            success: spy,
                                            callback: spy
                                        });
                                        expect(spy).not.toHaveBeenCalled();
                                    });

                                    it("should trigger the callbacks once loaded", function() {
                                        user.getAddress();
                                        user.getAddress({
                                            success: spy,
                                            callback: spy
                                        });
                                        complete({});
                                        expect(spy.callCount).toBe(2);
                                    });
                                });

                                describe("callbacks", function() {
                                    it("should not trigger any callbacks until the load completes", function() {
                                        user.getAddress(spy);
                                        user.getAddress({
                                            success: spy
                                        });
                                        user.getAddress({
                                            failure: spy
                                        });
                                        user.getAddress({
                                            callback: spy
                                        });
                                        expect(spy).not.toHaveBeenCalled();

                                    });

                                    describe("when successful", function() {
                                        it("should accept a function as the callback and default the scope to the model", function() {
                                            address = user.getAddress(spy);
                                            complete({});
                                            var call = spy.mostRecentCall;
                                            expect(call.args[0]).toBe(address);
                                            expect(call.args[1].isOperation).toBe(true);
                                            expect(call.args[2]).toBe(true);
                                            expect(call.object).toBe(user);
                                        });
                                    
                                        it("should accept a function with a scope", function() {
                                            var o = {};
                                            user.getAddress(spy, o);
                                            complete({});
                                            expect(spy.mostRecentCall.object).toBe(o);   
                                        });
                                    
                                        it("should accept an options object with success and default the scope to the model", function() {
                                            address = user.getAddress({
                                                success: spy
                                            });  
                                            complete({});
                                            var call = spy.mostRecentCall; 
                                            expect(call.args[0]).toBe(address);
                                            expect(call.args[1].isOperation).toBe(true);
                                            expect(call.object).toBe(user);  
                                        });

                                        it("should accept an options object with success and a scope", function() {
                                            var o = {},
                                                call;

                                            user.getAddress({
                                                scope: o,
                                                success: spy
                                            });  
                                            complete({});
                                            call = spy.mostRecentCall; 
                                            expect(call.object).toBe(o);  
                                        });

                                        it("should accept an options object with callback and default the scope to the model", function() {
                                            address = user.getAddress({
                                                callback: spy
                                            });  
                                            complete({});
                                            var call = spy.mostRecentCall; 
                                            expect(call.args[0]).toBe(address);
                                            expect(call.args[1].isOperation).toBe(true);
                                            expect(call.args[2]).toBe(true);
                                            expect(call.object).toBe(user); 
                                        });
                                    
                                        it("should accept an options object with callback and a scope", function() {
                                            var o = {},
                                                call;

                                            user.getAddress({
                                                scope: o,
                                                callback: spy
                                            });  
                                            complete({});
                                            call = spy.mostRecentCall; 
                                            expect(call.object).toBe(o); 
                                        });
                                    });

                                    describe("when failed", function() {
                                        it("should accept a function as the callback and default the scope to the model", function() {
                                            address = user.getAddress(spy);
                                            complete(null, 500);
                                            var call = spy.mostRecentCall;
                                            expect(call.args[0]).toBe(address);
                                            expect(call.args[1].isOperation).toBe(true);
                                            expect(call.args[2]).toBe(false);
                                            expect(call.object).toBe(user);
                                        });
                                    
                                        it("should accept a function with a scope", function() {
                                            var o = {};
                                            user.getAddress(spy, o);
                                            complete(null, 500);
                                            expect(spy.mostRecentCall.object).toBe(o);   
                                        });
                                    
                                        it("should accept an options object with failure and default the scope to the model", function() {
                                            address = user.getAddress({
                                                failure: spy
                                            });  
                                            complete(null, 500);
                                            var call = spy.mostRecentCall; 
                                            expect(call.args[0]).toBe(address);
                                            expect(call.args[1].isOperation).toBe(true);
                                            expect(call.object).toBe(user);  
                                        });

                                        it("should accept an options object with failure and a scope", function() {
                                            var o = {},
                                                call;

                                            user.getAddress({
                                                scope: o,
                                                failure: spy
                                            });  
                                            complete(null, 500);
                                            call = spy.mostRecentCall; 
                                            expect(call.object).toBe(o);  
                                        });

                                        it("should accept an options object with callback and default the scope to the model", function() {
                                            address = user.getAddress({
                                                callback: spy
                                            });  
                                            complete(null, 500);
                                            var call = spy.mostRecentCall; 
                                            expect(call.args[0]).toBe(address);
                                            expect(call.args[1].isOperation).toBe(true);
                                            expect(call.args[2]).toBe(false);
                                            expect(call.object).toBe(user); 
                                        });
                                    
                                        it("should accept an options object with callback and a scope", function() {
                                            var o = {},
                                                call;

                                            user.getAddress({
                                                scope: o,
                                                callback: spy
                                            });  
                                            complete(null, 500);
                                            call = spy.mostRecentCall; 
                                            expect(call.object).toBe(o); 
                                        });
                                    });
                                });
                            });
                        });

                        describe("with an already loaded instance", function() {
                            beforeEach(function() {
                                address = new Address({
                                    id: 2
                                }, session);
                                
                                user.setAddress(address);
                            });

                            it("should return the same instance", function() {
                                expect(user.getAddress()).toBe(address);
                            });

                            it("should not attempt to load", function() {
                                spy = spyOn(Address.getProxy(), 'read');
                                user.getAddress();
                                expect(spy).not.toHaveBeenCalled();
                            });

                            it("should attempt to reload if called with options.reload", function() {
                                spy = spyOn(Address.getProxy(), 'read').andReturn();
                                user.getAddress({
                                    reload: true
                                });
                                expect(spy).toHaveBeenCalled();
                            });

                            it("should reload the same record when called with reload", function() {
                                var result = user.getAddress({
                                    reload: true
                                });
                                expect(result).toBe(address);
                            });

                            describe("callbacks", function() {
                                it("should call the callbacks before the function returns", function() {
                                    user.getAddress(spy);
                                    expect(spy).toHaveBeenCalled();
                                    spy.reset();
                                    user.getAddress({
                                        success: spy
                                    });
                                    expect(spy).toHaveBeenCalled();
                                    spy.reset();
                                    user.getAddress({
                                        callback: spy
                                    });
                                    expect(spy).toHaveBeenCalled();
                                });

                                it("should accept a function as the callback and default the scope to the model", function() {
                                    user.getAddress(spy);
                                    var call = spy.mostRecentCall;
                                    expect(call.args[0]).toBe(address);
                                    expect(call.args[1]).toBeNull();
                                    expect(call.args[2]).toBe(true);
                                    expect(call.object).toBe(user);
                                });
                                
                                it("should accept a function with a scope", function() {
                                    var o = {};
                                    user.getAddress(spy, o);
                                    expect(spy.mostRecentCall.object).toBe(o);   
                                });
                                
                                it("should accept an options object with success and default the scope to the model", function() {
                                    user.getAddress({
                                        success: spy
                                    });  
                                    var call = spy.mostRecentCall; 
                                    expect(call.args[0]).toBe(address);
                                    expect(call.args[1]).toBeNull();
                                    expect(call.object).toBe(user);  
                                });

                                it("should accept an options object with success and a scope", function() {
                                    var o = {},
                                        call;

                                    user.getAddress({
                                        scope: o,
                                        success: spy
                                    });  
                                    call = spy.mostRecentCall; 
                                    expect(call.object).toBe(o);  
                                });

                                it("should accept an options object with callback and default the scope to the model", function() {
                                    user.getAddress({
                                        callback: spy
                                    });  
                                    var call = spy.mostRecentCall; 
                                    expect(call.args[0]).toBe(address);
                                    expect(call.args[1]).toBeNull();
                                    expect(call.args[2]).toBe(true);
                                    expect(call.object).toBe(user); 
                                });
                                
                                it("should accept an options object with callback and a scope", function() {
                                    var o = {},
                                        call;

                                    user.getAddress({
                                        scope: o,
                                        callback: spy
                                    });  
                                    call = spy.mostRecentCall; 
                                    expect(call.object).toBe(o); 
                                });
                            });
                        });
                    });
                
                    describe("setter", function() {
                        beforeEach(function() {
                            user = new User({
                                id: 7
                            }, session);
                        });

                        describe("instance", function() {
                            var address;

                            beforeEach(function() {
                                address = new Address({
                                    id: 3
                                }, session);
                            });

                            describe("with nothing existing", function() {
                                beforeEach(function() {
                                    user.setAddress(address);
                                });

                                it("should have the same record reference", function() {
                                    expect(user.getAddress()).toBe(address);
                                });
                            
                                it("should set the underlying key value", function() {
                                    expect(user.get('addressId')).toBe(3);  
                                });

                                it("should clear the instance and foreign key when setting to null", function() {
                                    user.setAddress(null);
                                    expect(user.getAddress()).toBeNull();
                                    expect(user.get('addressId')).toBeNull();
                                });
                            });

                            describe("with an existing key, but no instance", function() {
                                beforeEach(function() {
                                    user.setAddress(1000);
                                    user.setAddress(address);
                                });

                                it("should have the new record reference", function() {
                                    expect(user.getAddress()).toBe(address);
                                });

                                it("should set the underlying key value", function() {
                                    expect(user.get('addressId')).toBe(3);  
                                });

                                it("should clear the instance and foreign key when setting to null", function() {
                                    user.setAddress(null);
                                    expect(user.getAddress()).toBeNull();
                                    expect(user.get('addressId')).toBeNull();
                                });
                            });

                            describe("with an existing instance", function() {
                                beforeEach(function() {
                                    user.setAddress(new Address({
                                        id: 1000
                                    }, session));
                                    user.setAddress(address);
                                });

                                it("should have the new record reference", function() {
                                    expect(user.getAddress()).toBe(address);
                                });

                                it("should set the underlying key value", function() {
                                    expect(user.get('addressId')).toBe(3);  
                                });

                                it("should clear the instance and foreign key when setting to null", function() {
                                    user.setAddress(null);
                                    expect(user.getAddress()).toBeNull();
                                    expect(user.get('addressId')).toBeNull();
                                });
                            });
                        });
                        
                        describe("value", function() {
                            describe("with nothing existing", function() {
                                it("should set the underlying key", function() {
                                    user.setAddress(16);
                                    expect(user.get('addressId')).toBe(16);    
                                });

                                it("should return a new record object that loads", function() {
                                    user.setAddress(16);
                                    spy = spyOn(Address.getProxy(), 'read');
                                    // Reference doesn't exist, so need to grab it again here
                                    expect(user.getAddress().getId()).toBe(16);
                                    expect(spy.mostRecentCall.args[0].getId()).toBe(16);
                                });

                                it("should do nothing if the key is null", function() {
                                    user.setAddress(null);
                                    expect(user.getAddress()).toBeNull();
                                });
                            });

                            describe("with an existing key, but no instance", function() {
                                beforeEach(function() {
                                    user.setAddress(1000);
                                });

                                it("should set the underlying key", function() {
                                    user.setAddress(16);
                                    expect(user.get('addressId')).toBe(16);    
                                });

                                it("should return a new record object that loads", function() {
                                    user.setAddress(16);
                                    spy = spyOn(Address.getProxy(), 'read');
                                    // Reference doesn't exist, so need to grab it again here
                                    expect(user.getAddress().getId()).toBe(16);
                                    expect(spy.mostRecentCall.args[0].getId()).toBe(16);
                                });

                                it("should clear the key", function() {
                                    user.setAddress(null);
                                    expect(user.get('addressId')).toBeNull();
                                    expect(user.getAddress()).toBeNull();
                                });
                            });

                            describe("with an existing instance", function() {
                                beforeEach(function() {
                                    user.setAddress(new Address({
                                        id: 1000
                                    }, session));
                                });

                                it("should set the underlying key", function() {
                                    user.setAddress(16);
                                    expect(user.get('addressId')).toBe(16);    
                                });

                                it("should return a new record object that loads", function() {
                                    user.setAddress(16);
                                    spy = spyOn(Address.getProxy(), 'read');
                                    // Reference doesn't exist, so need to grab it again here
                                    expect(user.getAddress().getId()).toBe(16);
                                    expect(spy.mostRecentCall.args[0].getId()).toBe(16);
                                });

                                it("should clear the key", function() {
                                    user.setAddress(null);
                                    expect(user.get('addressId')).toBeNull();
                                    expect(user.getAddress()).toBeNull();
                                });
                            });
                        });

                        describe("timing", function() {
                            var address, joiner, fn;

                            beforeEach(function() {
                                joiner = {
                                    afterEdit: function() {
                                        fn();
                                    }
                                };
                                address = new Address({
                                    id: 101
                                }, session);
                            });

                            afterEach(function() {
                                fn = joiner = null;
                            });

                            it("should have the record instances set in afterEdit", function() {
                                var val;
                                fn = function() {
                                    val = user.getAddress();
                                };
                                user.join(joiner);
                                user.setAddress(address);
                                expect(val).toBe(address);
                            });

                            it("should have the value cleared in afterEdit", function() {
                                var val;
                                user.setAddress(address);

                                fn = function() {
                                    val = user.getAddress();
                                };
                                user.join(joiner);
                                user.setAddress(null);
                                expect(val).toBeNull();
                            });
                        });
                        
                        describe("callbacks", function() {
                            it("should accept a function as the second arg, scope should default to the model", function() {
                                user.setAddress(16, spy);
                                complete({});
                                var call = spy.mostRecentCall;
                                expect(call.args[0]).toBe(user);
                                expect(call.object).toBe(user);
                            });    
                            
                            it("should accept a function with a scope", function() {
                                var o = {};
                                address = user.setAddress(16, spy, o);
                                complete({});
                                expect(spy.mostRecentCall.object).toBe(o);
                            });
                            
                            describe("options object", function() {
                                var successSpy, failureSpy, callbackSpy;

                                beforeEach(function() {
                                    successSpy = jasmine.createSpy();
                                    failureSpy = jasmine.createSpy();
                                    callbackSpy = jasmine.createSpy();
                                });

                                afterEach(function() {
                                    successSpy = failureSpy = callbackSpy = null;
                                });

                                describe("on success", function() {
                                    it("should call success/callback and scope should default to the model", function() {
                                        user.setAddress(16, {
                                            success: successSpy,
                                            callback: callbackSpy,
                                            failure: failureSpy
                                        });
                                        complete({});
                                        expect(failureSpy).not.toHaveBeenCalled();
                                        expect(successSpy).toHaveBeenCalled();
                                        expect(callbackSpy).toHaveBeenCalled();
                                        expect(successSpy.mostRecentCall.object).toBe(user);
                                        expect(callbackSpy.mostRecentCall.object).toBe(user);
                                    });

                                    it("should use a passed scope", function() {
                                        var scope = {};
                                        user.setAddress(16, {
                                            scope: scope,
                                            success: successSpy,
                                            callback: callbackSpy
                                        });
                                        complete({});
                                        expect(successSpy.mostRecentCall.object).toBe(scope);
                                        expect(callbackSpy.mostRecentCall.object).toBe(scope);
                                    });
                                });

                                describe("on failure", function() {
                                    it("should call failure/callback and scope should default to the model", function() {
                                        user.setAddress(16, {
                                            success: successSpy,
                                            callback: callbackSpy,
                                            failure: failureSpy
                                        });
                                        complete(null, 500);
                                        expect(successSpy).not.toHaveBeenCalled();
                                        expect(failureSpy).toHaveBeenCalled();
                                        expect(callbackSpy).toHaveBeenCalled();
                                        expect(failureSpy.mostRecentCall.object).toBe(user);
                                        expect(callbackSpy.mostRecentCall.object).toBe(user);
                                    });

                                    it("should use a passed scope", function() {
                                        var scope = {};
                                        user.setAddress(16, {
                                            scope: scope,
                                            failure: failureSpy,
                                            callback: callbackSpy
                                        });
                                        complete(null, 500);
                                        expect(failureSpy.mostRecentCall.object).toBe(scope);
                                        expect(callbackSpy.mostRecentCall.object).toBe(scope);
                                    });
                                });
                            });
                        });
                    });

                    describe("modifying the foreign key", function() {
                        var user;

                        beforeEach(function() {
                            user = new User({
                                id: 7
                            }, session);
                        });

                        it("should set the reference with no existing key", function() {
                            user.set('addressId', 44);
                            expect(user.getAddress().getId()).toBe(44);
                        });

                        it("should clear the reference when setting to null", function() {
                            address = new Address({
                                id: 3
                            }, session);
                            user.setAddress(address);

                            user.set('addressId', null);
                            expect(user.address).toBeFalsy();
                            expect(user.getAddress()).toBeNull();
                        });

                        it("should change the reference for the key", function() {
                            address = new Address({
                                id: 3
                            }, session);
                            user.setAddress(address);
                            
                            user.set('addressId', 123);
                            expect(user.getAddress().getId()).toBe(123);
                        });

                        if (withSession) {
                            it("should set the new reference if it exists in the session", function() {
                                address = new Address({
                                    id: 3
                                }, session); 
                                user.setAddress(address);

                                var other = new Address({
                                    id: 10
                                }, session);
                                user.set('addressId', 10);
                                var addressName = User.associations.address.getInstanceName();
                                expect(user[addressName]).toBe(other);
                                expect(user.getAddress()).toBe(other);
                            });
                        }
                    });
                });
            });
        }
        createSuite(false);
        createSuite(true);
    });

    describe("dropping", function() {
        function createSuite(withSession) {
            var session, user, address, storeData;

            beforeEach(function() {
                if (withSession) {
                    session = new Ext.data.Session();
                }

                storeData = [{
                    id: 1,
                    address: {
                        id: 101
                    }
                }];
            });

            afterEach(function() {
                if (withSession) {
                    session.destroy();
                    session = null;
                }
                storeData = user = address = null;
            });

            function makeUser(id, addressId) {
                var data = {
                    id: id,
                    addressId: addressId
                };

                // Session will be null if withSession is false
                user = new User(data, session);
            }

            function makeAddress(id) {
                // Session will be null if withSession = false
                address = new Address({
                    id: id
                }, session);
            }

            function makeStore(data) {
                var store = new Ext.data.Store({
                    model: User,
                    // Session will be null if withSession = false
                    session: session
                });
                store.loadRawData(data || storeData);
                return store;
            }

            describe(withSession ? "with session" : "without session", function() {
                describe("the key holder", function() {
                    describe("inverse not loaded", function() {
                        beforeEach(function() {
                            defineUser();
                        });

                        it("should not create the the inverse record", function() {
                            makeUser(1, 101);
                            user.drop();
                            expect(addressCalled).toBe(false);
                        });

                        
                        it("should clear the foreign key", function() {
                            makeUser(1, 101);
                            user.drop();
                            expect(user.get('addressId')).toBeNull();
                        });
                    });

                    describe("inverse loaded", function() {
                        var store;

                        afterEach(function() {
                            store.destroy();
                            store = null;
                        });

                        describe("no parent/child relationship", function() {
                            beforeEach(function() {
                                defineUser();
                                store = makeStore();
                                user = store.first();
                                address = user.getAddress();
                            });

                            it("should clear the foreign key", function() {
                                user.drop();
                                expect(user.get('addressId')).toBeNull();
                            });

                            it("should not return the inverse record", function() {
                                expect(user.getAddress()).toBe(address);
                                user.drop();
                                expect(user.getAddress()).toBeNull();
                            });

                            it("should not drop the child record", function() {
                                user.drop();
                                expect(address.dropped).toBe(false);
                            });

                            it("should clear the owner on the inverse", function() {
                                user.drop();
                                expect(address.getUser()).toBeNull();
                            });
                        });

                        describe("as a parent", function() {
                            beforeEach(function() {
                                defineUser({
                                    type: null,
                                    child: 'Address'
                                });
                                store = makeStore();
                                user = store.first();
                                address = user.getAddress();
                            });

                            it("should clear the foreign key", function() {
                                user.drop();
                                expect(user.get('addressId')).toBeNull();
                            });

                            it("should not return the inverse record", function() {
                                expect(user.getAddress()).toBe(address);
                                user.drop();
                                expect(user.getAddress()).toBeNull();
                            });

                            describe("dropping the child", function() {
                                it("should drop the child record", function() {
                                    user.drop();
                                    Ext.data.Model.schema.processKeyChecks(true);
                                    expect(address.dropped).toBe(true);
                                });


                                it("should clear the owner on the inverse", function() {
                                    user.drop();
                                    Ext.data.Model.schema.processKeyChecks(true);
                                    expect(address.getUser()).toBeNull();
                                });

                                it("should drop the child when changing the foreign key", function() {
                                    user.set('addressId', null);
                                    Ext.data.Model.schema.processKeyChecks(true);
                                    expect(address.dropped).toBe(true);
                                });

                                it("should drop the child when nulling out via the setter", function() {
                                    user.setAddress(null);
                                    Ext.data.Model.schema.processKeyChecks(true);
                                    expect(address.dropped).toBe(true);
                                });

                                it("should drop the child when setting a new record", function() {
                                    var other = new Address({
                                        id: 2
                                    }, session);
                                    user.setAddress(other);
                                    Ext.data.Model.schema.processKeyChecks(true);
                                    expect(address.dropped).toBe(true);
                                    expect(other.dropped).toBe(false);
                                });

                                it("should drop the child when setting a new key", function() {
                                    user.setAddress(2);
                                    Ext.data.Model.schema.processKeyChecks(true);
                                    expect(address.dropped).toBe(true);
                                });

                                if (withSession) {
                                    it("should drop when the the records are not connected", function() {
                                        user = new User({
                                            id: 1001,
                                            addressId: 5001
                                        }, session);

                                        var address1 = new Address({
                                            id: 5001
                                        }, session);

                                        var address2 = new Address({
                                            id: 5002
                                        }, session);

                                        user.drop();
                                        Ext.data.Model.schema.processKeyChecks(true);
                                        expect(address1.dropped).toBe(true);
                                        expect(address2.dropped).toBe(false);
                                    });
                                }
                            });

                            describe("not dropping the child", function() {
                                it("should not drop the child immediately", function() {
                                    user.setAddress(null);
                                    expect(address.dropped).toBe(false);
                                })

                                it("should not drop the child if it has been reassigned", function() {
                                    var otherUser = new User({
                                        id: 5
                                    }, session);
                                    user.setAddress(null);
                                    otherUser.setAddress(address);
                                    Ext.data.Model.schema.processKeyChecks(true);
                                });
                            });
                        });
                    });
                });

                describe("the non-key holder", function() {
                    beforeEach(function() {
                        defineUser();
                    });

                    describe("inverse not loaded", function() {
                        it("should not raise an error", function() {
                            makeAddress(101);
                            expect(function() {
                                address.drop();
                            }).not.toThrow();
                        });
                    });

                    describe("inverse loaded", function() {
                        it("should clear the owner reference", function() {
                            var store = makeStore();
                            user = store.first();
                            address = user.getAddress();
                            expect(address.getUser()).toBe(user);
                            address.drop();
                            expect(address.getUser()).toBeNull();
                            store.destroy();
                        });
                    });
                });
            });
        }
        createSuite(false);
        createSuite(true);
    });
});