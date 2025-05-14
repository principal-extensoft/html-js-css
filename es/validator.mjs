// validator.mjs

import Common from './common.mjs';
import TOASTER from './toaster.mjs';

/**
 * Global validator settings (if you need them).
 */
export const Validator = {
    settings: {},
    init(options = {}) {
        Common.merge(this.settings, options);
    }
};

/**
 * Per-input validation harness.
 */
export class Validation {
    /**
     * @param {HTMLInputElement} inputEl
     * @param {{ validate: (domain:string, id:string, value:string)=>Promise<ProblemDetails|true> }=} apiClient
     */
    constructor(inputEl, apiClient = null) {
        if (!(inputEl instanceof HTMLInputElement)) {
            throw new Error('Validation requires an HTMLInputElement');
        }
        this.inputEl = inputEl;
        this.apiClient = apiClient;
        this.failFast = true;
        this.onSuccess = () => { };
        this.onFailure = () => { };
        this.validators = [];
        this.debounceTime = 500;
        this.debounceFunc = null;
        this.shouldValidate = () => true;
        this.publishFunc = this._defaultPublish.bind(this);
    }

    setFailFast(enabled = true) {
        this.failFast = enabled;
        return this;
    }

    onSuccessFunc(fn) {
        this.onSuccess = fn;
        return this;
    }

    onFailureFunc(fn) {
        this.onFailure = fn;
        return this;
    }

    /**
     * Only validate when this predicate returns true.
     */
    when(fn) {
        this.shouldValidate = fn;
        return this;
    }

    /**
     * Override how errors are published.
     */
    setPublisher(fn) {
        this.publishFunc = fn;
        return this;
    }

    /**
     * Add a generic validator function.
     * If `debounce` is true, it will be debounced.
     */
    addValidator(fn, { debounce = false, time = 500 } = {}) {
        if (debounce) {
            this.debounceTime = time;
            this.debounceFunc = this._debounce(fn, time);
        } else {
            this.validators.push(fn);
        }
        return this;
    }

    /**
     * Add a regex-based validator.
     */
    addRegex(pattern, message) {
        return this.addValidator(value => {
            if (!pattern.test(value)) {
                return new ProblemDetails({
                    title: message,
                    errors: { [this.inputEl.id]: message },
                    testType: 'regex'
                });
            }
            return true;
        });
    }

    /**
     * Add a server-side (API) validator.
     * Requires an apiClient with a `validate(domain, id, value)` method.
     */
    addApi(domain = '') {
        if (!this.apiClient) {
            throw new Error('No API client provided to Validation');
        }
        const fn = async value => {
            const res = await this.apiClient.validate(domain, this.inputEl.id, value);
            if (res instanceof ProblemDetails) {
                res.testType = 'api';
                return res;
            }
            return true;
        };
        // if a debounce validator exists, debounce this fn too
        if (this.debounceFunc) {
            this.debounceFunc = this._debounce(fn, this.debounceTime);
        } else {
            this.validators.push(fn);
        }
        return this;
    }

    /**
     * Wire up the validation logic to the input element.
     */
    setup() {
        const el = this.inputEl;
        const runner = async () => {
            this.clearErrorMessage();
            if (!this.shouldValidate(el.value)) return;

            // run debounce validator if present
            if (this.debounceFunc) {
                const result = await this.debounceFunc(el.value);
                if (result !== true) return this._handleFailure(result);
            }

            // run each validator in sequence
            for (const fn of this.validators) {
                const result = await fn(el.value);
                if (result !== true) {
                    this._handleFailure(result);
                    if (this.failFast) return;
                }
            }

            this.onSuccess(el.value);
        };

        el.addEventListener(this.debounceFunc ? 'input' : 'change', runner);
        return this;
    }

    // --- internals ---

    _handleFailure(pd) {
        if (!(pd instanceof ProblemDetails)) {
            console.error('Validator failure not a ProblemDetails:', pd);
            return;
        }
        this._showErrorMessage(pd);
        this.onFailure(pd);
    }

    _defaultPublish(pd) {
        this.inputEl.title = pd.title;
        if (pd.testType === 'api') {
            TOASTER.warn(pd.title);
        }
    }

    _showErrorMessage(pd) {
        let errDiv = document.getElementById(`${this.inputEl.id}-error`);
        if (!errDiv) {
            errDiv = document.createElement('div');
            errDiv.id = `${this.inputEl.id}-error`;
            errDiv.className = 'validation-error';
            this.inputEl.insertAdjacentElement('afterend', errDiv);
        }
        errDiv.textContent = Object.values(pd.errors).join(', ') || pd.title;
        errDiv.style.display = 'block';
        this.publishFunc(pd);
    }

    clearErrorMessage() {
        const div = document.getElementById(`${this.inputEl.id}-error`);
        if (div) {
            div.textContent = '';
            div.style.display = 'none';
        }
    }

    _debounce(fn, wait) {
        let timeout;
        return (...args) =>
            new Promise((resolve, reject) => {
                clearTimeout(timeout);
                timeout = setTimeout(async () => {
                    try {
                        resolve(await fn(...args));
                    } catch (e) {
                        reject(e);
                    }
                }, wait);
            });
    }
}

/**
 * RFC-style ProblemDetails with a simple `errors` map.
 */
export class ProblemDetails {
    constructor({ type = '', title = '', status = 0, detail = '', instance = '', errors = {} } = {}) {
        this.type = type;
        this.title = title;
        this.status = status;
        this.detail = detail;
        this.instance = instance;
        this.errors = errors;
        this.testType = '';
    }

    log() {
        console.error(this.title, this.detail, this.errors);
        return this;
    }

    /**
     * Render errors into an element designated by `selector`.
     */
    display(selector) {
        let el = document.querySelector(`${selector}-error`);
        if (!el) {
            el = document.createElement('div');
            el.id = selector.replace(/^#/, '') + '-error';
            el.className = 'validation-error';
            document.querySelector(selector).insertAdjacentElement('afterend', el);
        }
        el.innerHTML = Object.values(this.errors).join('<br/>');
        el.style.display = el.innerHTML ? 'block' : 'none';
        return this;
    }
}


/*

        import ApiService    from './apiService.mjs';
        import { Validation, ProblemDetails } from './validator.mjs';

        const myValidator = new Validation(
          document.getElementById('username'),
          {
            // adapt ApiService into a minimal client interface
            async validate(domain, id, value) {
              try {
                const pd = await ApiService.post(`/api/validate/${domain}`, { id, toValidate: value });
                // if your API returns a ProblemDetails‐shaped JSON on failure:
                return (pd.errors) ? new ProblemDetails(pd) : true;
              } catch (e) {
                return new ProblemDetails({
                  title:  'Network error',
                  detail: e.message,
                  errors: { [id]: e.message }
                });
              }
            }
          }
        );

        myValidator
          .addRegex(/^[A-Za-z]\w{3,}$/, 'Must start with a letter and be ≥4 chars')
          .addApi('usernames')
          .onSuccessFunc(v => console.log('good:', v))
          .onFailureFunc(pd => console.warn('bad:', pd))
          .setup();


*/