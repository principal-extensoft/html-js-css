// appState.mjs

/**
 * Utility for namespaced, typed access to localStorage.
 */

// Private helper
function isLocalStorageAvailable() {
    try {
        const testKey = '__test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}

const AppState = {
    /**
     * Call once at app startup to check availability.
     */
    init() {
        if (!isLocalStorageAvailable()) {
            console.warn('Local storage is not available.');
        }
    },

    set(key, value) {
        if (!isLocalStorageAvailable()) return;
        localStorage.setItem(key, JSON.stringify(value));
    },

    get(key) {
        if (!isLocalStorageAvailable()) return null;
        const raw = localStorage.getItem(key);
        return raw != null ? JSON.parse(raw) : null;
    },

    setBool(key, value) {
        if (typeof value !== 'boolean') {
            console.warn('Value must be a boolean.');
            return;
        }
        this.set(key, value);
    },

    getBool(key) {
        const v = this.get(key);
        return v === true;
    },

    setInt(key, value) {
        if (!Number.isInteger(value)) {
            console.warn('Value must be an integer.');
            return;
        }
        this.set(key, value);
    },

    getInt(key) {
        const v = this.get(key);
        return Number.isInteger(v) ? v : null;
    },

    setString(key, value) {
        if (typeof value !== 'string') {
            console.warn('Value must be a string.');
            return;
        }
        this.set(key, value);
    },

    getString(key) {
        const v = this.get(key);
        return typeof v === 'string' ? v : null;
    },

    setDate(key, value) {
        if (!(value instanceof Date)) {
            console.warn('Value must be a Date object.');
            return;
        }
        this.set(key, value.toISOString());
    },

    getDate(key) {
        const raw = this.get(key);
        return raw ? new Date(raw) : null;
    },

    /**
     * Retrieve all keys.
     * @param {string=} namespace  If provided, returns a nested object tree under that namespace.
     *                             Otherwise returns an array of {key,value}.
     */
    getAllKeys(namespace) {
        if (!isLocalStorageAvailable()) return namespace ? {} : [];

        const result = namespace ? {} : [];
        for (const key of Object.keys(localStorage)) {
            const value = this.get(key);
            if (namespace) {
                if (!key.startsWith(namespace)) continue;
                // build nested object
                const parts = key.split('.');
                let cur = result;
                parts.forEach((part, idx) => {
                    if (idx === parts.length - 1) {
                        cur[part] = value;
                    } else {
                        cur[part] = cur[part] || {};
                        cur = cur[part];
                    }
                });
            } else {
                result.push({ key, value });
            }
        }
        return result;
    }
};

export default AppState;


/*

// appState.mjs

/**
 * Utility for namespaced, typed access to localStorage.
 */

// Private helper
function isLocalStorageAvailable() {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const AppState = {
  /**
   * Call once at app startup to check availability.
   */
  init() {
    if (!isLocalStorageAvailable()) {
      console.warn('Local storage is not available.');
    }
  },

  set(key, value) {
    if (!isLocalStorageAvailable()) return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  get(key) {
    if (!isLocalStorageAvailable()) return null;
    const raw = localStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : null;
  },

  setBool(key, value) {
    if (typeof value !== 'boolean') {
      console.warn('Value must be a boolean.');
      return;
    }
    this.set(key, value);
  },

  getBool(key) {
    const v = this.get(key);
    return v === true;
  },

  setInt(key, value) {
    if (!Number.isInteger(value)) {
      console.warn('Value must be an integer.');
      return;
    }
    this.set(key, value);
  },

  getInt(key) {
    const v = this.get(key);
    return Number.isInteger(v) ? v : null;
  },

  setString(key, value) {
    if (typeof value !== 'string') {
      console.warn('Value must be a string.');
      return;
    }
    this.set(key, value);
  },

  getString(key) {
    const v = this.get(key);
    return typeof v === 'string' ? v : null;
  },

  setDate(key, value) {
    if (!(value instanceof Date)) {
      console.warn('Value must be a Date object.');
      return;
    }
    this.set(key, value.toISOString());
  },

  getDate(key) {
    const raw = this.get(key);
    return raw ? new Date(raw) : null;
  },

  /**
   * Retrieve all keys.
   * @param {string=} namespace  If provided, returns a nested object tree under that namespace.
   *                             Otherwise returns an array of {key,value}.
   */
  getAllKeys(namespace) {
    if (!isLocalStorageAvailable()) return namespace ? {} : [];

    const result = namespace ? {} : [];
    for (const key of Object.keys(localStorage)) {
      const value = this.get(key);
      if (namespace) {
        if (!key.startsWith(namespace)) continue;
        // build nested object
        const parts = key.split('.');
        let cur = result;
        parts.forEach((part, idx) => {
          if (idx === parts.length - 1) {
            cur[part] = value;
          } else {
            cur[part] = cur[part] || {};
            cur = cur[part];
          }
        });
      } else {
        result.push({ key, value });
      }
    }
    return result;
  }
};

export default AppState;

/*


            import AppState from './appState.mjs';

            AppState.init();

            AppState.setString('user.name', 'Alice');
            console.log(AppState.getString('user.name')); // "Alice"

            AppState.setDate('lastLogin', new Date());
            console.log(AppState.getDate('lastLogin')); // Date object

            // all keys:
            const all = AppState.getAllKeys(); 
            // namespaced:
            const tree = AppState.getAllKeys('myapp.users.505.preferences');




*/