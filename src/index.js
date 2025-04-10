import { MarkovModel } from './MarkovModel.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Example usage of the MarkovModel
 */
async function main() {
  try {
    // Create a new model with custom options
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
    
    // Generate some text
    console.log('\nGenerated text:');
    const generated = markov.generate({
      maxLength: 50,
      temperature: 0.8,
      stopProbability: 0.7
    });
    console.log(generated);
    
    // Save the model
    const modelPath = path.join(__dirname, '../models/sample-model.json');
    await fs.mkdir(path.dirname(modelPath), { recursive: true });
    await markov.save(modelPath);
    console.log('\nModel saved to:', modelPath);
    
    // Load and use the saved model
    console.log('\nLoading saved model...');
    const loadedModel = await MarkovModel.load(modelPath);
    
    // Generate text with a seed
    console.log('\nGenerated text with seed:');
    const seeded = loadedModel.generate({
      maxLength: 50,
      temperature: 0.8,
      stopProbability: 0.7,
      seed: 'The quick brown'
    });
    console.log(seeded);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main(); 