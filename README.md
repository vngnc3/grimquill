# Grimquill 🔮✍️🤖🧠

Configurable Higher-Order Markov Text Generator.

## What does Grimquill do?
- 🧠 Create and train higher-order Markov chain models
- 🔮 Generate text from the trained Markov chain models
- 🚅 Support parallel processing for faster training
- 📝 Handle both word and character-level tokenization
- 🎯 Control text generation with temperature and seeding

## Installation
```bash
npm install grimquill
```

## Usage

### Workflow 1: Training and Saving Models

#### Basic Training
```javascript
import { MarkovModel } from 'grimquill';

// Create a new model
const markov = new MarkovModel({
  order: 3,              // Markov chain order
  tokenType: 'word',     // 'word' or 'char'
  stopTokens: ['.', '!', '?']  // Tokens that can end generation
});

// Train on a single text
await markov.train('Your training text here');

// Save the trained model
await markov.save('path/to/model.json');
```

#### Training on Multiple Texts
```javascript
const texts = [
  'First text corpus...',
  'Second text corpus...'
];

// Train on multiple texts
await markov.train(texts);

// Save the trained model
await markov.save('path/to/model.json');
```

#### Parallel Training for Large Datasets
```javascript
import { MarkovModel } from 'grimquill';
import workerpool from 'workerpool';

// Create a pool of workers
const pool = workerpool.pool('./worker.js');

// Split large text into chunks
const chunks = splitTextIntoChunks(largeText, numChunks);

// Process chunks in parallel
const results = await Promise.all(
  chunks.map(chunk => pool.exec('processChunk', [{
    chunk,
    order: 3,
    tokenType: 'word'
  }]))
);

// Create final model and merge results
const markov = new MarkovModel({ order: 3 });
results.forEach(result => {
  result.forEach(([context, nextTokens]) => {
    if (!markov.model.has(context)) {
      markov.model.set(context, new Map());
    }
    nextTokens.forEach(([token, count]) => {
      const currentCount = markov.model.get(context).get(token) || 0;
      markov.model.get(context).set(token, currentCount + count);
    });
  });
});

// Save the merged model
await markov.save('path/to/model.json');

// Clean up
pool.terminate();
```

### Workflow 2: Loading and Generating Text

#### Basic Text Generation
```javascript
import { MarkovModel } from 'grimquill';

// Load a saved model
const markov = await MarkovModel.load('path/to/model.json');

// Generate text
const generated = markov.generate({
  maxLength: 100,        // Maximum length of generated text
  temperature: 0.8,      // Controls randomness (0-1)
  stopProbability: 0.7   // Probability of stopping at stop tokens
});

console.log(generated);
```

#### Seeded Text Generation
```javascript
// Load a saved model
const markov = await MarkovModel.load('path/to/model.json');

// Generate text starting with specific words
const seeded = markov.generate({
  maxLength: 100,
  temperature: 0.8,
  stopProbability: 0.7,
  seed: 'The quick brown'  // Start generation with these words
});

console.log(seeded);
```

#### Batch Text Generation
```javascript
// Load a saved model
const markov = await MarkovModel.load('path/to/model.json');

// Generate multiple texts with different parameters
const texts = [
  markov.generate({ temperature: 0.5 }),  // More predictable
  markov.generate({ temperature: 0.8 }),  // Balanced
  markov.generate({ temperature: 1.0 })   // More creative
];

texts.forEach((text, i) => {
  console.log(`\nGenerated text ${i + 1}:`);
  console.log(text);
});
```

## Configuration Options

### MarkovModel Constructor
- `order` (number): Markov chain order (default: 2)
- `tokenType` (string): Tokenization type ('word' or 'char', default: 'word')
- `stopTokens` (string[]): Tokens that can end generation (default: ['.', '!', '?'])

### Generation Options
- `maxLength` (number): Maximum length of generated text (default: 100)
- `temperature` (number): Controls randomness (0 = deterministic, 1 = random, default: 0.8)
- `stopProbability` (number): Probability of stopping at stop tokens (default: 0.7)
- `seed` (string): Optional starting text for generation

## Best Practices

### For Training
1. Choose appropriate order based on your needs:
   - Lower order (1-2) for more random, creative text
   - Higher order (3-4) for more coherent, predictable text
2. For large datasets:
   - Use parallel processing
   - Split text into manageable chunks
   - Consider using character-level tokenization for very large texts
3. Save models after training for later use

### For Generation
1. Adjust temperature based on desired output:
   - Lower temperature (0.2-0.5) for more predictable text
   - Higher temperature (0.7-1.0) for more creative text
2. Use seeding for more controlled generation
3. Experiment with stopProbability to control text length

## Known Issues
- Large models may consume significant memory
- Very high order models may overfit to training data
- Parallel processing requires careful memory management

## License
MIT