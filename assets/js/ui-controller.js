// UI Controller - Handles rendering and user interactions

export class UIController {
  constructor(quizEngine) {
    this.quizEngine = quizEngine;
    this.answerSelected = false;
    this.initializeElements();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    // Screens
    this.startScreen = document.getElementById('start-screen');
    this.quizScreen = document.getElementById('quiz-screen');
    this.resultsScreen = document.getElementById('results-screen');

    // Start screen
    this.difficultyButtons = document.querySelectorAll('.difficulty-btn');

    // Quiz screen
    this.questionCounter = document.getElementById('question-counter');
    this.progressFill = document.getElementById('progress-fill');
    this.currentScore = document.getElementById('current-score');
    this.questionText = document.getElementById('question-text');
    this.optionsContainer = document.getElementById('options-container');
    this.hintBtn = document.getElementById('hint-btn');
    this.hintDisplay = document.getElementById('hint-display');
    this.feedbackContainer = document.getElementById('feedback-container');
    this.nextBtn = document.getElementById('next-btn');

    // Results screen
    this.finalScore = document.getElementById('final-score');
    this.correctCount = document.getElementById('correct-count');
    this.totalCount = document.getElementById('total-count');
    this.percentage = document.getElementById('percentage');
    this.restartBtn = document.getElementById('restart-btn');
    this.reviewBtn = document.getElementById('review-btn');
  }

  /**
   * Show a specific screen
   * @param {string} screenId - ID of screen to show
   */
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('active');
    }
  }

  /**
   * Render the start screen
   */
  renderStartScreen() {
    this.showScreen('start-screen');
    this.answerSelected = false;
  }

  /**
   * Render the quiz screen with current question
   */
  renderQuizScreen() {
    this.showScreen('quiz-screen');
    this.answerSelected = false;
    
    const question = this.quizEngine.getCurrentQuestion();
    if (!question) {
      this.showResults();
      return;
    }

    // Update progress
    this.updateProgress();
    
    // Update score
    this.updateScore();

    // Render question
    this.questionText.textContent = question.question;

    // Render options
    this.renderOptions(question);

    // Reset hint display
    this.hintDisplay.classList.remove('show');
    this.hintDisplay.textContent = '';
    this.updateHintButton();

    // Hide feedback and next button
    this.feedbackContainer.classList.remove('show', 'correct', 'incorrect');
    this.nextBtn.style.display = 'none';
  }

  /**
   * Render answer options
   * @param {Object} question - Question object
   */
  renderOptions(question) {
    this.optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'option-btn';
      button.textContent = option;
      button.dataset.index = index;
      
      button.addEventListener('click', () => this.handleOptionClick(index));
      
      this.optionsContainer.appendChild(button);
    });
  }

  /**
   * Handle option button click
   * @param {number} index - Selected option index
   */
  handleOptionClick(index) {
    if (this.answerSelected) {
      return; // Already answered
    }

    this.answerSelected = true;
    const result = this.quizEngine.submitAnswer(index);

    // Disable all option buttons
    const optionButtons = this.optionsContainer.querySelectorAll('.option-btn');
    optionButtons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === result.correctIndex) {
        btn.classList.add('correct');
      } else if (i === index && !result.isCorrect) {
        btn.classList.add('incorrect');
      }
    });

    // Show feedback
    this.showFeedback(result);

    // Update score
    this.updateScore();

    // Show next button
    this.nextBtn.style.display = 'block';
  }

  /**
   * Show feedback for answer
   * @param {Object} result - Result object from quiz engine
   */
  showFeedback(result) {
    this.feedbackContainer.textContent = result.feedback;
    this.feedbackContainer.className = `feedback-container show ${result.isCorrect ? 'correct' : 'incorrect'}`;
  }

  /**
   * Update progress indicator
   */
  updateProgress() {
    const progress = this.quizEngine.getProgress();
    this.questionCounter.textContent = `Question ${progress.current} of ${progress.total}`;
    this.progressFill.style.width = `${progress.percentage}%`;
  }

  /**
   * Update score display
   */
  updateScore() {
    this.currentScore.textContent = this.quizEngine.score;
  }

  /**
   * Handle hint button click
   */
  handleHintClick() {
    const hint = this.quizEngine.getHint();
    if (hint) {
      this.hintDisplay.textContent = hint;
      this.hintDisplay.classList.add('show');
      this.updateHintButton();
    }
  }

  /**
   * Update hint button state
   */
  updateHintButton() {
    if (this.quizEngine.hasMoreHints()) {
      this.hintBtn.style.display = 'block';
      this.hintBtn.disabled = false;
    } else {
      this.hintBtn.style.display = 'none';
      this.hintBtn.disabled = true;
    }
  }

  /**
   * Show results screen
   */
  showResults() {
    this.showScreen('results-screen');
    const results = this.quizEngine.getResults();
    
    this.finalScore.textContent = results.score;
    this.correctCount.textContent = results.correctCount;
    this.totalCount.textContent = results.totalQuestions;
    this.percentage.textContent = results.percentage;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Difficulty selection
    this.difficultyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const difficulty = e.target.dataset.difficulty;
        // This will be handled by main.js
        if (this.onDifficultySelected) {
          this.onDifficultySelected(difficulty);
        }
      });
    });

    // Hint button
    this.hintBtn.addEventListener('click', () => this.handleHintClick());

    // Next button
    this.nextBtn.addEventListener('click', () => {
      if (this.onNextQuestion) {
        this.onNextQuestion();
      }
    });

    // Restart button
    this.restartBtn.addEventListener('click', () => {
      if (this.onRestart) {
        this.onRestart();
      }
    });

    // Review button (placeholder for now)
    this.reviewBtn.addEventListener('click', () => {
      if (this.onReview) {
        this.onReview();
      }
    });
  }
}

