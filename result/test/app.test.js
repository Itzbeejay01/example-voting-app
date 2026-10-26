const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'views', 'app.js'), 'utf8');
const context = {
  angular: { module: () => ({ controller: () => {} }) },
  document: { getElementById: () => ({ style: {} }) },
  io: { connect: () => ({ on: () => {} }) },
};
vm.createContext(context);
vm.runInContext(source, context);

test('getPercentages calculates the vote split', () => {
  assert.deepEqual({ ...context.getPercentages(3, 1) }, { a: 75, b: 25 });
});

test('getPercentages returns an even split when there are no votes', () => {
  assert.deepEqual({ ...context.getPercentages(0, 0) }, { a: 50, b: 50 });
});

test('getPercentages always totals 100', () => {
  const result = context.getPercentages(2, 1);
  assert.equal(result.a + result.b, 100);
});
