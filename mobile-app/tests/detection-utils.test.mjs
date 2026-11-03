import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeById } from '../src/services/detection-utils.mjs';

test('mergeById appends new page rows without duplicating an id', () => {
  const merged = mergeById([{ id: 'a', value: 1 }], [{ id: 'a', value: 1 }, { id: 'b', value: 2 }]);
  assert.deepEqual(merged, [{ id: 'a', value: 1 }, { id: 'b', value: 2 }]);
});

test('mergeById replaces a stale row with the latest database event', () => {
  const merged = mergeById([{ id: 'a', status: 'new' }], [{ id: 'a', status: 'resolved' }]);
  assert.deepEqual(merged, [{ id: 'a', status: 'resolved' }]);
});
