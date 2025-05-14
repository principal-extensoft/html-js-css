// formFactory.mjs

import { h } from './h.js';
import { Validation, ProblemDetails } from './validator.mjs';

/**
 * A field schema:
 * {
 *   name: string,
 *   label: string,
 *   type?: string,          // e.g. "text", "email", "date", etc.
 *   required?: boolean,
 *   validators?: Array<fn>, // each fn: (value)=>true|ProblemDetails
 * }
 *
 * formSchema = {
 *   title: string,
 *   fields: FieldSchema[],
 *   onSubmit: (data:Object)=>void,
 *   apiClient?: { validate(domain,id,value):Promise<PD|true> },
 *   validationDomain?: string
 * }
 */
export function createForm(formSchema) {
    const { title, fields, onSubmit, apiClient, validationDomain } = formSchema;

    // Build inputs & validations
    const validators = {};
    fields.forEach(field => {
        if (field.validators || apiClient) {
            const inputEl = document.createElement('input'); // dummy for setup
            inputEl.id = field.name;
            const val = new Validation(inputEl, apiClient)
                .when(v => !field.required || v.trim() !== '')
                .onFailureFunc(pd => {/* can hook extra UI here */ })
                .onSuccessFunc(() => {/* optional */ });

            // required check
            if (field.required) {
                val.addValidator(v => v.trim() ? true : new ProblemDetails({
                    title: `${field.label} is required`,
                    errors: { [field.name]: `${field.label} cannot be empty` }
                }));
            }
            // custom validators
            (field.validators || []).forEach(fn => val.addValidator(fn));

            // API validator if requested
            if (apiClient && validationDomain) {
                val.addApi(validationDomain);
            }

            validators[field.name] = val;
        }
    });

    // onSubmit handler
    const handleSubmit = e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const runAll = Object.entries(validators).map(([name, val]) =>
            val.executeValidators(data[name])
        );
        // Wait for all validations
        Promise.all(runAll)
            .then(() => onSubmit(data))
            .catch(err => {
                console.error('Submission blocked by validation:', err);
            });
    };

    // Build the form JSX-style
    const formNode = h('form', { onSubmit: handleSubmit, className: 'js-form' },
        h('h3', {}, title),
        ...fields.map(field =>
            h('div', { className: 'form-group' },
                h('label', { for: field.name }, field.label),
                h('input', {
                    id: field.name,
                    name: field.name,
                    type: field.type || 'text',
                    required: field.required || false,
                    className: 'form-control'
                })
            )
        ),
        h('button', { type: 'submit', className: 'btn btn-primary' }, 'Submit')
    );

    // Wire up each Validation to its real input element
    Object.values(validators).forEach(v => {
        const el = formNode.querySelector(`#${v.inputEl.id}`);
        v.inputEl = el;
        v.setup();
    });

    return formNode;
}

/*


            import { createForm } from './formFactory.mjs';
            import ApiService    from './apiService.mjs';

            // Define your form schema
            const userFormSchema = {
              title: 'Create User',
              fields: [
                { name: 'username', label: 'Username', required: true,
                  validators: [
                    v => v.length >= 4 
                      ? true 
                      : new ProblemDetails({ title: 'Too short', errors: { username: 'Minimum 4 chars' } })
                  ]
                },
                { name: 'email',    label: 'Email',    type: 'email', required: true }
              ],
              apiClient: {
                async validate(domain, id, value) {
                  try {
                    const pd = await ApiService.post(`/api/validate/${domain}`, { id, toValidate: value });
                    return pd.errors ? new ProblemDetails(pd) : true;
                  } catch (e) {
                    return new ProblemDetails({
                      title:  'Network error',
                      detail: e.message,
                      errors: { [id]: e.message }
                    });
                  }
                }
              },
              validationDomain: 'users',
              onSubmit(data) {
                console.log('Form submitted with', data);
                // call ApiService.post(...) etc.
              }
            };

            // Render it
            const container = document.getElementById('form-container');
            container.appendChild(createForm(userFormSchema));



*/