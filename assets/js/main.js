// Main application entry point
// Wires together quiz engine and UI controller

import { QuizEngine } from './quiz-engine.js';
import { UIController } from './ui-controller.js';

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
    this.uiController.onDifficultySelected = (difficulty) => {
      this.startQuiz(difficulty);
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

    // Show start screen
    this.uiController.renderStartScreen();
  }

  /**
   * Start a new quiz
   * @param {string} difficulty - Difficulty level
   */
  startQuiz(difficulty) {
    try {
      const questionCount = this.quizEngine.startQuiz(difficulty, null, true, true);
      console.log(`Started quiz with ${questionCount} questions`);
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

