export class TestCase {
  constructor({ id, title, description, steps = [] }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.steps = steps.map(s => new Step(s));
  }

  addStep(stepData) {
    this.steps.push(new Step(stepData));
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      steps: this.steps.map(s => s.toJSON())
    };
  }
}
