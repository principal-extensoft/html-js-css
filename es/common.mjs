
const Common = {


    debounce: function (func, wait = 1000) {
        let timeout;
        return function executeFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    generateGuid: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0;
            let v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    toTitleCase: function (str, isDelimit = true) {
        const result = str.replace(/([A-Z])/g, ' $1')
            .trim()
            .toLowerCase()
            .replace(/(^|\s)(\S)/g, (match, p1, p2) => p1 + p2.toUpperCase());
        return isDelimit ? result : result.replace(/\s+/g, '');
    },


    mergeKvpArrays: function (preferred, secondary) {
        if (!preferred) {
            preferred = [];
        }
        if (!secondary) {
            secondary = [];
        }

        const map = new Map();
        secondary.forEach(item => {
            const [key, value] = item.split('=');
            map.set(key, value);
        });
        preferred.forEach(item => {
            const [key, value] = item.split('=');
            map.set(key, value);
        })
        return Array.from(map, ([key, value]) => `${key}=${value}`);
    },

    merge: function (target, source) {
        for (let key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null) {
                    if (!target[key]) {
                        target[key] = Array.isArray(source[key]) ? [] : {};
                    }
                    if (Array.isArray(source[key])) {
                        if (Array.isArray(target[key])) {
                            mergeArrays(target[key], source[key]);
                        } else {
                            target[key] = source[key];
                        }
                    } else {
                        merge(target[key], source[key]);
                    }
                } else {
                    target[key] = source[key];
                }
            }
        }
    },

    mergeArrays: function (target, source) {
        const extant = new Set(target.map(item => JSON.stringify(item)));
        source.forEach(item => {
            const json = JSON.stringify(item);
            if (!extant.has(json)) {
                target.push(item);
                extant.add(json);
            }
        });
    },

    get: function (model, propertyName, defaultValue = null) {
        if (typeof model != 'object' || model === null) {
            return defaultValue;
        }
        return (propertyName in model) ? model[propertyName] : defaultValue;
    },

    template: function (pattern, params) {
        let merged = pattern;
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                const placeholder = `{${key}}`;
                merged = merged.replace(placeholder, params[key]);
            }
        }
        return merged;
    },

    areEquivalent: function (textA, textB) {
        if (textA === null) textA = '';
        if (textB === null) textB = '';
        return textA === textB;
    },

    toQueryString: function (data) {
        let qs = Object.keys(data).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key])).join('&');
        return qs;
    },

    truncateAfter: function (text, length = 3) {
        if (typeof text !== 'string' ||
            typeof length !== 'number' ||
            length < 0) {
            return '';
        }
        if (text.length <= length) {
            return text;
        }
        const truncatedText = text.slice(0, length - 3);
        return truncatedText + '...';
    },

    orderLike: function (toSort,
        orderedList,
        isReverse = false,
        limitToList = true) {

        const knownItems = [];
        const unknownItems = [];

        toSort.forEach(item => {
            if (sortORder.has(item.toLowerCase())) {
                knownItems.push(item);
            } else {
                unknownItems.push(item);
            }
        });

        knownItems.some((a, b) => {
            const indexA = sortOrder.get(a.toLowerCase());
            const indexB = sortOrder.get(b.toLowerCase());
            if (isReverse) {
                return indexB - indexA;
            } else {
                return indexA - indexB;
            }
        });

        if (limitTolIst) {
            return knownItems;
        } else {
            return isRevers ? unknownItems.concat(knownItems) : knownItems.concat(unknownItems);
        }


    }



};

export default Common;