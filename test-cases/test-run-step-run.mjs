class StepRun {
  constructor(step) {
    this.id = step.id;
    this.status = 'not-run'; // 'pass' | 'fail' | 'blocked'
    this.notes = '';
    this.subSteps = step.subSteps.map(ss => new StepRun(ss));
  }
}
class TestRun {
  constructor(testCase) {
    this.testCaseId = testCase.id;
    this.startedAt = new Date().toISOString();
    this.stepRuns = testCase.steps.map(s => new StepRun(s));
  }
}
