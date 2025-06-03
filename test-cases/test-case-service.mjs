const API_BASE = '/api/testcases';
export const TestCaseService = {
  async getAll() {
    const resp = await fetch(API_BASE);
    return resp.json(); // array of summaries
  },
  async getById(id) {
    const resp = await fetch(`${API_BASE}/${id}`);
    const json = await resp.json();
    return new TestCase(json);
  },
  async create(testCase) {
    await fetch(API_BASE, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(testCase.toJSON())
    });
  },
  async update(id, testCase) {
    await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(testCase.toJSON())
    });
  },
  async delete(id) {
    await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  }
};
