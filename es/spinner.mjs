// spinner.mjs

import Common from './common.mjs';

const settings = {
    delay: 0,
    elementId: null,
    element: null
};

/**
 * Initialize the spinner by merging in overrides and
 * looking up the DOM element by ID.
 */
export function init(opts = {}) {
    Common.merge(settings, opts);
    if (settings.elementId) {
        settings.element = document.getElementById(settings.elementId);
    }
}

/**
 * Schedule showing the spinner after the configured delay.
 * Returns the timeout handle.
 */
export function create() {
    if (settings.element) {
        return setTimeout(() => {
            settings.element.style.display = 'block';
        }, settings.delay);
    }
    return null;
}

/**
 * Clear a pending spinner show (if any) and hide the element.
 */
export function clear(timeoutHandle) {
    if (timeoutHandle != null) {
        clearTimeout(timeoutHandle);
    }
    if (settings.element) {
        settings.element.style.display = 'none';
    }
}

export default {
    init,
    create,
    clear
};



/*


        import Spinner from './spinner.mjs';

        // configure (e.g. in app startup)
        Spinner.init({ elementId: 'my-spinner', delay: 100 });

        // when you start an async operation:
        const handle = Spinner.create();

        // when it finishes:
        Spinner.clear(handle);


(/)