/**
 * Tokenizer class for handling text tokenization at word or character level
 */
export class Tokenizer {
  constructor(type = 'word') {
    this.type = type;
  }
  
  /**
   * Tokenize input text based on the configured token type
   * @param {string} text - Input text to tokenize
   * @returns {string[]} Array of tokens
   */
  tokenize(text) {
    if (this.type === 'char') {
      return text.split('');
    }
    
    // Word tokenization with punctuation handling
    return text.match(/\b[\w']+\b|[.,!?;:"()[\]{}]/g) || [];
  }
  
  /**
   * Convert tokens back to text with proper spacing
   * @param {string[]} tokens - Array of tokens to detokenize
   * @returns {string} Reconstructed text
   */
  detokenize(tokens) {
    if (this.type === 'char') {
      return tokens.join('');
    }
    
    // More sophisticated detokenization for words
    let result = '';
    const punctuation = new Set(['.', ',', '!', '?', ';', ':', ')', ']', '}']);
    const openingPunctuation = new Set(['(', '[', '{']);
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const nextToken = tokens[i + 1];
      
      result += token;
      
      if (nextToken) {
        if (punctuation.has(nextToken)) {
          // No space before punctuation
        } else if (openingPunctuation.has(token)) {
          // No space after opening punctuation
        } else {
          result += ' ';
        }
      }
    }
    
    return result;
  }
} 