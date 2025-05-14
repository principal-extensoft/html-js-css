import ApiService from './apiService.mjs';
import SuperGrid from './supergrid.mjs';
import { createForm } from './formFactory.mjs';
import Presenter from './presenter.mjs';

class GridController {
    constructor({ grid, api, presenter, formSchemas }) {
        this.grid = grid;
        this.api = api;
        this.presenter = presenter;
        this.schemas = formSchemas;  // e.g. { details: schemaObj, update: schemaObj, delete: schemaObj }
    }

    async list() {
        const data = await this.api.get('/api/model');
        this.grid.renderGrid(data);
    }

    async showDetails(id) {
        const { items } = await this.api.get(`/api/model/${id}`);
        const schema = this.schemas.details;
        const formNode = createForm({ ...schema, onSubmit: () => {/* no-op for details*/ } });
        // populate form with data[0]
        Object.entries(items[0]).forEach(([k, v]) => {
            const input = formNode.querySelector(`#${k}`);
            if (input) input.value = v;
        });
        this.presenter.showForm({ title: schema.title, form: formNode });
    }

    async edit(id) {
        const { items } = await this.api.get(`/api/model/${id}`);
        const schema = this.schemas.update;
        const formNode = createForm({
            ...schema,
            onSubmit: data => this._submitUpdate(id, data)
        });
        Object.entries(items[0]).forEach(([k, v]) => {
            const input = formNode.querySelector(`#${k}`);
            if (input) input.value = v;
        });
        this.presenter.showForm({ title: schema.title, form: formNode });
    }

    async _submitUpdate(id, data) {
        await this.api.put(`/api/model/${id}`, data);
        this.presenter.closeForm();
        this.list();
    }

    // similar for create & delete…
}
