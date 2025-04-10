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
   * Generate text from the trained model
   * @param {Object} options - Generation options
   * @param {number} options.maxLength - Maximum length of generated text
   * @param {number} options.temperature - Controls randomness (0 = deterministic, 1 = random)
   * @param {number} options.stopProbability - Probability of stopping at a stop token
   * @param {string} options.seed - Optional seed text to start generation
   * @returns {string} Generated text
   */
  generate(options = {}) {
    const {
      maxLength = 100,
      temperature = 0.8,
      stopProbability = 0.7,
      seed = null
    } = options;
    
    let tokens = [];
    
    // Initialize with seed or random context
    if (seed) {
      tokens = this.tokenizer.tokenize(seed);
      if (tokens.length < this.order) {
        throw new Error('Seed text must be at least as long as the model order');
      }
    } else {
      // Get random context from model
      const contexts = Array.from(this.model.keys());
      const randomContext = contexts[Math.floor(Math.random() * contexts.length)];
      tokens = randomContext.split(' ');
    }
    
    while (tokens.length < maxLength) {
      const context = tokens.slice(-this.order).join(' ');
      
      if (!this.model.has(context)) {
        break;
      }
      
      const nextTokens = this.model.get(context);
      const nextToken = this._selectNextToken(nextTokens, temperature);
      
      tokens.push(nextToken);
      
      // Check for stop token
      if (this.stopTokens.has(nextToken) && Math.random() < stopProbability) {
        break;
      }
    }
    
    // Detokenize and capitalize first letter if it's a valid English letter
    let text = this.tokenizer.detokenize(tokens);
    if (/^[a-z]/.test(text)) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    
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