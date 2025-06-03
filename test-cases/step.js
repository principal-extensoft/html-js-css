export class Step {
  constructor({ id, description, expectedResult = "", subSteps = [] }) {
    this.id = id;
    this.description = description;
    this.expectedResult = expectedResult;
    this.subSteps = subSteps.map(ss => new Step(ss));
  }

  addSubStep(stepData) {
    this.subSteps.push(new Step(stepData));
  }

  toJSON() {
    return {
      id: this.id,
      description: this.description,
      expectedResult: this.expectedResult,
      subSteps: this.subSteps.map(ss => ss.toJSON())
    };
  }
}
