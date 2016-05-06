describe("Ext.data.schema.ManyToOne", function() {
    
    var schema, Post, Thread, threadRole, postRole,
        threadCalled =false, 
        postCalled = false;

    function definePost(refCfg) {
        Post = Ext.define('spec.Post', {
            extend: 'Ext.data.Model',
            fields: ['id', 'content', {
                name: 'threadId',
                reference: Ext.apply({
                    type: 'Thread'
                }, refCfg)
            }],

            constructor: function() {
                postCalled = true;
                this.callParent(arguments);
            }
        });
        
        threadRole = Post.associations.thread;
        postRole = Thread.associations.posts;
    }

    function complete(data, status) {
        Ext.Ajax.mockComplete({
            status: status || 200,
            responseText: Ext.JSON.encode(data)
        });
    }
    
    beforeEach(function() {
        threadCalled = postCalled = false;
        MockAjaxManager.addMethods();
        schema = Ext.data.Model.schema;
        schema.setNamespace('spec');
        
        Thread = Ext.define('spec.Thread', {
            extend: 'Ext.data.Model',
            fields: ['id', 'title'],

            constructor: function() {
                threadCalled = true;
                this.callParent(arguments);
            }
        });
    });
    
    afterEach(function() {
        MockAjaxManager.removeMethods();
        Ext.undefine('spec.Post');
        Ext.undefine('spec.Thread');
        
        schema.clear(true);
        Post = postRole = Thread = threadRole = schema = null;   
        threadCalled = postCalled = false;
    });
    
    describe("Model.associations", function() {
        it("should have an association role on each model", function() {
            definePost();
            expect(Post.associations.thread).toBeDefined();
            expect(Thread.associations.posts).toBeDefined();
        });
        
        it("should have a reference back to the association for each role", function() {
            definePost();
            expect(Post.associations.thread.association).toBe(Thread.associations.posts.association);
            expect(Thread.associations.posts.association.isManyToOne).toBe(true);
        });     
    });
    
    describe("association default config", function() {
        var assoc;

        beforeEach(function() {
            definePost();
            assoc = threadRole.association;
        });
        
        it("should have a schema set", function() {
            expect(assoc.schema).toBe(schema);    
        });
        
        it("should have the reference field set", function() {
            expect(assoc.field).toBe(Post.getField('threadId'));
        });  
        
        it("should have the left part be set to the key holder", function() {
            expect(assoc.left).toBe(postRole);
        });
        
        it("should set definedBy to the key holder", function() {
            expect(assoc.definedBy).toBe(Post);    
        });
        
        it("should have the right part be set to the non key holder", function() {
            expect(assoc.right).toBe(threadRole);
        });
        
        it("should have the owner as null", function() {
            expect(assoc.owner).toBeNull();
        });
        
        it("should set the assoc name to {PluralKeyHolder}By{SingluarOther}", function() {
            expect(assoc.name).toBe('ThreadPosts');
        });
    });
    
    describe("left", function() {
        beforeEach(function() {
            definePost();
        });
        
        it("should set the role to be plural lowercase & the type to be the entity name", function() {
            expect(postRole.role).toBe('posts');
            expect(postRole.type).toBe('Post');
        });
        
        it("should set the inverse role to the right", function() {
            expect(postRole.inverse).toBe(threadRole);    
        });    
        
        it("should set the entity", function() {
            expect(postRole.cls).toBe(Post);    
        });
    });
    
    describe("right", function() {
        beforeEach(function() {
            definePost();
        });
        
        it("should set the role to be singular lowercase & the type to be the entity name", function() {
            expect(threadRole.role).toBe('thread');
            expect(threadRole.type).toBe('Thread');
        });
        
        it("should set the inverse role to the left", function() {
            expect(threadRole.inverse).toBe(postRole);    
        });    
        
        it("should set the entity", function() {
            expect(threadRole.cls).toBe(Thread);    
        });
    });
    
    describe("configuring", function() {
        it("should set an association name", function() {
            definePost({
                association: 'CustomName'
            });    
            expect(postRole.association.name).toBe('CustomName');
        });
        
        it("should set the owner based on the child param", function() {
            definePost({
                child: true
            });
            expect(postRole.association.owner).toBe(postRole);
            expect(postRole.owner).toBe(true);
            expect(threadRole.owner).toBe(false);
        });
        
        it("should set the owner based on the parent param", function() {
            definePost({
                parent: true
            });
            expect(postRole.association.owner).toBe(threadRole);
            expect(threadRole.owner).toBe(true);
            expect(postRole.owner).toBe(false);
        });
        
        it("should be able to set a custom role", function() {
            definePost({
                role: 'foo'
            });
            threadRole = Post.associations.foo;
            expect(threadRole.association.name).toBe('ThreadFooPosts');
            expect(threadRole.role).toBe('foo');
        });
        
        describe("inverse", function() {
            it("should set with a string", function() {
                definePost({
                    inverse: 'foo'
                });
                postRole = Thread.associations.foo;
                expect(postRole.association.name).toBe('ThreadFoo');
                expect(postRole.role).toBe('foo');
            });
            
            it("should set with an object", function() {
                definePost({
                    inverse: {
                        role: 'foo'
                    }
                });
                postRole = Thread.associations.foo;
                expect(postRole.association.name).toBe('ThreadFoo');
                expect(postRole.role).toBe('foo');
            });
        });
    });
    
    describe("model decoration", function() {
        it("should generate a getter on the key holder", function() {
            definePost();
            expect(typeof Post.prototype.getThread).toBe('function');
        });
        
        it("should generate a setter on the key holder", function() {
            definePost();
            expect(typeof Post.prototype.setThread).toBe('function');
        });
        
        it("should define a getter on the inverse", function() {
            definePost();
            expect(typeof Thread.prototype.posts).toBe('function');
        });
        
        it("should allow a custom getter name on the key holder", function() {
            definePost({
                inverse: {
                    getterName: 'getFoo'
                }
            });
            expect(typeof Thread.prototype.getFoo).toBe('function');
        });
        
        it("should allow a custom setter name on the key holder", function() {
            definePost({
                setterName: 'setFoo'
            });
            expect(typeof Post.prototype.setFoo).toBe('function');
        });
        
        it("should allow a custom getter name on the inverse", function() {
            definePost({
                getterName: 'ghosts'
            });
            expect(typeof Post.prototype.ghosts).toBe('function');
        });

        it("should decorate the model based on the role", function() {
            var OtherPost = Ext.define('spec.OtherPost', {
                extend: 'Ext.data.Model',
                fields: ['id', 'name', {
                    name: 'threadAId',
                    reference: {
                        type: 'Thread',
                        role: 'ThreadA'
                    }
                }, {
                    name: 'threadBId',
                    reference: {
                        type: 'Thread',
                        role: 'ThreadB'
                    }
                }]
            });

            expect(typeof OtherPost.prototype.getThreadA).toBe('function');
            expect(typeof OtherPost.prototype.getThreadB).toBe('function');

            Ext.undefine('spec.OtherPost');
        });
    });

    describe("subclassing", function() {
        // Post
        describe("the left", function() {
            var SubPost;

            beforeEach(function() {
                definePost();
                SubPost = Ext.define('spec.SubPost', {
                    extend: 'spec.Post'
                });
            });

            afterEach(function() {
                Ext.undefine('spec.SubPost');
                SubPost = null;
            });

            it("should still have the original association", function() {
                var inverse = Post.associations.thread.inverse;
                expect(inverse.role).toBe('posts');
                expect(inverse.cls).toBe(Post);
            });

            it("should inherit the association from the parent and modify the relevant classes", function() {
                var inverse = SubPost.associations.thread.inverse;
                expect(inverse.role).toBe('subPosts');
                expect(inverse.cls).toBe(SubPost);
            });
        });

        // Thread
        describe("the right", function() {
            var SubThread;

            beforeEach(function() {
                definePost();
                SubThread = Ext.define('spec.SubThread', {
                    extend: 'spec.Thread'
                })
            });

            it("should not have any associations", function() {
                expect(SubThread.associations).toEqual({});
            });
        });
    });

    describe("nested loading", function() {
        it("should infer the key when using remoteFilter: false", function() {
            definePost({
                inverse: {
                    storeConfig: {
                        remoteFilter: false
                    }
                }
            });
            var thread = Thread.load(1);
            complete({
                id: 1,
                posts: [{
                    id: 101
                }, {
                    id: 102
                }]
            });
            var posts = thread.posts();
            expect(posts.getAt(0).get('threadId')).toBe(1);
            expect(posts.getAt(0).dirty).toBe(false);
            expect(posts.getAt(1).get('threadId')).toBe(1);
            expect(posts.getAt(1).dirty).toBe(false);
            expect(posts.getRemoteFilter()).toBe(false);
        });

        it("should delete the many from the data collection", function() {
            definePost();
            var thread = Thread.load(1);
            complete({
                id: 1,
                posts: [{
                    id: 101
                }, {
                    id: 102
                }]
            });
            expect(thread.get('posts')).toBeUndefined();
            expect(thread.posts().getCount()).toBe(2);
        });

        it("should delete the one from the data collection", function() {
            definePost();
            var post = Post.load(101);
            complete({
                id: 101,
                thread: {
                    id: 1
                }
            });
            expect(post.get('thread')).toBeUndefined();
            expect(post.getThread().getId()).toBe(1);
        });

        it("should not pollute the reader when reading nested data of the same type", function() {
            function getData() {
                return {
                    records: [{
                        id: 1,
                        parentId: null,
                        children: [{
                            id: 101,
                            parentId: 1
                        }, {
                            id: 102,
                            parentId: 1
                        }]
                    }]
                };
            }
            Ext.define('spec.Node', {
                extend: 'Ext.data.Model',
                fields: [{
                    name: 'parentId',
                    reference: {
                        type: 'Node',
                        inverse: 'children'
                    }
                }],
                proxy: {
                    type: 'ajax',
                    reader: {
                        type: 'json',
                        rootProperty: 'records'
                    }
                }
            });

            var store = new Ext.data.Store({
                model: 'Node'
            });
            store.load();
            complete(getData());
            expect(store.first().children().getCount()).toBe(2);
            store.load();
            complete(getData());
            expect(store.first().children().getCount()).toBe(2);
            store.destroy();
            Ext.undefine('spec.Node');
        });

        describe("key inference", function() {
            describe("without session", function() {
                it("should infer the key from the parent", function() {
                    definePost();
                    var thread = Thread.load(1);
                    complete({
                        id: 1,
                        posts: [{
                            id: 101
                        }, {
                            id: 102
                        }]
                    });
                    var posts = thread.posts();
                    expect(posts.getCount()).toBe(2);
                    expect(posts.getAt(0).getId()).toBe(101);
                    expect(posts.getAt(0).get('threadId')).toBe(1);
                    expect(posts.getAt(0).dirty).toBe(false);
                    expect(posts.getAt(1).getId()).toBe(102);
                    expect(posts.getAt(1).get('threadId')).toBe(1);
                    expect(posts.getAt(1).dirty).toBe(false);
                });
            });

            describe("with session", function() {
                var session;

                beforeEach(function() {
                    definePost();
                    session = new Ext.data.Session();
                });

                afterEach(function() {
                    session.destroy();
                    session = null;
                });

                it("should favour an existing reference", function() {
                    var post = session.createRecord('Post', {
                        id: 101,
                        threadId: 3
                    });

                    var thread = Thread.load(1, null, session);
                    complete({
                        id: 1,
                        posts: [{
                            id: 101
                        }, {
                            id: 102
                        }]
                    });
                    var posts = thread.posts();
                    expect(posts.getCount()).toBe(1);
                    expect(posts.getAt(0).getId()).toBe(102);
                    expect(posts.getAt(0).get('threadId')).toBe(1);
                    expect(posts.getAt(0).dirty).toBe(false);
                    expect(posts.indexOf(post)).toBe(-1);
                });

                it("should infer the key from the parent if not specified", function() {
                    var thread = Thread.load(1, null, session);
                    complete({
                        id: 1,
                        posts: [{
                            id: 101
                        }, {
                            id: 102
                        }]
                    });
                    var posts = thread.posts();
                    expect(posts.getCount()).toBe(2);
                    expect(posts.getAt(0).getId()).toBe(101);
                    expect(posts.getAt(0).get('threadId')).toBe(1);
                    expect(posts.getAt(0).dirty).toBe(false);
                    expect(posts.getAt(1).getId()).toBe(102);
                    expect(posts.getAt(1).get('threadId')).toBe(1);
                    expect(posts.getAt(1).dirty).toBe(false);
                });

                it("should not infer the key from the parent if a key is specified", function() {
                    var thread = Thread.load(1, null, session);
                    complete({
                        id: 1,
                        posts: [{
                            id: 101,
                            threadId: 100
                        }, {
                            id: 102
                        }]
                    });
                    var posts = thread.posts();
                    expect(posts.getCount()).toBe(1);
                    expect(posts.getAt(0).getId()).toBe(102);
                    expect(posts.getAt(0).get('threadId')).toBe(1);
                    expect(posts.getAt(0).dirty).toBe(false);

                    var rec = session.peekRecord('Post', 101);
                    expect(posts.indexOf(rec)).toBe(-1);
                });
            });
        });
    });
    
    describe("getters/setters", function() {
        function createSuite(withSession) {
            describe(withSession ? "with session" : "without session", function() {
                var spy, session, post, thread;

                beforeEach(function() {
                    spy = jasmine.createSpy();
                    if (withSession) {
                        session = new Ext.data.Session();
                    }
                });
                
                afterEach(function() {
                    if (withSession) {
                        session.destroy();
                    }
                    session = post = thread = null;
                });

                describe("the one", function() {
                    beforeEach(function() {
                        definePost();
                    });

                    describe("getter", function() {
                        beforeEach(function() {
                            post = new Post({
                                id: 4
                            }, session);
                            
                        });
                        describe("without an instance", function() {
                            describe("with no foreign key value", function() {
                                it("should return null", function() {
                                    expect(post.getThread()).toBeNull();
                                });

                                it("should not make any request", function() {
                                    spy = spyOn(Thread.getProxy(), 'read');
                                    post.getThread();
                                    expect(spy).not.toHaveBeenCalled();
                                });

                                describe("callbacks", function() {
                                    it("should call the callbacks before the function returns", function() {
                                        post.getThread(spy);
                                        expect(spy).toHaveBeenCalled();
                                        spy.reset();
                                        post.getThread({
                                            success: spy
                                        });
                                        expect(spy).toHaveBeenCalled();
                                        spy.reset();
                                        post.getThread({
                                            callback: spy
                                        });
                                        expect(spy).toHaveBeenCalled();
                                    });

                                    it("should accept a function as the callback and default the scope to the model", function() {
                                        post.getThread(spy);
                                        var call = spy.mostRecentCall;
                                        expect(call.args[0]).toBe(thread);
                                        expect(call.args[1]).toBeNull();
                                        expect(call.args[2]).toBe(true);
                                        expect(call.object).toBe(post);
                                    });
                                    
                                    it("should accept a function with a scope", function() {
                                        var o = {};
                                        post.getThread(spy, o);
                                        expect(spy.mostRecentCall.object).toBe(o);   
                                    });
                                    
                                    it("should accept an options object with success and default the scope to the model", function() {
                                        post.getThread({
                                            success: spy
                                        });  
                                        var call = spy.mostRecentCall; 
                                        expect(call.args[0]).toBe(thread);
                                        expect(call.args[1]).toBeNull();
                                        expect(call.object).toBe(post);  
                                    });

                                    it("should accept an options object with success and a scope", function() {
                                        var o = {},
                                            call;

                                        post.getThread({
                                            scope: o,
                                            success: spy
                                        });  
                                        call = spy.mostRecentCall; 
                                        expect(call.object).toBe(o);  
                                    });

                                    it("should accept an options object with callback and default the scope to the model", function() {
                                        post.getThread({
                                            callback: spy
                                        });  
                                        var call = spy.mostRecentCall; 
                                        expect(call.args[0]).toBe(thread);
                                        expect(call.args[1]).toBeNull();
                                        expect(call.args[2]).toBe(true);
                                        expect(call.object).toBe(post); 
                                    });
                                    
                                    it("should accept an options object with callback and a scope", function() {
                                        var o = {},
                                            call;

                                        post.getThread({
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
                                    post.set('threadId', 17);
                                });

                                if (withSession) {
                                    it("should create an instance in the session", function() {
                                        expect(post.getThread()).toBe(session.getRecord('Thread', 17, false));
                                    });

                                    it("should use an existing record instance", function() {
                                        thread = session.getRecord('Thread', 17, false);
                                        expect(post.getThread()).toBe(thread);
                                    });

                                    it("should not load an existing instance", function() {
                                        thread = session.getRecord('Thread', {
                                            id: 17
                                        }, false);
                                        post.getThread();
                                        expect(thread.isLoading()).toBe(false);
                                    });
                                }

                                it("should return an instance with the matching id", function() {
                                    expect(post.getThread().getId()).toBe(17);
                                });

                                it("should be in a loading state", function() {
                                    expect(post.getThread().isLoading()).toBe(true);
                                });

                                it("should trigger a load for the record", function() {
                                    spy = spyOn(Thread.getProxy(), 'read');
                                    post.getThread();
                                    expect(spy.mostRecentCall.args[0].getId()).toBe(17);
                                });

                                describe("calling while during a load", function() {
                                    it("should return the same record", function() {
                                        var rec = post.getThread();
                                        expect(post.getThread()).toBe(rec);
                                    });

                                    it("should not trigger a second load", function() {
                                        post.getThread();
                                        spy = spyOn(Thread.getProxy(), 'read');
                                        post.getThread();
                                        expect(spy).not.toHaveBeenCalled();
                                    });

                                    it("should not trigger any callback until load completes", function() {
                                        post.getThread();
                                        post.getThread({
                                            success: spy,
                                            callback: spy
                                        });
                                        expect(spy).not.toHaveBeenCalled();
                                    });

                                    it("should trigger the callbacks once loaded", function() {
                                        post.getThread();
                                        post.getThread({
                                            success: spy,
                                            callback: spy
                                        });
                                        complete({});
                                        expect(spy.callCount).toBe(2);
                                    });
                                });

                                describe("callbacks", function() {
                                    it("should not trigger any callbacks until the load completes", function() {
                                        post.getThread(spy);
                                        post.getThread({
                                            success: spy
                                        });
                                        post.getThread({
                                            failure: spy
                                        });
                                        post.getThread({
                                            callback: spy
                                        });
                                        expect(spy).not.toHaveBeenCalled();

                                    });

                                    describe("when successful", function() {
                                        it("should accept a function as the callback and default the scope to the model", function() {
                                            thread = post.getThread(spy);
                                            complete({});
                                            var call = spy.mostRecentCall;
                                            expect(call.args[0]).toBe(thread);
                                            expect(call.args[1].isOperation).toBe(true);
                                            expect(call.args[2]).toBe(true);
                                            expect(call.object).toBe(post);
                                        });
                                    
                                        it("should accept a function with a scope", function() {
                                            var o = {};
                                            post.getThread(spy, o);
                                            complete({});
                                            expect(spy.mostRecentCall.object).toBe(o);   
                                        });
                                    
                                        it("should accept an options object with success and default the scope to the model", function() {
                                            thread = post.getThread({
                                                success: spy
                                            });  
                                            complete({});
                                            var call = spy.mostRecentCall; 
                                            expect(call.args[0]).toBe(thread);
                                            expect(call.args[1].isOperation).toBe(true);
                                            expect(call.object).toBe(post);  
                                        });

                                        it("should accept an options object with success and a scope", function() {
                                            var o = {},
                                                call;

                                            post.getThread({
                                                scope: o,
                                                success: spy
                                            });  
                                            complete({});
                                            call = spy.mostRecentCall; 
                                            expect(call.object).toBe(o);  
                                        });

                                        it("should accept an options object with callback and default the scope to the model", function() {
                                            thread = post.getThread({
                                                callback: spy
                                            });  
                                            complete({});
                                            var call = spy.mostRecentCall; 
                                            expect(call.args[0]).toBe(thread);
                                            expect(call.args[1].isOperation).toBe(true);
                                            expect(call.args[2]).toBe(true);
                                            expect(call.object).toBe(post); 
                                        });
                                    
                                        it("should accept an options object with callback and a scope", function() {
                                            var o = {},
                                                call;

                                            post.getThread({
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
                                            thread = post.getThread(spy);
                                            complete(null, 500);
                                            var call = spy.mostRecentCall;
                                            expect(call.args[0]).toBe(thread);
                                            expect(call.args[1].isOperation).toBe(true);
                                            expect(call.args[2]).toBe(false);
                                            expect(call.object).toBe(post);
                                        });
                                    
                                        it("should accept a function with a scope", function() {
                                            var o = {};
                                            post.getThread(spy, o);
                                            complete(null, 500);
                                            expect(spy.mostRecentCall.object).toBe(o);   
                                        });
                                    
                                        it("should accept an options object with failure and default the scope to the model", function() {
                                            thread = post.getThread({
                                                failure: spy
                                            });  
                                            complete(null, 500);
                                            var call = spy.mostRecentCall; 
                                            expect(call.args[0]).toBe(thread);
                                            expect(call.args[1].isOperation).toBe(true);
                                            expect(call.object).toBe(post);  
                                        });

                                        it("should accept an options object with failure and a scope", function() {
                                            var o = {},
                                                call;

                                            post.getThread({
                                                scope: o,
                                                failure: spy
                                            });  
                                            complete(null, 500);
                                            call = spy.mostRecentCall; 
                                            expect(call.object).toBe(o);  
                                        });

                                        it("should accept an options object with callback and default the scope to the model", function() {
                                            thread = post.getThread({
                                                callback: spy
                                            });  
                                            complete(null, 500);
                                            var call = spy.mostRecentCall; 
                                            expect(call.args[0]).toBe(thread);
                                            expect(call.args[1].isOperation).toBe(true);
                                            expect(call.args[2]).toBe(false);
                                            expect(call.object).toBe(post); 
                                        });
                                    
                                        it("should accept an options object with callback and a scope", function() {
                                            var o = {},
                                                call;

                                            post.getThread({
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
                                thread = new Thread({
                                    id: 2
                                }, session);
                                
                                
                                post.setThread(thread);
                            });

                            it("should return the same instance", function() {
                                expect(post.getThread()).toBe(thread);
                            });

                            it("should not attempt to load", function() {
                                spy = spyOn(Thread.getProxy(), 'read');
                                post.getThread();
                                expect(spy).not.toHaveBeenCalled();
                            });

                            it("should attempt to reload if called with options.reload", function() {
                                spy = spyOn(Thread.getProxy(), 'read').andReturn();
                                post.getThread({
                                    reload: true
                                });
                                expect(spy).toHaveBeenCalled();
                            });

                            it("should reload the same record when called with reload", function() {
                                var result = post.getThread({
                                    reload: true
                                });
                                expect(result).toBe(thread);
                            });

                            describe("callbacks", function() {
                                it("should call the callbacks before the function returns", function() {
                                    post.getThread(spy);
                                    expect(spy).toHaveBeenCalled();
                                    spy.reset();
                                    post.getThread({
                                        success: spy
                                    });
                                    expect(spy).toHaveBeenCalled();
                                    spy.reset();
                                    post.getThread({
                                        callback: spy
                                    });
                                    expect(spy).toHaveBeenCalled();
                                });

                                it("should accept a function as the callback and default the scope to the model", function() {
                                    post.getThread(spy);
                                    var call = spy.mostRecentCall;
                                    expect(call.args[0]).toBe(thread);
                                    expect(call.args[1]).toBeNull();
                                    expect(call.args[2]).toBe(true);
                                    expect(call.object).toBe(post);
                                });
                                
                                it("should accept a function with a scope", function() {
                                    var o = {};
                                    post.getThread(spy, o);
                                    expect(spy.mostRecentCall.object).toBe(o);   
                                });
                                
                                it("should accept an options object with success and default the scope to the model", function() {
                                    post.getThread({
                                        success: spy
                                    });  
                                    var call = spy.mostRecentCall; 
                                    expect(call.args[0]).toBe(thread);
                                    expect(call.args[1]).toBeNull();
                                    expect(call.object).toBe(post);  
                                });

                                it("should accept an options object with success and a scope", function() {
                                    var o = {},
                                        call;

                                    post.getThread({
                                        scope: o,
                                        success: spy
                                    });  
                                    call = spy.mostRecentCall; 
                                    expect(call.object).toBe(o);  
                                });

                                it("should accept an options object with callback and default the scope to the model", function() {
                                    post.getThread({
                                        callback: spy
                                    });  
                                    var call = spy.mostRecentCall; 
                                    expect(call.args[0]).toBe(thread);
                                    expect(call.args[1]).toBeNull();
                                    expect(call.args[2]).toBe(true);
                                    expect(call.object).toBe(post); 
                                });
                                
                                it("should accept an options object with callback and a scope", function() {
                                    var o = {},
                                        call;

                                    post.getThread({
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
                            post = new Post({
                                id: 7
                            }, session);
                        });

                        describe("instance", function() {
                            var thread;

                            beforeEach(function() {
                                thread = new Thread({
                                    id: 3
                                }, session);
                            });

                            describe("with nothing existing", function() {
                                beforeEach(function() {
                                    post.setThread(thread);
                                });

                                it("should have the same record reference", function() {
                                    expect(post.getThread()).toBe(thread);
                                });
                            
                                it("should set the underlying key value", function() {
                                    expect(post.get('threadId')).toBe(3);  
                                });

                                it("should clear the instance and foreign key when setting to null", function() {
                                    post.setThread(null);
                                    expect(post.getThread()).toBeNull();
                                    expect(post.get('threadId')).toBeNull();
                                });
                            });

                            describe("with an existing key, but no instance", function() {
                                beforeEach(function() {
                                    post.setThread(1000);
                                    post.setThread(thread);
                                });

                                it("should have the new record reference", function() {
                                    expect(post.getThread()).toBe(thread);
                                });

                                it("should set the underlying key value", function() {
                                    expect(post.get('threadId')).toBe(3);  
                                });

                                it("should clear the instance and foreign key when setting to null", function() {
                                    post.setThread(null);
                                    expect(post.getThread()).toBeNull();
                                    expect(post.get('threadId')).toBeNull();
                                });
                            });

                            describe("with an existing instance", function() {
                                beforeEach(function() {
                                    post.setThread(new Thread({
                                        id: 1000
                                    }, session));
                                    post.setThread(thread);
                                });

                                it("should have the new record reference", function() {
                                    expect(post.getThread()).toBe(thread);
                                });

                                it("should set the underlying key value", function() {
                                    expect(post.get('threadId')).toBe(3);  
                                });

                                it("should clear the instance and foreign key when setting to null", function() {
                                    post.setThread(null);
                                    expect(post.getThread()).toBeNull();
                                    expect(post.get('threadId')).toBeNull();
                                });
                            });
                        });
                        
                        describe("value", function() {
                            describe("with nothing existing", function() {
                                it("should set the underlying key", function() {
                                    post.setThread(16);
                                    expect(post.get('threadId')).toBe(16);    
                                });

                                it("should return a new record object that loads", function() {
                                    post.setThread(16);
                                    spy = spyOn(Thread.getProxy(), 'read');
                                    // Reference doesn't exist, so need to grab it again here
                                    expect(post.getThread().getId()).toBe(16);
                                    expect(spy.mostRecentCall.args[0].getId()).toBe(16);
                                });

                                it("should do nothing if the key is null", function() {
                                    post.setThread(null);
                                    expect(post.getThread()).toBeNull();
                                });
                            });

                            describe("with an existing key, but no instance", function() {
                                beforeEach(function() {
                                    post.setThread(1000);
                                });

                                it("should set the underlying key", function() {
                                    post.setThread(16);
                                    expect(post.get('threadId')).toBe(16);    
                                });

                                it("should return a new record object that loads", function() {
                                    post.setThread(16);
                                    spy = spyOn(Thread.getProxy(), 'read');
                                    // Reference doesn't exist, so need to grab it again here
                                    expect(post.getThread().getId()).toBe(16);
                                    expect(spy.mostRecentCall.args[0].getId()).toBe(16);
                                });

                                it("should clear the key", function() {
                                    post.setThread(null);
                                    expect(post.get('threadId')).toBeNull();
                                    expect(post.getThread()).toBeNull();
                                });
                            });

                            describe("with an existing instance", function() {
                                beforeEach(function() {
                                    post.setThread(new Thread({
                                        id: 1000
                                    }, session));
                                });

                                it("should set the underlying key", function() {
                                    post.setThread(16);
                                    expect(post.get('threadId')).toBe(16);    
                                });

                                it("should return a new record object that loads", function() {
                                    post.setThread(16);
                                    spy = spyOn(Thread.getProxy(), 'read');
                                    // Reference doesn't exist, so need to grab it again here
                                    expect(post.getThread().getId()).toBe(16);
                                    expect(spy.mostRecentCall.args[0].getId()).toBe(16);
                                });

                                it("should clear the key", function() {
                                    post.setThread(null);
                                    expect(post.get('threadId')).toBeNull();
                                    expect(post.getThread()).toBeNull();
                                });
                            });
                        });

                        describe("timing", function() {
                            var thread, joiner, fn;

                            beforeEach(function() {
                                joiner = {
                                    afterEdit: function() {
                                        fn();
                                    }
                                };
                                thread = new Thread({
                                    id: 101
                                }, session);
                            });

                            afterEach(function() {
                                fn = joiner = null;
                            });

                            it("should have the record instances set in afterEdit", function() {
                                var val;
                                fn = function() {
                                    val = post.getThread();
                                };
                                post.join(joiner);
                                post.setThread(thread);
                                expect(val).toBe(thread);
                            });

                            it("should have the value cleared in afterEdit", function() {
                                var val;
                                post.setThread(thread);

                                fn = function() {
                                    val = post.getThread();
                                };
                                post.join(joiner);
                                post.setThread(null);
                                expect(val).toBeNull();
                            });
                        });
                        
                        describe("callbacks", function() {
                            it("should accept a function as the second arg, scope should default to the model", function() {
                                post.setThread(16, spy);
                                complete({});
                                var call = spy.mostRecentCall;
                                expect(call.args[0]).toBe(post);
                                expect(call.object).toBe(post);
                            });    
                            
                            it("should accept a function with a scope", function() {
                                var o = {};
                                thread = post.setThread(16, spy, o);
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
                                        post.setThread(16, {
                                            success: successSpy,
                                            callback: callbackSpy,
                                            failure: failureSpy
                                        });
                                        complete({});
                                        expect(failureSpy).not.toHaveBeenCalled();
                                        expect(successSpy).toHaveBeenCalled();
                                        expect(callbackSpy).toHaveBeenCalled();
                                        expect(successSpy.mostRecentCall.object).toBe(post);
                                        expect(callbackSpy.mostRecentCall.object).toBe(post);
                                    });

                                    it("should use a passed scope", function() {
                                        var scope = {};
                                        post.setThread(16, {
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
                                        post.setThread(16, {
                                            success: successSpy,
                                            callback: callbackSpy,
                                            failure: failureSpy
                                        });
                                        complete(null, 500);
                                        expect(successSpy).not.toHaveBeenCalled();
                                        expect(failureSpy).toHaveBeenCalled();
                                        expect(callbackSpy).toHaveBeenCalled();
                                        expect(failureSpy.mostRecentCall.object).toBe(post);
                                        expect(callbackSpy.mostRecentCall.object).toBe(post);
                                    });

                                    it("should use a passed scope", function() {
                                        var scope = {};
                                        post.setThread(16, {
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
                        var thread, posts;

                        beforeEach(function() {
                            thread = new Thread({
                                id: 1
                            }, session);
                            posts = thread.posts();
                        });

                        function makePost(id, threadId) {
                            post = new Post({
                                id: id,
                                threadId: threadId || 1
                            }, session);
                        }

                        afterEach(function() {
                            posts = thread = null;
                        });

                        it("should remove from the store when changing the key to null", function() {
                            makePost(101);
                            posts.add(post);
                            post.set('threadId', null);
                            expect(posts.getCount()).toBe(0);
                        });

                        it("should remove from the store when changing the key to some other value", function() {
                            makePost(101);
                            posts.add(post);
                            post.set('threadId', 4);
                            expect(posts.getCount()).toBe(0);
                        });

                        it("should null out the one when there is no key", function() {
                            makePost(101);
                            post.setThread(thread);
                            post.set('threadId', null);
                            expect(post.thread).toBeFalsy();
                            expect(post.getThread()).toBeNull();
                        });

                        it("should not remove the record from unrelated stores", function() {
                            makePost(101);
                            spyOn(Ext.log, 'warn');
                            var someStore = new Ext.data.Store();
                            someStore.add(post);
                            posts.add(post);
                            post.set('threadId', null);
                            expect(posts.getCount()).toBe(0);
                            expect(someStore.first()).toBe(post);
                            someStore.destroy();
                        });

                        if (withSession) {
                            it("should add to an existing store if a matching key is found", function() {
                                var otherThread = new Thread({
                                    id: 2
                                }, session);
                                var otherPosts = otherThread.posts();

                                makePost(101);
                                posts.add(post);
                                post.set('threadId', 2);
                                expect(posts.getCount()).toBe(0);
                                expect(otherPosts.first()).toBe(post);
                            });

                            it("should set the many record if it exists in the session", function() {
                                var otherThread = new Thread({
                                    id: 2
                                }, session);

                                makePost(101);
                                expect(post.getThread()).toBe(thread);
                                post.set('threadId', 2);
                                var threadName = Post.associations.thread.getInstanceName();
                                expect(post[threadName]).toBe(otherThread);
                                expect(post.getThread()).toBe(otherThread);
                            });

                            it("should not create the record if the existing key does not exist", function() {
                                makePost(101);
                                posts.add(post);
                                post.set('threadId', 2);
                                expect(session.peekRecord('Thread', 2)).toBeNull();
                            });

                            it("should not create the store on an existing record", function() {
                                var otherThread = new Thread({
                                    id: 2
                                }, session);
                                var name = otherThread.associations.posts.getStoreName();

                                makePost(101);
                                posts.add(post);
                                post.set('threadId', 2);
                                expect(otherThread[name]).toBeUndefined();
                            });

                            it("should not add if an existing store is loading", function() {
                                var otherThread = new Thread({
                                    id: 2
                                }, session);
                                var otherPosts = otherThread.posts();
                                otherPosts.load();

                                makePost(101);
                                posts.add(post);
                                post.set('threadId', 2);
                                expect(posts.getCount()).toBe(0);
                                expect(otherPosts.getCount()).toBe(0);
                            });
                        }
                    });
                });
                
                describe("the many", function() {
                    var posts;
                    function makeThread() {
                        thread = new Thread({
                            id: 3
                        }, session);
                    }
                    
                    var thread;
                    
                    afterEach(function() {
                        posts = thread = null;
                    });
                    
                    it("should return a store", function() {
                        definePost();
                        makeThread();
                        expect(thread.posts().isStore).toBe(true);         
                    });
                    
                    it("should set the appropriate model type", function() {
                        definePost();
                        makeThread();
                        expect(thread.posts().model).toBe(Post);    
                    });

                    if (withSession) {
                        it("should set the session on the store", function() {
                            definePost();
                            makeThread();
                            expect(thread.posts().getSession()).toBe(session);
                        });
                    }
                    
                    it("should return the same store instance on multiple calls", function() {
                        definePost();
                        makeThread();
                        var s = thread.posts();
                        expect(thread.posts()).toBe(s);
                    });
                    
                    it("should apply the storeConfig", function() {
                        definePost({
                            inverse: {
                                storeConfig: {
                                    autoLoad: true
                                }
                            }
                        });
                        makeThread();
                        posts = thread.posts();
                        expect(posts.getAutoLoad()).toBe(true);
                        posts.destroy();
                    });

                    it("should add a filter on the store", function() {
                        definePost();
                        makeThread();
                        var s = thread.posts(),
                            filter = s.getFilters().first();

                        expect(filter.getProperty()).toBe('threadId');
                        expect(filter.getValue()).toBe(3);
                    });
                    
                    describe("autoLoad", function() {
                        it("should not load the store by default", function() {
                            definePost();
                            makeThread();
                            var spy = spyOn(Ext.data.Store.prototype, 'load').andReturn();
                            thread.posts();
                            expect(spy.callCount).toBe(0);    
                        });  
                        
                        it("should load the store if configured with autoLoad: true", function() {
                            definePost({
                                inverse: {
                                    autoLoad: true
                                }
                            }); 
                            
                            makeThread();
                            var spy = spyOn(Ext.data.Store.prototype, 'load').andReturn();
                            thread.posts();
                            expect(spy.callCount).toBe(1);          
                        });
                    });
                    
                    describe("store modification", function() {
                        
                        beforeEach(function() {
                            definePost();
                        });

                        describe("loading", function() {
                            var postData;
 
                             beforeEach(function() {
                                 postData = [{id: 101, threadId: 3}, {id: 102, threadId: 3}, {id: 103, threadId: 3}];
                             });

                             it("should set the owner instance when loading", function() {
                                makeThread();
                                var posts = thread.posts();
 
                                posts.load();
                                complete(postData);
 
                                var readSpy = spyOn(Post.getProxy(), 'read');
                                expect(posts.getAt(0).getThread()).toBe(thread);
                                expect(posts.getAt(1).getThread()).toBe(thread);
                                expect(posts.getAt(2).getThread()).toBe(thread);
                                expect(readSpy).not.toHaveBeenCalled();
                            });
 
                            it("should set the owner instance when loading via nested loading", function() {
                                thread = Thread.load(3);
                                complete({
                                    id: 3,
                                    posts: postData
                                });
 
                                var posts = thread.posts();
 
                                var readSpy = spyOn(Post.getProxy(), 'read');
                                expect(posts.getAt(0).getThread()).toBe(thread);
                                expect(posts.getAt(1).getThread()).toBe(thread);
                                expect(posts.getAt(2).getThread()).toBe(thread);
                                expect(readSpy).not.toHaveBeenCalled();
                            });
                        });
                        
                        describe("adding", function() {
                            beforeEach(function() {
                                makeThread();
                            });

                            it("should default to the key to the primaryKey", function() {
                                var posts = thread.posts(),
                                    post;

                                posts.load();
                                complete([]);
                                post = posts.add({})[0];
                                expect(post.get('threadId')).toBe(3);
                            });
                        
                            it("should set the primaryKey onto the foreignKey on add", function() {
                                var posts = thread.posts(),
                                    post;

                                posts.load();
                                complete([]);
                                post = posts.add({
                                    threadId: 1
                                })[0];
                                expect(post.get('threadId')).toBe(3);
                            });

                            it("should set the owner instance when adding", function() {
                                var posts = thread.posts();
 
                                posts.load();
                                complete([]);
                                post = posts.add({})[0];
 
                                var readSpy = spyOn(Post.getProxy(), 'read');
                                expect(post.getThread()).toBe(thread);
                                expect(readSpy).not.toHaveBeenCalled();
                            });

                            it("should set the owner instance when adding when the record already has the FK", function() {
                                var posts = thread.posts(),
                                    post = posts.add({
                                        id: 101,
                                        threadId: thread.getId()
                                    })[0];
                                expect(post.getThread()).toBe(thread);
                            });

                            it("should have the key & instance set in the add event", function() {
                                var posts = thread.posts(),
                                    id, rec;

                                post = new Post({}, session);
                                posts.on('add', function() {
                                    id = post.get('threadId');
                                    rec = post.getThread();
                                });
                                posts.add(post);
                                expect(id).toBe(thread.getId());
                                expect(rec).toBe(thread);
                            });
                        });

                        describe("removing", function() {
                            beforeEach(function() {
                                makeThread();
                            });

                            it("should set the key to null when removing an item", function() {
                                var posts = thread.posts(),
                                    post;

                                posts.load();
                                complete([{id: 12, threadId: 3}]);
                                post = posts.first();

                                posts.remove(post);
                                expect(post.get('threadId')).toBeNull();
                            });

                            it("should set the key to null when removing all items", function() {
                                var posts = thread.posts(),
                                    post1, post2, post3;

                                posts.load();
                                complete([{id: 11, threadId: 3}, {id: 12, threadId: 3}, {id: 13, threadId: 3}]);

                                post1 = posts.getAt(0);
                                post2 = posts.getAt(1);
                                post3 = posts.getAt(2);

                                posts.removeAll();
                                expect(post1.get('threadId')).toBeNull();
                                expect(post2.get('threadId')).toBeNull();
                                expect(post3.get('threadId')).toBeNull();
                            });

                            it("should not modify the store when removing the an item", function() {
                                var posts = thread.posts(),
                                    post;
 
                                posts.load();
                                complete([{id: 12, threadId: 3}]);
                                post = posts.first();
 
                                posts.remove(post);
                                expect(thread.posts()).toBe(posts);
                                expect(post.getThread()).toBeNull();
                            });
 
                            it("should not modify the store when removing the all items", function() {
                                var posts = thread.posts(),
                                    post1, post2, post3;
 
                                posts.load();
                                complete([{id: 11, threadId: 3}, {id: 12, threadId: 3}, {id: 13, threadId: 3}]);
 
                                post1 = posts.getAt(0);
                                post2 = posts.getAt(1);
                                post3 = posts.getAt(2);
 
                                posts.removeAll();
                                expect(post1.getThread()).toBeNull();
                                expect(post2.getThread()).toBeNull();
                                expect(post3.getThread()).toBeNull();
                                expect(thread.posts()).toBe(posts);
                            });

                            it("should have the key & instance cleared in the remove event", function() {
                                var posts = thread.posts(),
                                    id, rec;

                                posts.load();
                                complete([{id: 11, threadId: 3}, {id: 12, threadId: 3}, {id: 13, threadId: 3}]);
                                post = posts.first();
                                posts.on('remove', function() {
                                    id = post.get('threadId');
                                    rec = post.getThread();
                                });
                                posts.remove(post);
                                expect(id).toBeNull();
                                expect(rec).toBeNull();
                            });
                        });
                    });

                    describe("reload", function() {
                        beforeEach(function() {
                            definePost();
                            makeThread();
                        });

                        it("should reload an existing store", function() {
                            thread.posts();
                            spy = spyOn(Post.getProxy(), 'read');
                            thread.posts({
                                reload: true
                            });
                            expect(spy).toHaveBeenCalled();
                        });

                        it("should not trigger an existing load if already loading", function() {
                            posts = thread.posts({});
                            expect(posts.isLoading()).toBe(true);
                            spy = spyOn(Post.getProxy(), 'read');
                            thread.posts({
                                reload: true
                            });
                            expect(spy).not.toHaveBeenCalled();
                        });
                    });

                    describe("calling while during a load", function() {
                        beforeEach(function() {
                            definePost();
                            makeThread();
                        });

                        it("should not trigger a second load", function() {
                            thread.posts({});
                            spy = spyOn(Post.getProxy(), 'read');
                            thread.posts({});
                            expect(spy).not.toHaveBeenCalled();
                        });

                        it("should not trigger any callback until load completes", function() {
                            thread.posts({});
                            thread.posts({
                                success: spy,
                                callback: spy
                            });
                            expect(spy).not.toHaveBeenCalled();
                        });

                        it("should trigger the callbacks once loaded", function() {
                            thread.posts({});
                            thread.posts({
                                success: spy,
                                callback: spy
                            });
                            complete([]);
                            expect(spy.callCount).toBe(2);
                        });
                    });

                    describe("callbacks", function() {
                        beforeEach(function() {
                            definePost();
                            makeThread();
                        });

                        describe("when not triggering a load", function() {
                            beforeEach(function() {
                                thread.posts();
                            });

                            it("should call the callbacks before the function returns", function() {
                                thread.posts(spy);
                                expect(spy).toHaveBeenCalled();
                                spy.reset();
                                thread.posts({
                                    success: spy
                                });
                                expect(spy).toHaveBeenCalled();
                                spy.reset();
                                thread.posts({
                                    callback: spy
                                });
                                expect(spy).toHaveBeenCalled();
                            });

                            it("should accept a function as the callback and default the scope to the model", function() {
                                posts = thread.posts(spy);
                                var call = spy.mostRecentCall;
                                expect(call.args[0]).toBe(posts);
                                expect(call.args[1]).toBeNull();
                                expect(call.args[2]).toBe(true);
                                expect(call.object).toBe(thread);
                            });
                            
                            it("should accept a function with a scope", function() {
                                var o = {};
                                thread.posts(spy, o);
                                expect(spy.mostRecentCall.object).toBe(o);   
                            });
                            
                            it("should accept an options object with success and default the scope to the model", function() {
                                posts = thread.posts({
                                    success: spy
                                });  
                                var call = spy.mostRecentCall; 
                                expect(call.args[0]).toBe(posts);
                                expect(call.args[1]).toBeNull();
                                expect(call.object).toBe(thread);  
                            });

                            it("should accept an options object with success and a scope", function() {
                                var o = {},
                                    call;

                                thread.posts({
                                    scope: o,
                                    success: spy
                                });  
                                call = spy.mostRecentCall; 
                                expect(call.object).toBe(o);  
                            });

                            it("should accept an options object with callback and default the scope to the model", function() {
                                posts = thread.posts({
                                    callback: spy
                                });  
                                var call = spy.mostRecentCall; 
                                expect(call.args[0]).toBe(posts);
                                expect(call.args[1]).toBeNull();
                                expect(call.args[2]).toBe(true);
                                expect(call.object).toBe(thread); 
                            });
                            
                            it("should accept an options object with callback and a scope", function() {
                                var o = {},
                                    call;

                                thread.posts({
                                    scope: o,
                                    callback: spy
                                });  
                                call = spy.mostRecentCall; 
                                expect(call.object).toBe(o); 
                            });
                        });

                        describe("when triggering a load", function() {
                            it("should not trigger any callbacks until the load completes", function() {
                                thread.posts(spy);
                                thread.posts({
                                    success: spy
                                });
                                thread.posts({
                                    failure: spy
                                });
                                thread.posts({
                                    callback: spy
                                });
                                expect(spy).not.toHaveBeenCalled();

                            });

                            describe("when successful", function() {
                                it("should accept a function as the callback and default the scope to the model", function() {
                                    posts = thread.posts(spy);
                                    complete([]);
                                    var call = spy.mostRecentCall;
                                    expect(call.args[0]).toBe(posts);
                                    expect(call.args[1].isOperation).toBe(true);
                                    expect(call.args[2]).toBe(true);
                                    expect(call.object).toBe(thread);
                                });
                            
                                it("should accept a function with a scope", function() {
                                    var o = {};
                                    thread.posts(spy, o);
                                    complete([]);
                                    expect(spy.mostRecentCall.object).toBe(o);   
                                });
                            
                                it("should accept an options object with success and default the scope to the model", function() {
                                    posts = thread.posts({
                                        success: spy
                                    });  
                                    complete([]);
                                    var call = spy.mostRecentCall; 
                                    expect(call.args[0]).toBe(posts);
                                    expect(call.args[1].isOperation).toBe(true);
                                    expect(call.object).toBe(thread);  
                                });

                                it("should accept an options object with success and a scope", function() {
                                    var o = {},
                                        call;

                                    thread.posts({
                                        scope: o,
                                        success: spy
                                    });  
                                    complete([]);
                                    call = spy.mostRecentCall; 
                                    expect(call.object).toBe(o);  
                                });

                                it("should accept an options object with callback and default the scope to the model", function() {
                                    posts = thread.posts({
                                        callback: spy
                                    });  
                                    complete([]);
                                    var call = spy.mostRecentCall; 
                                    expect(call.args[0]).toBe(posts);
                                    expect(call.args[1].isOperation).toBe(true);
                                    expect(call.args[2]).toBe(true);
                                    expect(call.object).toBe(thread); 
                                });
                            
                                it("should accept an options object with callback and a scope", function() {
                                    var o = {},
                                        call;

                                    thread.posts({
                                        scope: o,
                                        callback: spy
                                    });  
                                    complete([]);
                                    call = spy.mostRecentCall; 
                                    expect(call.object).toBe(o); 
                                });
                            });

                            describe("when failed", function() {
                                it("should accept a function as the callback and default the scope to the model", function() {
                                    posts = thread.posts(spy);
                                    complete(null, 500);
                                    var call = spy.mostRecentCall;
                                    expect(call.args[0]).toBe(posts);
                                    expect(call.args[1].isOperation).toBe(true);
                                    expect(call.args[2]).toBe(false);
                                    expect(call.object).toBe(thread);
                                });
                            
                                it("should accept a function with a scope", function() {
                                    var o = {};
                                    thread.posts(spy, o);
                                    complete(null, 500);
                                    expect(spy.mostRecentCall.object).toBe(o);   
                                });
                            
                                it("should accept an options object with failure and default the scope to the model", function() {
                                    posts = thread.posts({
                                        failure: spy
                                    });  
                                    complete(null, 500);
                                    var call = spy.mostRecentCall; 
                                    expect(call.args[0]).toBe(posts);
                                    expect(call.args[1].isOperation).toBe(true);
                                    expect(call.object).toBe(thread);  
                                });

                                it("should accept an options object with failure and a scope", function() {
                                    var o = {},
                                        call;

                                    thread.posts({
                                        scope: o,
                                        failure: spy
                                    });  
                                    complete(null, 500);
                                    call = spy.mostRecentCall; 
                                    expect(call.object).toBe(o);  
                                });

                                it("should accept an options object with callback and default the scope to the model", function() {
                                    posts = thread.posts({
                                        callback: spy
                                    });  
                                    complete(null, 500);
                                    var call = spy.mostRecentCall; 
                                    expect(call.args[0]).toBe(posts);
                                    expect(call.args[1].isOperation).toBe(true);
                                    expect(call.args[2]).toBe(false);
                                    expect(call.object).toBe(thread); 
                                });
                            
                                it("should accept an options object with callback and a scope", function() {
                                    var o = {},
                                        call;

                                    thread.posts({
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

                    if (withSession) {
                        describe("local store modifications with loading", function() {
                            var data;

                            beforeEach(function() {
                                definePost();
                                makeThread();
                                posts = thread.posts();

                                data = [{
                                    id: 101,
                                    threadId: 3
                                }, {
                                    id: 102,
                                    threadId: 3
                                }, {
                                    id: 103,
                                    threadId: 3
                                }];
                            });

                            it("should exclude records with local foreign key changes", function() {
                                posts.load();
                                complete(data);
                                var rec = session.getRecord('Post', 102);
                                posts.removeAt(1);
                                expect(rec.get('threadId')).toBeNull();
                                posts.load();
                                complete(data);
                                expect(posts.getCount()).toBe(2);
                                expect(posts.indexOf(rec)).toBe(-1);
                            });

                            it("should append records with the key that were not attached", function() {
                                posts.load();
                                complete(data);
                                var rec = session.getRecord('Post', 104);
                                complete({
                                    id: 104
                                });
                                posts.add(rec);
                                expect(rec.get('threadId')).toBe(3);
                                posts.load();
                                complete(data);
                                expect(posts.getCount()).toBe(4);
                                expect(posts.indexOf(rec)).toBe(3);
                            });

                            it("should include records added to the session with a matching key", function() {
                                posts.load();
                                complete(data);

                                var p1 = new Post({
                                    id: 104,
                                    threadId: 3
                                }, session);

                                var p2 = new Post({
                                    id: 105,
                                    threadId: 7
                                }, session);

                                expect(posts.indexOf(p1)).toBe(3);
                                expect(posts.indexOf(p2)).toBe(-1);
                            });
                        });
                    }
                });
            });
        }
        createSuite(false);
        createSuite(true);
    });

    describe("dropping", function() {
        function createSuite(withSession) {
            var session, post, thread, storeData;

            beforeEach(function() {
                if (withSession) {
                    session = new Ext.data.Session();
                }

                storeData = [{
                    id: 1,
                    posts: [{
                        id: 101,
                        threadId: 1
                    }, {
                        id: 102,
                        threadId: 1
                    }, {
                        id: 103,
                        threadId: 1
                    }]
                }];
            });

            afterEach(function() {
                if (withSession) {
                    session.destroy();
                    session = null;
                }
                storeData = post = thread = null;
            });

            function makePost(id, threadId) {
                var data = {
                    id: id,
                    threadId: threadId
                };

                // Session will be null if withSession is false
                post = new Post(data, session);
            }

            function makeThread(id) {
                // Session will be null if withSession = false
                thread = new Thread({
                    id: id
                }, session);
            }

            function makeStore(data) {
                var store = new Ext.data.Store({
                    model: Thread,
                    // Session will be null if withSession = false
                    session: session
                });
                store.loadRawData(data || storeData);
                return store;
            }

            describe(withSession ? "with session" : "without session", function() {
                describe("the one", function() {
                    beforeEach(function() {
                        definePost();
                    });

                    describe("inverse not loaded", function() {
                        it("should not create the the inverse record", function() {
                            makePost(101, 1);
                            post.drop();
                            expect(threadCalled).toBe(false);
                        });

                        
                        it("should clear the foreign key", function() {
                            makePost(101, 1);
                            post.drop();
                            expect(post.get('threadId')).toBeNull();
                        });
                    });

                    describe("inverse loaded", function() {
                        var store, posts;

                        beforeEach(function() {
                            store = makeStore();
                            thread = store.first();
                            posts = thread.posts();
                            post = posts.first();
                        });

                        afterEach(function() {
                            store.destroy();
                            store = posts = null;
                        });

                        it("should remove from the store", function() {
                            expect(posts.getCount()).toBe(3);
                            post.drop();
                            expect(posts.getCount()).toBe(2);
                            expect(posts.indexOf(post)).toBe(-1);
                        });

                        it("should clear the foreign key", function() {
                            post.drop();
                            expect(post.get('threadId')).toBeNull();
                        });

                        it("should not return the inverse record", function() {
                            expect(post.getThread()).toBe(thread);
                            post.drop();
                            expect(post.getThread()).toBeNull();
                        });
                    });
                });

                describe("the many", function() {
                    describe("inverse not loaded", function() {
                        beforeEach(function() {
                            definePost();
                        });

                        it("should not attempt to load the store", function() {
                            makeThread(1);
                            var spy = spyOn(Post.getProxy(), 'read');
                            thread.drop();
                            expect(spy).not.toHaveBeenCalled();
                        });
                    });

                    describe("inverse loaded", function() {
                        var store;

                        afterEach(function() {
                            if (store) {
                                store.destroy();
                            }
                            store = null;
                        });

                        describe("no parent/child relationship", function() {
                            beforeEach(function() {
                                definePost();
                            });

                            it("should not raise an exception with an empty store", function() {
                                store = makeStore([{
                                    id: 1
                                }]);
                                thread = store.first();
                                expect(function() {
                                    thread.drop();
                                }).not.toThrow();
                            });

                            it("should remove all children from the store", function() {
                                store = makeStore();
                                thread = store.first();
                                var posts = thread.posts(),
                                    allPosts = posts.getRange(),
                                    spy = jasmine.createSpy();

                                posts.on('clear', spy);
                                thread.drop();
                                expect(spy.mostRecentCall.args[1]).toEqual(allPosts);
                            });

                            it("should clear the foreign key for each child", function() {
                                store = makeStore();
                                thread = store.first();
                                var posts = thread.posts(),
                                    allPosts = posts.getRange();

                                thread.drop();
                                expect(allPosts[0].get('threadId')).toBeNull();
                                expect(allPosts[1].get('threadId')).toBeNull();
                                expect(allPosts[2].get('threadId')).toBeNull();
                            });

                            it("should not drop the child records", function() {
                                store = makeStore();
                                thread = store.first();
                                var posts = thread.posts(),
                                    allPosts = posts.getRange();

                                thread.drop();
                                expect(allPosts[0].dropped).toBe(false);
                                expect(allPosts[1].dropped).toBe(false);
                                expect(allPosts[2].dropped).toBe(false);
                            });

                            it("should clear the owner on the inverse", function() {
                                store = makeStore();
                                thread = store.first();
                                var posts = thread.posts(),
                                    allPosts = posts.getRange();

                                thread.drop();

                                expect(allPosts[0].getThread()).toBeNull();
                                expect(allPosts[1].getThread()).toBeNull();
                                expect(allPosts[2].getThread()).toBeNull();
                            });
                        });

                        describe("as a parent", function() {
                            var posts, allPosts;

                            function createDefaults() {
                                store = makeStore();
                                thread = store.first();
                                posts = thread.posts();
                                allPosts = posts.getRange();
                                post = posts.first();
                            }

                            beforeEach(function() {
                                definePost({
                                    type: null,
                                    parent: 'Thread'
                                });
                            });

                            afterEach(function() {
                                posts = allPosts = null;
                            });

                            it("should not raise an exception with an empty store", function() {
                                store = makeStore([{
                                    id: 1
                                }]);
                                thread = store.first();
                                expect(function() {
                                    thread.drop();
                                }).not.toThrow();
                            });

                            it("should drop each child in the store and remove it", function() {
                                var spy = jasmine.createSpy();
                                createDefaults();

                                posts.on('clear', spy);
                                thread.drop();
                                expect(allPosts[0].dropped).toBe(true);
                                expect(allPosts[1].dropped).toBe(true);
                                expect(allPosts[2].dropped).toBe(true);
                                expect(spy.mostRecentCall.args[1]).toEqual(allPosts);
                            });

                            it("should clear the foreign key for each child", function() {
                                createDefaults();

                                thread.drop();
                                expect(allPosts[0].get('threadId')).toBeNull();
                                expect(allPosts[1].get('threadId')).toBeNull();
                                expect(allPosts[2].get('threadId')).toBeNull();
                            });

                            it("should clear the owner on the inverse", function() {
                                createDefaults();

                                thread.drop();

                                expect(allPosts[0].getThread()).toBeNull();
                                expect(allPosts[1].getThread()).toBeNull();
                                expect(allPosts[2].getThread()).toBeNull();
                            });

                            describe("dropping the child", function() {
                                it("should drop a child when removing it from the store", function() {
                                    createDefaults();
                                    posts.remove(post);
                                    Ext.data.Model.schema.processKeyChecks(true);
                                    expect(post.dropped).toBe(true);
                                });

                                it("should drop a child when changing the foreign key", function() {
                                    createDefaults();
                                    post.set('threadId', null);
                                    Ext.data.Model.schema.processKeyChecks(true);
                                    expect(post.dropped).toBe(true);
                                    expect(posts.indexOf(post)).toBe(-1);
                                });

                                it("should drop a child when nulling out via the setter", function() {
                                    createDefaults();
                                    post.setThread(null);
                                    Ext.data.Model.schema.processKeyChecks(true);
                                    expect(post.dropped).toBe(true);
                                    expect(posts.indexOf(post)).toBe(-1);
                                });

                                if (withSession) {
                                    it("should drop the child even if the store is not created", function() {
                                        thread = new Thread({
                                            id: 1
                                        }, session);

                                        var post1 = new Post({
                                            id: 101,
                                            threadId: 1
                                        }, session);

                                        var post2 = new Post({
                                            id: 102,
                                            threadId: 1
                                        }, session);

                                        var post3 = new Post({
                                            id: 103,
                                            threadId: 1
                                        }, session);

                                        var post4 = new Post({
                                            id: 104,
                                            threadId: 2
                                        });

                                        thread.drop();
                                        expect(post1.dropped).toBe(true);
                                        expect(post2.dropped).toBe(true);
                                        expect(post3.dropped).toBe(true);
                                        expect(post4.dropped).toBe(false);
                                    });
                                }
                            });

                            describe("not dropping the child", function() {
                                it("should not drop the child when setting a new record", function() {
                                    createDefaults();
                                    var other = new Thread({
                                        id: 2
                                    }, session);
                                    post.setThread(other);
                                    expect(post.dropped).toBe(false);
                                });

                                it("should not drop the child when setting a new key", function() {
                                    createDefaults();
                                    post.setThread(2);
                                    expect(post.dropped).toBe(false);
                                });

                                it("should not drop the child when adding to a new store", function() {
                                    createDefaults();

                                    var otherThread = new Thread({
                                        id: 2
                                    }, session);
                                    posts.remove(post);

                                    otherThread.posts().add(post);
                                    Ext.data.Model.schema.processKeyChecks(true);
                                    expect(post.dropped).toBe(false);
                                });

                                it("should not drop the child when setting the foreign key", function() {
                                    createDefaults();

                                    posts.remove(post);
                                    post.set('threadId', 2);
                                    Ext.data.Model.schema.processKeyChecks(true);
                                    expect(post.dropped).toBe(false);
                                });

                                it("should not drop the child when setting a new parent", function() {
                                    createDefaults();

                                    var otherThread = new Thread({
                                        id: 2
                                    }, session);

                                    posts.remove(post);
                                    post.setThread(otherThread);
                                    Ext.data.Model.schema.processKeyChecks(true);
                                    expect(post.dropped).toBe(false);
                                });
                            });
                        });
                    });
                });
            });
        }
        createSuite(false);
        createSuite(true);
    });
});