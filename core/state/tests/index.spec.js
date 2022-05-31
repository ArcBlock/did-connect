const createStateMachine = require('../lib');

describe('State', () => {
  test('should be a function', () => {
    expect(typeof createStateMachine).toBe('function');
  });
});
