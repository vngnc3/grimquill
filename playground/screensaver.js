import { MarkovModel } from '../src/MarkovModel.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const BASE_UPDATE_INTERVAL = 1300; // base milliseconds between updates
const WORD_INTERVAL_BONUS = 150; // additional milliseconds per word
const MODEL_PATH = path.join(__dirname, 'models', 'Pak-synthetic-0411.json');
const MIN_WORD_DELAY = 50; // minimum milliseconds between words
const MAX_WORD_DELAY = 200; // maximum milliseconds between words

// Generation parameter ranges
const BOTTOM_MAX_LENGTH = 90;
const TOP_MAX_LENGTH = 100;
const BOTTOM_TEMP = 0.1;
const TOP_TEMP = 0.6;
const BOTTOM_STOP_PROB = 0.2;
const TOP_STOP_PROB = 0.7;
const BOTTOM_SENTENCE_PROB = 0.4;
const TOP_SENTENCE_PROB = 0.7;

// Helper function to get random value within range
function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

// ANSI escape codes for terminal control
const CLEAR_SCREEN = '\x1B[2J\x1B[0f';
const HIDE_CURSOR = '\x1B[?25l';
const SHOW_CURSOR = '\x1B[?25h';
const RESET = '\x1B[0m';

// Theme configuration
const theme = {
    // Main text color (bright white)
    text: '\x1B[97m',
    // Secondary text color (dark gray)
    secondary: '\x1B[90m',
    // Reset all styles
    reset: RESET
};

// Helper function to format date and time
function formatDateTime() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    const date = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    return `${time} · ${date}`;
}

async function main() {
    try {
        // Load the trained model
        const model = await MarkovModel.load(MODEL_PATH);
        
        // Clear screen and hide system cursor
        process.stdout.write(CLEAR_SCREEN + HIDE_CURSOR);
        
        // Handle Ctrl+C gracefully
        process.on('SIGINT', () => {
            process.stdout.write(SHOW_CURSOR);
            process.exit(0);
        });
        
        // Function to display words one by one
        async function typeWords(words) {
            for (const word of words) {
                process.stdout.write(`${theme.text}${word}${theme.reset} `);
                // Random delay between words
                const delay = Math.floor(Math.random() * (MAX_WORD_DELAY - MIN_WORD_DELAY + 1)) + MIN_WORD_DELAY;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            process.stdout.write('\n\n');
            
            // Add status line
            const statusText = `${formatDateTime()} · ${words.length} words · vngnc/grimquill`;
            process.stdout.write(`${theme.secondary}${statusText}${theme.reset}\n\n`);
            
            // Calculate dynamic update interval based on word count
            return BASE_UPDATE_INTERVAL + (words.length * WORD_INTERVAL_BONUS);
        }
        
        // Function to generate and display new text
        async function updateDisplay() {
            // Generate random parameters for this iteration
            const maxLength = Math.floor(getRandomInRange(BOTTOM_MAX_LENGTH, TOP_MAX_LENGTH));
            const temperature = getRandomInRange(BOTTOM_TEMP, TOP_TEMP);
            const stopProbability = getRandomInRange(BOTTOM_STOP_PROB, TOP_STOP_PROB);
            const multipleSentenceProbability = getRandomInRange(BOTTOM_SENTENCE_PROB, TOP_SENTENCE_PROB);
            
            const text = model.generate({
                maxLength,
                temperature,
                stopProbability,
                multipleSentenceProbability
            });
            
            // Clear screen and display new text word by word
            process.stdout.write(CLEAR_SCREEN);
            const updateInterval = await typeWords(text.split(' '));
            
            // Schedule next update with dynamic interval
            setTimeout(updateDisplay, updateInterval);
        }
        
        // Start the update cycle
        updateDisplay();
        
    } catch (error) {
        console.error('Error:', error.message);
        process.stdout.write(SHOW_CURSOR);
        process.exit(1);
    }
}

main(); 