describe("Ext.event.gesture.Tap", function() {
    var helper = Ext.testHelper,
        tapRecognizer = Ext.event.gesture.Tap.instance,
        moveDistance = tapRecognizer.getMoveDistance(),
        targetEl, tapHandler, tapCancelHandler, e, recognizer;

    function start(cfg) {
        helper.touchStart(targetEl, cfg);
    }

    function move(cfg) {
        helper.touchMove(targetEl, cfg);
    }

    function end(cfg) {
        helper.touchEnd(targetEl, cfg);
    }

    function cancel(cfg) {
        helper.touchCancel(targetEl, cfg);
    }

    beforeEach(function() {
        targetEl = Ext.getBody().createChild();
        tapHandler = jasmine.createSpy();
        tapCancelHandler = jasmine.createSpy();

        tapHandler.andCallFake(function(event) {
            e = event;
        });

        tapCancelHandler.andCallFake(function(event) {
            e = event;
        });

        targetEl.on('tap', tapHandler);
        targetEl.on('tapcancel', tapCancelHandler);
    });

    afterEach(function() {
        targetEl.destroy();
    });

    it("should fire tap when there is no movement", function() {
        waits(100);
        runs(function() {
            start({ id: 1, x: 10, y: 10 });
            end({ id: 1, x: 10, y: 10 });
        });
        waitsForAnimation();
        runs(function() {
            expect(tapHandler).toHaveBeenCalled();
            expect(e.type).toBe('tap');
            expect(e.getX()).toBe(10);
            expect(e.getY()).toBe(10);
        });
    });

    it("should fire tap if movement is within moveDistance", function() {
        waits(100);
        runs(function() {
            start({ id: 1, x: 10, y: 10 });
            move({ id: 1, x: 9 + moveDistance, y: 10 });
            end({ id: 1, x: 9 + moveDistance, y: 10 });
        });
        waitsForAnimation();
        runs(function() {
            expect(tapHandler).toHaveBeenCalled();
            expect(e.type).toBe('tap');
            expect(e.getX()).toBe(9 + moveDistance);
            expect(e.getY()).toBe(10);
        });
    });

    it("should not fire tap, and should fire tapcancel if movement is greater than or equal to moveDistance", function() {
        waits(100);
        runs(function() {
            start({ id: 1, x: 10, y: 10 });
            move({ id: 1, x: 10, y: 10 + moveDistance });
            end({ id: 1, x: 10, y: 10 + moveDistance });
        });
        waitsForAnimation();
        runs(function() {
            expect(tapHandler).not.toHaveBeenCalled();
            expect(tapCancelHandler).toHaveBeenCalled();
            expect(e.type).toBe('tapcancel');
        });
    });

    if (Ext.supports.Touch) {
        it("should not fire tap if a second touch is initiated", function() {
            runs(function() {
                start({ id: 1, x: 10, y: 10 });
                start({ id: 2, x: 30, y: 30 });
                end({ id: 1, x: 10, y: 10 });
            });
            waitsForAnimation();
            runs(function() {
                end({ id: 2, x: 30, y: 30 });
            });
            waitsForAnimation();
            runs(function() {
                expect(tapHandler).not.toHaveBeenCalled();
            });
        });

        it("should not fire tap and should fire tapcancel if a cancel event is received", function() {
            runs(function() {
                start({ id: 1, x: 10, y: 10 });
            });
            waitsForAnimation();
            runs(function() {
                cancel({ id: 1, x: 10, y: 10 });
            });
            waitsForAnimation();
            runs(function() {
                expect(tapHandler).not.toHaveBeenCalled();
                expect(tapCancelHandler).toHaveBeenCalled();
                expect(e.type).toBe('tapcancel');
            });
        });
    }

    it("should not fire tap and should fire tapcancel if movement exceeds moveDistance, but the pointer is moved back within the moveDistance before touchend", function() {
        runs(function() {
            start({ id: 1, x: 10, y: 10 });
            move({ id: 1, x: 10, y: 11 + moveDistance });
        });
        waitsForAnimation();
        runs(function() {
            move({ id: 1, x: 10, y: 10 });
            end({ id: 1, x: 10, y: 10 });
        });
        waitsForAnimation();
        runs(function() {
            expect(tapHandler).not.toHaveBeenCalled();
            expect(tapCancelHandler).toHaveBeenCalled();
            expect(e.type).toBe('tapcancel');
        });
    });
});
