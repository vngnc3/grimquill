import { Tokenizer } from './Tokenizer.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Higher-order Markov chain model for text generation
 */
export class MarkovModel {
  constructor(options = {}) {
    this.order = options.order || 2;
    this.tokenType = options.tokenType || 'word';
    this.stopTokens = new Set(options.stopTokens || ['.', '!', '?']);
    this.model = new Map();
    this.tokenizer = new Tokenizer(this.tokenType);
  }
  
  /**
   * Train the model on one or more text corpora
   * @param {string|string[]} corpus - Text or array of texts to train on
   */
  async train(corpus) {
    const texts = Array.isArray(corpus) ? corpus : [corpus];
    
    for (const text of texts) {
      const lines = text.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const tokens = this.tokenizer.tokenize(line);
        
        // Build model with sliding window
        for (let i = 0; i < tokens.length - this.order; i++) {
          const context = tokens.slice(i, i + this.order).join(' ');
          const nextToken = tokens[i + this.order];
          
          if (!this.model.has(context)) {
            this.model.set(context, new Map());
          }
          
          const nextTokens = this.model.get(context);
          nextTokens.set(nextToken, (nextTokens.get(nextToken) || 0) + 1);
        }
      }
    }
  }
  
  /**
   * Clean up and format generated text
   * @private
   */
  _formatGeneratedText(text) {
    // Find the first valid starting character (letter, quote, or number)
    const firstValidChar = text.search(/[a-zA-Z0-9"]/);
    if (firstValidChar > 0) {
      text = text.slice(firstValidChar);
    }

    // Capitalize first letter if it's a valid English letter
    if (/^[a-z]/.test(text)) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }

    // Count quotes to identify invalid pairs
    const quoteCount = (text.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      // If odd number of quotes, remove all quotes and their surrounding spaces
      text = text
        .replace(/\s*"\s*/g, '')  // Remove quotes and their surrounding spaces
        .replace(/\s+/g, ' ')     // Clean up any resulting double spaces
        .trim();
    } else {
      // First, handle nested quotes
      text = text
        // Remove spaces inside nested quotes
        .replace(/"\s*([^"]*)"\s*([^"]*)"\s*([^"]*)"/g, '"$1"$2"$3"')
        .replace(/"\s*([^"]*)"\s*([^"]*)"/g, '"$1"$2"');

      // Then handle all quote pairs
      let quotePairs = text.match(/"[^"]*"/g) || [];
      for (const pair of quotePairs) {
        const cleanPair = pair
          .replace(/"\s+/g, '"')  // Remove spaces after opening quote
          .replace(/\s+"/g, '"'); // Remove spaces before closing quote
        
        // Replace the original pair with the cleaned version
        text = text.replace(pair, cleanPair);
      }

      // Now handle spacing around quotes
      text = text
        // Add space before opening quotes (except after opening parenthesis, bracket, or at start of text)
        .replace(/([^(\[\s])"/g, '$1 "')
        
        // Add space after closing quotes (except before punctuation or at end of text)
        .replace(/"([^.,!?)\]\s])/g, '" $1')
        
        // Move punctuation inside quotes (except for parentheses and brackets)
        .replace(/([.,!?])"/g, '"$1')
        
        // Handle multiple consecutive punctuation marks
        .replace(/([.!?])\s*([.!?])/g, '$1$2')
        .replace(/([.!?])\s*([.!?])/g, '$1$2') // Run twice to catch overlapping patterns
        
        // Handle special cases for punctuation
        .replace(/\s*,\s*/g, ', ')
        .replace(/\s*;\s*/g, '; ')
        .replace(/\s*:\s*/g, ': ')
        
        // Handle parentheses and brackets
        .replace(/\s*\(\s*/g, ' (')
        .replace(/\s*\)\s*/g, ') ')
        .replace(/\s*\[\s*/g, ' [')
        .replace(/\s*\]\s*/g, '] ')
        
        // Clean up any remaining spacing issues
        .replace(/\s+/g, ' ')
        .replace(/\s*([.,!?])\s*/g, '$1 ')
        .trim();
    }

    // Final check for proper sentence endings
    if (!/[.!?]$/.test(text)) {
      // If text doesn't end with proper punctuation, add a period
      text = text.replace(/\s*$/, '.');
    }

    return text;
  }
  
  /**
   * Generate text from the trained model
   * @param {Object} options - Generation options
   * @param {number} options.maxLength - Maximum length of generated text
   * @param {number} options.temperature - Controls randomness (0 = deterministic, 1 = random)
   * @param {number} options.stopProbability - Probability of stopping at a stop token
   * @param {string} options.seed - Optional seed text to start generation
   * @param {number} options.multipleSentenceProbability - Probability to continue after a stop token (0-1)
   * @returns {string} Generated text
   */
  generate(options = {}) {
    const {
      maxLength = 100,
      temperature = 0.8,
      stopProbability = 0.7,
      seed = null,
      multipleSentenceProbability = 0
    } = options;
    
    // Validate multipleSentenceProbability
    if (multipleSentenceProbability < 0 || multipleSentenceProbability >= 1) {
      throw new Error('multipleSentenceProbability must be between 0 and 1');
    }
    
    let tokens = [];
    let currentLength = 0;
    
    // Initialize with seed or random context
    if (seed) {
      tokens = this.tokenizer.tokenize(seed);
      if (tokens.length < this.order) {
        throw new Error('Seed text must be at least as long as the model order');
      }
      currentLength = tokens.length;
    } else {
      // Get random context from model
      const contexts = Array.from(this.model.keys());
      const randomContext = contexts[Math.floor(Math.random() * contexts.length)];
      tokens = randomContext.split(' ');
      currentLength = tokens.length;
    }
    
    while (currentLength < maxLength) {
      const context = tokens.slice(-this.order).join(' ');
      
      if (!this.model.has(context)) {
        break;
      }
      
      const nextTokens = this.model.get(context);
      const nextToken = this._selectNextToken(nextTokens, temperature);
      
      tokens.push(nextToken);
      currentLength++;
      
      // Check for stop token
      if (this.stopTokens.has(nextToken)) {
        // First check if we should stop at this sentence
        if (Math.random() < stopProbability) {
          // Then check if we should continue with a new sentence
          if (multipleSentenceProbability > 0 && Math.random() < multipleSentenceProbability) {
            // Add a space after the stop token
            tokens.push(' ');
            currentLength++;
            continue;
          }
          break;
        }
      }
    }
    
    // Detokenize and format the text
    let text = this.tokenizer.detokenize(tokens);
    text = this._formatGeneratedText(text);
    
    return text;
  }
  
  /**
   * Select next token based on weights and temperature
   * @private
   */
  _selectNextToken(nextTokens, temperature) {
    const entries = Array.from(nextTokens.entries());
    const total = entries.reduce((sum, [_, count]) => sum + count, 0);
    
    // Apply temperature to control randomness
    const weights = entries.map(([_, count]) => 
      Math.pow(count / total, 1 / temperature)
    );
    const weightTotal = weights.reduce((sum, w) => sum + w, 0);
    
    // Random selection based on weights
    let random = Math.random() * weightTotal;
    let cumulativeWeight = 0;
    
    for (let i = 0; i < entries.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return entries[i][0];
      }
    }
    
    return entries[entries.length - 1][0];
  }
  
  /**
   * Save model to JSON file
   * @param {string} filePath - Path to save the model
   */
  async save(filePath) {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    const serialized = {
      order: this.order,
      tokenType: this.tokenType,
      stopTokens: Array.from(this.stopTokens),
      model: Array.from(this.model.entries()).map(([context, nextTokens]) => [
        context,
        Array.from(nextTokens.entries())
      ])
    };
    
    await fs.writeFile(filePath, JSON.stringify(serialized, null, 2));
  }
  
  /**
   * Load model from JSON file
   * @param {string} filePath - Path to load the model from
   * @returns {Promise<MarkovModel>} Loaded model instance
   */
  static async load(filePath) {
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const model = new MarkovModel({
      order: data.order,
      tokenType: data.tokenType,
      stopTokens: data.stopTokens
    });
    
    model.model = new Map(data.model.map(([context, nextTokens]) => [
      context,
      new Map(nextTokens)
    ]));
    
    return model;
  }
} 