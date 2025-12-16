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
    this.categoryButtons = document.querySelectorAll('.category-btn');

    // Quiz screen
    this.questionCounter = document.getElementById('question-counter');
    this.progressFill = document.getElementById('progress-fill');
    this.difficultyBadge = document.getElementById('difficulty-badge');
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
    this.highScoreIndicator = document.getElementById('high-score-indicator');
    this.easyStats = document.getElementById('easy-stats');
    this.mediumStats = document.getElementById('medium-stats');
    this.hardStats = document.getElementById('hard-stats');
    this.overallStats = document.getElementById('overall-stats');
    this.totalQuizzes = document.getElementById('total-quizzes');
    this.totalQuestionsStat = document.getElementById('total-questions-stat');
    this.overallAccuracy = document.getElementById('overall-accuracy');
    this.restartBtn = document.getElementById('restart-btn');
    this.reviewBtn = document.getElementById('review-btn');
    this.resetBtn = document.getElementById('reset-btn');
    
    // Store current results for display
    this.currentResults = null;
    this.isNewHighScore = false;
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
    
    console.log(`Rendering question at index: ${this.quizEngine.currentQuestionIndex}`);
    const question = this.quizEngine.getCurrentQuestion();
    if (!question) {
      console.log('No question found, showing results');
      this.showResults();
      return;
    }
    console.log(`  Question: ${question.id}, Difficulty: ${question.difficulty}`);

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
    this.nextBtn.disabled = false; // Ensure button is enabled for next question
  }
  
  /**
   * Set up next button listener (called separately to avoid duplicates)
   */
  setupNextButton() {
    // Remove all existing event listeners by cloning
    const oldBtn = this.nextBtn;
    const nextBtnClone = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(nextBtnClone, oldBtn);
    this.nextBtn = nextBtnClone;
    
    // Add single event listener
    this.nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Next button clicked, current index before:', this.quizEngine.currentQuestionIndex);
      
      // Prevent double-clicks
      if (this.nextBtn.disabled) {
        console.log('Next button already processing, ignoring click');
        return;
      }
      
      this.nextBtn.disabled = true;
      
      if (this.onNextQuestion) {
        this.onNextQuestion();
      }
      
      // Re-enable after a short delay to prevent rapid clicking
      setTimeout(() => {
        this.nextBtn.disabled = false;
      }, 300);
    });
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

    // Show next button and set up listener
    this.nextBtn.style.display = 'block';
    this.setupNextButton(); // Set up listener when button becomes visible
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
    
    // Update difficulty badge
    const question = this.quizEngine.getCurrentQuestion();
    if (question && this.difficultyBadge) {
      this.difficultyBadge.textContent = question.difficulty;
      this.difficultyBadge.className = `difficulty-badge ${question.difficulty}`;
    }
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
   * Set quiz results data (called from main.js after saving)
   * @param {Object} results - Quiz results
   * @param {boolean} isNewHighScore - Whether this is a new high score
   */
  setQuizResults(results, isNewHighScore = false) {
    this.currentResults = results;
    this.isNewHighScore = isNewHighScore;
  }

  /**
   * Show results screen
   */
  showResults() {
    this.showScreen('results-screen');
    
    if (!this.currentResults) {
      this.currentResults = this.quizEngine.getResults();
    }
    
    const results = this.currentResults;
    
    // Basic score display
    this.finalScore.textContent = results.score;
    this.correctCount.textContent = results.correctCount;
    this.totalCount.textContent = results.totalQuestions;
    this.percentage.textContent = results.percentage;
    
    // Show high score indicator
    if (this.isNewHighScore && this.highScoreIndicator) {
      this.highScoreIndicator.style.display = 'block';
    } else if (this.highScoreIndicator) {
      this.highScoreIndicator.style.display = 'none';
    }
    
    // Calculate breakdown by difficulty
    if (this.easyStats && this.mediumStats && this.hardStats) {
      const breakdown = this.calculateDifficultyBreakdown(results.answers);
      this.easyStats.textContent = breakdown.easy;
      this.mediumStats.textContent = breakdown.medium;
      this.hardStats.textContent = breakdown.hard;
    }
    
    // Load and display overall statistics
    this.displayOverallStats();
  }

  /**
   * Calculate breakdown by difficulty
   * @param {Array} answers - Array of answer objects
   * @returns {Object} Breakdown object
   */
  calculateDifficultyBreakdown(answers) {
    const breakdown = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
    
    answers.forEach((answer, index) => {
      const question = this.quizEngine.questions[index];
      if (question) {
        const diff = question.difficulty;
        if (breakdown[diff]) {
          breakdown[diff].total++;
          if (answer.isCorrect) {
            breakdown[diff].correct++;
          }
        }
      }
    });
    
    return {
      easy: `${breakdown.easy.correct}/${breakdown.easy.total}`,
      medium: `${breakdown.medium.correct}/${breakdown.medium.total}`,
      hard: `${breakdown.hard.correct}/${breakdown.hard.total}`
    };
  }

  /**
   * Display overall statistics
   */
  displayOverallStats() {
    // Import storage manager dynamically to avoid circular dependency
    import('./storage.js').then(({ storageManager }) => {
      const stats = storageManager.getStatistics();
      
      if (stats.totalQuizzes > 0 && this.overallStats) {
        this.overallStats.style.display = 'block';
        if (this.totalQuizzes) this.totalQuizzes.textContent = stats.totalQuizzes;
        if (this.totalQuestionsStat) this.totalQuestionsStat.textContent = stats.totalQuestions;
        
        const accuracy = stats.totalQuestions > 0 
          ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
          : 0;
        if (this.overallAccuracy) this.overallAccuracy.textContent = `${accuracy}%`;
      } else if (this.overallStats) {
        this.overallStats.style.display = 'none';
      }
    });
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Category selection - re-query buttons in case they were dynamically added
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
      // Remove any existing listeners by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Add new listener
      newBtn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        console.log('Category selected:', category);
        // This will be handled by main.js
        if (this.onCategorySelected) {
          this.onCategorySelected(category);
        }
      });
    });
    
    // Update the reference
    this.categoryButtons = document.querySelectorAll('.category-btn');

    // Hint button
    this.hintBtn.addEventListener('click', () => this.handleHintClick());

    // Next button listener will be set up in renderQuizScreen to avoid duplicates

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

    // Reset button - clone to remove old listeners
    if (this.resetBtn) {
      const resetBtnClone = this.resetBtn.cloneNode(true);
      this.resetBtn.parentNode.replaceChild(resetBtnClone, this.resetBtn);
      this.resetBtn = resetBtnClone;
      
      this.resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onReset) {
          this.onReset();
        }
      });
    }
  }
}

