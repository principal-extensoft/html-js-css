import Wizard from './wizard.mjs';

Wizard.init(
    {
        orientation: 'vertical',
        transitions: [
            { id: 'start-middle', isEnabled: true },
            { id: 'middle-end', isEnabled: false }
        ],
        states: [
            {
                name: 'start',
                display: 'Step 1',
                buildElement: () => { /* return a DOM node */ },
                behaviors: {
                    validate: () => {/* return boolean */ },
                    onEnter: () => {/* called when entering this step */ }
                }
            },
            // … more states …
        ]
    },
    {
        workflow: {
            begin: 'start',
            end: ['end']
        },
        states: [ /* state definitions… see above */],
        transitions: [ /* transition definitions… see above */]
    }
);

// To trigger manual validation when form fields change:
Wizard.validate();
