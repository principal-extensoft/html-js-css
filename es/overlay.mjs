// overlay.mjs

/**
 * A small overlay manager.
 */

const overlays = {};

/**
 * Inserts a built overlay into the container with the given key (element id),
 * and shows it.
 */
export function setOverlay(key, args) {
    const container = document.getElementById(key);
    if (!container) return;
    const overlay = buildOverlay(key, args);
    container.appendChild(overlay);
    container.style.display = 'block';
}

/**
 * Clears out and hides the overlay container.
 */
export function removeOverlay(key) {
    const container = document.getElementById(key);
    if (!container) return;
    container.innerHTML = '';
    container.style.display = 'none';
}

/**
 * Registers a callback for a given overlay key (not used by default logic,
 * but stored for your own invocation later).
 */
export function registerOverlay(key, func) {
    if (!overlays[key]) {
        overlays[key] = { args: null, funcs: [func] };
    } else {
        overlays[key].funcs.push(func);
    }
}

/**
 * Closes the default background-overlay by clearing its title/content.
 */
export function closeOverlay() {
    const bg = document.getElementById('background-overlay');
    const titleEl = document.getElementById('overlay-title');
    const content = document.getElementById('overlay-content');
    if (titleEl) titleEl.innerHTML = '';
    if (content) content.innerHTML = '';
    if (bg) bg.style.display = 'none';
}

/**
 * Shows the default background-overlay, after injecting title + elements.
 */
export function showOverlay(overlayTitle, ...elements) {
    renderContent(overlayTitle, ...elements);
    const bg = document.getElementById('background-overlay');
    if (bg) bg.style.display = 'block';
    else console.error('Background overlay element is missing.');
}

/**
 * Fills in the title and body for the default overlay structure.
 */
export function renderContent(overlayTitle = 'Overlay Title', ...elements) {
    const titleEl = document.getElementById('overlay-title');
    const content = document.getElementById('overlay-content');
    if (!titleEl || !content) {
        console.error('Required overlay elements are missing.');
        return;
    }
    titleEl.textContent = overlayTitle;
    content.innerHTML = '';
    elements.forEach(el => {
        if (el instanceof HTMLElement) {
            content.appendChild(el);
        } else {
            console.warn('Invalid element skipped:', el);
        }
    });
}

// -- private helper to create the DOM structure for an overlay --
function buildOverlay(key /*, args—unused currently */) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    // header
    const header = document.createElement('div');
    header.className = 'overlay-header';

    const titleElement = document.createElement('div');
    titleElement.id = 'overlay-title';
    titleElement.className = 'overlay-title';

    const exitButton = document.createElement('button');
    exitButton.textContent = '×';
    exitButton.addEventListener('click', () => removeOverlay(key));

    header.append(titleElement, exitButton);

    // body
    const body = document.createElement('div');
    body.id = 'overlay-content';

    overlay.append(header, body);
    return overlay;
}

export default {
    setOverlay,
    removeOverlay,
    registerOverlay,
    closeOverlay,
    showOverlay,
    renderContent
};


/*


        import Overlay from './overlay.mjs';

        // To create & display:
        Overlay.setOverlay('background-overlay');

        // Or, use the default background + content:
        const contentEl = document.createElement('p');
        contentEl.textContent = 'Hello world';
        Overlay.showOverlay('My Title', contentEl);

        // To close:
        Overlay.closeOverlay();




*/