// Explorer.mjs
import ApiService from './es/api-service.mjs';
import Common from './es/common.mjs';

const PolicySearch = {
    settings: {
        containerId: 'facet-container',
        serviceUrl: '/api/facets/search'
    },

    state: {
        facets: []
    },

    /**
     * Initialize with optional overrides, then load & render.
     * @param {{ containerId?: string, serviceUrl?: string }} opts
     */
    init(opts = {}) {
        Common.merge(this.settings, opts);
        this.container = document.getElementById(this.settings.containerId);
        if (!this.container) {
            console.error(`Explorer: no element with id "${this.settings.containerId}"`);
            return;
        }
        // optional: spin up ApiService spinner, etc.
        this.loadFacets();
    },

    /** Fetch facets and render them */
    async loadFacets() {
        this.container.innerHTML = '<em>Loading facets…</em>';
        ApiService.get(
            this.settings.serviceUrl,
            data => {
                this.state.facets = data.facets || [];
                this.render();
            },
            err => {
                console.error('PolicySearch.loadFacets error:', err);
                this.container.innerHTML = '<span class="text-danger">Failed to load facets.</span>';
            }
        );
    },

    /** Render the facets as a list */
    render() {
        this.container.innerHTML = '';
        if (!this.state.facets.length) {
            this.container.innerText = 'No facets found.';
            return;
        }
        const elements = [];
        this.state.facets.forEach(f => {


            const fieldset = document.createElement('fieldset');
            fieldset.className = 'facet-card';
            fieldset.innerHTML = `<legend>${f.display}</legend>`;
            const select = document.createElement('select');
            select.multiple = true;
            select.className = 'multiselect-listbox';
            select.id = f.id;
            select.disabled = !f.isEnabled;
            const selectOption = document.createElement('option');
            selectOption.value = -1;
            selectOption.textContent = "Select...";
            select.appendChild(selectOption);
            
            f.items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.value;
                option.textContent = item.display;
                option.disabled = !item.isEnabled;
                select.appendChild(option);
            })

            select.addEventListener('change', (event) => {
                this.handleSelectFacetEvent(event, select);
            });
            const div = document.createElement('div');
            div.className = 'card-content';
            div.appendChild(select);
            fieldset.appendChild(div);
            elements.push(fieldset);
        })

        const actionbutton = document.createElement('button');
        actionbutton.id = '';
        actionbutton.textContent = 'search';
        actionbutton.type = 'button';
        actionbutton.classList.add('btn', 'btn-primary', 'clear-filter', 'command');
        actionbutton.addEventListener('click', () => {
            const action = 'search';
            this.executeAction(action);
        });
        elements.push(actionbutton);
        elements.forEach(el => { this.container.appendChild(el); });

    },

    executeAction(actionName) {
        console.log(actionName);
    },

    handleSelectFacetEvent(event) {
        console.log('select facet event');
    }


};

export default PolicySearch;
