describe("Ext.util.Cache", function () {
    var evicted = [],
        cache;

    function dump () {
        var a = [],
            i = 0;

        cache.each(function (key, value) {
            a.push(key + '=' + value);
            ++i;
        });

        a.unshift(i);
        return a.join(',');
    }

    beforeEach(function () {
        evicted.length = 0;

        cache = new Ext.util.Cache({
            maxSize: 3,

            evict: function (key, value) {
                evicted.push('evict:' + key + '=' + value);
            },

            miss: function (key) {
                return '{' + key + '}';
            }
        });
    });

    it('should add entries until maxSize', function () {
        expect(cache.count).toBe(0);
        expect(dump()).toBe('0');

        var a = cache.get('a');

        expect(a).toBe('{a}');
        expect(cache.count).toBe(1);
        expect(dump()).toBe('1,a={a}');

        var b = cache.get('b');

        expect(b).toBe('{b}');
        expect(cache.count).toBe(2);
        expect(dump()).toBe('2,b={b},a={a}');

        var c = cache.get('c');

        expect(c).toBe('{c}');
        expect(cache.count).toBe(3);
        expect(dump()).toBe('3,c={c},b={b},a={a}');
    });

    it('should reorder entries', function () {
        var a = cache.get('a');
        var b = cache.get('b');
        var c = cache.get('c');

        expect(cache.count).toBe(3);
        expect(evicted.length).toBe(0);

        var b2 = cache.get('b');

        expect(evicted.length).toBe(0);
        expect(b2).toBe(b);
        expect(cache.count).toBe(3);
        expect(dump()).toBe('3,b={b},c={c},a={a}');
    });

    it('should remove oldest entry after maxSize', function () {
        var a = cache.get('a');
        var b = cache.get('b');
        var c = cache.get('c');
        // full

        expect(cache.count).toBe(3);
        expect(evicted.length).toBe(0);

        var d = cache.get('d');

        expect(evicted).toEqual([ 'evict:a={a}' ]);
        expect(d).toBe('{d}');
        expect(cache.count).toBe(3);
        expect(dump()).toBe('3,d={d},c={c},b={b}');
    });

    it('should remove everything on clear', function () {
        var a = cache.get('a');
        var b = cache.get('b');
        var c = cache.get('c');
        // full

        expect(cache.count).toBe(3);

        cache.clear();
        expect(cache.count).toBe(0);
        expect(dump()).toBe('0');
    });

    it('should evict everything on clear', function () {
        var a = cache.get('a');
        var b = cache.get('b');
        var c = cache.get('c');
        // full

        expect(cache.count).toBe(3);

        cache.clear();
        expect(evicted.length).toBe(3);
        expect(evicted).toEqual([ 'evict:c={c}', 'evict:b={b}', 'evict:a={a}' ]);
    });

    it('should evict everything on destroy', function () {
        var a = cache.get('a');
        var b = cache.get('b');
        var c = cache.get('c');
        // full

        expect(cache.count).toBe(3);

        cache.destroy();
        expect(cache.count).toBe(0);
        expect(dump()).toBe('0');

        expect(evicted.length).toBe(3);
        expect(evicted).toEqual([ 'evict:c={c}', 'evict:b={b}', 'evict:a={a}' ]);
    });
});
