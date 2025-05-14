// toaster.mjs

import Common from './common.mjs';

const config = {
    containerId: 'toaster-container',
    fadeInDuration: 200,
    fadeOutDuration: 300,
    displayDuration: 1500,
    messageTypes: [
        { name: 'debug', icon: 'ℹ️', color: 'blue' },
        { name: 'info', icon: 'ℹ️', color: 'darkgray' },
        { name: 'warn', icon: '⚠️', color: '#f1c40f' },
        { name: 'error', icon: '❌', color: '#e74c3c' },
        { name: 'okay', icon: '✅', color: '#2ecc71' },
    ],
};

const messageQueue = [];

export function setConfig(options) {
    Common.merge(config, options);
}

export function debug(message) { show(message, 'debug'); }
export function info(message) { show(message, 'info'); }
export function warn(message) { show(message, 'warn'); }
export function error(message) { show(message, 'error'); }
export function okay(message) { show(message, 'okay'); }

/**
 * show(message, type)
 *
 * Enqueues and displays a toast of the given type.
 */
export function show(message, messageType = 'debug') {
    const container = document.getElementById(config.containerId);
    const typeCfg = config.messageTypes.find(t => t.name === messageType);

    if (!container || !typeCfg) {
        console.error(`Toaster: invalid container or type '${messageType}'`);
        return;
    }

    const toast = document.createElement('div');
    toast.className = 'toaster';
    toast.style.backgroundColor = typeCfg.color;
    toast.style.opacity = '0';

    const icon = document.createElement('span');
    icon.className = 'toaster-icon';
    icon.innerHTML = typeCfg.icon;

    const text = document.createElement('span');
    text.textContent = message;

    toast.append(icon, text);
    messageQueue.push(toast);

    // if this is the only toast, kick off the display loop
    if (messageQueue.length === 1) {
        _displayNext();
    }

    function _displayNext() {
        if (!messageQueue.length) return;
        const current = messageQueue[0];
        container.appendChild(current);

        // fade in
        setTimeout(() => {
            current.style.transition = `opacity ${config.fadeInDuration}ms`;
            current.style.opacity = '1';
        }, 20);

        // fade out & remove
        setTimeout(() => {
            current.style.transition = `opacity ${config.fadeOutDuration}ms`;
            current.style.opacity = '0';

            setTimeout(() => {
                container.removeChild(current);
                messageQueue.shift();
                _displayNext();
            }, config.fadeOutDuration);
        }, config.displayDuration + config.fadeInDuration);
    }
}
