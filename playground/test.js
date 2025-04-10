import { MarkovModel } from "../src/MarkovModel.js";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelPath = "models/Pak-synthetic-0411.json";
const datasetPath = "dataset/Synthetic_Pak_0410.txt";

/**
 * Example training function
 */
async function trainModel() {
  // Create a new model
  const markov = new MarkovModel({
    order: 3,
    tokenType: "word",
    stopTokens: [".", "!", "?"],
  });

  // Import txt file for training
  const trainingData = await fs.readFile(
    path.join(__dirname, datasetPath),
    "utf8"
  );

  // Import multiple txt files for training
  const datasetDirectory = "dataset";
  const datasetFiles = [
    "Synthetic_Pak_0410.txt",
    "Revelation_excerpts.txt",
  ];
  const trainingDataConcat = await Promise.all(
    datasetFiles.map((file) =>
      fs.readFile(path.join(__dirname, datasetDirectory, file), "utf8")
    )
  ).then((files) => files.join("\n"));

  // Train the model
  console.log("Training model...");
  await markov.train(trainingDataConcat);

  // Save the trained model
  console.log("Training complete, saving model...");
  await markov.save(path.join(__dirname, modelPath));
  console.log("Model saved successfully");
}

/**
 * Example generation function
 */
async function generateText() {
  // Load a saved model
  const markov = await MarkovModel.load(path.join(__dirname, modelPath));

  const generatedText = markov.generate({
    maxLength: 100,
    temperature: 0.8,
    stopProbability: 0.5,
    multipleSentenceProbability: 0.95,
  });

  console.log(generatedText);
}

// Uncomment to run specific examples
// await trainModel();
await generateText();
