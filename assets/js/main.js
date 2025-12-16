// Main application entry point
// Wires together quiz engine and UI controller

import { QuizEngine } from './quiz-engine.js';
import { UIController } from './ui-controller.js';
import { getCategories } from './questions/index.js';
import { storageManager } from './storage.js';
import { soundManager } from './sound-manager.js';
import { themeManager } from './theme-manager.js';

class QuizApp {
  constructor() {
    this.quizEngine = new QuizEngine();
    this.uiController = new UIController(this.quizEngine);
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    // Initialize sound manager and load preferences
    soundManager.loadPreferences();
    
    // Initialize audio context on first user interaction (required by browsers)
    const initAudio = () => {
      soundManager.init();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
    
    // Set up event handlers
    this.uiController.onCategorySelected = (category) => {
      this.startQuiz(category);
    };

    this.uiController.onNextQuestion = () => {
      this.nextQuestion();
    };

    this.uiController.onRestart = () => {
      this.restart();
    };

    this.uiController.onReview = () => {
      // Show review mode
      this.uiController.showReviewMode();
    };

    this.uiController.onReset = () => {
      this.resetAllData();
    };

    // Set up UI event listeners
    this.uiController.setupEventListeners();

    // Populate category buttons dynamically
    this.populateCategories();

    // Show start screen
    this.uiController.renderStartScreen();
  }

  /**
   * Populate category buttons dynamically based on available categories
   */
  populateCategories() {
    const categories = getCategories();
    const categorySelector = document.querySelector('.category-selector');
    
    if (!categorySelector) {
      return;
    }

    // Store the Random button's text/content
    const randomBtn = categorySelector.querySelector('[data-category="random"]');
    const randomBtnText = randomBtn ? randomBtn.textContent : 'Random (All Categories)';
    
    // Clear all buttons
    categorySelector.innerHTML = '';
    
    // Create and add Random button
    const randomButton = document.createElement('button');
    randomButton.className = 'category-btn';
    randomButton.dataset.category = 'random';
    randomButton.textContent = randomBtnText;
    categorySelector.appendChild(randomButton);

    // Add category buttons
    categories.forEach(category => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.dataset.category = category;
      btn.textContent = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
      categorySelector.appendChild(btn);
    });

    // Re-setup event listeners for all buttons (including Random)
    this.uiController.setupEventListeners();
  }

  /**
   * Start a new quiz
   * @param {string|null} category - Category name, 'random' for all, or null
   */
  startQuiz(category) {
    try {
      const questionCount = this.quizEngine.startQuiz(category, true, true);
      console.log(`Started quiz with ${questionCount} questions from category: ${category || 'all'}`);
      this.uiController.renderQuizScreen();
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Move to next question or show results
   */
  nextQuestion() {
    const hasMore = this.quizEngine.nextQuestion();
    
    if (hasMore) {
      this.uiController.renderQuizScreen();
    } else {
      // Quiz complete - save results and show results screen
      this.saveQuizResults();
      this.uiController.showResults();
    }
  }

  /**
   * Save quiz results to storage
   */
  saveQuizResults() {
    if (!storageManager.isAvailable()) {
      console.warn('LocalStorage not available');
      return;
    }

    const results = this.quizEngine.getResults();
    const category = results.category || 'random';
    
    // Check if this is a new high score BEFORE saving
    const bestScore = storageManager.getBestScore(category);
    console.log('High score check:', { 
      category, 
      currentScore: results.score, 
      bestScore: bestScore ? bestScore.score : null,
      bestScoreObj: bestScore 
    });
    
    // Only show high score indicator if:
    // 1. There's no previous best score AND current score > 0 (first quiz with a score), OR
    // 2. Current score beats the previous best score
    const shouldShowHighScore = bestScore 
      ? results.score > bestScore.score 
      : results.score > 0;
    
    console.log('Should show high score indicator:', shouldShowHighScore);
    
    storageManager.saveHighScore(category, {
      score: results.score,
      totalPoints: results.totalPoints,
      correctCount: results.correctCount,
      totalQuestions: results.totalQuestions,
      percentage: results.percentage,
      difficulty: results.difficulty
    });
    
    // Update statistics
    storageManager.updateStatistics({
      category: category,
      score: results.score,
      totalQuestions: results.totalQuestions,
      correctCount: results.correctCount
    });
    
    // Clear any incomplete quiz
    storageManager.clearIncompleteQuiz();
    
    // Pass results to UI controller for display (only show indicator if actually beat previous high)
    this.uiController.setQuizResults(results, shouldShowHighScore);
  }

  /**
   * Restart the quiz (go back to start screen)
   */
  restart() {
    this.quizEngine.reset();
    this.uiController.renderStartScreen();
  }

  /**
   * Reset all stored data
   */
  resetAllData() {
    if (confirm('Are you sure you want to reset all saved data? This will delete all high scores and statistics.')) {
      if (storageManager.resetAll()) {
        alert('All data has been reset.');
        this.restart();
      } else {
        alert('Error resetting data.');
      }
    }
  }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
  });
} else {
  // DOM already loaded
  new QuizApp();
}

