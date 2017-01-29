var wpmCalc = require('../../src/wpmCalc.js');

describe("Raw WPM Calculation", function() {
    it("should return the correct value", function() {
        var value = wpmCalc.getRawWPM(60 * 5, 60 * 1000);
        expect(value).toEqual(60);
    });

    it("should return zero when time is zero too", function() {
        var value = wpmCalc.getRawWPM(0, 0);
        expect(value).toEqual(0);
    });
});


describe("Net WPM Calculation", function() {
    it("should return the correct value", function() {
        var value = wpmCalc.getNetWPM(60 * 5, 5, 60 * 1000);
        expect(value).toEqual(55);
    });

    it("should return zero when time is zero too", function() {
        var value = wpmCalc.getNetWPM(0, 0, 0);
        expect(value).toEqual(0);
    });

    it("should not return negative numbers", function() {
        var value = wpmCalc.getNetWPM(60 * 5, 61, 60 * 1000);
        expect(value).toEqual(0);
    });

});
