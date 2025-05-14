// apiService.mjs

import Common from './common.mjs';
import * as Toaster from './toaster.mjs';

// -- module‐scoped "private" state & helpers --

const settings = {
    friendlyErrorMessage: () => { Toaster.warn('An error occurred on the server'); },
    onValidationErrors: (errors) => { console.log(JSON.stringify(errors)); },
    publishMessage: (message) => { console.log(message); },
    httpGetNoData: (msg) => { Toaster.warn(`apiservice.default.message: ${msg}`); },
    spinner: {
        clear: (timeout) => { console.log('timeout.clear'); },
        create: () => { console.log('timeout.create'); }
    },
    httpOptions: {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
        timeoutDuration: 30000
    }
};

function assembleOptions(defaultSettings, overrideSettings, data) {
    const options = { ...defaultSettings };
    Common.merge(options, overrideSettings);
    if (data && !['GET', 'DELETE', 'HEAD'].includes(options.method)) {
        options.body = JSON.stringify(data);
        options.headers = options.headers || {};
        options.headers['Content-Type'] ||= 'application/json';
    }
    return options;
}

async function send(url, httpSettings = {}, data = null) {
    const options = assembleOptions(settings.httpOptions, httpSettings, data);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
        settings.publishMessage(`clientside timeout!: ${JSON.stringify(options)}`);
    }, options.timeoutDuration);
    options.signal = controller.signal;

    const spinnerHandle = settings.spinner.create();
    try {
        const response = await fetch(url, options);
        clearTimeout(timeoutId);
        settings.spinner.clear(spinnerHandle);
        return handleResponse(response, options);
    } catch (err) {
        clearTimeout(timeoutId);
        settings.spinner.clear(spinnerHandle);
        if (err.name === 'AbortError') {
            settings.publishMessage('Request timed out');
        } else {
            settings.publishMessage(err);
        }
        throw err;
    }
}

function handleResponse(response, options) {
    if (!response) return null; // fetch aborted
    if (!response.ok) {
        const errMsg = `HTTP error: ${response.status} - ${response.statusText}: ${response.url}`;
        settings.publishMessage(errMsg);
        if (response.status === 400) {
            return response.json().then(json => {
                settings.onValidationErrors?.(json.errors);
                throw new Error('Validation Error');
            });
        }
        if (response.status === 404) {
            console.error('404 Not found', response);
            throw new Error('404 Not found');
        }
        if (response.status === 500) {
            settings.friendlyErrorMessage();
            console.error(response);
            throw new Error('Server Error');
        }
        console.error(response);
        throw new Error('Unhandled API Exception');
    }
    const contentType = response.headers?.get('content-type') || '';
    return contentType.includes('application/json')
        ? response.json()
        : response.text();
}

// http‐method wrappers
const httpGet = (url, opts) => send(url, { ...opts, method: 'GET' });
const httpPost = (url, data, opts) => send(url, { ...opts, method: 'POST' }, data);
const httpPut = (url, data, opts) => send(url, { ...opts, method: 'PUT' }, data);
const httpDelete = (url, opts) => send(url, { ...opts, method: 'DELETE' });

// public API‐method implementations
function executeGet(url, onSuccess, onFailure, apiSettings = {}) {
    return httpGet(url, apiSettings)
        .then(data => {
            // handle no‐data cases
            const empty = data == null
                || (Array.isArray(data) && data.length === 0)
                || (typeof data === 'object' && Object.keys(data).length === 0);

            if (empty) {
                const noDataFn = apiSettings.httpGetNoData || settings.httpGetNoData;
                const msg = apiSettings.noDataMessage
                    ? apiSettings.noDataMessage(data)
                    : `No data for: ${url}`;
                noDataFn(msg);
            }
            if (onSuccess) onSuccess(data);
        })
        .catch(err => {
            if (onFailure) onFailure(err);
            else console.error(err);
        });
}

function executePost(url, data, onSuccess, onFailure, apiSettings = {}) {
    return httpPost(url, data, apiSettings)
        .then(d => onSuccess?.(d))
        .catch(err => (onFailure ? onFailure(err) : console.error(err)));
}

function executePut(url, data, onSuccess, onFailure, apiSettings = {}) {
    return httpPut(url, data, apiSettings)
        .then(d => onSuccess?.(d))
        .catch(err => (onFailure ? onFailure(err) : console.error(err)));
}

function executeDelete(url, onSuccess, onFailure, apiSettings = {}) {
    return httpDelete(url, apiSettings)
        .then(d => onSuccess?.(d))
        .catch(err => (onFailure ? onFailure(err) : console.error(err)));
}

// -- the object we export --

const ApiService = {
    init(apiSettings) {
        Common.merge(settings, apiSettings);
    },
    get: executeGet,
    post: executePost,
    put: executePut,
    delete: executeDelete,
    // if you still need lower‐level access:
    httpGet, httpPost, httpPut, httpDelete,
    handleResponse
};

export default ApiService;
