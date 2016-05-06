describe("Ext.dom.GarbageCollector", function() {
    it("should collect an orphan element", function() {
        var el = Ext.get(document.createElement('div')),
            id = el.id;

        expect(id in Ext.cache).toBe(true);

        spyOn(el, 'clearListeners').andCallThrough();

        Ext.dom.GarbageCollector.collect();

        expect(el.clearListeners).toHaveBeenCalled();
        expect(id in Ext.cache).toBe(false);

        el.destroy();
    });

    it("should not collect an element that is in the body", function() {
        var el = Ext.get(document.createElement('div')),
            id = el.id;

        Ext.getBody().appendChild(el);

        spyOn(el, 'clearListeners').andCallThrough();

        Ext.dom.GarbageCollector.collect();

        expect(el.clearListeners).not.toHaveBeenCalled();
        expect(id in Ext.cache).toBe(true);

        el.destroy();
    });

    it("should not collect an element that is in the detached body", function() {
        var el = Ext.get(document.createElement('div')),
            id = el.id;

        Ext.getDetachedBody().appendChild(el);

        spyOn(el, 'clearListeners').andCallThrough();

        Ext.dom.GarbageCollector.collect();

        expect(el.clearListeners).not.toHaveBeenCalled();
        expect(id in Ext.cache).toBe(true);

        el.destroy();
    });

    it("should return the ids of collected elements", function() {
        var ids, el2;

        Ext.Element.create({ id: 'one' });
        el2 = Ext.getBody().createChild({ id: 'two' });
        Ext.Element.create({ tag: 'a', id: 'three' });

        ids = Ext.dom.GarbageCollector.collect();

        expect(ids instanceof Array).toBe(true);
        expect(Ext.Array.contains(ids, 'DIV#one')).toBe(true);
        expect(Ext.Array.contains(ids, 'DIV#two')).toBe(false);
        expect(Ext.Array.contains(ids, 'A#three')).toBe(true);

        el2.destroy();
    });
});
