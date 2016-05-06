describe("Ext.util.Bag", function() {

    var bag, a, b, c, d;

    function makeBag() {    
        return new Ext.util.Bag();
    }

    beforeEach(function() {
        bag = makeBag();        
        a = {id: 'a'};
        b = {id: 'b'};
        c = {id: 'c'};
        d = {id: 'd'};
    });

    afterEach(function() {
        bag = Ext.destroy(bag);
    });

    describe("at construction", function() {
        it("should have no items", function() {
            expect(bag.length).toBe(0);
            expect(bag.getCount()).toBe(0);

            expect(bag.getAt(0)).toBeNull();
        });

        it("should be at generation 0", function() {
            expect(bag.generation).toBe(0);
        });
    });

    describe("adding", function() {
        describe("a new item", function() {
            it("should add an item to an empty collection", function() {
                bag.add(a);

                expect(bag.length).toBe(1);
                expect(bag.getCount()).toBe(1);

                expect(bag.getAt(0)).toBe(a);
                expect(bag.getByKey('a')).toBe(a);

                expect(bag.generation).toBe(1);
            });

            it("should add to the end of a filled collection", function() {
                bag.add(a);
                bag.add(b);
                bag.add(c);

                expect(bag.length).toBe(3);
                expect(bag.getCount()).toBe(3);

                expect(bag.getAt(0)).toBe(a);
                expect(bag.getByKey('a')).toBe(a);
                expect(bag.getAt(1)).toBe(b);
                expect(bag.getByKey('b')).toBe(b);
                expect(bag.getAt(2)).toBe(c);
                expect(bag.getByKey('c')).toBe(c);

                expect(bag.generation).toBe(3);
            });

            it("should return the added item", function() {
                expect(bag.add(a)).toBe(a);
            });
        });

        describe("an existing item", function() {
            beforeEach(function() {
                bag.add(a);
                bag.add(b);
                bag.add(c);
            });

            it("should leave the item in place", function() {
                bag.add(b);

                expect(bag.length).toBe(3);
                expect(bag.getCount()).toBe(3);

                expect(bag.getAt(1)).toBe(b);
                expect(bag.getByKey('b')).toBe(b);

                expect(bag.generation).toBe(4);
            });

            it("should replace an item with the same key", function() {
                var newB = {id: 'b'};
                bag.add(newB);

                expect(bag.length).toBe(3);
                expect(bag.getCount()).toBe(3);

                expect(bag.getAt(1)).toBe(newB);
                expect(bag.getByKey('b')).toBe(newB);

                expect(bag.generation).toBe(4);
            });

            it("should return the old item", function() {
                var newB = {id: 'b'};
                expect(bag.add(b)).toBe(b);
                expect(bag.add(newB)).toBe(b);
            });
        });
    });

    describe("clear", function() {
        describe("empty collection", function() {
            it("should be empty", function() {
                bag.clear();

                expect(bag.length).toBe(0);
                expect(bag.getCount()).toBe(0);

                expect(bag.getAt(0)).toBeNull();
                expect(bag.getByKey('a')).toBeNull();
            });

            it("should not increment the generation if there have been no items", function() {
                bag.clear();

                expect(bag.generation).toBe(0);
            });

            it("should increment the generation if there have been items", function() {
                bag.add(a);
                bag.remove(a);

                bag.clear();

                expect(bag.generation).toBe(3);
            });
        });

        describe("filled collection", function() {
            beforeEach(function() {
                bag.add(a);
                bag.add(b);
                bag.add(c);
            });

            it("should be empty", function() {
                bag.clear();

                expect(bag.length).toBe(0);
                expect(bag.getCount()).toBe(0);

                expect(bag.getAt(0)).toBeNull();
                expect(bag.getByKey('a')).toBeNull();
            });

            it("should increment the generation", function() {
                bag.clear();

                expect(bag.generation).toBe(4);
            });
        });

        describe("cloned collection", function() {
            it("should increment the generation", function() {
                bag.add(a);

                var other = bag.clone();
                expect(other.generation).toBe(0);

                other.clear();

                expect(other.generation).toBe(1);

                other.destroy();
            });
        });
    });

    describe("clone", function() {
        var other;

        afterEach(function() {
            other = Ext.destroy(other);
        });

        describe("empty collection", function() {
            beforeEach(function() {
                other = bag.clone();
            });

            it("should have generation 0", function() {
                other = bag.clone();
                expect(other.generation).toBe(0);
            });

            it("should be empty", function() {
                other = bag.clone();

                expect(other.length).toBe(0);
                expect(other.getCount()).toBe(0);
            });

            it("should not share changes", function() {
                other = bag.clone();
                other.add(a);

                expect(other.getAt(0)).toBe(a);
                expect(other.getByKey('a')).toBe(a);

                expect(bag.getAt(0)).toBeNull();
                expect(bag.getByKey('a')).toBeNull();
            });
        });

        describe("filled collection", function() {
            beforeEach(function() {
                bag.add(a);
                bag.add(b);
                bag.add(c);
                other = bag.clone();
            });

            it("should have generation 0", function() {
                expect(other.generation).toBe(0);
            });

            it("should copy over items", function() {
                expect(other.length).toBe(3);
                expect(other.getCount(3));

                expect(other.getAt(0)).toBe(bag.getAt(0));
                expect(other.getAt(1)).toBe(bag.getAt(1));
                expect(other.getAt(2)).toBe(bag.getAt(2));

                expect(other.getByKey('a')).toBe(bag.getByKey('a'));
                expect(other.getByKey('b')).toBe(bag.getByKey('b'));
                expect(other.getByKey('c')).toBe(bag.getByKey('c'));
            });

            it("should not share changes made to the clone", function() {
                other.add(d);

                expect(other.length).toBe(4);
                expect(other.getCount()).toBe(4);
                expect(other.getAt(3)).toBe(d);
                expect(other.getByKey('d')).toBe(d);

                expect(bag.length).toBe(3);
                expect(bag.getCount()).toBe(3);
                expect(bag.getAt(3)).toBeNull()
                expect(bag.getByKey('d')).toBeNull();
            });

            it("should not share changes made to the original", function() {
                bag.add(d);

                expect(bag.length).toBe(4);
                expect(bag.getCount()).toBe(4);
                expect(bag.getAt(3)).toBe(d);
                expect(bag.getByKey('d')).toBe(d);

                expect(other.length).toBe(3);
                expect(other.getCount()).toBe(3);
                expect(other.getAt(3)).toBeNull()
                expect(other.getByKey('d')).toBeNull();
            });
        });
    });

    describe("contains", function() {
        describe("empty collection", function() {
            it("should always be false", function() {
                expect(bag.contains(a)).toBe(false);
            });
        });

        describe("filled collection", function() {
            beforeEach(function() {
                bag.add(a);
                bag.add(b);
            });

            it("should be false if the value is null/undefined", function() {
                expect(bag.contains(null)).toBe(false);
                expect(bag.contains(undefined)).toBe(false);
            });

            it("should return true if the item is in the collection", function() {
                expect(bag.contains(a)).toBe(true);
            });

            it("should return false for an item not in the collection", function() {
                expect(bag.contains(c)).toBe(false);
            });

            it("should return false for an item with a matching key but not the same reference", function() {
                expect(bag.contains({id: 'b'})).toBe(false);
            });
        });
    });

    describe("containsKey", function() {
        describe("empty collection", function() {
            it("should always be false", function() {
                expect(bag.containsKey('a')).toBe(false);
            });
        });

        describe("filled collection", function() {
            beforeEach(function() {
                bag.add(a);
            });

            it("should return false when the key is not in the collection", function() {
                expect(bag.containsKey('b')).toBe(false);
            });

            it("should return true when the key is in the collection", function() {
                expect(bag.containsKey('a')).toBe(true);
            });
        });
    });

    describe("getAt", function() {
        describe("empty collection", function() {
            it("should always return null", function() {
                expect(bag.getAt(0)).toBeNull();
            });
        });

        describe("filled collection", function() {
            beforeEach(function() {
                bag.add(a);
                bag.add(b);
                bag.add(c);
                bag.add(d);
            });

            it("should return the item at the specified index", function() {
                expect(bag.getAt(0)).toBe(a);
                expect(bag.getAt(1)).toBe(b);
                expect(bag.getAt(2)).toBe(c);
                expect(bag.getAt(3)).toBe(d);
            });

            it("should return null when the index is larger than the collection bounds", function() {
                expect(bag.getAt(200)).toBeNull();
            });
        });
    });

    describe("getByKey", function() {
        describe("empty collection", function() {
            it("should always return null", function() {
                expect(bag.getByKey('a')).toBeNull();
            });
        });

        describe("filled collection", function() {
            beforeEach(function() {
                bag.add(a);
                bag.add(b);
                bag.add(c);
                bag.add(d);
            });

            it("should return the item with the matching key", function() {
                expect(bag.getByKey('c')).toBe(c);
            });

            it("should return null when when the key doesn't exist in the collection", function() {
                expect(bag.getByKey('z')).toBeNull();
            });
        });
    });

    describe("remove", function() {
        describe("empty collection", function() {
            it("should not modify the generation", function() {
                bag.remove(a);
                expect(bag.generation).toBe(0);
            });

            it("should remain empty", function() {
                bag.remove(a);
                expect(bag.length).toBe(0);
                expect(bag.getCount()).toBe(0);
            });

            it("should return null", function() {
                expect(bag.remove(a)).toBeNull();
            });
        });

        describe("filled collection", function() {
            beforeEach(function() {
                bag.add(a);
                bag.add(b);
                bag.add(c);
                bag.add(d);
            });

            describe("item exists in the collection", function() {
                it("should return the removed item", function() {
                    expect(bag.remove(a)).toBe(a);
                });

                it("should decrement the length", function() {
                    bag.remove(a);
                    expect(bag.length).toBe(3);
                    expect(bag.getCount()).toBe(3);
                });

                it("should increment the generation", function() {
                    bag.remove(a);
                    expect(bag.generation).toBe(5);
                });

                it("should be able to remove the last item", function() {
                    bag.remove(d);
                    expect(bag.getAt(0)).toBe(a);
                    expect(bag.getAt(1)).toBe(b);
                    expect(bag.getAt(2)).toBe(c);
                    expect(bag.getAt(3)).toBeNull();
                });

                it("should move the last item in place of the removed item", function() {
                    bag.remove(a);
                    expect(bag.getAt(0)).toBe(d);
                    expect(bag.getAt(1)).toBe(b);
                    expect(bag.getAt(2)).toBe(c);
                    expect(bag.getAt(3)).toBeNull();
                });

                it("should be able to remove the last remaining item", function() {
                    bag.remove(a);
                    bag.remove(b);
                    bag.remove(c);
                    bag.remove(d);

                    expect(bag.length).toBe(0);
                    expect(bag.getCount()).toBe(0);

                    expect(bag.getAt(0)).toBeNull();
                    expect(bag.getAt(1)).toBeNull();
                    expect(bag.getAt(2)).toBeNull();
                    expect(bag.getAt(3)).toBeNull();
                });
            });

            describe("item not in the collection", function() {
                it("should return null", function() {
                    expect(bag.remove({id: 'z'})).toBeNull();
                });

                it("should not modify the length", function() {
                    bag.remove({id: 'z'});
                    expect(bag.length).toBe(4);
                    expect(bag.getCount()).toBe(4);
                });

                it("should not modify the generation", function() {
                    bag.remove({id: 'z'});
                    expect(bag.generation).toBe(4);
                });
            });
        });
    });

    describe("removeByKey", function() {
        describe("empty collection", function() {
            it("should not modify the generation", function() {
                bag.removeByKey('a');
                expect(bag.generation).toBe(0);
            });

            it("should remain empty", function() {
                bag.removeByKey('a');
                expect(bag.length).toBe(0);
                expect(bag.getCount()).toBe(0);
            });

            it("should return null", function() {
                expect(bag.removeByKey('a')).toBeNull();
            });
        });

        describe("filled collection", function() {
            beforeEach(function() {
                bag.add(a);
                bag.add(b);
                bag.add(c);
                bag.add(d);
            });

            describe("item exists in the collection", function() {
                it("should return the removed item", function() {
                    expect(bag.removeByKey('a')).toBe(a);
                });

                it("should decrement the length", function() {
                    bag.removeByKey('a');
                    expect(bag.length).toBe(3);
                    expect(bag.getCount()).toBe(3);
                });

                it("should increment the generation", function() {
                    bag.removeByKey('a');
                    expect(bag.generation).toBe(5);
                });

                it("should be able to remove the last item", function() {
                    bag.removeByKey('d');
                    expect(bag.getAt(0)).toBe(a);
                    expect(bag.getAt(1)).toBe(b);
                    expect(bag.getAt(2)).toBe(c);
                    expect(bag.getAt(3)).toBeNull();
                });

                it("should move the last item in place of the removed item", function() {
                    bag.removeByKey('a');
                    expect(bag.getAt(0)).toBe(d);
                    expect(bag.getAt(1)).toBe(b);
                    expect(bag.getAt(2)).toBe(c);
                });

                it("should be able to remove the last remaining item", function() {
                    bag.removeByKey('a');
                    bag.removeByKey('b');
                    bag.removeByKey('c');
                    bag.removeByKey('d');

                    expect(bag.length).toBe(0);
                    expect(bag.getCount()).toBe(0);

                    expect(bag.getAt(0)).toBeNull();
                    expect(bag.getAt(1)).toBeNull();
                    expect(bag.getAt(2)).toBeNull();
                    expect(bag.getAt(3)).toBeNull();
                });
            });

            describe("item not in the collection", function() {
                it("should return null", function() {
                    expect(bag.removeByKey({id: 'z'})).toBeNull();
                });

                it("should not modify the length", function() {
                    bag.removeByKey({id: 'z'});
                    expect(bag.length).toBe(4);
                    expect(bag.getCount()).toBe(4);
                });

                it("should not modify the generation", function() {
                    bag.removeByKey({id: 'z'});
                    expect(bag.generation).toBe(4);
                });
            });
        });
    });

    describe("sort", function() {
        function sorter(a, b) {
            a = a.id;
            b = b.id;

            if (a === b) {
                return 0;
            }
            return a < b ? -1 : 1;
        }

        describe("empty collection", function() {
            it("should not increase the generation", function() {
                bag.sort(sorter);
                expect(bag.generation).toBe(0);
            });
        });

        describe("filled collection", function() {
            beforeEach(function() {
                bag.add(b);
                bag.add(a);
                bag.add(d);
                bag.add(c);
            });

            it("should sort by function", function() {
                bag.sort(sorter);

                expect(bag.getAt(0)).toBe(a);
                expect(bag.getAt(1)).toBe(b);
                expect(bag.getAt(2)).toBe(c);
                expect(bag.getAt(3)).toBe(d);

                expect(bag.getByKey('a')).toBe(a);
                expect(bag.getByKey('b')).toBe(b);
                expect(bag.getByKey('c')).toBe(c);
                expect(bag.getByKey('d')).toBe(d);

                expect(bag.length).toBe(4);
                expect(bag.getCount()).toBe(4);
            });

            it("should increase the generation", function() {
                bag.sort(sorter);
                expect(bag.generation).toBe(5);
            });

            it("should not attempt to maintain the sort", function() {
                var e = {id: 'e'};
                // Reverse order
                bag.sort(function(a, b) {
                    a = a.id;
                    b = b.id;

                    if (a === b) {
                        return 0;
                    }
                    return a < b ? 1 : -1;
                });

                bag.add(e);
                expect(bag.getAt(0)).toBe(d);
                expect(bag.getAt(1)).toBe(c);
                expect(bag.getAt(2)).toBe(b);
                expect(bag.getAt(3)).toBe(a);
                expect(bag.getAt(4)).toBe(e);
            });
        });
    });

});