// elapseTimer.mjs

/**
 * A simple elapsed‐time timer that updates a DOM element at a given frequency.
 */
export class ElapseTimer {
    /**
     * @param {string|HTMLElement} elementOrId
     * @param {number} updateFrequency – interval in ms
     * @param {(elapsedMs: number)=>string} displayStrategy – formats elapsed time
     */
    constructor(elementOrId, updateFrequency = 1000, displayStrategy = null) {
        this.element = typeof elementOrId === 'string'
            ? document.getElementById(elementOrId)
            : elementOrId;
        this.updateFrequency = updateFrequency;
        this.displayStrategy = displayStrategy || this.defaultDisplayStrategy;
        this.startTime = Date.now();
        this.timerInterval = null;
    }

    /**
     * Begins periodic updates.
     * @returns {this}
     */
    start() {
        this.timerInterval = setInterval(
            () => this.updateDisplay(),
            this.updateFrequency
        );
        return this;
    }

    /**
     * Resets the timer to zero and updates immediately.
     * @returns {this}
     */
    reset() {
        this.startTime = Date.now();
        this.updateDisplay();
        return this;
    }

    /**
     * Stops periodic updates.
     * @returns {this}
     */
    clear() {
        clearInterval(this.timerInterval);
        return this;
    }

    /**
     * Computes elapsed time and writes formatted text to the element.
     */
    updateDisplay() {
        const elapsed = Date.now() - this.startTime;
        this.element.innerText = this.displayStrategy(elapsed);
    }

    /**
     * Default formatting: "m:ss minutes" or "s seconds".
     * @param {number} elapsed – milliseconds
     */
    defaultDisplayStrategy(elapsed) {
        const totalSeconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (minutes > 0) {
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} minutes`;
        }
        return `${totalSeconds} seconds`;
    }

    /**
     * Fluent builder entry point.
     * @param {string|HTMLElement} elementOrId
     */
    static builder(elementOrId) {
        return new ElapseTimerBuilder(elementOrId);
    }
}

/**
 * Builder for ElapseTimer.
 */
export class ElapseTimerBuilder {
    /**
     * @param {string|HTMLElement} elementOrId
     */
    constructor(elementOrId) {
        this.elementOrId = elementOrId;
        this.updateFrequency = 1000;
        this.displayStrategy = null;
    }

    /**
     * Customize update frequency (ms).
     * @param {number} ms
     */
    withUpdateFrequency(ms) {
        this.updateFrequency = ms;
        return this;
    }

    /**
     * Customize how elapsed time is formatted.
     * @param {(elapsedMs: number)=>string} fn
     */
    withDisplayStrategy(fn) {
        this.displayStrategy = fn;
        return this;
    }

    /**
     * Build the ElapseTimer.
     * @returns {ElapseTimer}
     */
    build() {
        return new ElapseTimer(
            this.elementOrId,
            this.updateFrequency,
            this.displayStrategy
        );
    }
}


/*

            import { ElapseTimer } from './elapseTimer.mjs';

            // simple timer with default formatting
            const timer = new ElapseTimer('timerElement').start();

            // using the builder and a custom format
            const customTimer = ElapseTimer
              .builder('timerElement2')
              .withUpdateFrequency(500)
              .withDisplayStrategy(ms => `${(ms/1000).toFixed(1)}s elapsed`)
              .build()
              .start();


*/