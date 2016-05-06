describe("Ext.data.TreeStore", function() {
    var store,
        loadStore,
        dummyData,
        NodeModel = Ext.define(null, {
            extend: 'Ext.data.Model',
            fields: ['name'],
            proxy: {
                type: 'ajax',
                url: 'foo.json',
                reader: {
                    type: 'json'
                }
            }
        }),
        TaskModel = Ext.define(null, {
            extend: 'Ext.data.Model',
            idProperty : 'id',
            fields: [
                {name: 'id',       type: 'int', allowNull: true},
                {name: 'task',     type: 'string'},
                {name: 'duration', type: 'string'}
            ]
        });

    function spyOnEvent(object, eventName, fn) {
        var obj = {
            fn: fn || Ext.emptyFn
        },
        spy = spyOn(obj, "fn");
        object.addListener(eventName, obj.fn);
        return spy;
    }

    function expandify(nodes) {
        if (Ext.isNumber(nodes[0])) {
            nodes = Ext.Array.map(nodes, function(id) {
                return {
                    id: id,
                    leaf: true
                };
            });
        }
        Ext.Array.forEach(nodes, function(node) {
            if (node.children || node.leaf === false) {
                node.expanded = true;
                if (node.children) {
                    node.children = expandify(node.children);
                } else {
                    node.children = [];
                }
            } else {
                node.leaf = true;
            }
        });
        return nodes;
    }

    function makeStore(nodes, cfg) {
        store = new Ext.data.TreeStore(Ext.apply({
            root: {
                expanded: true,
                children: expandify(nodes)
            }
        }, cfg));
    }

    beforeEach(function() {
        dummyData = {
            success: true,
            children: [{
                id: 1,
                name: "aaa"
            },{
                id: 2,
                name: "bbb", 
                children: [{
                    id: 3, 
                    name: "ccc"
                },{
                    id: 4, 
                    name: "ddd", 
                    children: [{
                        id: 5, 
                        name: "eee",
                        leaf: true
                    }]
                }]
            },{
                id: 6, 
                name: "fff", 
                children: [{id: 7, 
                    name: "ggg"
                }]
            }]
        };

        MockAjaxManager.addMethods();   

        loadStore = function(store, options) {
            store.load(options);
            completeWithData(dummyData);
        };

    });
    
    afterEach(function() {
        MockAjaxManager.removeMethods();
    });

    function completeWithData(data) {
        Ext.Ajax.mockComplete({
            status: 200,
            responseText: Ext.encode(data)
        });
    }

    function byId(id) {
        return store.getNodeById(id);
    }

    describe("the model", function() {
        it("should be able to use a non TreeModel", function() {
            var Model = Ext.define(null, {
                extend: 'Ext.data.Model',
                fields: ['foo']
            });

            // Important that the proxy gets applied first here
            store = new Ext.data.TreeStore({
                proxy: {
                    type: 'ajax',
                    url: 'fake'
                },
                model: Model
            });
            expect(store.getModel()).toBe(Model);
            expect(Model.prototype.isNode).toBe(true);
        });
    });

    describe("sorting", function() {
        function expectOrder(parent, ids) {
            var childNodes = parent.childNodes,
                i, len;

            expect((childNodes || []).length).toBe(ids.length);

            if (childNodes) {
                for (i = 0, len = childNodes.length; i < len; ++i) {
                    expect(childNodes[i].id).toBe(ids[i]);
                }
            }
        }

        function expectStoreOrder(ids) {
            var len = ids.length,
                i;

            expect(store.getCount()).toBe(len);

            for (i = 0; i < len; ++i) {
                expect(store.getAt(i).id).toBe(ids[i]);
            }


        }

        describe("with local data", function() {
            describe("with folderSort: true", function() {
                it("should sort when setting folderSort dynamically", function() {
                    store = new Ext.data.TreeStore({
                        model: NodeModel,
                        root: {
                            expanded: true,
                            children: [{
                                id: 'l1',
                                leaf: true
                            }, {
                                id: 'f1'
                            }, {
                                id: 'l2',
                                leaf: true
                            }, {
                                id: 'f2'
                            }]
                        }
                    });
                    store.setFolderSort(true);
                    expectOrder(store.getRoot(), ['f1', 'f2', 'l1', 'l2']);
                });

                it("should leave the original sort order if there are no other sorters", function() {
                    store = new Ext.data.TreeStore({
                        model: NodeModel,
                        folderSort: true,
                        root: {
                            expanded: true,
                            children: [{
                                id: 'l3',
                                leaf: true
                            }, {
                                id: 'l2',
                                leaf: true
                            }, {
                                id: 'f3'
                            }, {
                                id: 'l1',
                                leaf: true
                            }, {
                                id: 'f2'
                            }, {
                                id: 'f1'
                            }]
                        }
                    });
                    expectOrder(store.getRoot(), ['f3', 'f2', 'f1', 'l3', 'l2', 'l1']);
                });

                it("should do a deep sort", function() {
                    store = new Ext.data.TreeStore({
                        model: NodeModel,
                        folderSort: true,
                        root: {
                            expanded: true,
                            children: [{
                                id: 'p1',
                                children: [{
                                    id: 'l1',
                                    leaf: true
                                }, {
                                    id: 'f1'
                                }]
                            }, {
                                id: 'p2',
                                children: [{
                                    id: 'l2',
                                    leaf: true
                                }, {
                                    id: 'f2'
                                }]
                            }]
                        }
                    });
                    expectOrder(byId('p1'), ['f1', 'l1']);
                    expectOrder(byId('p2'), ['f2', 'l2']);
                });

                it("should sort folder/non folder groups by any additional sorters", function() {
                    store = new Ext.data.TreeStore({
                        model: NodeModel,
                        folderSort: true,
                        sorters: ['id'],
                        root: {
                            expanded: true,
                            children: [{
                                id: 'f4'
                            }, {
                                id: 'l3'
                            }, {
                                id: 'f1'
                            }, {
                                id: 'l1'
                            }, {
                                id: 'l2'
                            }, {
                                id: 'f3'
                            }, {
                                id: 'l4'
                            }, {
                                id: 'f2'
                            }]
                        }
                    });
                    expectOrder(store.getRoot(), ['f1', 'f2', 'f3', 'f4', 'l1', 'l2', 'l3', 'l4']);
                });
            });

            describe("with folderSort: false", function() {
                it("should sort by existing sorters when setting folderSort: false", function() {
                    store = new Ext.data.TreeStore({
                        model: NodeModel,
                        folderSort: false,
                        sorters: ['id'],
                        root: {
                            expanded: true,
                            children: [{
                                id: 'a',
                                leaf: true
                            }, {
                                id: 'b'
                            }, {
                                id: 'c',
                                leaf: true
                            }, {
                                id: 'd'
                            }]
                        }
                    });
                    store.setFolderSort(false);
                    expectOrder(store.getRoot(), ['a', 'b', 'c', 'd']);
                });

                it("should do a deep sort", function() {
                    store = new Ext.data.TreeStore({
                        model: NodeModel,
                        folderSort: false,
                        sorters: ['id'],
                        root: {
                            expanded: true,
                            children: [{
                                id: 'p1',
                                expanded: true,
                                children: [{
                                    id: 'b',
                                    leaf: true
                                }, {
                                    id: 'c',
                                    leaf: true
                                }, {
                                    id: 'a',
                                    leaf: true
                                }, {
                                    id: 'd',
                                    leaf: true
                                }]

                            }, {
                                id: 'p2',
                                expanded: true,
                                children: [{
                                    id: 'g',
                                    leaf: true
                                }, {
                                    id: 'e',
                                    leaf: true
                                }, {
                                    id: 'h',
                                    leaf: true
                                }, {
                                    id: 'f',
                                    leaf: true
                                }]
                            }]
                        }
                    });
                    store.setFolderSort(false);
                    expectOrder(byId('p1'), ['a', 'b', 'c', 'd']);
                    expectOrder(byId('p2'), ['e', 'f', 'g', 'h']);
                });
            });
        });

        describe("with remote data", function() {
            describe("with folderSort: true", function() {
                it("should sort when setting folderSort dynamically", function() {
                    store = new Ext.data.TreeStore({
                        model: NodeModel,
                        root: {
                            expanded: true
                        }
                    });
                    completeWithData([{
                        id: 'l1',
                        leaf: true
                    }, {
                        id: 'f1'
                    }, {
                        id: 'l2',
                        leaf: true
                    }, {
                        id: 'f2'
                    }]);
                    store.setFolderSort(true);
                    expectOrder(store.getRoot(), ['f1', 'f2', 'l1', 'l2']);
                });

                it("should leave the original sort order if there are no other sorters", function() {
                    store = new Ext.data.TreeStore({
                        model: NodeModel,
                        folderSort: true,
                        root: {
                            expanded: true
                        }
                    });
                    completeWithData([{
                        id: 'l3',
                        leaf: true
                    }, {
                        id: 'l2',
                        leaf: true
                    }, {
                        id: 'f3'
                    }, {
                        id: 'l1',
                        leaf: true
                    }, {
                        id: 'f2'
                    }, {
                        id: 'f1'
                    }]);
                    expectOrder(store.getRoot(), ['f3', 'f2', 'f1', 'l3', 'l2', 'l1']);
                });

                it("should do a deep sort", function() {
                    store = new Ext.data.TreeStore({
                        model: NodeModel,
                        folderSort: true,
                        root: {
                            expanded: true
                        }
                    });
                    completeWithData([{
                        id: 'p1',
                        children: [{
                            id: 'l1',
                            leaf: true
                        }, {
                            id: 'f1'
                        }]
                    }, {
                        id: 'p2',
                        children: [{
                            id: 'l2',
                            leaf: true
                        }, {
                            id: 'f2'
                        }]
                    }]);
                    expectOrder(byId('p1'), ['f1', 'l1']);
                    expectOrder(byId('p2'), ['f2', 'l2']);
                });

                it("should sort folder/non folder groups by any additional sorters", function() {
                    store = new Ext.data.TreeStore({
                        model: NodeModel,
                        folderSort: true,
                        sorters: ['id'],
                        root: {
                            expanded: true
                        }
                    });
                    completeWithData([{
                        id: 'f4'
                    }, {
                        id: 'l3'
                    }, {
                        id: 'f1'
                    }, {
                        id: 'l1'
                    }, {
                        id: 'l2'
                    }, {
                        id: 'f3'
                    }, {
                        id: 'l4'
                    }, {
                        id: 'f2'
                    }]);
                    expectOrder(store.getRoot(), ['f1', 'f2', 'f3', 'f4', 'l1', 'l2', 'l3', 'l4']);
                });
            });

            describe("with folderSort: false", function() {
                it("should sort by existing sorters when setting folderSort: false", function() {
                    store = new Ext.data.TreeStore({
                        model: NodeModel,
                        folderSort: false,
                        sorters: ['id'],
                        root: {
                            expanded: true
                        }
                    });
                    completeWithData([{
                        id: 'a',
                        leaf: true
                    }, {
                        id: 'b'
                    }, {
                        id: 'c',
                        leaf: true
                    }, {
                        id: 'd'
                    }]);
                    store.setFolderSort(false);
                    expectOrder(store.getRoot(), ['a', 'b', 'c', 'd']);
                });

                it("should do a deep sort", function() {
                    store = new Ext.data.TreeStore({
                        model: NodeModel,
                        folderSort: false,
                        sorters: ['id'],
                        root: {
                            expanded: true
                        }
                    });
                    completeWithData([{
                        id: 'p1',
                        expanded: true,
                        children: [{
                            id: 'b',
                            leaf: true
                        }, {
                            id: 'c',
                            leaf: true
                        }, {
                            id: 'a',
                            leaf: true
                        }, {
                            id: 'd',
                            leaf: true
                        }]

                    }, {
                        id: 'p2',
                        expanded: true,
                        children: [{
                            id: 'g',
                            leaf: true
                        }, {
                            id: 'e',
                            leaf: true
                        }, {
                            id: 'h',
                            leaf: true
                        }, {
                            id: 'f',
                            leaf: true
                        }]
                    }]);
                    store.setFolderSort(false);
                    expectOrder(byId('p1'), ['a', 'b', 'c', 'd']);
                    expectOrder(byId('p2'), ['e', 'f', 'g', 'h']);
                });
            });
        });

        describe("adding/expanding nodes", function() {
            it("should sort nodes correctly on expand", function() {
                store = new Ext.data.TreeStore({
                    model: NodeModel,
                    sorters: ['id'],
                    root: {
                        expanded: true,
                        children: [{
                            id: 'a',
                            children: [{
                                id: 'z'
                            }, {
                                id: 'y'
                            }]
                        }, {
                            id: 'b',
                            children: [{
                                id: 'x'
                            }, {
                                id: 'w'
                            }]
                        }, {
                            id: 'c',
                            children: [{
                                id: 'v'
                            }, {
                                id: 'u'
                            }]
                        }]
                    }
                });

                byId('a').expand();
                expectOrder(byId('a'), ['y', 'z']);
                expectStoreOrder(['a', 'y', 'z', 'b', 'c']);

                byId('b').expand();
                expectOrder(byId('b'), ['w', 'x']);
                expectStoreOrder(['a', 'y', 'z', 'b', 'w', 'x', 'c']);

                byId('c').expand();
                expectOrder(byId('c'), ['u', 'v']);
                expectStoreOrder(['a', 'y', 'z', 'b', 'w', 'x', 'c', 'u', 'v']);
            });

            it("should sort nodes correctly on add", function() {
                store = new Ext.data.TreeStore({
                    model: NodeModel,
                    sorters: ['id'],
                    root: {
                        expanded: true,
                        children: [{
                            id: 'a',
                            expanded: true,
                            children: []
                        }, {
                            id: 'b',
                            expanded: true,
                            children: []
                        }, {
                            id: 'c',
                            expanded: true,
                            children: []
                        }]
                    }
                });

                byId('a').appendChild([{
                    id: 'y'
                }, {
                    id: 'z'
                }]);
                expectOrder(byId('a'), ['y', 'z']);
                expectStoreOrder(['a', 'y', 'z', 'b', 'c']);

                byId('b').appendChild([{
                    id: 'w'
                }, {
                    id: 'x'
                }]);
                expectOrder(byId('b'), ['w', 'x']);
                expectStoreOrder(['a', 'y', 'z', 'b', 'w', 'x', 'c']);

                byId('c').appendChild([{
                    id: 'u'
                }, {
                    id: 'v'
                }]);
                expectOrder(byId('c'), ['u', 'v']);
                expectStoreOrder(['a', 'y', 'z', 'b', 'w', 'x', 'c', 'u', 'v']);

            });
        });
    });

    describe("getNodeById", function() {
        it("should return null if there is no matching id", function() {
            store = new Ext.data.TreeStore({
                model: NodeModel,
                root: {
                    expanded: true,
                    text: 'Root'
                }
            });
            expect(store.getNodeById('foo')).toBeNull();
        });

        it("should be able to return the root", function() {
            store = new Ext.data.TreeStore({
                model: NodeModel,
                root: {
                    expanded: true,
                    id: 'root'
                }
            });
            expect(store.getNodeById('root')).toBe(store.getRoot());
        });

        it("should be able to return a deep node", function() {
            store = new Ext.data.TreeStore({
                model: NodeModel,
                root: {
                    expanded: true,
                    children: [{
                        expanded: true,
                        children: [{
                            expanded: true,
                            children: [{
                                expanded: true,
                                children: [{
                                    id: 'deep'
                                }]
                            }]
                        }]
                    }]
                }
            });

            var idNode;

            store.getRoot().cascadeBy(function(node) {
                if (node.id === 'deep') {
                    idNode = node;
                }
            });

            expect(store.getNodeById('deep')).toBe(idNode);
        });

        it('should be usable during nodeappend event', function () {
            var ids = [];

            store = new Ext.data.TreeStore({
                model: NodeModel,
                listeners: {
                    nodeappend: function (parent, child, index) {
                        ids.push(child.id);
                        var treeStore = child.getTreeStore();
                        var c = treeStore.getNodeById(child.id);

                        // easy to read output:
                        expect(c && c.id).toBe(child.id);

                        // nearly useless output on failure (but not infinite expansion):
                        expect(c === child).toBe(true);
                    }
                },
                root: {
                    expanded: true,
                    id: 'root',
                    children: [{
                        id: 'child',
                        expanded: false,
                        children: [{
                            id: 'leaf'
                        }]
                    }]
                }
            });

            expect(ids.join(' ')).toBe('root child leaf');
        });

        it("should find loaded children of collapsed nodes", function() {
            store = new Ext.data.TreeStore({
                model: NodeModel,
                root: {
                    expanded: true,
                    children: [{
                        expanded: false,
                        children: [{
                            id: 'leaf'
                        }]
                    }]
                }
            });
            expect(store.getNodeById('leaf')).toBe(store.getRoot().firstChild.firstChild);
        });

        it("should find nodes that are filtered out", function() {
            store = new Ext.data.TreeStore({
                model: NodeModel,
                root: {
                    expanded: true,
                    children: [{
                        text: 'A'
                    }, {
                        text: 'A'
                    }, {
                        text: 'A'
                    }, {
                        id: 'bNode',
                        text: 'B'
                    }]
                }
            });
            expect(store.getCount()).toBe(4);
            store.filter('text', 'A');
            expect(store.getCount()).toBe(3);
            expect(store.getNodeById('bNode')).toBe(store.getRoot().lastChild);
        });
    });
 
    describe("loading data", function() {
        describe("isLoaded", function() {
            it("should be false by default", function() {
                store = new Ext.data.TreeStore({
                    root: {
                        text: 'Root'
                    }
                });
                expect(store.isLoaded()).toBe(false);
            });

            it("should be true after a load", function() {
                store = new Ext.data.TreeStore({
                    root: {
                        text: 'Root'
                    }
                });
                loadStore(store);
                expect(store.isLoaded()).toBe(true);
            });
        });

        describe("when loading asynchronously from a url", function() {
           describe("if the root node is expanded", function() {
                it("should load the TreeStore automatically", function() {
                    spyOn(Ext.data.TreeStore.prototype, 'load');
                    
                    store = Ext.create('Ext.data.TreeStore', {
                        model: NodeModel,
                        root: {
                            expanded: true,
                            id: 0,
                            name: 'Root Node'
                        }
                    });

                    expect(store.load.callCount).toBe(1);
                });

                describe("with autoLoad: true", function() {
                    it("should not load twice with a root defined", function() {
                        spyOn(Ext.data.TreeStore.prototype, 'load');
                    
                        runs(function() {
                            store = Ext.create('Ext.data.TreeStore', {
                                model: NodeModel,
                                autoLoad: true,
                                root: {
                                    expanded: true,
                                    id: 0,
                                    name: 'Root Node'
                                }
                            });
                        });
                        // autoLoad runs on a timer, can't use waitsFor here
                        waits(10);
                        runs(function() {
                            expect(store.load.callCount).toBe(1);
                        });
                    });

                    it("should not load twice without a root defined", function() {
                        spyOn(Ext.data.TreeStore.prototype, 'load');
                    
                        runs(function() {
                            store = Ext.create('Ext.data.TreeStore', {
                                model: NodeModel,
                                autoLoad: true
                            });
                        });
                        // autoLoad runs on a timer, can't use waitsFor here
                        waits(10);
                        runs(function() {
                            expect(store.load.callCount).toBe(1);
                        });
                    });
                });
            });
            
            describe("if the root node is not expanded", function() {
                beforeEach(function() {
                    store = Ext.create('Ext.data.TreeStore', {
                        model: NodeModel,
                        autoLoad: false,
                        root: {
                            expanded: false,
                            id: 0,
                            name: 'Root Node'
                        }
                    });
                });
                
                it("should not be loading before load is called", function() {
                    expect(store.isLoading()).toBe(false);
                });

                it("should be loading while the request is still in progress", function() {
                    store.load();
                    expect(store.isLoading()).toBe(true);
                });

                it("should not be loading after the request has finished", function() {
                    loadStore(store);

                    expect(store.isLoading()).toBe(false);
                });
                
                describe("if autoLoad is set to true", function() {
                    beforeEach(function() {
                        spyOn(Ext.data.TreeStore.prototype, 'load').andCallFake(function() {});

                        store = Ext.create('Ext.data.TreeStore', {
                            model: NodeModel,
                            autoLoad: true,
                            root: {
                                expanded: false,
                                id: 0,
                                name: 'Root Node'
                            }
                        });
                    });

                    it("should load the TreeStore automatically", function() {
                        expect(store.load).toHaveBeenCalled();
                    });
                });
            });

            describe("when reloading a store that already contains records", function() {
                beforeEach(function() {
                    store = Ext.create('Ext.data.TreeStore', {
                        model: NodeModel,
                        autoLoad: false,
                        root: {
                            expanded: false,
                            id: 0,
                            name: 'Root Node'
                        }
                    });

                    store.fillNode(store.getRootNode(), store.getProxy().getReader().readRecords(dummyData.children).getRecords());
                });

                describe("if records have been removed from the store", function() {
                    beforeEach(function() {
                        store.getNodeById(1).remove();
                        store.getNodeById(5).remove();
                        store.getNodeById(4).remove();
                    });
                    describe("if the node being loaded is the root node", function() {
                        beforeEach(function() {
                            loadStore(store);
                        });
                        it("should reset the store's removed array", function() {
                            expect(store.getRemovedRecords().length).toBe(0);
                        });
                    });
                    describe("if the node being loaded is not the root node", function() {
                        var removed;

                        beforeEach(function() {
                            loadStore(store, {node: store.getNodeById(2)});
                        });
                        it("should only remove records from the removed array that were previously descendants of the node being reloaded", function() {
                            removed = store.getRemovedRecords();

                            expect(removed.length).toBe(1);
                            expect(removed[0].getId()).toBe(1);
                        });
                    });
                    describe("if clearRemovedOnLoad is false", function() {
                        var removed;

                        beforeEach(function() {
                            store.clearRemovedOnLoad = false;
                            loadStore(store);
                        });
                        afterEach(function() {
                            store.clearRemovedOnLoad = true;
                        });
                        it("should not alter the store's removed array", function() {
                            removed = store.getRemovedRecords();

                            expect(removed.length).toBe(3);
                            expect(removed[0].getId()).toBe(1);
                            expect(removed[1].getId()).toBe(5);
                            expect(removed[2].getId()).toBe(4);
                        });
                    });

                });

            });

            describe("when the records in the response data have an index field", function() {
                beforeEach(function() {
                    dummyData = {
                        success: true,
                        children: [{
                                id: 1, 
                                name: "aaa", 
                                index: 2
                            },{
                                id: 2, 
                                name: "bbb", 
                                index: 0, 
                                children: [{
                                    id: 3, 
                                    name: "ccc", 
                                    index: 1
                                },{
                                    id: 4, 
                                    name: "ddd", 
                                    index: 0
                                }],
                                expanded: true
                            },{
                                id: 5, 
                                name: "eee", 
                                index: 1
                        }]
                    };

                    store = Ext.create('Ext.data.TreeStore', {
                        model: NodeModel,
                        root: {
                            expanded: true,
                            id: 0,
                            name: 'Root Node'
                        }
                    });

                    loadStore(store);
                });

                it("should sort the root level nodes by index", function() {
                    // use getRootNode (as opposed to new getter getRoot) to test backward compatibilty.
                    expect(store.getRootNode().childNodes[0].getId()).toBe(2);
                    expect(store.getRootNode().childNodes[1].getId()).toBe(5);
                    expect(store.getRootNode().childNodes[2].getId()).toBe(1);
                });

                it("should sort descendants by index", function() {
                    expect(store.getNodeById(2).firstChild.getId()).toBe(4);
                    expect(store.getNodeById(2).lastChild.getId()).toBe(3);
                });

                it("should sort folders first, then in index order", function() {
                    expect(store.getAt(0).getId()).toBe(2);
                    expect(store.getAt(1).getId()).toBe(4);
                    expect(store.getAt(2).getId()).toBe(3);
                    expect(store.getAt(3).getId()).toBe(5);
                    expect(store.getAt(4).getId()).toBe(1);
                });
            });
        });
        
        describe("clearOnLoad", function(){
            
            beforeEach(function(){
                store = Ext.create('Ext.data.TreeStore', {
                    model: NodeModel,
                    root: {
                        expanded: true,
                        id: 0,
                        name: 'Root Node'
                    }
                });
            });
            
            it("should remove existing nodes with clearOnLoad: true", function(){
                dummyData = {
                    children: []
                };
                var root = store.getRootNode();
                root.appendChild({
                    id: 'node1',
                    text: 'A'
                });
                
                root.appendChild({
                    id: 'node2',
                    text: 'B'
                });
                loadStore(store);
                expect(store.getRootNode().childNodes.length).toBe(0);
                expect(store.getNodeById('node1')).toBeNull();
                expect(store.getNodeById('node2')).toBeNull();
            });
            
            it("should leave existing nodes with clearOnLoad: false", function(){
                store.clearOnLoad = false;
                dummyData = {
                    children: []
                };    
                var root = store.getRootNode(),
                    childNodes = root.childNodes,
                    node1, node2;

                root.appendChild({
                    id: 'node1',
                    text: 'A'
                });
                node1 = childNodes[0];
                
                root.appendChild({
                    id: 'node2',
                    text: 'B'
                });
                node2 = childNodes[1];

                loadStore(store);
                expect(childNodes.length).toBe(2);
                expect(store.getNodeById('node1')).toBe(node1);
                expect(store.getNodeById('node2')).toBe(node2);
            });
            
            it("should ignore dupes with clearOnLoad: false", function(){
                store.clearOnLoad = false;
                dummyData = {
                    children: [{
                        id: 'node1',
                        text: 'A'
                    }, {
                        id: 'node3',
                        text: 'C'
                    }]
                };    
                var root = store.getRootNode();
                root.appendChild({
                    id: 'node1',
                    text: 'A'
                });
                
                root.appendChild({
                    id: 'node2',
                    text: 'B'
                });
                loadStore(store);
                expect(store.getRootNode().childNodes.length).toBe(3);
            });
        });
    });

    describe('adding data', function () {
        // See EXTJS-13509.
        var root, child;

        afterEach(function () {
            Ext.destroy(store);
            root = child =  null;
        });

        describe('adding non-leaf nodes with children', function () {
            var root, child;

            function doIt(desc, method) {
                describe(desc + ' an existing node', function () {
                    doAdd(method, false);
                    doAdd(method, true);
                });
            }

            function doAdd(method, expanded) {
                describe('expanded: ' + expanded.toString(), function () {
                    it('should add the node and create its child nodes', function () {
                        root[method]({
                            text: 'child',
                            expanded: expanded,
                            children: [{
                                text: 'detention',
                                expanded: expanded,
                                children: [{
                                    text: 'ben',
                                    leaf: true
                                }, {
                                    text: 'bill',
                                    leaf: true
                                }]
                            }]
                        });

                        child = store.getNewRecords()[0];
                        expect(child.childNodes.length).toBe(1);
                        expect(child.firstChild.childNodes.length).toBe(2);
                        expect(store.getNewRecords().length).toBe(4);
                    });

                    it('should mark the new nodes as "loaded"', function () {
                        expect(child.get('loaded')).toBe(true);
                        expect(child.firstChild.get('loaded')).toBe(true);
                    });
                });
            }

            beforeEach(function () {
                store = new Ext.data.TreeStore({
                    root: {
                        name: 'Root Node'
                    }
                });

                root = store.getRootNode();
            });

            doIt('appending to', 'appendChild');
            doIt('inserting before', 'insertBefore');
        });

        describe('adding childless non-leaf nodes', function () {
            beforeEach(function () {
                spyOn(Ext.data.TreeStore.prototype, 'load').andCallFake(function () {});

                store = new Ext.data.TreeStore({
                    model: NodeModel,
                    root: {
                        name: 'Root Node'
                    }
                });

                root = store.getRootNode();

                root.appendChild({
                    text: 'child2',
                    expanded: false
                });
            });

            it('should not make a request for data when expanded', function () {
                root.firstChild.expand();
                expect(store.load).not.toHaveBeenCalled();
            });
        });
    });

    describe("modifying records", function() {
        it("should fire the update event and pass the store, record, type & modified fields", function() {
            store = new Ext.data.TreeStore({
                model: NodeModel,
                root: {
                    expanded: true,
                    text: 'Root',
                    children: [{
                        text: 'A child',
                        someProp: 'a'
                    }]
                }
            });

            var rec = store.getRoot().firstChild,
                spy = jasmine.createSpy();

            store.on('update', spy);
            rec.set('someProp', 'b');
            expect(spy).toHaveBeenCalled();
            var args = spy.mostRecentCall.args;
            expect(args[0]).toBe(store);
            expect(args[1]).toBe(rec);
            expect(args[2]).toBe(Ext.data.Model.EDIT);
            expect(args[3]).toEqual(['someProp']);
        });

        it("should fire the update event and pass the store, record, type & modified fields when attached to another store", function() {
            store = new Ext.data.TreeStore({
                model: NodeModel,
                root: {
                    expanded: true,
                    text: 'Root',
                    children: [{
                        text: 'A child',
                        someProp: 'a'
                    }]
                }
            });

            var rec = store.getRoot().firstChild,
                spy = jasmine.createSpy();

            var other = new Ext.data.Store({
                model: NodeModel,
                data: [rec]
            });

            store.on('update', spy);
            rec.set('someProp', 'b');
            expect(spy).toHaveBeenCalled();
            var args = spy.mostRecentCall.args;
            expect(args[0]).toBe(store);
            expect(args[1]).toBe(rec);
            expect(args[2]).toBe(Ext.data.Model.EDIT);
            expect(args[3]).toEqual(['someProp']);
        });
    });

    describe("saving data", function() {
        var record, records, syncSpy;

        beforeEach(function() {
            store = Ext.create('Ext.data.TreeStore', {
                model: NodeModel,
                root: {
                    expanded: true,
                    name: 'Root Node'
                }
            });

            loadStore(store);

            // If overriding the sync, we need to clear the needsSync flag so that future endUpdate calls do not sync again
            syncSpy = spyOn(store, 'sync').andCallFake(function() {
                this.needsSync = false;
            });
        });

        describe("creating records", function() {
            describe("appending a single node", function() {
                beforeEach(function() {
                    record = new NodeModel({name: 'Phil'});
                    store.getRootNode().appendChild(record);
                });

                it("should add the node to getNewRecords", function() {
                    records = store.getNewRecords();
                    expect(records.length).toBe(1);
                    expect(records[0]).toBe(record);
                });

                it("should not add anything to getUpdatedRecords", function() {
                    expect(store.getUpdatedRecords().length).toBe(0);
                });

                it("should not sync the store", function() {
                    expect(syncSpy).not.toHaveBeenCalled();
                });
            });

            describe("inserting a single node", function() {
                beforeEach(function() {
                    record = new NodeModel({name: 'Phil'});
                    store.getNodeById(2).insertBefore(record, store.getNodeById(4));
                });

                it("should add the node to getNewRecords", function() {
                    records = store.getNewRecords();
                    expect(records.length).toBe(1);
                    expect(records[0]).toBe(record);
                });

                it("should not add any records to getUpdatedRecords", function() {
                    expect(store.getUpdatedRecords().length).toBe(0);
                });

                it("should not sync the store", function() {
                    expect(syncSpy).not.toHaveBeenCalled();
                });
            });

            describe("appending and inserting multiple nodes", function() {
                var record1, record2, record3;

                beforeEach(function() {
                    record1 = new NodeModel({name: '1'});
                    record2 = new NodeModel({name: '2'});
                    record3 = new NodeModel({name: '3'});


                    store.getRootNode().appendChild(record1);
                    store.getNodeById(2).insertBefore(record2, store.getNodeById(4));
                    record2.appendChild(record3);
                });

                it("should add the nodes to getNewRecords", function() {
                    var newRecords = store.getNewRecords();
                    expect(newRecords.length).toBe(3);
                    expect(Ext.Array.contains(newRecords, record1)).toBe(true);
                    expect(Ext.Array.contains(newRecords, record2)).toBe(true);
                    expect(Ext.Array.contains(newRecords, record3)).toBe(true);
                });

                it("should not add any records to getUpdatedRecords", function() {
                    expect(store.getUpdatedRecords().length).toBe(0);
                });

                it("should not sync the store", function() {
                    expect(syncSpy).not.toHaveBeenCalled();
                });
            });

            describe("when the index field is persistent", function() {
                beforeEach(function() {
                    NodeModel.getField('index').persist = true;
                });
                afterEach(function() {
                    NodeModel.getField('index').persist = false;
                });

                describe("appending a single node", function() {
                    beforeEach(function() {
                        record = new NodeModel({name: 'Phil'});
                        store.getRootNode().appendChild(record);
                    });

                    it("should add the node to getNewRecords", function() {
                        records = store.getNewRecords();
                        expect(records.length).toBe(1);
                        expect(records[0]).toBe(record);
                    });

                    it("should not add any records to getUpdatedRecords", function() {
                        expect(store.getUpdatedRecords().length).toBe(0);
                    });
                });

                describe("inserting a single node", function() {
                    beforeEach(function() {
                        record = new NodeModel({name: 'Phil'});
                        store.getNodeById(2).insertBefore(record, store.getNodeById(3));
                    });

                    it("should add the node to getNewRecords", function() {
                        records = store.getNewRecords();
                        expect(records.length).toBe(1);
                        expect(records[0]).toBe(record);
                    });

                    it("should add all of its sibling nodes that come after the insertion point to getUpdatedRecords", function() {
                        records = store.getUpdatedRecords();
                        expect(records.length).toBe(2);
                        expect(Ext.Array.contains(records, store.getNodeById(3))).toBe(true);
                        expect(Ext.Array.contains(records, store.getNodeById(4))).toBe(true);
                    });
                });
            });

            describe("when autoSync is true", function() {
                beforeEach(function() {
                    store.autoSync = true;
                });

                describe("appending a single node", function() {
                    beforeEach(function() {
                        record = new NodeModel({name: 'Phil'});
                        store.getRootNode().appendChild(record);
                    });

                    it("should sync the store", function() {
                        expect(syncSpy.callCount).toBe(1);
                    });
                });

                describe("inserting a single node", function() {
                    beforeEach(function() {
                        record = new NodeModel({name: 'Phil'});
                        store.getNodeById(2).insertBefore(record, store.getNodeById(4));
                    });

                    it("should sync the store", function() {
                        expect(syncSpy.callCount).toBe(1);
                    });
                });
            });
        });

        describe("updating records", function() {
            describe("updating multiple records", function() {
                beforeEach(function() {
                    store.getNodeById(2).set('name', '222');
                    store.getNodeById(3).set('name', '333');
                });

                it("should add the nodes to getUpdatedRecords", function() {
                    records = store.getUpdatedRecords();
                    expect(records.length).toBe(2);
                    expect(Ext.Array.contains(records, store.getNodeById(2))).toBe(true);
                    expect(Ext.Array.contains(records, store.getNodeById(3))).toBe(true);
                });

                it("should not sync the store", function() {
                    expect(syncSpy).not.toHaveBeenCalled();
                });
            });

            describe("moving records", function() {
                describe("within the same parent node", function() {
                    beforeEach(function() {
                        store.getRootNode().insertBefore(store.getNodeById(6), store.getNodeById(1));
                    });

                    it("should not add any records to getUpdatedRecords", function() {
                        expect(store.getUpdatedRecords().length).toBe(0);
                    });

                    it("should not sync the store", function() {
                        expect(syncSpy).not.toHaveBeenCalled();
                    });
                });

                describe("to a different parent node", function() {
                    beforeEach(function() {
                        store.getNodeById(4).insertBefore(store.getNodeById(1), store.getNodeById(5));
                    });

                    it("should add the node to getUpdatedRecords", function() {
                        records = store.getUpdatedRecords();
                        expect(records.length).toBe(1);
                        expect(records[0]).toBe(store.getNodeById(1));
                    });

                    it("should not sync the store", function() {
                        expect(syncSpy).not.toHaveBeenCalled();
                    });
                });
            });

            describe("moving records when the index field is persistent", function() {
                beforeEach(function() {
                    NodeModel.getField('index').persist = true;
                });
                afterEach(function() {
                    NodeModel.getField('index').persist = false;
                });

                describe("within the same parent node", function() {
                    beforeEach(function() {
                        store.getRootNode().insertBefore(store.getNodeById(6), store.getNodeById(1));
                    });

                    it("should add the node and all sibling nodes after it to getUpdatedRecords", function() {
                        records = store.getUpdatedRecords();
                        expect(records.length).toBe(3);
                        expect(Ext.Array.contains(records, store.getNodeById(1))).toBe(true);
                        expect(Ext.Array.contains(records, store.getNodeById(2))).toBe(true);
                        expect(Ext.Array.contains(records, store.getNodeById(6))).toBe(true);
                    });
                });

                describe("to a different parent node", function() {
                    beforeEach(function() {
                        store.getNodeById(4).insertBefore(store.getNodeById(1), store.getNodeById(5));
                    });

                    it("should add the node, all sibling nodes after it's insertion point, and all siblings after its removal point to getUpdatedRecords", function() {
                        records = store.getUpdatedRecords();
                        expect(records.length).toBe(4);
                        expect(Ext.Array.contains(records, store.getNodeById(1))).toBe(true);
                        expect(Ext.Array.contains(records, store.getNodeById(2))).toBe(true);
                        expect(Ext.Array.contains(records, store.getNodeById(5))).toBe(true);
                        expect(Ext.Array.contains(records, store.getNodeById(6))).toBe(true);
                    });
                });
            });

            describe("moving records when autoSync is true", function() {
                beforeEach(function() {
                    store.autoSync = true;
                });

                describe("within the same parent node", function() {
                    beforeEach(function() {
                        store.getRootNode().insertBefore(store.getNodeById(6), store.getNodeById(1));
                    });

                    // The parentId field is persistent. Has not been changed in this case.
                    it("should not sync the store", function() {
                        expect(syncSpy).not.toHaveBeenCalled();
                    });
                });

                describe("to a different parent node", function() {
                    beforeEach(function() {
                        store.getNodeById(4).insertBefore(store.getNodeById(1), store.getNodeById(5));
                    });

                    // The parentId field is persistent. Has been changed, so store is dirty
                    it("should sync the store", function() {
                        expect(syncSpy.callCount).toBe(1);
                    });
                });

                describe("to a different TreeStore", function() {
                    var otherStore,
                        otherSyncSpy;

                    beforeEach(function() {
                        otherStore = Ext.create('Ext.data.TreeStore', {
                            model: NodeModel,
                            root: {
                                expanded: true,
                                name: 'Root Node'
                            },
                            autoSync: true
                        });
                        otherSyncSpy = spyOn(otherStore, 'sync').andCallFake(function() {
                            this.needsSync = false;
                        });
                        otherStore.getRootNode().appendChild(store.getNodeById(1));
                    });
                    afterEach(function() {
                        otherStore.destroy();
                    });

                    it("should sync both the stores", function() {
                        expect(syncSpy.callCount).toBe(1);
                        expect(otherSyncSpy.callCount).toBe(1);
                    });
                });
                
            });
        });

        describe("removing records", function() {
            describe("removing a single record", function() {
                beforeEach(function() {
                    record = store.getNodeById(1).remove();
                });

                it("should add the node to getRemovedRecords", function() {
                    records = store.getRemovedRecords();
                    expect(records.length).toBe(1);
                    expect(records[0]).toBe(record);
                });

                it("should not add any records to getUpdatedRecords", function() {
                    expect(store.getUpdatedRecords().length).toBe(0);
                });

                it("should not sync the store", function() {
                    expect(syncSpy).not.toHaveBeenCalled();
                });
                
                it("should not add phantom records to the removed collection", function(){
                    var node = new NodeModel(),
                        root = store.getRootNode();
                        
                    root.appendChild(node);
                    root.removeChild(node);
                    expect(Ext.Array.contains(store.getRemovedRecords(), node)).toBe(false); 
                });
            });

            describe("removing multiple records", function() {
                var record2;

                beforeEach(function() {
                    record = store.getNodeById(1).remove();
                    record2 = store.getNodeById(4).remove();
                });

                it("should add the nodes to getRemovedRecords", function() {
                    records = store.getRemovedRecords();

                    // 1, 4, and 4's sole child 5 should be in the removed list.
                    expect(records.length).toBe(3);
                    expect(Ext.Array.contains(records, record)).toBe(true);
                    expect(Ext.Array.contains(records, record2)).toBe(true);
                });

                it("should not add any records to getUpdatedRecords", function() {
                    expect(store.getUpdatedRecords().length).toBe(0);
                });

                it("should not sync the store", function() {
                    expect(syncSpy).not.toHaveBeenCalled();
                });
            });


            describe("when the index field is persistent", function() {
                beforeEach(function() {
                    NodeModel.getField('index').persist = true;
                });
                afterEach(function() {
                    NodeModel.getField('index').persist = false;
                });

                describe("removing a single record", function() {
                    beforeEach(function() {
                        record = store.getNodeById(1).remove();
                    });

                    it("should add the node to getRemovedRecords", function() {
                        records = store.getRemovedRecords();
                        expect(records.length).toBe(1);
                        expect(records[0]).toBe(record);
                    });

                    it("should add all siblings after the node's removal point to getUpdatedRecords", function() {
                        records = store.getUpdatedRecords();
                        expect(records.length).toBe(2);
                        expect(Ext.Array.contains(records, store.getNodeById(2))).toBe(true);
                        expect(Ext.Array.contains(records, store.getNodeById(6))).toBe(true);
                    });
                });
            });

            describe("when autoSync is true", function() {
                beforeEach(function() {
                    store.autoSync = true;
                });

                describe("removing a single record", function() {
                    beforeEach(function() {
                        store.getNodeById(1).remove();
                    });

                    it("should sync the store", function() {
                        expect(syncSpy.callCount).toBe(1);
                    });
                });
            });
        });

        describe("sorting", function() {
            var sortByNameDesc = function(node1, node2) {
                var name1 = node1.data.name,
                    name2 = node2.data.name;

                return name1 < name2 ? 1 : node1 === node2 ? 0 : -1;
            };

            describe("when sorting recursively", function() {
                beforeEach(function() {
                    store.getRootNode().sort(sortByNameDesc, true);
                });

                it("should not add any records to getUpdatedRecords", function() {
                    expect(store.getUpdatedRecords().length).toBe(0);
                });
            });

            describe("when sorting non-recursively", function() {
                beforeEach(function() {
                    store.getRootNode().sort(sortByNameDesc);
                });

                it("should not add any records to getUpdatedRecords", function() {
                    expect(store.getUpdatedRecords().length).toBe(0);
                });
            });

            describe("when the index field is persistent and autoSync is true", function() {
                beforeEach(function() {
                    NodeModel.getField('index').persist = true;
                    store.autoSync = true;
                });
                afterEach(function() {
                    NodeModel.getField('index').persist = false;
                });

                describe("when sorting recursively", function() {
                    beforeEach(function() {
                        store.getRootNode().sort(sortByNameDesc, true);
                    });

                    it("should add all nodes at all levels that had an index change to getUpdatedRecords", function() {
                        records = store.getUpdatedRecords();
                        expect(records.length).toBe(4);
                        expect(Ext.Array.contains(records, store.getNodeById(1))).toBe(true);
                        expect(Ext.Array.contains(records, store.getNodeById(3))).toBe(true);
                        expect(Ext.Array.contains(records, store.getNodeById(4))).toBe(true);
                        expect(Ext.Array.contains(records, store.getNodeById(6))).toBe(true);
                    });

                    it("should sync the store", function() {
                        expect(syncSpy.callCount).toBe(1);
                    });
                });

                describe("when sorting non-recursively", function() {
                    beforeEach(function() {
                        store.getRootNode().sort(sortByNameDesc);
                    });

                    it("should add all nodes at depth 1 that had an index change to getUpdatedRecords", function() {
                        records = store.getUpdatedRecords();
                        expect(records.length).toBe(2);
                        expect(Ext.Array.contains(records, store.getNodeById(1))).toBe(true);
                        expect(Ext.Array.contains(records, store.getNodeById(6))).toBe(true);
                    });

                    it("should sync the store", function() {
                        expect(syncSpy.callCount).toBe(1);
                    });
                });
            });
        });
    });

    describe('Loading TreeStore using root config', function() {
        it('should load the root nodes children using Proxy\'s "root" config', function() {
            // Suppress console error
            spyOn(Ext.log, 'error');
            var store = Ext.create('Ext.data.TreeStore', {
                root: {
                    expanded: true,
                    CHILDREN: [
                        { text: "detention", leaf: true },
                        { text: "homework", expanded: true, CHILDREN: [
                            { text: "book report", leaf: true },
                            { text: "alegrbra", leaf: true}
                        ] },
                        { text: "buy lottery tickets", leaf: true }
                    ]
                },
                proxy: {
                    type: "memory",
                    reader: {
                        type: "json",
                        rootProperty: "CHILDREN"
                    }
                }
            });
            var cn = store.getRootNode().childNodes;
            expect(cn.length).toBe(3);
            expect(cn[0].childNodes.length).toBe(0);
            expect(cn[1].childNodes.length).toBe(2);
            expect(cn[2].childNodes.length).toBe(0);
        });
    });
    
    describe("default node id", function() {
        it('Should use generate an ID if the idProperty is null in the incoming data', function() {
            store = Ext.create('Ext.data.TreeStore', {
                model: TaskModel,
                defaultRootId: null,
                root : {
                }
            });
            expect(store.getRootNode().getId()).not.toBeNull();
        });
        it('Should use "root" as the defaultRootId, and parse that according to the idProperty field type', function() {
            // The idProperty field is an int, so this should raise an error
            expect(function() {
                store = Ext.create('Ext.data.TreeStore', {
                    model: TaskModel,
                    root : {
                    }
                });
            }).toRaiseExtError();
        });

        it('Should use the configured defaultRootId, and parse that according to the idProperty field type', function() {
            store = Ext.create('Ext.data.TreeStore', {
                model: TaskModel,
                defaultRootId: -1,
                root : {
                }
            });
            expect(store.getRootNode().getId()).toBe(-1);
        });
    });
    
    describe('moving root node between trees', function() {
        it('should move root and all descendants from source tree into destination tree', function() {
            var store = Ext.create('Ext.data.TreeStore', {
                    root: {
                        expanded: true, 
                        children: [{
                            text: "Test",
                            leaf: true,
                            id: 'testId'
                        }]
                    },
                    listeners: {
                        rootchange: function(newRoot, oldRoot) {
                            oldStoreRootChangeArgs = [newRoot, oldRoot];
                        },
                        refresh: function() {
                            storeRefreshed++;
                        },
                        add: function() {
                            added++;
                        },
                        remove: function() {
                            removed++;
                        }
                    }
                }),
                rootNode = store.getRootNode(),
                childNode = rootNode.firstChild,
                store2 = Ext.create('Ext.data.TreeStore', {
                    listeners: {
                        rootchange: function(newRoot, oldRoot) {
                            newStoreRootChangeArgs = [newRoot, oldRoot];
                        },
                        refresh: function() {
                            store2Refreshed++;
                        },
                        add: function() {
                            added++;
                        },
                        remove: function() {
                            removed++;
                        }
                    },
                    root: {
                    }
                }),
                storeRefreshed = 0,
                store2Refreshed = 0,
                added = 0,
                removed = 0,
                store2Root = store2.getRootNode(),
                oldStoreRootChangeArgs = [],
                newStoreRootChangeArgs = [];

            // TreeStore set up as expected
            expect(rootNode.rootOf === store.tree).toBe(true);
            expect(store.getNodeById('testId') === childNode).toBe(true);

            // Move the root to a new TreeStore and check it's set up as expected.
            store2.setRootNode(rootNode);

            // Old store has gone from rootNode to null
            expect(oldStoreRootChangeArgs[0]).toEqual(null);
            expect(oldStoreRootChangeArgs[1]).toEqual(rootNode);

            // Second store has gone from store2Root to rootNode
            expect(newStoreRootChangeArgs[0]).toEqual(rootNode);
            expect(newStoreRootChangeArgs[1]).toEqual(store2Root);

            // Both stores should fire a refresh event
            expect(storeRefreshed).toBe(1);
            expect(store2Refreshed).toBe(1);

            // Add and remove events should be suspended for the root change operation
            expect(added).toBe(0);
            expect(removed).toBe(0);

            expect(rootNode.rootOf === store2.tree).toBe(true);
            expect(store2.getRootNode() === rootNode).toBe(true);
            expect(store2.getNodeById('testId') === childNode).toBe(true);

            // Child node must not be registered with the old TreeStore
            expect(store.getNodeById('testId')).toBeFalsy();

            // Old TreeStore must not have a root
            expect(store.getRootNode()).toBeFalsy();
        });
    });

    describe('Node events bubbled to the root node', function() {

        var spy,
            root,
            newNode,
            removedNode,
            firstChild,
            spyArgs;

        beforeEach(function() {
            store = new Ext.data.TreeStore({
                root: {
                    text: 'Root 1',
                    expanded: true,
                    children: [{
                        text: 'Child 1',
                        leaf: true
                    }, {
                        text: 'Child 2',
                        leaf: true
                    }, {
                        text: 'Child 3',
                        leaf: true
                    }, {
                        text: 'Child 4',
                        leaf: true
                    }]
                }
            });
            root = store.getRootNode();
        });

        it('should fire insert event', function() {

            // Node events are NOT bubbled up to the TreeStore level, only as far as the root
            spy = spyOnEvent(root, "insert").andCallThrough();
            firstChild = root.firstChild;
            newNode = root.insertBefore({
                text: 'New First'
            }, firstChild);
            spyArgs = spy.calls[0].args;
            expect(spy.calls.length).toBe(1);
            expect(spyArgs[0]).toBe(root);
            expect(spyArgs[1]).toBe(newNode);
            expect(spyArgs[2]).toBe(firstChild);
        });

        it('should fire append event', function() {

            // Node events are NOT bubbled up to the TreeStore level, only as far as the root
            spy = spyOnEvent(root, "append").andCallThrough();
            newNode = root.appendChild({
                text: 'New Last'
            });
            spyArgs = spy.calls[0].args;
            expect(spy.calls.length).toBe(1);
            expect(spyArgs[0]).toBe(root);
            expect(spyArgs[1]).toBe(newNode);
            expect(spyArgs[2]).toBe(4);
        });

        it('should fire remove event', function() {
            var context;

            // Node events are NOT bubbled up to the TreeStore level, only as far as the root
            spy = spyOnEvent(root, "remove").andCallThrough();
            removedNode = root.removeChild(root.childNodes[1]);
            spyArgs = spy.calls[0].args;
            expect(spy.calls.length).toBe(1);
            expect(spyArgs[0]).toBe(root);
            expect(spyArgs[1]).toBe(removedNode);
            expect(spyArgs[2]).toBe(false);

            // Context arguments: where the removed node came from
            context = spyArgs[3];
            expect(context.parentNode).toBe(root);
            expect(context.previousSibling).toBe(root.childNodes[0]);
            expect(context.nextSibling).toBe(root.childNodes[1]);
        });

        it('should fire update event', function() {
            spy = spyOnEvent(store, "update").andCallThrough();
            root.firstChild.set('text', 'New Text');
            spyArgs = spy.calls[0].args;
            expect(spy.calls.length).toBe(1);
            expect(spyArgs[0]).toBe(store);
            expect(spyArgs[1]).toBe(root.firstChild);
            expect(spyArgs[2]).toBe("edit");
            expect(spyArgs[3]).toEqual(["text"]);
        });


        it('should fire "load" event with valid 5-argument signature', function() {
            spy = spyOnEvent(store, "load").andCallThrough();
            loadStore(store);
            spyArgs = spy.calls[0].args;
            expect(spy.calls.length).toBe(1);
            expect(spyArgs.length).toBe(5);

            // validating args: [ store, records[], success, operation, node]
            expect(spyArgs[0]).toBe(store);
            expect(Ext.isArray(spyArgs[1])).toBe(true);
            expect(typeof spyArgs[2]).toBe('boolean');
            expect(spyArgs[3].isReadOperation).toBe(true);
            expect(spyArgs[4]).toBe(root);

        });

        it('should fire "beforeload" event with valid 2-argument signature', function() {
            spy = spyOnEvent(store, "beforeload").andCallThrough();
            loadStore(store);
            spyArgs = spy.calls[0].args;
            expect(spy.calls.length).toBe(1);
            expect(spyArgs.length).toBe(2);

            // validating args: [ store, data.Operation, object, eOptsObject ]
            expect(spyArgs[0]).toBe(store);
            expect(spyArgs[1] && spyArgs[1].isReadOperation).toBe(true);
        });

        describe('event ordering', function() {
            it('should fire events in the correct order', function() {
                store = new Ext.data.TreeStore({
                    root: {
                        text: 'Root 1',
                        expanded: true,
                        children: []
                    }
                });
                root = store.getRoot();

                var result = [],
                    nodeData = {
                        id: 'A',
                        leaf: false,
                        expanded: true,
                        children: [{
                            id: 'A.A',
                            leaf: true
                        }, {
                            id: 'A.B',
                            leaf: true
                        }, {
                            id: 'A.C',
                            leaf: false,
                            expanded: true,
                            children: [{
                                id: 'A.C.A',
                                leaf: true
                            }, {
                                id: 'A.C.B',
                                leaf: true
                            }]
                        }, {
                            id: 'A.D',
                            leaf: true
                        }]
                    };

                // Node events are NOT bubbled up to the TreeStore level, only as far as the root
                root.on('append', function(thisNode, newChildNode, index) {
                    result.push(newChildNode.getPath() + " | " + thisNode.getPath());
                });
                root.appendChild(nodeData);
                result = result.join(', ');
                expect(result).toBe("/root/A | /root, /root/A/A.A | /root/A, /root/A/A.B | /root/A, /root/A/A.C | /root/A, /root/A/A.C/A.C.A | /root/A/A.C, /root/A/A.C/A.C.B | /root/A/A.C, /root/A/A.D | /root/A");
                store.destroy();
            });
        });
    });
    
    describe('Node events bubbled to the TreeStore', function() {

        var spy,
            root,
            newNode,
            removedNode,
            firstChild,
            spyArgs;

        beforeEach(function() {
            store = new Ext.data.TreeStore({
                root: {
                    text: 'Root 1',
                    expanded: true,
                    children: [{
                        text: 'Child 1',
                        leaf: true
                    }, {
                        text: 'Child 2',
                        leaf: true
                    }, {
                        text: 'Child 3',
                        leaf: true
                    }, {
                        text: 'Child 4',
                        leaf: true
                    }]
                }
            });
            root = store.getRootNode();
        });

        // Node events fired through the TreeStore are prepended with "node"
        it('should fire insert event', function() {

            spy = spyOnEvent(store, "nodeinsert").andCallThrough();
            firstChild = root.firstChild;
            newNode = root.insertBefore({
                text: 'New First'
            }, firstChild);
            spyArgs = spy.calls[0].args;
            expect(spy.calls.length).toBe(1);
            expect(spyArgs[0]).toBe(root);
            expect(spyArgs[1]).toBe(newNode);
            expect(spyArgs[2]).toBe(firstChild);
        });

        // Node events fired through the TreeStore are prepended with "node"
        it('should fire append event', function() {

            spy = spyOnEvent(store, "nodeappend").andCallThrough();
            newNode = root.appendChild({
                text: 'New Last'
            });
            spyArgs = spy.calls[0].args;
            expect(spy.calls.length).toBe(1);
            expect(spyArgs[0]).toBe(root);
            expect(spyArgs[1]).toBe(newNode);
            expect(spyArgs[2]).toBe(4);
        });

        // Node events fired through the TreeStore are prepended with "node"
        it('should fire remove event', function() {

            spy = spyOnEvent(store, "noderemove").andCallThrough();
            removedNode = root.removeChild(root.firstChild);
            spyArgs = spy.calls[0].args;
            expect(spy.calls.length).toBe(1);
            expect(spyArgs[0]).toBe(root);
            expect(spyArgs[1]).toBe(removedNode);
            expect(spyArgs[2]).toBe(false);
        });

        describe('event ordering', function() {
            it('should fire events in the correct order', function() {

                store = new Ext.data.TreeStore({
                    root: {
                        text: 'Root 1',
                        expanded: true,
                        children: []
                    }
                });
                root = store.getRoot();

                var result = [],
                    nodeData = {
                        id: 'A',
                        leaf: false,
                        expanded: true,
                        children: [{
                            id: 'A.A',
                            leaf: true
                        }, {
                            id: 'A.B',
                            leaf: true
                        }, {
                            id: 'A.C',
                            leaf: false,
                            expanded: true,
                            children: [{
                                id: 'A.C.A',
                                leaf: true
                            }, {
                                id: 'A.C.B',
                                leaf: true
                            }]
                        }, {
                            id: 'A.D',
                            leaf: true
                        }]
                    };

                // Node events fired through the TreeStore are prepended with "node"
                store.on('nodeappend', function(thisNode, newChildNode, index) {
                    result.push(newChildNode.getPath() + " | " + thisNode.getPath());
                });

                root.appendChild(nodeData);
                result = result.join(', ');
                expect(result).toBe("/root/A | /root, /root/A/A.A | /root/A, /root/A/A.B | /root/A, /root/A/A.C | /root/A, /root/A/A.C/A.C.A | /root/A/A.C, /root/A/A.C/A.C.B | /root/A/A.C, /root/A/A.D | /root/A");
                store.destroy();
            });
        });
    });

    describe('events from descendants of collapsed nodes', function() {
        beforeEach(function() {
            store = Ext.create('Ext.data.TreeStore', {
                model: NodeModel,
                autoLoad: true,
                root: {
                    expanded: false,
                    id: 0,
                    name: 'Root Node',
                    autoLoad: true,
                    children: dummyData.children
                }
            });
        });
        it('should fire update events from descendants of collapsed nodes', function() {
            var updateSpy = spyOnEvent(store, 'update');

            store.getNodeById(5).set('name', 'modified');

            // Data notifications take precedance over filering
            expect(updateSpy).toHaveBeenCalled();
        });
    });

    describe('beforeload', function() {
    
        it('should not clear node descendants if a function bound to beforeload returns false', function() {
            var beforeLoadComplete = false;

            store = Ext.create('Ext.data.TreeStore', {
                model: NodeModel,
                autoLoad: false,
                root: {
                    expanded: false,
                    id: 0,
                    name: 'Root Node',
                    children: [{
                        id: 1
                    }]
                }
             });
                    
             store.on('beforeload', function(store) {
                 expect(store.getRootNode().firstChild).not.toBeNull();
                 beforeLoadComplete = true;
                 return false; 
             });
             
             store.load();
             
             waitsFor(function() {
                 return beforeLoadComplete;
             });
        });
    });

    describe('appending to leaf nodes', function() {
        beforeEach(function() {
            store = Ext.create('Ext.data.TreeStore', {
                model: NodeModel,
                root: {
                    expanded: true,
                    id: 0,
                    name: 'Root Node'
                }
            });
            store.fillNode(store.getRootNode(), store.getProxy().getReader().readRecords(dummyData.children).records);
        });
        it('should convert leaf nodes to branch nodes.', function() {
            var leaf = store.getNodeById(5);

            expect(leaf.isLeaf()).toBe(true);
            leaf.appendChild({
                name: 'eee-child'
            });
            expect(leaf.isLeaf()).toBe(false);
        });
    });

    describe("filtering", function() {
        function vis(node) {
            if (Ext.isNumber(node)) {
                node = byId(node);
            }
            return store.isVisible(node);
        }

        function idFilter(ids) {
            store.filter({
                filterFn: function(node) {
                    return Ext.Array.indexOf(ids, node.id) > -1;
                }
            });
        }

        describe("basic filtering", function() {
            it("should be able to provide a filter in the constructor", function() {
                makeStore([{
                    id: 1
                }, {
                    id: 2
                }], {
                    filters: [{
                        fn: function(rec) {
                            return rec.get('id') === 1;
                        }
                    }]
                });
                expect(vis(1)).toBe(true);
                expect(vis(2)).toBe(false);
            });

            it("should not show children of non matching nodes", function() {
                makeStore([{
                    id: 1,
                    children: [2, 3]
                }, {
                    id: 4,
                    children: [5, 6]
                }]);
                idFilter([2, 3, 4, 5, 6]);
                expect(vis(1)).toBe(false);
                expect(vis(2)).toBe(false);
                expect(vis(3)).toBe(false);
                expect(vis(4)).toBe(true);
                expect(vis(5)).toBe(true);
                expect(vis(6)).toBe(true);
            });

            it("should hide non-matching leaves", function() {
                makeStore([{
                    id: 1,
                    children: [2, 3]
                }, {
                    id: 4,
                    children: [5, 6]
                }]);
                idFilter([1, 4]);
                expect(vis(1)).toBe(true);
                expect(vis(2)).toBe(false);
                expect(vis(3)).toBe(false);
                expect(vis(4)).toBe(true);
                expect(vis(5)).toBe(false);
                expect(vis(6)).toBe(false);
            });

            it("should hide non-matching nodes at all levels", function() {
                makeStore([{
                    id: 1,
                    children: [{
                        id: 2,
                        children: [{
                            id: 3,
                            children: [{
                                id: 4,
                                children: [{
                                    id: 5
                                }]
                            }]
                        }]
                    }]
                }]);
                idFilter([1, 2]);
                expect(vis(1)).toBe(true);
                expect(vis(2)).toBe(true);
                expect(vis(3)).toBe(false);
                expect(vis(4)).toBe(false);
                expect(vis(5)).toBe(false);
            });

            it("should run the filters on all nodes (even if the parent is not visible) bottom up", function() {
                makeStore([{
                    id: 'n',
                    children: [{
                        id: 'h',
                        children: [{
                            id: 'c',
                            children: [{
                                id: 'a'
                            }, {
                                id: 'b'
                            }]
                        }, {
                            id: 'f',
                            children: [{
                                id: 'd'
                            }, {
                                id: 'e'
                            }]
                        }, {
                            id: 'g'
                        }]
                    }, {
                        id: 'm',
                        children: [{
                            id: 'i'
                        }, {
                            id: 'l',
                            children: [{
                                id: 'j'
                            }, {
                                id: 'k'
                            }]
                        }]
                    }]
                }, {
                    id: 'v',
                    children: [{
                        id: 'r',
                        children: [{
                            id: 'p',
                            children: [{
                                id: 'o'
                            }]
                        }, {
                            id: 'q'
                        }]
                    }, {
                        id: 'u',
                        children: [{
                            id: 's'
                        }, {
                            id: 't'
                        }]
                    }]
                }, {
                    id: 'z',
                    children: [{
                        id: 'x',
                        children: [{
                            id: 'w'
                        }]
                    }, {
                        id: 'y'
                    }]
                }]);

                var order = [];
                store.getFilters().add({
                    filterFn: function(node) {
                        if (!node.isRoot()) {
                            order.push(node.id);
                        }
                        return node.id !== 'h';
                    }
                });
                expect(order.join('')).toBe('abcdefghijklmnopqrstuvwxyz');
            });
        });

        describe("clearing filters", function() {
            it("should reset node visibility after clearing filters", function() {
                makeStore([{
                    id: 1,
                    children: [{
                        id: 2,
                        children: [3, 4]
                    }, {
                        id: 5
                    }, {
                        id: 6,
                        children: [{
                            id: 7,
                            children: [8, 9]
                        }]
                    }]
                }]);
                idFilter([1, 6]);
                expect(vis(1)).toBe(true);
                expect(vis(2)).toBe(false);
                expect(vis(3)).toBe(false);
                expect(vis(4)).toBe(false);
                expect(vis(5)).toBe(false);
                expect(vis(6)).toBe(true);
                expect(vis(7)).toBe(false);
                expect(vis(8)).toBe(false);
                expect(vis(9)).toBe(false);
                store.getFilters().removeAll();
                expect(vis(1)).toBe(true);
                expect(vis(2)).toBe(true);
                expect(vis(3)).toBe(true);
                expect(vis(4)).toBe(true);
                expect(vis(5)).toBe(true);
                expect(vis(6)).toBe(true);
                expect(vis(7)).toBe(true);
                expect(vis(8)).toBe(true);
                expect(vis(9)).toBe(true);
            });

            it("should not fire refresh or datachanged when passing suppressEvent", function() {
                makeStore([{
                    id: 1,
                    children: [{
                        id: 2,
                        children: [3, 4]
                    }, {
                        id: 5
                    }, {
                        id: 6,
                        children: [{
                            id: 7,
                            children: [8, 9]
                        }]
                    }]
                }]);
                idFilter([1, 6]);
                var spy = jasmine.createSpy();
                store.on('refresh', spy);
                store.on('datachanged', spy);
                store.clearFilter(true);
                expect(spy).not.toHaveBeenCalled();
            });
        });

        describe("root visibility", function() {
            describe("with rootVisible: true", function() {
                it("should show the root if any root childNodes are visible", function() {
                    makeStore([{
                        id: 1
                    }, {
                        id: 2
                    }, {
                        id: 3
                    }], {rootVisible: true});
                    idFilter([2]);
                    expect(vis(store.getRoot())).toBe(true);
                });

                it("should not show the root if no children match", function() {
                    makeStore([{
                        id: 1
                    }, {
                        id: 2
                    }], {rootVisible: true});
                    idFilter([3]);
                    expect(vis(store.getRoot())).toBe(false);
                });
            });
        });

        describe("dynamic manipulation", function() {
            describe("adding", function() {
                it("should not show nodes that are added to a filtered out node", function() {
                    makeStore([{
                        id: 1,
                        leaf: false
                    }]);
                    idFilter([2]);
                    byId(1).appendChild({
                        id: 2
                    });
                    expect(vis(2)).toBe(false);
                });

                it("should not show a node that does match the filter", function() {
                    makeStore([{
                        id: 1,
                        leaf: false
                    }]);
                    idFilter([1]);
                    byId(1).appendChild({
                        id: 2
                    });
                    expect(vis(2)).toBe(false);
                });

                it("should show if the added node matches the filter", function() {
                    makeStore([{
                        id: 1,
                        leaf: false
                    }]);
                    idFilter([1, 2]);
                    byId(1).appendChild({
                        id: 2
                    });
                    expect(vis(2)).toBe(true);
                });

                it("should filter out deep nodes that do not match", function() {
                    makeStore([{
                        id: 1,
                        leaf: false
                    }]);
                    idFilter([1, 2, 3, 4]);

                    var main = new Ext.data.TreeModel({
                        id: 2,
                        leaf: false,
                        expanded: true,
                        children: []
                    });
                    main.appendChild({
                        id: 3,
                        leaf: false,
                        expanded: true,
                        children: []
                    }).appendChild({
                        id: 4,
                        leaf: false,
                        expanded: true,
                        children: []
                    }).appendChild({
                        id: 5,
                        leaf: true
                    });

                    byId(1).appendChild(main);
                    expect(vis(2)).toBe(true);
                    expect(vis(3)).toBe(true);
                    expect(vis(4)).toBe(true);
                    expect(vis(5)).toBe(false);
                });
            });

            describe("updating", function() {
                it("should exclude a node when modifying it to not match the filter", function() {
                    makeStore([{
                        id: 1,
                        text: 'Foo'
                    }]);
                    store.getFilters().add({
                        property: 'text',
                        value: 'Foo'
                    });
                    byId(1).set('text', 'Bar');
                    expect(vis(1)).toBe(false);
                });

                it("should exclude children when the parent is filtered out", function() {
                    makeStore([{
                        id: 1,
                        text: 'Foo',
                        children: [{
                            id: 2,
                            text: 'Leaf'
                        }]
                    }]);
                    store.getFilters().add({
                        filterFn: function(node) {
                            if (node.isLeaf()) {
                                return true;
                            } else {
                                return node.data.text === 'Foo';
                            }
                        }
                    });
                    byId(1).set('text', 'Bar');
                    expect(vis(1)).toBe(false);
                    expect(vis(2)).toBe(false);
                });

                it("should include a node when modifying it to match the filter", function() {
                    makeStore([{
                        id: 1,
                        text: 'Foo'
                    }]);
                    store.getFilters().add({
                        property: 'text',
                        value: 'Bar'
                    });
                    byId(1).set('text', 'Bar');
                    expect(vis(1)).toBe(true);
                });

                it("should include children when the parent is filtered in", function() {
                    makeStore([{
                        id: 1,
                        text: 'Bar',
                        children: [{
                            id: 2,
                            text: 'Leaf'
                        }]
                    }]);
                    store.getFilters().add({
                        filterFn: function(node) {
                            if (node.isLeaf()) {
                                return true;
                            } else {
                                return node.data.text === 'Foo';
                            }
                        }
                    });
                    byId(1).set('text', 'Foo');
                    expect(vis(1)).toBe(true);
                    expect(vis(2)).toBe(true);
                });
            });
        });
    });
    
    describe('heterogeneous TreeStores', function() {
        var treeData,
            schema;

        beforeEach(function() {
            schema = Ext.data.Model.schema;
            schema.setNamespace('spec');

            Ext.define('spec.Territory', {
                extend: 'Ext.data.TreeModel',
                idProperty: 'territoryName',
                fields: [{
                    name: 'territoryName',
                    mapping: 'territoryName',
                    convert: undefined
                }]
            });
            Ext.define('spec.Country', {
                extend: 'Ext.data.TreeModel',
                idProperty: 'countryName',
                fields: [{
                    name: 'countryName',
                    mapping: 'countryName',
                    convert: undefined
                }]
            });
            Ext.define('spec.City', {
                extend: 'Ext.data.TreeModel',
                idProperty: 'cityName',
                fields: [{
                    name: 'cityName',
                    mapping: 'cityName',
                    convert: undefined
                }]
            });

            // Must renew the data each time. Because TreeStore mutates input data object by deleting
            // the childNodes in onBeforeNodeExpand and onNodeAdded. TODO: it shouldn't do that.
            // The heterogeneous models MUST have disparate, non-overlapping field names
            // so that we test that a correct, record-specific data extraction function
            // has been run on the different mtypes on the dataset.
            treeData = {
                children: [{
                    mtype: 'Territory',
                    territoryName: 'North America',
                    children :[{
                        mtype: 'Country',
                        countryName: 'USA',

                        // Test using both forms of classname, defaultNamespaced "City".
                        children: [{
                            mtype: 'spec.City',
                            cityName: 'Redwood City',
                            leaf: true
                        }, {
                            mtype: 'City',
                            cityName: 'Frederick, MD',
                            leaf: true
                        }]
                    }, {
                        mtype: 'Country',
                        countryName: 'Canada',
                        children: [{
                            mtype: 'spec.City',
                            cityName: 'Vancouver',
                            leaf: true
                        }, {
                            mtype: 'City',
                            cityName: 'Toronto',
                            leaf: true
                        }]
                    }]
                }, {
                    mtype: 'Territory',
                    territoryName: 'Europe, ME, Africa',
                    expanded: true,
                    children :[{
                        mtype: 'Country',
                        countryName: 'England',
                        children: [{
                            mtype: 'spec.City',
                            cityName: 'Nottingham',
                            leaf: true
                        }, {
                            mtype: 'City',
                            cityName: 'London',
                            leaf: true
                        }]
                    }, {
                        mtype: 'Country',
                        countryName: 'Netherlands',
                        children: [{
                            mtype: 'spec.City',
                            cityName: 'Amsterdam',
                            leaf: true
                        }, {
                            mtype: 'City',
                            cityName: 'Haaksbergen',
                            leaf: true
                        }]
                    }]
                }]
            };
        });
        afterEach(function() {
            Ext.undefine('spec.Territory');
            Ext.undefine('spec.Country');
            Ext.undefine('spec.City');
            schema.clear(true);
        });

        it("should use the parentNode's childType to resolve child node models if no typeProperty is used on Reader", function() {

            // Need a special root type which knows about the first level
            Ext.define('spec.World', {
                extend: 'Ext.data.TreeModel',
                childType: 'Territory'
            });
            // Set the childType on the prototypes.
            // So Territory chould always produce Country childNodes and Country should always produce City childNodes.
            spec.Territory.prototype.childType = 'Country';
            spec.Country.prototype.childType = 'City';

            store = new Ext.data.TreeStore({
                root: treeData,
                model: 'spec.World',
                proxy: {
                    type: 'memory'
                }
            });
            var root = store.getRootNode(),
                na = root.childNodes[0],
                emea = root.childNodes[1],
                spain,
                madrid,
                usa = na.childNodes[0],
                rwc = usa.childNodes[0],
                frederick = usa.childNodes[1],
                canada = na.childNodes[1],
                vancouver = canada.childNodes[0],
                toronto = canada.childNodes[1],
                sacramento = usa.appendChild({
                    cityName: 'Sacramento',
                    leaf: true
                });

            // Two top level nodes are North America and Europe, ME, Africa"
            expect(na instanceof spec.Territory).toBe(true);
            expect(emea instanceof spec.Territory).toBe(true);
            expect(na.get('territoryName')).toBe('North America');
            expect(emea.get('territoryName')).toBe('Europe, ME, Africa');

            expect(usa instanceof spec.Country).toBe(true);
            expect(canada instanceof spec.Country).toBe(true);
            expect(usa.get('countryName')).toBe('USA');
            expect(canada.get('countryName')).toBe('Canada');

            expect(rwc instanceof spec.City).toBe(true);
            expect(frederick instanceof spec.City).toBe(true);
            expect(sacramento instanceof spec.City).toBe(true);
            expect(vancouver instanceof spec.City).toBe(true);
            expect(toronto instanceof spec.City).toBe(true);
            expect(rwc.get('cityName')).toBe('Redwood City');
            expect(frederick.get('cityName')).toBe('Frederick, MD');
            expect(sacramento.get('cityName')).toBe('Sacramento');
            expect(vancouver.get('cityName')).toBe('Vancouver');
            expect(toronto.get('cityName')).toBe('Toronto');

            // Check that the Model converts raw configs correctly according to the
            // typeProperty in the TreeStore
            spain = emea.appendChild({
                mtype: 'Country',
                countryName: 'Spain'
            });
            expect(spain instanceof spec.Country).toBe(true);
            expect(spain.get('countryName')).toBe('Spain');

            madrid = spain.appendChild({
                mtype: 'City',
                cityName: 'Madrid'
            });
            expect(madrid instanceof spec.City).toBe(true);
            expect(madrid.get('cityName')).toBe('Madrid');
        });

        it("should use the store's model namespace to resolve child node models if short form typeProperty is used", function() {
            store = new Ext.data.TreeStore({
                model: 'spec.Territory',
                root: treeData,
                proxy: {
                    type: 'memory',
                    reader: {
                        typeProperty: 'mtype'
                    }
                }
            });
            var root = store.getRootNode(),
                na = root.childNodes[0],
                emea = root.childNodes[1],
                spain,
                madrid,
                usa = na.childNodes[0],
                rwc = usa.childNodes[0],
                frederick = usa.childNodes[1],
                canada = na.childNodes[1],
                vancouver = canada.childNodes[0],
                toronto = canada.childNodes[1];

            // Two top level nodes are North America and Europe, ME, Africa"
            expect(na instanceof spec.Territory).toBe(true);
            expect(emea instanceof spec.Territory).toBe(true);
            expect(na.get('territoryName')).toBe('North America');
            expect(emea.get('territoryName')).toBe('Europe, ME, Africa');

            expect(usa instanceof spec.Country).toBe(true);
            expect(canada instanceof spec.Country).toBe(true);
            expect(usa.get('countryName')).toBe('USA');
            expect(canada.get('countryName')).toBe('Canada');

            expect(rwc instanceof spec.City).toBe(true);
            expect(frederick instanceof spec.City).toBe(true);
            expect(vancouver instanceof spec.City).toBe(true);
            expect(toronto instanceof spec.City).toBe(true);
            expect(rwc.get('cityName')).toBe('Redwood City');
            expect(frederick.get('cityName')).toBe('Frederick, MD');
            expect(vancouver.get('cityName')).toBe('Vancouver');
            expect(toronto.get('cityName')).toBe('Toronto');

            // Check that the Model converts raw configs correctly according to the
            // typeProperty in the TreeStore
            spain = emea.appendChild({
                mtype: 'Country',
                countryName: 'Spain'
            });
            expect(spain instanceof spec.Country).toBe(true);
            expect(spain.get('countryName')).toBe('Spain');

            madrid = spain.appendChild({
                mtype: 'City',
                cityName: 'Madrid'
            });
            expect(madrid instanceof spec.City).toBe(true);
            expect(madrid.get('cityName')).toBe('Madrid');
        });

        it("should use the typeProperty's namespace property to resolve model class names", function() {
            var data = Ext.clone(treeData);

            // Remove all usages of namespace.
            // It gets added.
            data.children[0].children[0].children[0].mtype = 'City';
            data.children[0].children[1].children[0].mtype = 'City';
            data.children[1].children[0].children[0].mtype = 'City';
            data.children[1].children[1].children[0].mtype = 'City';
            
            store = new Ext.data.TreeStore({
                root: data,
                proxy: {
                    type: 'memory',
                    reader: {
                        typeProperty: {
                            name: 'mtype',
                            namespace: 'spec'
                        }
                    }
                }
            });
            var root = store.getRootNode(),
                na = root.childNodes[0],
                emea = root.childNodes[1],
                spain,
                madrid,
                usa = na.childNodes[0],
                rwc = usa.childNodes[0],
                frederick = usa.childNodes[1],
                canada = na.childNodes[1],
                vancouver = canada.childNodes[0],
                toronto = canada.childNodes[1];

            expect(na instanceof spec.Territory).toBe(true);
            expect(emea instanceof spec.Territory).toBe(true);
            expect(na.get('territoryName')).toBe('North America');
            expect(emea.get('territoryName')).toBe('Europe, ME, Africa');

            expect(usa instanceof spec.Country).toBe(true);
            expect(canada instanceof spec.Country).toBe(true);
            expect(usa.get('countryName')).toBe('USA');
            expect(canada.get('countryName')).toBe('Canada');

            expect(rwc instanceof spec.City).toBe(true);
            expect(frederick instanceof spec.City).toBe(true);
            expect(vancouver instanceof spec.City).toBe(true);
            expect(toronto instanceof spec.City).toBe(true);
            expect(rwc.get('cityName')).toBe('Redwood City');
            expect(frederick.get('cityName')).toBe('Frederick, MD');
            expect(vancouver.get('cityName')).toBe('Vancouver');
            expect(toronto.get('cityName')).toBe('Toronto');

            // Check that the Model converts raw configs correctly according to the
            // typeProperty in the TreeStore
            spain = emea.appendChild({
                mtype: 'Country',
                countryName: 'Spain'
            });
            expect(spain instanceof spec.Country).toBe(true);
            expect(spain.get('countryName')).toBe('Spain');

            madrid = spain.appendChild({
                mtype: 'City',
                cityName: 'Madrid'
            });
            expect(madrid instanceof spec.City).toBe(true);
            expect(madrid.get('cityName')).toBe('Madrid');
        });

        it("should use the typeProperty's map property to resolve model class names", function() {
            store = new Ext.data.TreeStore({
                root: treeData,
                proxy: {
                    type: 'memory',
                    reader: {
                        typeProperty: {
                            name: 'mtype',
                            map: {
                                Territory: 'Territory',
                                Country: 'Country',
                                City: 'City'
                            }
                        }
                    }
                }
            });
            var root = store.getRootNode(),
                na = root.childNodes[0],
                emea = root.childNodes[1],
                spain,
                madrid,
                usa = na.childNodes[0],
                rwc = usa.childNodes[0],
                frederick = usa.childNodes[1],
                canada = na.childNodes[1],
                vancouver = canada.childNodes[0],
                toronto = canada.childNodes[1];

            expect(na instanceof spec.Territory).toBe(true);
            expect(emea instanceof spec.Territory).toBe(true);
            expect(na.get('territoryName')).toBe('North America');
            expect(emea.get('territoryName')).toBe('Europe, ME, Africa');

            expect(usa instanceof spec.Country).toBe(true);
            expect(canada instanceof spec.Country).toBe(true);
            expect(usa.get('countryName')).toBe('USA');
            expect(canada.get('countryName')).toBe('Canada');

            expect(rwc instanceof spec.City).toBe(true);
            expect(frederick instanceof spec.City).toBe(true);
            expect(vancouver instanceof spec.City).toBe(true);
            expect(toronto instanceof spec.City).toBe(true);
            expect(rwc.get('cityName')).toBe('Redwood City');
            expect(frederick.get('cityName')).toBe('Frederick, MD');
            expect(vancouver.get('cityName')).toBe('Vancouver');
            expect(toronto.get('cityName')).toBe('Toronto');

            // Check that the Model converts raw configs correctly according to the
            // typeProperty in the TreeStore
            spain = emea.appendChild({
                mtype: 'Country',
                countryName: 'Spain'
            });
            expect(spain instanceof spec.Country).toBe(true);
            expect(spain.get('countryName')).toBe('Spain');

            madrid = spain.appendChild({
                mtype: 'City',
                cityName: 'Madrid'
            });
            expect(madrid instanceof spec.City).toBe(true);
            expect(madrid.get('cityName')).toBe('Madrid');
        });

        it("should CALL the typeProperty to resolve model class names if it is a function", function() {
            var typePropertyScope;

            store = new Ext.data.TreeStore({
                root: treeData,
                proxy: {
                    type: 'memory',
                    reader: {
                        typeProperty: function(rawData) {
                            typePropertyScope = this;
                            return Ext.String.startsWith(rawData.mtype, 'spec.') ? rawData.mtype : 'spec.' + rawData.mtype;
                        }
                    }
                }
            });
            var root = store.getRootNode(),
                na = root.childNodes[0],
                emea = root.childNodes[1],
                spain,
                madrid,
                usa = na.childNodes[0],
                rwc = usa.childNodes[0],
                frederick = usa.childNodes[1],
                canada = na.childNodes[1],
                vancouver = canada.childNodes[0],
                toronto = canada.childNodes[1];

            // The typeProperty function must be called in the scope of the Reader
            expect(typePropertyScope === store.getProxy().getReader());

            expect(na instanceof spec.Territory).toBe(true);
            expect(emea instanceof spec.Territory).toBe(true);
            expect(na.get('territoryName')).toBe('North America');
            expect(emea.get('territoryName')).toBe('Europe, ME, Africa');

            expect(usa instanceof spec.Country).toBe(true);
            expect(canada instanceof spec.Country).toBe(true);
            expect(usa.get('countryName')).toBe('USA');
            expect(canada.get('countryName')).toBe('Canada');

            expect(rwc instanceof spec.City).toBe(true);
            expect(frederick instanceof spec.City).toBe(true);
            expect(vancouver instanceof spec.City).toBe(true);
            expect(toronto instanceof spec.City).toBe(true);
            expect(rwc.get('cityName')).toBe('Redwood City');
            expect(frederick.get('cityName')).toBe('Frederick, MD');
            expect(vancouver.get('cityName')).toBe('Vancouver');
            expect(toronto.get('cityName')).toBe('Toronto');

            // Check that the Model converts raw configs correctly according to the
            // typeProperty in the TreeStore
            spain = emea.appendChild({
                mtype: 'Country',
                countryName: 'Spain'
            });
            expect(spain instanceof spec.Country).toBe(true);
            expect(spain.get('countryName')).toBe('Spain');

            madrid = spain.appendChild({
                mtype: 'City',
                cityName: 'Madrid'
            });
            expect(madrid instanceof spec.City).toBe(true);
            expect(madrid.get('cityName')).toBe('Madrid');
        });
    });

    describe('Filtering, and isLastVisible status', function() {
        var rec0, rec1, rec2;

        beforeEach(function() {
            store = Ext.create('Ext.data.TreeStore', {
                model: NodeModel,
                root: {
                    expanded: true,
                    id: 0,
                    name: 'Root Node',
                    children: [{
                        name: 'Foo'
                    }, {
                        name: 'Bar'
                    }, {
                        name: 'Bletch'
                    }]
                }
            });
            rec0 = store.getAt(0);
            rec1 = store.getAt(1);
            rec2 = store.getAt(2);

        });
        it('should correctly ascertain whether a node is the last visible node.', function() {

            // Verify initial conditions
            expect(store.getCount()).toEqual(3);
            expect(rec0.isLastVisible()).toBe(false);
            expect(rec1.isLastVisible()).toBe(false);
            expect(rec2.isLastVisible()).toBe(true);

            // Only first node should now be visible
            store.filter({
                property: 'name',
                value: 'Foo'
            });

            // Now there's only 1, and it should report that it is the last visible
            expect(store.getCount()).toEqual(1);
            expect(rec0.isLastVisible()).toBe(true);
        });
    });

    describe('TreeNode drop with locally created (phantom) nodes', function() {
        var n1, n2, n3;

        beforeEach(function() {
            store = Ext.create('Ext.data.TreeStore', {
                model: NodeModel,
                root: {
                    expanded: true,
                    id: 0,
                    name: 'Root Node',
                    children: [{
                        name: 'Foo',
                        expanded: true,
                        children: []
                    }, {
                        name: 'Bar'
                    }, {
                        name: 'Bletch'
                    }]
                }
            });

            n1 = store.getAt(0);
        });

        it('should remove all descendants. All nodes are phantom, so there should be an empty removed list', function() {
            var records;

            // "Foo", "Bar" and "Bletch" present
            expect(store.getCount()).toBe(3);

            // Append to expanded node "Foo"
            n2 = n1.appendChild({
                name: 'Zarg',
                expanded: true
            });
            n3 = n2.appendChild({
                name: 'Blivit',
                leaf: true
            });

            // The added nodes should be in the store; they are added to expanded nodes.
            expect(store.getCount()).toBe(5);

            // n1, its child n2("zarg"), and grandchild n3("blivit") will all be removed by this operation.
            n1.drop();

            records = store.getRemovedRecords();

            // NO records should appear in the removed list because they are all phantom
            // having been defined using client-side data.
            expect(records.length).toBe(0);

            // n1("Foo") and its descendants, "Zarg" and "Blivit" should be removed.
            // Only "Bar" and "Bletch" present now.
            expect(store.getCount()).toBe(2);
        });
    });
    
    describe('TreeNode drop', function() {
        var n1, n2, n3;

        beforeEach(function() {
            store = Ext.create('Ext.data.TreeStore', {
                model: NodeModel,
                root: {
                    expanded: true,
                    id: 0,
                    name: 'Root Node'
                },
                // Read these through a Proxy because we are expecting them NOT to be phantom
                proxy: {
                    type: 'memory',
                    data: [{
                        name: 'Foo',
                        expanded: true,
                        children: []
                    }, {
                        name: 'Bar'
                    }, {
                        name: 'Bletch'
                    }]
                }
            });

            n1 = store.getAt(0);
        });

        it('should remove all descendants, and add non-phantom descendants to removed list', function() {
            var records;

            // "Foo", "Bar" and "Bletch" present
            expect(store.getCount()).toBe(3);

            // Append to expanded node "Foo"
            n2 = n1.appendChild({
                name: 'Zarg',
                expanded: true
            });
            n3 = n2.appendChild({
                name: 'Blivit',
                leaf: true
            });

            // The added nodes should be in the store; they are added to expanded nodes.
            expect(store.getCount()).toBe(5);

            // n1, its child n2("zarg"), and grandchild n3("blivit") will all be removed by this operation.
            n1.drop();

            records = store.getRemovedRecords();

            // Only the non-phantom node "Foo" should be in the removed list.
            // The two newly added phantoms just disappear.
            // Only "Bar" and "Bletch" present now.
            expect(records.length).toBe(1);
            expect(records[0] === n1).toBe(true);

            // n1("Foo") and its descendants, "Zarg" and "Blivit" should be removed.
            // Only "Bar" and "Bletch" present now.
            expect(store.getCount()).toBe(2);
        });
    });

    describe("parentIdProperty", function() {
        var root;

        beforeEach(function() {
            store = new Ext.data.TreeStore({
                model: NodeModel,
                root: {},
                parentIdProperty: 'foo'
            });
            root = store.getRoot();
        });

        afterEach(function() {
            root = null;
        });

        it("should append items without a parentId to the loaded item", function() {
            root.expand();
            completeWithData([{
                id: 1
            }, {
                id: 2
            }, {
                id: 3
            }]);

            var childNodes = root.childNodes;
            expect(byId(1)).toBe(childNodes[0]);
            expect(byId(2)).toBe(childNodes[1]);
            expect(byId(3)).toBe(childNodes[2]);
        });

        it("should allow a parentId of 0", function() {
            root.expand();
            completeWithData([{
                id: 0
            }, {
                id: 1,
                foo: 0
            }]);

            expect(byId(1)).toBe(byId(0).childNodes[0]);
        });

        it("should throw an exception if a matching parent is not found", function() {
            root.expand();
            expect(function() {
                completeWithData([{
                    id: 1
                }, {
                    id: 2,
                    foo: 100
                }]);
            }).toThrow();
        });

        it("should add children to their parent nodes, retaining any implied order", function() {
            root.expand();
            completeWithData([{
                id: 'c21',
                foo: 'c2'
            }, {
                id: 'a'
            }, {
                id: 'c2',
                foo: 'c'
            }, {
                id: 'a1',
                foo: 'a'
            }, {
                id: 'c'
            }, {
                id: 'b'
            }, {
                id: 'b1',
                foo: 'b'
            }, {
                id: 'a2',
                foo: 'a'
            }, {
                id: 'c1',
                foo: 'c'
            }, {
                id: 'c22',
                foo: 'c2'
            }, {
                id: 'a32',
                foo: 'a3'
            }, {
                id: 'a31',
                foo: 'a3'
            }, {
                id: 'a21',
                foo: 'a2'
            }, {
                id: 'b11',
                foo: 'b1'
            }, {
                id: 'a3',
                foo: 'a'
            }, {
                id: 'a211',
                foo: 'a21'
            }]);

            var a = byId('a'),
                b = byId('b'),
                c = byId('c');

            expect(a).toBe(root.childNodes[0]);
            expect(c).toBe(root.childNodes[1]);
            expect(b).toBe(root.childNodes[2]);

            var a2 = byId('a2'),
                a21 = byId('a21'),
                a3 = byId('a3');

            expect(byId('a1')).toBe(a.childNodes[0]);
            expect(a2).toBe(a.childNodes[1]);
            expect(a3).toBe(a.childNodes[2]);

            expect(a21).toBe(a2.childNodes[0]);

            expect(byId('a211')).toBe(a21.childNodes[0]);

            expect(byId('a32')).toBe(a3.childNodes[0]);
            expect(byId('a31')).toBe(a3.childNodes[1]);

            var b1 = byId('b1');

            expect(b1).toBe(b.childNodes[0]);

            expect(byId('b11')).toBe(b1.childNodes[0]);

            var c2 = byId('c2');

            expect(c2).toBe(c.childNodes[0]);
            expect(byId('c1')).toBe(c.childNodes[1]);

            expect(byId('c21')).toBe(c2.childNodes[0]);
            expect(byId('c22')).toBe(c2.childNodes[1]);
        });
    });
    
    describe('loading inline data with no configured root node', function() {
        it('should run without throwing an error', function() {
            expect(function() {
                new Ext.data.TreeStore({
                    fields: ['name', 'text', 'id', 'parentId'],
                    parentIdProperty: 'parentId',
                    data: [{
                        id: 1,
                        name: 'A',
                        value: 10,
                        parentId: null
                    }, {
                        id: 2,
                        name: 'B',
                        value: 12,
                        parentId: 1,
                        leaf: true
                    }]
                }).load();
            }).not.toThrow();
        });
    });
    
    describe('Changing root node', function() {
        it('should remove all listeners from old root node', function() {
            var oldRoot,
                tree = new Ext.tree.Panel({
                    title: 'Test',
                    height: 200,
                    width: 400,
                    root: {
                        text: 'Root',
                        expanded: true,
                        children: [{
                            text: 'A',
                            leaf: true
                        }, {
                            text: 'B',
                            leaf: true
                        }]
                    }
                });

            oldRoot = tree.getRootNode();

            // The old root should have some listeners
            expect(Ext.Object.getKeys(oldRoot.hasListeners).length).toBeGreaterThan(0);
            
            tree.store.setRoot({
                text: 'NewRoot',
                expanded: true,
                children: [{
                    text: 'New A',
                    leaf: true
                }, {
                    text: 'New B',
                    leaf: true
                }]
            });

            // The old root should have no listeners
            expect(Ext.Object.getKeys(oldRoot.hasListeners).length).toBe(0);

        });
    });

    describe('commitChanges', function() {
        beforeEach(function() {
            makeStore([
                {
                    text: 'Foo',
                    leaf: true
                }
            ]);
        });

        afterEach(function() {
            Ext.destroy(store);
            store = null;
        });

        it('should clear the removed collection', function() {
            var root = store.getRoot();

            root.removeChild(root.getChildAt(0));

            store.commitChanges();

            expect(store.removedNodes.length).toBe(0);
        });
    });

    describe('rejected changes', function () {
        // Note that we don't actually need to remove a node to test this.
        function doTests(rootVisible) {
            describe('rootVisible = ' + rootVisible, function () {
                it('should not include the root node', function () {
                    makeStore([{
                        children: [2, 3]
                    }], {
                        rootVisible: rootVisible
                    });

                    expect(Ext.Array.contains(store.getRejectRecords(), store.getRoot())).toBe(false);
                });
            });
        }

        doTests(true);
        doTests(false);
    });
});

