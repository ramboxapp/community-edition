describe("Ext.event.publisher.Gesture", function() {
    describe("removing the target el before a gesture is complete", function() {
        var GC = Ext.dom.GarbageCollector,
            helper = Ext.testHelper,
            interval = GC.interval,
            targetEl;

        beforeEach(function() {
            targetEl = Ext.getBody().createChild({
                id: 'gesture-target'
            });
            spyOn(targetEl, 'clearListeners');
            GC.interval = 60;
            GC.pause();
            GC.resume();
        });

        afterEach(function() {
            targetEl.destroy();
            GC.interval = interval;
            GC.pause();
            GC.resume();
        });

        function removeTarget() {
            document.body.removeChild(targetEl.dom);
        }

        function expectCollected(collected) {
            if (collected) {
                expect('gesture-target' in Ext.cache).toBe(false);
                expect(targetEl.clearListeners).toHaveBeenCalled();
            } else {
                expect('gesture-target' in Ext.cache).toBe(true);
                expect(targetEl.clearListeners).not.toHaveBeenCalled();
            }
        }

        it("should not garbage collect the target element until the current gesture is complete", function() {
            runs(function() {
                helper.touchStart(targetEl, { id: 1, x: 10, y: 10 });
                helper.touchMove(targetEl, { id: 1, x: 15, y: 15 });
                removeTarget();
            });

            waits(90);

            runs(function() {
                expectCollected(false);
                helper.touchEnd(Ext.supports.TouchEvents ? targetEl : document.body, { id: 1, x: 15, y: 15 });
            });

            waits(90);

            runs(function() {
                expectCollected(true);
            })
        });
    });

    describe("order of recognizers", function() {
        it("should invoke the recognizers in priority order when an event is fired", function() {
            var gesture = Ext.event.gesture,
                Drag = gesture.Drag.instance,
                Tap = gesture.Tap.instance,
                DoubleTap = gesture.DoubleTap.instance,
                LongPress = gesture.LongPress.instance,
                Swipe = gesture.Swipe.instance,
                Pinch = gesture.Pinch.instance,
                Rotate = gesture.Rotate.instance,
                EdgeSwipe = gesture.EdgeSwipe.instance,
                result = [];

            Drag.onStart = Tap.onStart = DoubleTap.onStart = LongPress.onStart = Swipe.onStart =
                Pinch.onStart = Rotate.onStart = EdgeSwipe.onStart = function() {
                    result.push([this.$className, this.priority]);
                };

            Ext.testHelper.touchStart(document.body, {id: 1, x: 100, y: 100});

            expect(result[0]).toEqual(['Ext.event.gesture.Drag', 100]);
            expect(result[1]).toEqual(['Ext.event.gesture.Tap', 200]);
            expect(result[2]).toEqual(['Ext.event.gesture.DoubleTap', 300]);
            expect(result[3]).toEqual(['Ext.event.gesture.LongPress', 400]);
            expect(result[4]).toEqual(['Ext.event.gesture.Swipe', 500]);
            expect(result[5]).toEqual(['Ext.event.gesture.Pinch', 600]);
            expect(result[6]).toEqual(['Ext.event.gesture.Rotate', 700]);
            expect(result[7]).toEqual(['Ext.event.gesture.EdgeSwipe', 800]);

            delete Drag.onStart;
            delete Tap.onStart;
            delete DoubleTap.onStart;
            delete LongPress.onStart;
            delete Swipe.onStart;
            delete Pinch.onStart;
            delete Rotate.onStart;
            delete EdgeSwipe.onStart;
        });
    });
});
