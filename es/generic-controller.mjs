// genericController.mjs

/**
 * A generic UI controller for any resource,
 * using “list”, “view”, “new”, “edit”, “delete” terminology.
 */
export class GenericController {
    /**
     * @param {Object} deps
     * @param {SuperGrid}   deps.grid         – your SuperGrid instance
     * @param {ApiService}  deps.api          – your ApiService wrapper
     * @param {Presenter}   deps.presenter    – the UI presenter
     * @param {Function}    deps.createForm   – formFactory.createForm
     * @param {string}      deps.resourceName – e.g. "users", "orders"
     * @param {string=}     deps.baseUrl      – e.g. "/api" (defaults to "/api")
     * @param {Object=}     deps.endpointsOverride – only odd URL overrides
     * @param {Object}      deps.formSchemas  – { view, new, edit, delete } schemas
     */
    constructor({
        grid,
        api,
        presenter,
        createForm,
        resourceName,
        baseUrl = '/api',
        endpointsOverride = {},
        formSchemas
    }) {
        this.grid = grid;
        this.api = api;
        this.presenter = presenter;
        this.createForm = createForm;
        this.resource = resourceName;
        this.baseUrl = baseUrl;
        this.schemas = formSchemas;

        const convention = {
            list: `${baseUrl}/${resourceName}`,
            view: `${baseUrl}/${resourceName}/{id}`,
            create: `${baseUrl}/${resourceName}`,
            update: `${baseUrl}/${resourceName}/{id}`,
            delete: `${baseUrl}/${resourceName}/{id}`
        };

        // merge in any overrides:
        this.ep = { ...convention, ...endpointsOverride };
    }

    /** Fetch & render the list. */
    async list() {
        const data = await this.api.get(this.ep.list);
        this.grid.renderGrid(data);
    }

    /** Show details for a single item. */
    async view(id) {
        const { items } = await this.api.get(this._url(this.ep.view, id));
        const schema = this.schemas.view;
        const formNode = this._populateForm(schema, items[0], { readOnly: true });
        this.presenter.showForm({ title: schema.title, form: formNode });
    }

    /** Open a blank “new” form. */
    new() {
        const schema = this.schemas.new;
        const formNode = this.createForm({
            ...schema,
            onSubmit: async data => {
                await this.api.post(this.ep.create, data);
                this.presenter.closeForm();
                await this.list();
            }
        });
        this.presenter.showForm({ title: schema.title, form: formNode });
    }

    /** Open an “edit” form pre-populated. */
    async edit(id) {
        const { items } = await this.api.get(this._url(this.ep.view, id));
        const schema = this.schemas.edit;
        const formNode = this._populateForm(schema, items[0], {
            onSubmit: async data => {
                await this.api.put(this._url(this.ep.update, id), data);
                this.presenter.closeForm();
                await this.list();
            }
        });
        this.presenter.showForm({ title: schema.title, form: formNode });
    }

    /** Open a “delete” confirmation form. */
    async delete(id) {
        const schema = this.schemas.delete;
        const formNode = this.createForm({
            ...schema,
            onSubmit: async () => {
                await this.api.delete(this._url(this.ep.delete, id));
                this.presenter.closeForm();
                await this.list();
            }
        });
        this.presenter.showForm({ title: schema.title, form: formNode });
    }

    // — helpers —

    _url(pattern, id) {
        return pattern.replace('{id}', encodeURIComponent(id));
    }

    _populateForm(schema, data, { onSubmit = schema.onSubmit, readOnly = false } = {}) {
        // build form with our factory
        const node = this.createForm({ ...schema, onSubmit });
        // fill in values
        Object.entries(data).forEach(([k, v]) => {
            const input = node.querySelector(`#${k}`);
            if (input) {
                input.value = v;
                if (readOnly) input.disabled = true;
            }
        });
        return node;
    }
}


/*

            import SuperGrid      from './supergrid.mjs';
            import ApiService     from './apiService.mjs';
            import Presenter      from './presenter.mjs';
            import { createForm } from './formFactory.mjs';
            import { GenericController } from './genericController.mjs';

            // Define only the resource name:
            const resourceName = 'customers';

            // If you need an odd endpoint, override here:
            const endpointsOverride = {
              list: '/api/v2/customers',          // custom versioned list URL
              delete: '/api/v2/customer/remove/{id}'
            };

            const formSchemas = {
              view: {
                title: 'Customer Details',
                fields: []
              },
            new: {
                title: 'New Customer',
                    fields: []
            },
            edit: {
                title: 'Edit Customer',
                    fields: []
            },
            delete: {
                title: 'Confirm Delete',
                    fields: []
                }
            };

            // Instantiate & start:
            const controller = new GenericController({
                grid: SuperGrid,
                api: ApiService,
                presenter: Presenter,
                createForm,
                resourceName,
                baseUrl: '/api/v2',          // optional
                endpointsOverride,
                formSchemas
            });

            controller.list();


*/