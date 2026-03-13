import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MarkovModel } from '../src/MarkovModel.js';

test('MarkovModel basic training and generation', async () => {
  const sampleText = 'hello world. hello again.';
  const markov = new MarkovModel({ order: 1 });
  await markov.train(sampleText);
  
  assert(markov.model.size > 0);
  
  const generated = markov.generate({ maxLength: 10 });
  assert(typeof generated === 'string');
  assert(generated.length > 0);
});
