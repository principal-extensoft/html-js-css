// h.js

/**
 * h(tagOrComponent, props, ...children) → DOM Node
 * If tagOrComponent is a function, it’s treated as a Component.
 */
export function h(tag, props = {}, ...children) {
    // Components
    if (typeof tag === 'function') {
        return tag({ ...props, children });
    }

    // Native elements
    const el = document.createElement(tag);

    // Apply props
    for (const [key, value] of Object.entries(props)) {
        if (key.startsWith('on') && typeof value === 'function') {
            // e.g. onSubmit, onClick
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key in el) {
            el[key] = value;  // for value, checked, etc.
        } else {
            el.setAttribute(key, value);
        }
    }

    // Append children
    children.flat().forEach(child => {
        if (child == null) return;
        if (typeof child === 'string' || typeof child === 'number') {
            el.appendChild(document.createTextNode(child));
        } else {
            el.appendChild(child);
        }
    });

    return el;
}


/*


*/