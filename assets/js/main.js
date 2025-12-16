// Main application entry point
// Wires together quiz engine and UI controller

import { QuizEngine } from './quiz-engine.js';
import { UIController } from './ui-controller.js';
import { getCategories } from './questions/index.js';

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
      // Placeholder for review functionality
      console.log('Review functionality coming soon');
      this.restart();
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
      this.uiController.showResults();
    }
  }

  /**
   * Restart the quiz (go back to start screen)
   */
  restart() {
    this.quizEngine.reset();
    this.uiController.renderStartScreen();
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

