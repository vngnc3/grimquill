import { MarkovModel } from './MarkovModel.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Example training function
 */
async function trainModel() {
  // Create a new model
  const markov = new MarkovModel({
    order: 3,
    tokenType: 'word',
    stopTokens: ['.', '!', '?']
  });

  // Sample text for training
  const sampleText = `
    The quick brown fox jumps over the lazy dog.
    A quick brown fox jumps over a lazy dog.
    The lazy dog watches the quick brown fox jump.
    The fox jumps quickly over the lazy dog.
  `;

  // Train the model
  console.log('Training model...');
  await markov.train(sampleText);

  // Save the trained model
  console.log('Training complete, saving model...');
  await markov.save(path.join(__dirname, '../models/sample-model.json'));
  console.log('Model saved successfully');
}

/**
 * Example generation function
 */
async function generateText() {
  // Load a saved model
  const markov = await MarkovModel.load(path.join(__dirname, '../models/sample-model.json'));

  // Generate text with different parameters
  console.log('\nGenerated text (temperature: 0.5 - more predictable):');
  console.log(markov.generate({ temperature: 0.5 }));

  console.log('\nGenerated text (temperature: 0.8 - balanced):');
  console.log(markov.generate({ temperature: 0.8 }));

  console.log('\nGenerated text with seed:');
  console.log(markov.generate({
    temperature: 0.8,
    seed: 'The quick brown'
  }));
}

// Uncomment to run specific examples
// await trainModel();
// await generateText(); 