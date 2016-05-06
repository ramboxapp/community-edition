describe("Ext.scroll.Scroller", function() {
    var scroller, el;

    describe("instantiation", function() {
        var originalSupportsTouch;

        beforeEach(function() {
            el = Ext.getBody().createChild();
            originalSupportsTouch = Ext.supports.Touch;
        });

        afterEach(function() {
            el.destroy();
            scroller.destroy();
            Ext.supports.Touch = originalSupportsTouch;
        });

        it("should create an instance of Ext.scroll.DomScroller if Ext.supports.Touch is false", function() {
            Ext.supports.Touch = false;
            scroller = Ext.scroll.Scroller.create({
                element: el
            });

            expect(scroller instanceof Ext.scroll.DomScroller).toBe(true);
        });

        it("should create an instance of Ext.scroll.TouchScroller if Ext.supports.Touch is true", function() {
            Ext.supports.Touch = true;
            scroller = Ext.scroll.Scroller.create({
                element: el
            });

            expect(scroller instanceof Ext.scroll.TouchScroller).toBe(true);
        });
    });

    describe("configuring the element", function() {
        afterEach(function() {
            if (el && !el.isDestroyed) {
                Ext.fly(el).destroy();
            }
        });

        it("should accept an HTMLElement", function() {
            el = document.createElement('div');
            document.body.appendChild(el, true);

            scroller = new Ext.scroll.Scroller({
                element: el
            });

            expect(scroller.getElement().isElement).toBe(true);
            expect(scroller.getElement().dom).toBe(el);
        });

        it("should accept an Element ID", function() {
            el = document.createElement('div');
            el.id = 'theEl';
            document.body.appendChild(el, true);

            scroller = new Ext.scroll.Scroller({
                element: 'theEl'
            });

            expect(scroller.getElement().isElement).toBe(true);
            expect(scroller.getElement().dom).toBe(el);
        });

        it("should accept an Ext.dom.Element", function() {
            el = Ext.getBody().createChild();

            scroller = new Ext.scroll.Scroller({
                element: el
            });

            expect(scroller.getElement()).toBe(el);
        });

        it("should throw an error if element with given id not found", function() {
            expect(function() {
                scroller = new Ext.scroll.Scroller({
                    element: 'foobarelement'
                });
            }).toThrow("Cannot create Ext.scroll.Scroller instance. Element with id 'foobarelement' not found.");
        });
    });
});
