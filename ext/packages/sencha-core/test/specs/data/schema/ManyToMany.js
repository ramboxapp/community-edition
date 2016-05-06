describe("Ext.data.schema.ManyToMany", function() {
    describe("configuring", function() {
        var SimpleUser, SimpleGroup, FooBarThing, FooGoo,
            User2, Group2, User3, Group3, User4, Group4, User5, Group5,
            schema;

        beforeEach(function () {
            var Base = Ext.define('spec.many2many.Base', {
                extend: 'Ext.data.Model',

                schema: {
                    namespace: 'spec.many2many'
                }
            });

            schema = Base.schema;
            schema.clear();

            // Simple (one-side specified, default ordering)
            SimpleUser = Ext.define('spec.many2many.User', {
                extend: 'spec.many2many.Base',
                manyToMany: 'Group'
            });

            SimpleGroup = Ext.define('spec.many2many.Group', {
                extend: 'spec.many2many.Base'
            });

            // Side-specified
            User2 = Ext.define('spec.many2many.User2', {
                extend: 'spec.many2many.Base',
                manyToMany: '#Group2'
            });

            Group2 = Ext.define('spec.many2many.Group2', {
                extend: 'spec.many2many.Base',
                manyToMany: 'User2#'
            });

            // Object form
            User3 = Ext.define('spec.many2many.User3', {
                extend: 'spec.many2many.Base',
                manyToMany: [{
                    type: 'Group3',
                    left: true
                }]
            });

            Group3 = Ext.define('spec.many2many.Group3', {
                extend: 'spec.many2many.Base',
                manyToMany: [{
                    type: 'User3',
                    right: true
                }]
            });

            // Full Object form
            User4 = Ext.define('spec.many2many.User4', {
                extend: 'spec.many2many.Base',
                manyToMany: [{
                    type: 'Group4',
                    role: 'groups',
                    field: 'groupId',
                    left: {
                        role: 'users',
                        field: 'userId'
                    }
                }]
            });

            Group4 = Ext.define('spec.many2many.Group4', {
                extend: 'spec.many2many.Base',
                manyToMany: [{
                    type: 'User4',
                    role: 'users',
                    field: 'userId',
                    right: {
                        role: 'groups',
                        field: 'groupId'
                    }
                }]
            });

            // Named Full Object form
            User5 = Ext.define('spec.many2many.User5', {
                extend: 'spec.many2many.Base',
                manyToMany: {
                    foo: {
                        type: 'Group5',
                        role: 'theGroups',
                        field: 'theGroup_id',
                        left: {
                            role: 'theUsers',
                            field: 'theUser_id'
                        }
                    }
                }
            });

            Group5 = Ext.define('spec.many2many.Group5', {
                extend: 'spec.many2many.Base',
                manyToMany: {
                    foo: {
                        type: 'User5',
                        role: 'theUsers',
                        field: 'theUser_id',
                        right: {
                            role: 'theGroups',
                            field: 'theGroup_id'
                        }
                    }
                }
            });

            Base = Ext.define('spec.many2many.FooBase', {
                extend: 'Ext.data.Model',

                schema: {
                    namespace: 'spec.many2many'
                }
            });

            // Nested namespace
            FooBarThing = Ext.define('spec.many2many.foo.bar.Thing', {
                extend: 'spec.many2many.FooBase',
                manyToMany: 'foo.Goo'
            });

            FooGoo = Ext.define('spec.many2many.foo.Goo', {
                extend: 'spec.many2many.FooBase',
                manyToMany: 'foo.bar.Thing'
            });
            Ext.data.Model.schema.setNamespace('spec.many2many');
        });

        afterEach(function() {
            Ext.data.Model.schema.clear(true);
            Ext.undefine('spec.many2many.Base');
            Ext.undefine('spec.many2many.User');
            Ext.undefine('spec.many2many.Group');
            Ext.undefine('spec.many2many.User2');
            Ext.undefine('spec.many2many.Group2');
            Ext.undefine('spec.many2many.User3');
            Ext.undefine('spec.many2many.Group3');
            Ext.undefine('spec.many2many.User4');
            Ext.undefine('spec.many2many.Group4');
            Ext.undefine('spec.many2many.User5');
            Ext.undefine('spec.many2many.Group5');
            Ext.undefine('spec.many2many.FooBase');
            Ext.undefine('spec.many2many.foo.bar.Thing');
            Ext.undefine('spec.many2many.foo.Goo');
        });

        //-------------------------------------------------------------------------

        describe("Simple Association", function() {
            var User, Group, userGroups, users, groups;

            beforeEach(function () {
                User = SimpleUser;
                Group = SimpleGroup;

                groups = User.associations.groups;
                users = Group.associations.users;
                userGroups = groups.association;
            });

            describe('users role', function() {
                it("should have a role name", function() {
                    expect(users.role).toBe('users');
                });

                it("should have an id field", function() {
                    expect(users.field).toBe('userId');
                });

                it("should have the proper inverse role", function() {
                    expect(users.inverse).toBe(groups);
                });

                it("should have the proper class", function() {
                    expect(users.cls).toBe(User);
                });

                it("should have a reference back to the association", function() {
                    expect(users.association.isManyToMany).toBe(true);
                    expect(groups.association).toBe(users.association);
                });     
            });

            describe('groups role', function() {
                it("should have a role name", function() {
                    expect(groups.role).toBe('groups');
                });

                it("should have an id field", function() {
                    expect(groups.field).toBe('groupId');
                });

                it("should have the proper inverse role", function() {
                    expect(groups.inverse).toBe(users);
                });

                it("should have the proper class", function() {
                    expect(groups.cls).toBe(Group);
                });
            });
            
            describe('Common properties', function () {
                it("should set the assoc name", function() {
                    expect(userGroups.name).toBe('GroupUsers');
                });

                it("should have a schema set", function() {
                    expect(userGroups.schema).toBe(schema);    
                });

                it("should have no reference field set", function() {
                    expect(userGroups.field).toBeNull();
                });  

                it("should set definedBy to the key holder", function() {
                    expect(userGroups.definedBy).toBe(User);    
                });

                it("should have the owner as null", function() {
                    expect(userGroups.owner).toBeNull();
                });
            });

            describe('Getter/setter methods', function () {
                it('should generate getGroups', function () {
                    expect(typeof User.prototype.groups).toBe('function');
                });

                it('should generate getUsers', function () {
                    expect(typeof Group.prototype.users).toBe('function');
                });
            });
        });

        //-------------------------------------------------------------------------

        describe("Side-specified Association", function() {
            var User, Group, userGroups, users, groups;

            beforeEach(function () {
                User = User2;
                Group = Group2;

                groups = User.associations.group2s;
                users = Group.associations.user2s;
                userGroups = groups.association;
            });

            describe('users role', function() {
                it("should have a role name", function() {
                    expect(users.role).toBe('user2s');
                });

                it("should have an id field", function() {
                    expect(users.field).toBe('user2Id');
                });

                it("should have the proper inverse role", function() {
                    expect(users.inverse).toBe(groups);
                });

                it("should have the proper class", function() {
                    expect(users.cls).toBe(User);
                });

                it("should have a reference back to the association", function() {
                    expect(users.association.isManyToMany).toBe(true);
                    expect(groups.association).toBe(users.association);
                });     
            });

            describe('groups role', function() {
                it("should have a role name", function() {
                    expect(groups.role).toBe('group2s');
                });

                it("should have an id field", function() {
                    expect(groups.field).toBe('group2Id');
                });

                it("should have the proper inverse role", function() {
                    expect(groups.inverse).toBe(users);
                });

                it("should have the proper class", function() {
                    expect(groups.cls).toBe(Group);
                });
            });
            
            describe('Common properties', function () {
                it("should set the assoc name", function() {
                    expect(userGroups.name).toBe('User2Group2s');
                });

                it("should have a schema set", function() {
                    expect(userGroups.schema).toBe(schema);    
                });

                it("should have no reference field set", function() {
                    expect(userGroups.field).toBeNull();
                });  

                it("should set definedBy to the key holder", function() {
                    expect(userGroups.definedBy).toBe(User);    
                });

                it("should have the owner as null", function() {
                    expect(userGroups.owner).toBeNull();
                });
            });
        });

        //-------------------------------------------------------------------------

        describe("Simple Object-Form Association", function() {
            var User, Group, userGroups, users, groups;

            beforeEach(function () {
                User = User3;
                Group = Group3;

                groups = User.associations.group3s;
                users = Group.associations.user3s;
                userGroups = groups.association;
            });

            describe('users role', function() {
                it("should have a role name", function() {
                    expect(users.role).toBe('user3s');
                });

                it("should have an id field", function() {
                    expect(users.field).toBe('user3Id');
                });

                it("should have the proper inverse role", function() {
                    expect(users.inverse).toBe(groups);
                });

                it("should have the proper class", function() {
                    expect(users.cls).toBe(User);
                });

                it("should have a reference back to the association", function() {
                    expect(users.association.isManyToMany).toBe(true);
                    expect(groups.association).toBe(users.association);
                });     
            });

            describe('groups role', function() {
                it("should have a role name", function() {
                    expect(groups.role).toBe('group3s');
                });

                it("should have an id field", function() {
                    expect(groups.field).toBe('group3Id');
                });

                it("should have the proper inverse role", function() {
                    expect(groups.inverse).toBe(users);
                });

                it("should have the proper class", function() {
                    expect(groups.cls).toBe(Group);
                });
            });
            
            describe('Common properties', function () {
                it("should set the assoc name", function() {
                    expect(userGroups.name).toBe('User3Group3s');
                });

                it("should have a schema set", function() {
                    expect(userGroups.schema).toBe(schema);    
                });

                it("should have no reference field set", function() {
                    expect(userGroups.field).toBeNull();
                });  

                it("should set definedBy to the key holder", function() {
                    expect(userGroups.definedBy).toBe(User);    
                });

                it("should have the owner as null", function() {
                    expect(userGroups.owner).toBeNull();
                });
            });
        });

        //-------------------------------------------------------------------------

        describe("Full Object-Form Association", function() {
            var User, Group, userGroups, users, groups;

            beforeEach(function () {
                User = User4;
                Group = Group4;

                groups = User.associations.groups;
                users = Group.associations.users;
                userGroups = groups.association;
            });

            describe('users role', function() {
                it("should have a role name", function() {
                    expect(users.role).toBe('users');
                });

                it("should have an id field", function() {
                    expect(users.field).toBe('userId');
                });

                it("should have the proper inverse role", function() {
                    expect(users.inverse).toBe(groups);
                });

                it("should have the proper class", function() {
                    expect(users.cls).toBe(User);
                });

                it("should have a reference back to the association", function() {
                    expect(users.association.isManyToMany).toBe(true);
                    expect(groups.association).toBe(users.association);
                });     
            });

            describe('groups role', function() {
                it("should have a role name", function() {
                    expect(groups.role).toBe('groups');
                });

                it("should have an id field", function() {
                    expect(groups.field).toBe('groupId');
                });

                it("should have the proper inverse role", function() {
                    expect(groups.inverse).toBe(users);
                });

                it("should have the proper class", function() {
                    expect(groups.cls).toBe(Group);
                });
            });
            
            describe('Common properties', function () {
                it("should set the assoc name", function() {
                    expect(userGroups.name).toBe('User4Group4s');
                });

                it("should have a schema set", function() {
                    expect(userGroups.schema).toBe(schema);    
                });

                it("should have no reference field set", function() {
                    expect(userGroups.field).toBeNull();
                });  

                it("should set definedBy to the key holder", function() {
                    expect(userGroups.definedBy).toBe(User);    
                });

                it("should have the owner as null", function() {
                    expect(userGroups.owner).toBeNull();
                });
            });
        });

        //-------------------------------------------------------------------------

        describe("Named Full Object-Form Association", function() {
            var User, Group, userGroups, users, groups;

            beforeEach(function () {
                User = User5;
                Group = Group5;

                groups = User.associations.theGroups;
                users = Group.associations.theUsers;
                userGroups = groups.association;
            });

            describe('users role', function() {
                it("should have a role name", function() {
                    expect(users.role).toBe('theUsers');
                });

                it("should have an id field", function() {
                    expect(users.field).toBe('theUser_id');
                });

                it("should have the proper inverse role", function() {
                    expect(users.inverse).toBe(groups);
                });

                it("should have the proper class", function() {
                    expect(users.cls).toBe(User);
                });

                it("should have a reference back to the association", function() {
                    expect(users.association.isManyToMany).toBe(true);
                    expect(groups.association).toBe(users.association);
                });     
            });

            describe('groups role', function() {
                it("should have a role name", function() {
                    expect(groups.role).toBe('theGroups');
                });

                it("should have an id field", function() {
                    expect(groups.field).toBe('theGroup_id');
                });

                it("should have the proper inverse role", function() {
                    expect(groups.inverse).toBe(users);
                });

                it("should have the proper class", function() {
                    expect(groups.cls).toBe(Group);
                });
            });
            
            describe('Common properties', function () {
                it("should set the assoc name", function() {
                    expect(userGroups.name).toBe('foo');
                });

                it("should have a schema set", function() {
                    expect(userGroups.schema).toBe(schema);    
                });

                it("should have no reference field set", function() {
                    expect(userGroups.field).toBeNull();
                });  

                it("should set definedBy to the key holder", function() {
                    expect(userGroups.definedBy).toBe(User);    
                });

                it("should have the owner as null", function() {
                    expect(userGroups.owner).toBeNull();
                });
            });
        });

        //-------------------------------------------------------------------------

        describe("Nested Namespace Association", function() {
            var assoc, fooBarThings, fooGoos;

            /*
            FooBarThing = Ext.define('spec.many2many.foo.bar.Thing', {
                extend: 'spec.many2many.FooBase',
                manyToMany: 'foo.Goo'
            });

            FooGoo = Ext.define('spec.many2many.foo.Goo', {
                extend: 'spec.many2many.FooBase',
                manyToMany: 'foo.bar.Thing'
            });
            */

            beforeEach(function () {
                fooGoos = FooBarThing.associations.fooGoos;
                fooBarThings = FooGoo.associations.fooBarThings;
                assoc = fooGoos.association;
            });

            it("should have proper left name", function() {
                expect(fooBarThings.association.left.role).toBe('fooBarThings');
            });

            it("should have proper right name", function() {
                expect(fooBarThings.association.right.role).toBe('fooGoos');
            });

            it("should have proper left getter", function() {
                expect(typeof FooBarThing.prototype.fooGoos).toBe('function');
            });

            it("should have proper right getter", function() {
                expect(typeof FooGoo.prototype.fooBarThings).toBe('function');
            });
        });
    });

    describe("nested loading", function() {
        var User, Group;

        function makeAssociations(cfg) {
            Group = Ext.define('spec.Group', {
                extend: 'Ext.data.Model',
                fields: ['id', 'name'],
                manyToMany: cfg || 'User'
            });

            User = Ext.define('spec.User', {
                extend: 'Ext.data.Model',
                fields: ['id', 'name']
            });
        }

        beforeEach(function() {
            Ext.data.Model.schema.setNamespace('spec');
            MockAjaxManager.addMethods();
        });

        afterEach(function() {
            MockAjaxManager.removeMethods();
            Ext.undefine('spec.Group');
            Ext.undefine('spec.User');
            Ext.data.Model.schema.clear(true);
            User = Group = null;
        });

        function complete(data) {
            Ext.Ajax.mockComplete({
                status: 200,
                responseText: Ext.JSON.encode(data)
            });
        }

        describe("associationKey", function() {
            beforeEach(function() {
                makeAssociations({
                    GroupUsers: {
                        type: 'Group',
                        role: 'groups',
                        associationKey: 'groups.data',
                        right: {
                            type: 'User',
                            role: 'users',
                            associationKey: 'users.data'
                        }
                    }
                });
            });

            it("should use the associatioKey when loading the left", function() {
                var group = Group.load(1);
                complete({
                    id: 1,
                    users: {
                        data: [{
                            id: 101
                        }, {
                            id: 102
                        }]
                    }
                });
                var users = group.users();
                expect(users.getCount()).toBe(2);
                expect(users.getAt(0).getId()).toBe(101);
                expect(users.getAt(1).getId()).toBe(102);
            });

            it("should use the associatioKey when loading the right", function() {
                var user = User.load(1);
                complete({
                    id: 1,
                    groups: {
                        data: [{
                            id: 101
                        }, {
                            id: 102
                        }]
                    }
                });
                var groups = user.groups();
                expect(groups.getCount()).toBe(2);
                expect(groups.getAt(0).getId()).toBe(101);
                expect(groups.getAt(1).getId()).toBe(102);
            });
        });

        describe("without session", function() {
            beforeEach(function() {
                makeAssociations();
            });

            it("should load child records of the left", function() {
                var group = Group.load(1);
                complete({
                    id: 1,
                    users: [{
                        id: 101,
                        name: 'User1'
                    }, {
                        id: 102,
                        name: 'User2'
                    }, {
                        id: 103,
                        name: 'User3'
                    }]
                });
                var users = group.users();
                expect(users.getCount()).toBe(3);
                expect(users.getAt(0).getId()).toBe(101);
                expect(users.getAt(1).getId()).toBe(102);
                expect(users.getAt(2).getId()).toBe(103);
            });

            it("should load child records of the right", function() {
                var user = User.load(1);
                complete({
                    id: 1,
                    groups: [{
                        id: 101,
                        name: 'Group1'
                    }, {
                        id: 102,
                        name: 'Group2'
                    }, {
                        id: 103,
                        name: 'Group3'
                    }]
                });
                var groups = user.groups();
                expect(groups.getCount()).toBe(3);
                expect(groups.getAt(0).getId()).toBe(101);
                expect(groups.getAt(1).getId()).toBe(102);
                expect(groups.getAt(2).getId()).toBe(103);
            });
        });

        describe("with session", function() {
            var session;
            beforeEach(function() {
                makeAssociations();
                session = new Ext.data.Session();
            });

            afterEach(function() {
                session.destroy();
                session = null;
            });

            it("should load child records of the left", function() {
                var group = Group.load(1, {}, session);
                complete({
                    id: 1,
                    users: [{
                        id: 101,
                        name: 'User1'
                    }, {
                        id: 102,
                        name: 'User2'
                    }, {
                        id: 103,
                        name: 'User3'
                    }]
                });
                var users = group.users();
                expect(users.getCount()).toBe(3);
                expect(users.getAt(0).getId()).toBe(101);
                expect(users.getAt(1).getId()).toBe(102);
                expect(users.getAt(2).getId()).toBe(103);
            });

            it("should set up reflexive relationships for right records", function() {
                var group = Group.load(1, {}, session);
                complete({
                    id: 1,
                    users: [{
                        id: 101,
                        name: 'User1'
                    }, {
                        id: 102,
                        name: 'User2'
                    }, {
                        id: 103,
                        name: 'User3'
                    }]
                });

                var users = group.users(),
                    groups = users.getAt(0).groups();

                expect(groups.getCount()).toBe(1);
                expect(groups.getAt(0)).toBe(group);

                groups = users.getAt(1).groups();
                expect(groups.getCount()).toBe(1);
                expect(groups.getAt(0)).toBe(group);

                groups = users.getAt(2).groups();
                expect(groups.getCount()).toBe(1);
                expect(groups.getAt(0)).toBe(group);
            });

            it("should load child records of the right", function() {
                var user = User.load(1, {}, session);
                complete({
                    id: 1,
                    groups: [{
                        id: 101,
                        name: 'Group1'
                    }, {
                        id: 102,
                        name: 'Group2'
                    }, {
                        id: 103,
                        name: 'Group3'
                    }]
                });
                var groups = user.groups();
                expect(groups.getCount()).toBe(3);
                expect(groups.getAt(0).getId()).toBe(101);
                expect(groups.getAt(1).getId()).toBe(102);
                expect(groups.getAt(2).getId()).toBe(103);
            });

            it("should set up reflexive relationships for left records", function() {
                var user = User.load(1, {}, session);
                complete({
                    id: 1,
                    groups: [{
                        id: 101,
                        name: 'Group1'
                    }, {
                        id: 102,
                        name: 'Group2'
                    }, {
                        id: 103,
                        name: 'Group3'
                    }]
                });

                var groups = user.groups(),
                    users = groups.getAt(0).users();

                expect(users.getCount()).toBe(1);
                expect(users.getAt(0)).toBe(user);

                users = groups.getAt(1).users();
                expect(users.getCount()).toBe(1);
                expect(users.getAt(0)).toBe(user);

                users = groups.getAt(2).users();
                expect(users.getCount()).toBe(1);
                expect(users.getAt(0)).toBe(user);
            });
        });
    });

    describe("store membership", function() {
        var User, Group, session;

        beforeEach(function() {
            Ext.data.Model.schema.setNamespace('spec');
            Group = Ext.define('spec.Group', {
                extend: 'Ext.data.Model',
                fields: ['id', 'name'],
                manyToMany: 'User'
            });

            User = Ext.define('spec.User', {
                extend: 'Ext.data.Model',
                fields: ['id', 'name']
            });

            session = new Ext.data.Session();
        });

        afterEach(function() {
            Ext.undefine('spec.Group');
            Ext.undefine('spec.User');
            Ext.data.Model.schema.clear(true);
            session.destroy();
            session = User = Group = null;
        });

        describe("adding", function() {
            describe("with the inverse store not created", function() {
                it("should exist in the inverse store", function() {
                    var user = session.createRecord('User', 1),
                        group = session.createRecord('Group', 1),
                        users;

                    user.groups().add(group);
                    users = group.users();

                    expect(users.getCount()).toBe(1);
                    expect(users.getAt(0)).toBe(user);
                });
            });

            describe("with the inverse store created", function() {
                it("should exist in the inverse store", function() {
                    var user = session.createRecord('User', 1),
                        group = session.createRecord('Group', 1),
                        users = group.users();

                    user.groups().add(group);

                    expect(users.getCount()).toBe(1);
                    expect(users.getAt(0)).toBe(user);
                });
            });
        });

        describe("removing", function() {
            describe("with the inverse store not created", function() {
                it("should not exist in the inverse store", function() {
                    var user = session.createRecord('User', 1),
                        group = session.createRecord('Group', 1),
                        groups = user.groups(),
                        users;

                    groups.add(group);
                    groups.remove(group);
                    users = group.users();

                    expect(users.getCount()).toBe(0);
                });
            });

            describe("with the inverse store created", function() {
                it("should not exist in the inverse store", function() {
                    var user = session.createRecord('User', 1),
                        group = session.createRecord('Group', 1),
                        groups = user.groups(),
                        users = group.users();

                    groups.add(group);
                    groups.remove(group);

                    expect(users.getCount()).toBe(0);
                });
            });
        });
    });
    
});
