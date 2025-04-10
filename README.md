# Grimquill 🔮✍️🤖🧠

![Grimquill Logo](https://cemt2c0dp6.ufs.sh/f/wDtlfMZnQe0tIna4Mg89esT6KmxEWZvqhG4MayrcQgpXdJIU)

Configurable Higher-Order Markov Text Generator.

## What does Grimquill do?
- 🧠 Create and train higher-order Markov chain models
- 🔮 Generate text from the trained Markov chain models
- 🚅 Support parallel processing for faster training
- 📝 Handle both word and character-level tokenization
- 🎯 Control text generation with temperature and seeding
- 📝 Generate multiple sentences with configurable probability

## Installation
> ~~npm install grimquill~~  

Not available on NPM yet. Clone and install manually for now.

## Quick Start

### 1. Training a Model
```javascript
import { MarkovModel } from 'grimquill';

async function trainModel() {
  // Create a new model
  const markov = new MarkovModel({
    order: 3,              // Markov chain order
    tokenType: 'word',     // 'word' or 'char'
    stopTokens: ['.', '!', '?']  // Tokens that can end generation
  });

  // Train on your text
  console.log('Training model...');
  await markov.train('Your training text here');

  // Save the trained model
  console.log('Training complete, saving model...');
  await markov.save('path/to/model.json');
  console.log('Model saved successfully');
}

// Run the training
await trainModel();
```

### 2. Generating Text
```javascript
import { MarkovModel } from 'grimquill';

async function generateText() {
  // Load a saved model
  const markov = await MarkovModel.load('path/to/model.json');

  // Generate text with different parameters
  console.log('\nGenerated text (temperature: 0.5 - more predictable):');
  console.log(markov.generate({ temperature: 0.5 }));

  console.log('\nGenerated text (temperature: 0.8 - balanced):');
  console.log(markov.generate({ temperature: 0.8 }));

  console.log('\nGenerated text with seed:');
  console.log(markov.generate({
    temperature: 0.8,
    seed: 'Your starting text'
  }));

  // Generate multiple sentences
  console.log('\nGenerated text with multiple sentences:');
  console.log(markov.generate({
    temperature: 0.8,
    multipleSentenceProbability: 0.5  // 50% chance to continue after each sentence
  }));
}

// Run the generation
await generateText();
```

## Advanced Usage

### Training on Multiple Texts
```javascript
const texts = [
  'First text corpus...',
  'Second text corpus...'
];

await markov.train(texts);
```

### Parallel Training for Large Datasets
```javascript
import { MarkovModel } from 'grimquill';
import workerpool from 'workerpool';

async function trainParallel() {
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
}

await trainParallel();
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
- `multipleSentenceProbability` (number): Probability to continue after a stop token (0-1, default: 0)

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
4. Use multipleSentenceProbability to control paragraph length:
   - Lower values (0.1-0.3) for shorter paragraphs
   - Higher values (0.4-0.7) for longer paragraphs
   - Values above 0.8 may result in very long text

## Known Issues
- Large models may consume significant memory
- Very high order models may overfit to training data
- Parallel processing requires careful memory management
- High multipleSentenceProbability values may lead to very long generated text

## License
MIT