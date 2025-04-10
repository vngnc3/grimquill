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

  // Generate text with all available parameters
  console.log('\nGenerated text with all parameters:');
  console.log(markov.generate({
    maxLength: 200,                    // Maximum length of generated text
    temperature: 0.7,                  // Controls randomness (0 = deterministic, 1 = random)
    stopProbability: 0.6,              // Probability of stopping at stop tokens
    seed: 'The quick brown',           // Starting text for generation
    multipleSentenceProbability: 0.4   // Probability to continue after a stop token
  }));
}

// Uncomment to run specific examples
// await trainModel();
// await generateText(); 