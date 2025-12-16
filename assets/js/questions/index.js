// Question Registry and Loader
// Imports all question modules and provides filtering functions

// App-interface specific packs are disabled - they are in .gitignore
// Uncomment these imports if you want to use them locally:
// import { fundamentalsQuestions } from './categories/fundamentals.js';
// import { architectureQuestions } from './categories/architecture.js';
// import { entitiesQuestions } from './categories/entities.js';
// import { saasFilesQuestions } from './categories/saas-files.js';
// import { accessControlQuestions } from './categories/access-control.js';
// import { integrationsQuestions } from './categories/integrations.js';
// import { openshiftQuestions } from './categories/openshift.js';
// import { gitopsQuestions } from './categories/gitops.js';
// import { schemasQuestions } from './categories/schemas.js';
// import { externalResourcesQuestions } from './categories/external-resources.js';

// Test pack - generic questions for testing
import { testPackQuestions } from './categories/test-pack.js';

// Registry of all questions by category (built-in pack)
// Only test-pack is enabled by default
export const questionRegistry = {
  'test-pack': testPackQuestions,
  // App-interface categories are disabled - uncomment to enable:
  // fundamentals: fundamentalsQuestions,
  // architecture: architectureQuestions,
  // entities: entitiesQuestions,
  // 'saas-files': saasFilesQuestions,
  // 'access-control': accessControlQuestions,
  // integrations: integrationsQuestions,
  // openshift: openshiftQuestions,
  // gitops: gitopsQuestions,
  // schemas: schemasQuestions,
  // 'external-resources': externalResourcesQuestions,
};

// Add pack metadata to all built-in questions
// This allows pack-aware reporting
Object.values(questionRegistry).flat().forEach(question => {
  question.packId = 'builtin-public';
  question.packSource = 'builtin';
});

/**
 * Get questions filtered by category and/or difficulty
 * @param {string|null} category - Category name (e.g., 'fundamentals') or null for all
 * @param {string|null} difficulty - 'easy', 'medium', 'hard', or null for all
 * @returns {Array} Filtered array of question objects
 */
export function getQuestions(category = null, difficulty = null) {
  let questions = [];
  
  console.log(`[getQuestions] Called with category="${category}", difficulty="${difficulty}"`);
  
  // Try to get questions from pack manager first (includes built-in packs)
  if (typeof window !== 'undefined' && window.questionPackManager) {
    try {
      const mergedQuestions = window.questionPackManager.getMergedQuestions();
      console.log(`[getQuestions] Pack manager available, mergedQuestions:`, mergedQuestions);
      
      if (category) {
        // Get questions from specific category
        questions = mergedQuestions[category] || [];
        console.log(`[getQuestions] Category "${category}" has ${questions.length} questions`);
      } else {
        // Combine all categories
        questions = Object.values(mergedQuestions).flat();
        console.log(`[getQuestions] All categories have ${questions.length} total questions`);
      }
    } catch (error) {
      console.warn('[getQuestions] Error getting questions from pack manager, falling back to registry:', error);
    }
  } else {
    console.log('[getQuestions] Pack manager not available, using registry fallback');
  }
  
  // Fallback to built-in registry if pack manager not available or returned no questions
  if (questions.length === 0) {
    console.log('[getQuestions] No questions from pack manager, using registry fallback');
    if (category) {
      questions = questionRegistry[category] || [];
      console.log(`[getQuestions] Registry category "${category}" has ${questions.length} questions`);
    } else {
      questions = Object.values(questionRegistry).flat();
      console.log(`[getQuestions] Registry all categories have ${questions.length} total questions`);
    }
  }
  
  if (difficulty) {
    // Filter by difficulty
    const beforeFilter = questions.length;
    questions = questions.filter(q => q.difficulty === difficulty);
    console.log(`[getQuestions] After filtering by difficulty "${difficulty}": ${beforeFilter} -> ${questions.length} questions`);
  }
  
  console.log(`[getQuestions] Returning ${questions.length} questions`);
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
  // Use question pack manager if available (includes secure packs)
  if (window.questionPackManager) {
    const question = window.questionPackManager.getQuestionById(questionId);
    if (question) {
      return question;
    }
  }
  
  // Fallback to built-in registry (backwards compatibility)
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

