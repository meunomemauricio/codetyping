describe("Stopwatch", function() {

    beforeEach(function() {
        jasmine.clock().install();
    });

    afterEach(function() {
        jasmine.clock().uninstall();
    });

    it("should be able to be started", function() {
        var baseTime = new Date();
        jasmine.clock().mockDate(baseTime);

        var sw = new Stopwatch;
        sw.start();

        expect(sw.startedAt).toEqual(baseTime.getTime());
        expect(sw.running).toBe(true);
    });

    it("should be able to retrieve elapsed time", function() {
        var baseTime = new Date();
        var interval = 60;
        jasmine.clock().mockDate(baseTime);

        var sw = new Stopwatch;
        sw.start();
        jasmine.clock().tick(interval);

        expect(sw.elapsed()).toEqual(interval);
    });

    it("should be able to support pausing", function() {
        var baseTime = new Date();
        var interval = 60;
        jasmine.clock().mockDate(baseTime);

        var sw = new Stopwatch;
        sw.start();
        jasmine.clock().tick(interval);
        sw.pause();
        jasmine.clock().tick(interval);

        expect(sw.running).toBe(false);
        expect(sw.elapsed()).toEqual(interval);
    });

    it("should be able to be resume after pausing", function() {
        var baseTime = new Date();
        var interval = 60;
        jasmine.clock().mockDate(baseTime);

        var sw = new Stopwatch;
        sw.start();
        jasmine.clock().tick(interval);
        sw.pause();
        jasmine.clock().tick(interval);
        sw.start();
        jasmine.clock().tick(interval);

        expect(sw.running).toBe(true);
        expect(sw.elapsed()).toEqual(2*interval);
    });

    it("should be able to be reseted", function() {
        var baseTime = new Date();
        var interval = 60;
        jasmine.clock().mockDate(baseTime);

        var sw = new Stopwatch;
        sw.start();
        jasmine.clock().tick(interval);
        sw.reset();

        expect(sw.running).toBe(false);
        expect(sw.elapsed()).toEqual(0);
    });
});
