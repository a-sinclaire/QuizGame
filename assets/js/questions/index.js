// Question Registry and Loader
// Imports all question modules and provides filtering functions

import { module1Questions } from './categories/module1.js';

// Registry of all questions by category
export const questionRegistry = {
  module1: module1Questions,
  // Add more modules here as they're created
  // module2: module2Questions,
  // module3: module3Questions,
};

/**
 * Get questions filtered by category and/or difficulty
 * @param {string|null} category - Category name (e.g., 'module1') or null for all
 * @param {string|null} difficulty - 'easy', 'medium', 'hard', or null for all
 * @returns {Array} Filtered array of question objects
 */
export function getQuestions(category = null, difficulty = null) {
  let questions = [];
  
  if (category) {
    // Get questions from specific category
    questions = questionRegistry[category] || [];
  } else {
    // Combine all categories
    questions = Object.values(questionRegistry).flat();
  }
  
  if (difficulty) {
    // Filter by difficulty
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  
  return questions;
}

/**
 * Get all available categories
 * @returns {Array} Array of category names
 */
export function getCategories() {
  return Object.keys(questionRegistry);
}

/**
 * Get all available difficulties
 * @returns {Array} Array of difficulty levels
 */
export function getDifficulties() {
  return ['easy', 'medium', 'hard'];
}

/**
 * Get a question by its ID
 * @param {string} questionId - Question ID
 * @param {string} category - Category name
 * @param {string} difficulty - Difficulty level
 * @returns {Object|null} Question object or null if not found
 */
export function getQuestionById(questionId, category, difficulty) {
  let questions = [];
  
  if (category) {
    questions = questionRegistry[category] || [];
  } else {
    questions = Object.values(questionRegistry).flat();
  }
  
  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  
  return questions.find(q => q.id === questionId) || null;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

