/**
 * Simple Stopwatch to measure the time it takes to finish typing an excerpt.
 *
 * It does not use any timing function. It only stores Date.now() values when
 * started/paused;
 */
var Stopwatch = function() {
    this.running = false;
    // This variable stores the last time the start function was called.
    this.startedAt = 0;
    // This variable is used when pausing, creating a subtotal;
    this.subTotal = 0;

    this.start = function() {
        this.running = true;
        this.startedAt = Date.now();
    }

    this.pause = function() {
        this.running = false;
        this.subTotal += Date.now() - this.startedAt;
    }

    this.reset = function() {
        this.running = false;
        this.startedAt = 0;
        this.subTotal = 0;
    }

    this.elapsed = function() {
        if (this.running) {
            return this.subTotal + (Date.now() - this.startedAt);
        }
        else {
            return this.subTotal;
        }
    }
}
