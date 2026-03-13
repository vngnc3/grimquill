#!/usr/bin/env node
const path = require('path');
const { MarkovModel } = require('../src');
const fs = require('fs');

const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === 'train') {
  const textFile = args[1];
  const out = args[3] || 'model.json';
  const order = parseInt(args[args.indexOf('--order') + 1]) || 3;
  const tokenType = args[args.indexOf('--tokenType') + 1] || 'word';
  const m = new MarkovModel({ order, tokenType });
  m.train(fs.readFileSync(textFile, 'utf8'));
  m.save(out);
  console.log(`trained ${out}`);
} else if (cmd === 'generate') {
  const model = args[1];
  const temp = parseFloat(args[args.indexOf('--temp') + 1]) || 0.8;
  const seed = args[args.indexOf('--seed') + 1];
  const msprob = parseFloat(args[args.indexOf('--multipleSentenceProbability') + 1]) || 0;
  const m = await MarkovModel.load(model);
  console.log(m.generate({ temperature: temp, seed, multipleSentenceProbability: msprob }));
} else {
  console.log('grimquill train <text> [--order N] [--out model.json] [--tokenType word|char]');
  console.log('grimquill generate <model> [--temp T] [--seed S] [--multipleSentenceProbability P]');
}
