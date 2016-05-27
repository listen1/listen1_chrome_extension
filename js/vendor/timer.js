'use strict';

/**
 * Timer
 * https://github.com/david-sabata/web-scrobbler/blob/master/core/background/timer.js
 */
function Timer() {

    var callback = null,
        timeoutId = null,
        target = null, // target seconds
        pausedOn = null, // marks pause time in seconds
        startedOn = null, // marks start time in seconds
        spentPaused = 0, // sum of paused time in seconds
        hasTriggered = false; // already triggered callback?

    /**
     * Returns current time in seconds
     */
    function now() {
        return Math.round((new Date()).valueOf() / 1000);
    }

    function setTrigger(seconds) {
        clearTrigger();
        timeoutId = setTimeout(function() {
            callback();
            hasTriggered = true;
        }, seconds * 1000);
    }

    /**
     * Clears internal timeout
     */
    function clearTrigger() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = null;
    }




    /**
     * Set timer and define trigger callback.
     * Use update function to define time to trigger.
     */
    this.start = function(cb) {
        this.reset();
        startedOn = now();
        callback = cb;
    };

    /**
     * Pause timer
     */
    this.pause = function() {
        // only if timer was started and was running
        if (startedOn !== null && pausedOn === null) {
            pausedOn = now();
            clearTrigger();
        }
    };

    /**
     * Unpause timer
     */
    this.resume = function() {
        // only if timer was started and was paused
        if (startedOn !== null && pausedOn !== null) {
            spentPaused += now() - pausedOn;
            pausedOn = null;

            if (!hasTriggered && target !== null) {
                setTrigger(target - this.getElapsed());
            }
        }
    };

    /**
     * Update time for this timer before callback is triggered.
     * Already elapsed time is not modified and callback
     * will be triggered immediately if the new time is less than elapsed.
     *
     * Pass null to set destination time to 'never' - this prevents the timer from
     * triggering but still keeps it counting time.
     *
     * Intentionally does not check if the callback was already triggered.
     * This allows to update the timer after it went out once and still
     * be able to properly trigger the callback for the new timeout.
     */
    this.update = function(seconds) {
        // only if timer was started
        if (startedOn !== null) {
            target = seconds;

            if (seconds !== null) {
                if (pausedOn === null) {
                    setTrigger(target - this.getElapsed());
                }
            } else {
                clearTrigger();
            }
        }
    };

    /**
     * Returns seconds passed from the timer was started.
     * Time spent paused does not count
     */
    this.getElapsed = function() {
        var val = now() - startedOn - spentPaused;

        if (pausedOn !== null) {
            val -= (now() - pausedOn);
        }

        return val;
    };

    /**
     * Checks if current timer has already triggered its callback
     */
    this.hasTriggered = function() {
        return hasTriggered;
    };

    /**
     * Returns remaining (unpaused) seconds or null if no destination time is set
     */
    this.getRemainingSeconds = function() {
        if (target === null) {
            return null;
        }

        return target - this.getElapsed();
    };

    /**
     * Reset timer
     */
    this.reset = function() {
        target = null;
        startedOn = null;
        pausedOn = null;
        spentPaused = 0;
        callback = null;
        hasTriggered = false;

        clearTrigger();
    };

};

