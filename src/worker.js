import { MarkovModel } from './MarkovModel.js';

/**
 * Worker function for parallel processing of text chunks
 * @param {Object} options - Worker options
 * @param {string[]} options.chunk - Text chunk to process
 * @param {number} options.order - Markov chain order
 * @param {string} options.tokenType - Tokenization type ('word' or 'char')
 * @returns {Promise<Array>} Processed model data
 */
export async function processChunk(options) {
  const { chunk, order, tokenType } = options;
  
  // Create a temporary model for this chunk
  const model = new MarkovModel({ order, tokenType });
  await model.train(chunk);
  
  // Convert the model to a serializable format
  return Array.from(model.model.entries()).map(([context, nextTokens]) => [
    context,
    Array.from(nextTokens.entries())
  ]);
}

// Export the worker function
export { processChunk as default }; 