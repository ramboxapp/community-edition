describe("Ext.event.gesture.LongPress", function() {
    var helper = Ext.testHelper,
        recognizer = Ext.event.gesture.LongPress.instance,
        originalMinDuration = recognizer.getMinDuration(),
        moveDistance = recognizer.getMoveDistance(),
        minDuration = 60,
        targetEl, longpressHandler, tapholdHandler, longpressEvent, tapholdEvent;

    function start(cfg) {
        helper.touchStart(targetEl, cfg);
    }

    function move(cfg) {
        helper.touchMove(targetEl, cfg);
    }

    function end(cfg) {
        helper.touchEnd(targetEl, cfg);
    }

    beforeEach(function() {
        targetEl = Ext.getBody().createChild({});
        recognizer.setMinDuration(minDuration);
        longpressHandler = jasmine.createSpy();
        tapholdHandler = jasmine.createSpy();

        longpressHandler.andCallFake(function(event) {
            longpressEvent = event;
        });

        tapholdHandler.andCallFake(function(event) {
            tapholdEvent = event;
        });

        targetEl.on('longpress', longpressHandler);
        targetEl.on('taphold', tapholdHandler);
    });

    afterEach(function() {
        recognizer.setMinDuration(originalMinDuration);
        targetEl.destroy();
    });

    it("should fire longpress and taphold when the hold duration is longer than minDuration", function() {
        runs(function() {
            start({ id: 1, x: 10, y: 10 });
        });
        waits(minDuration + 30);
        runs(function() {
            end({ id: 1, x: 10, y: 10 });
            expect(longpressHandler).toHaveBeenCalled();
            expect(longpressEvent.type).toBe('longpress');
            expect(tapholdHandler).toHaveBeenCalled();
            expect(tapholdEvent.type).toBe('taphold');

            expect(longpressEvent.duration).toBe(minDuration);
            expect(tapholdEvent.duration).toBe(minDuration);
        });
    });

    it("should not fire longpress and taphold when the hold duration is shorter than minDuration", function() {
        runs(function() {
            start({ id: 1, x: 10, y: 10 });
        });
        waits(minDuration - 30);
        runs(function() {
            end({ id: 1, x: 10, y: 10 });
            expect(longpressHandler).not.toHaveBeenCalled();
            expect(tapholdHandler).not.toHaveBeenCalled();
        });
        waitsForAnimation();
    });

    it("should not fire longpress and taphold if the amount of movement exceeds moveDistance", function() {
        runs(function() {
            start({ id: 1, x: 10, y: 10 });
            move({ id: 1, x: 10, y: 10 + moveDistance });
        });
        waits(minDuration + 30);
        runs(function() {
            end({ id: 1, x: 10, y: 10 + moveDistance });
            expect(longpressHandler).not.toHaveBeenCalled();
            expect(tapholdHandler).not.toHaveBeenCalled();
        });
        waitsForAnimation();
    });

    it("should fire longpress and taphold if the amount of movement is within moveDistance", function() {
        runs(function() {
            start({ id: 1, x: 10, y: 10 });
            move({ id: 1, x: 10, y: 9 + moveDistance });
        });
        waits(minDuration + 30);
        runs(function() {
            end({ id: 1, x: 10, y: 9 + moveDistance });
            expect(longpressHandler).toHaveBeenCalled();
            expect(tapholdHandler).toHaveBeenCalled();
        });
        waitsForAnimation();
    });

    if (Ext.supports.Touch) {
        it("should not fire longpress and taphold if a second touch is initiated", function() {
            runs(function() {
                start({ id: 1, x: 10, y: 10 });
                start({ id: 2, x: 20, y: 20 });
            });
            waits(minDuration + 30);
            runs(function() {
                end({ id: 1, x: 10, y: 10 });
                end({ id: 2, x: 20, y: 20 });
                expect(longpressHandler).not.toHaveBeenCalled();
                expect(tapholdHandler).not.toHaveBeenCalled();
            });
            waitsForAnimation();
        });
    }
});
