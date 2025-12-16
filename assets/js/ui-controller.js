// UI Controller - Handles rendering and user interactions

import { soundManager } from './sound-manager.js';
import { themeManager } from './theme-manager.js';
import { storageManager } from './storage.js';

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

    // Report elements
    this.reportBtn = document.getElementById('report-btn');
    this.reportModal = document.getElementById('report-modal');
    this.closeReportModal = document.getElementById('close-report-modal');
    this.cancelReportBtn = document.getElementById('cancel-report-btn');
    this.submitReportBtn = document.getElementById('submit-report-btn');
    this.reportReason = document.getElementById('report-reason');
    this.reportDetails = document.getElementById('report-details');
    this.reportQuestionText = document.getElementById('report-question-text');
    this.exportReportsBtn = document.getElementById('export-reports-btn');
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
    this.shareBtn = document.getElementById('share-btn');
    this.resetBtn = document.getElementById('reset-btn');

    // Theme control
    this.themeToggle = document.getElementById('theme-toggle');
    this.themeIcon = document.getElementById('theme-icon');

    // Sound controls
    this.muteBtn = document.getElementById('mute-btn');
    this.muteIcon = document.getElementById('mute-icon');
    this.volumeSlider = document.getElementById('volume-slider');
    this.volumeDisplay = document.getElementById('volume-display');

    // Review screen
    this.reviewScreen = document.getElementById('review-screen');
    this.reviewCategoryFilter = document.getElementById('review-category-filter');
    this.reviewDifficultyFilter = document.getElementById('review-difficulty-filter');
    this.reviewPrevBtn = document.getElementById('review-prev-btn');
    this.reviewNextBtn = document.getElementById('review-next-btn');
    this.reviewQuestionCounter = document.getElementById('review-question-counter');
    this.reviewDifficultyBadge = document.getElementById('review-difficulty-badge');
    this.reviewQuestionId = document.getElementById('review-question-id');
    this.reviewQuestionText = document.getElementById('review-question-text');
    this.reviewOptionsContainer = document.getElementById('review-options-container');
    this.reviewExplanations = document.getElementById('review-explanations');
    this.reviewBackBtn = document.getElementById('review-back-btn');
    this.reviewStartBtn = document.getElementById('review-start-btn');
    
    // Store current results for display
    this.currentResults = null;
    this.isNewHighScore = false;
    
    // Review mode state
    this.reviewQuestions = [];
    this.currentReviewIndex = 0;
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

    // Add slide animation
    const questionContainer = document.querySelector('.question-container');
    if (questionContainer) {
      questionContainer.classList.remove('slide-out', 'slide-in');
      // Trigger reflow
      void questionContainer.offsetWidth;
      questionContainer.classList.add('slide-in');
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

    // Show report button
    if (this.reportBtn) {
      this.reportBtn.style.display = 'block';
    }

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

    // Play sound effect
    if (result.isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playIncorrect();
    }

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
    if (this.currentScore) {
      const oldScore = parseInt(this.currentScore.textContent) || 0;
      const newScore = this.quizEngine.score;
      
      this.currentScore.textContent = newScore;
      
      // Animate score update if it increased
      if (newScore > oldScore) {
        this.currentScore.classList.add('score-update');
        setTimeout(() => {
          this.currentScore.classList.remove('score-update');
        }, 500);
      }
    }
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

    // Theme toggle - clone to remove old listeners
    if (this.themeToggle) {
      console.log('Setting up theme toggle button');
      const themeToggleClone = this.themeToggle.cloneNode(true);
      this.themeToggle.parentNode.replaceChild(themeToggleClone, this.themeToggle);
      this.themeToggle = themeToggleClone;
      // Update icon reference
      this.themeIcon = this.themeToggle.querySelector('#theme-icon');
      
      console.log('Theme toggle button element:', this.themeToggle);
      
      this.themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Theme toggle clicked, current theme:', themeManager.getTheme());
        const newTheme = themeManager.toggleTheme();
        console.log('New theme:', newTheme);
        this.updateThemeIcon(newTheme);
      });
      
      // Set initial theme icon
      this.updateThemeIcon(themeManager.getTheme());
    } else {
      console.warn('Theme toggle button not found!');
    }

    // Sound controls - clone to remove old listeners
    if (this.muteBtn) {
      const muteBtnClone = this.muteBtn.cloneNode(true);
      this.muteBtn.parentNode.replaceChild(muteBtnClone, this.muteBtn);
      this.muteBtn = muteBtnClone;
      // Update icon reference
      this.muteIcon = this.muteBtn.querySelector('#mute-icon');
      
      this.muteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const muted = soundManager.toggleMute();
        console.log('Mute toggled:', muted);
        this.updateMuteIcon(muted);
      });
    }
    
    if (this.volumeSlider) {
      // Clone volume slider to remove old listeners
      const volumeSliderClone = this.volumeSlider.cloneNode(true);
      this.volumeSlider.parentNode.replaceChild(volumeSliderClone, this.volumeSlider);
      this.volumeSlider = volumeSliderClone;
      
      this.volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        soundManager.setVolume(volume);
        if (this.updateVolumeDisplay) {
          this.updateVolumeDisplay(volume);
        }
      });
      
      // Set initial volume from preferences
      const initialVolume = soundManager.getVolume();
      this.volumeSlider.value = initialVolume * 100;
      if (this.updateVolumeDisplay) {
        this.updateVolumeDisplay(initialVolume);
      }
      this.updateMuteIcon(soundManager.isMuted());
    }

    // Next button listener will be set up in renderQuizScreen to avoid duplicates

    // Restart button
    this.restartBtn.addEventListener('click', () => {
      if (this.onRestart) {
        this.onRestart();
      }
    });

    // Review button
    this.reviewBtn.addEventListener('click', () => {
      if (this.onReview) {
        this.onReview();
      }
    });

    // Share button
    if (this.shareBtn) {
      this.shareBtn.addEventListener('click', () => {
        this.shareResults();
      });
    }

    // Report button
    if (this.reportBtn) {
      console.log('Setting up report button:', this.reportBtn);
      this.reportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Report button clicked!');
        this.openReportModal();
      });
    } else {
      console.warn('Report button not found!');
    }

    // Report modal controls
    if (this.closeReportModal) {
      this.closeReportModal.addEventListener('click', () => {
        this.closeReportModalFunc();
      });
    }

    if (this.cancelReportBtn) {
      this.cancelReportBtn.addEventListener('click', () => {
        this.closeReportModalFunc();
      });
    }

    if (this.submitReportBtn) {
      // Clone button to remove old listeners
      const submitBtnClone = this.submitReportBtn.cloneNode(true);
      this.submitReportBtn.parentNode.replaceChild(submitBtnClone, this.submitReportBtn);
      this.submitReportBtn = submitBtnClone;
      
      this.submitReportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.submitReport();
      });
    }

    // Export reports button
    if (this.exportReportsBtn) {
      this.exportReportsBtn.addEventListener('click', () => {
        this.exportReports();
      });
    }

    // Close modal when clicking outside
    if (this.reportModal) {
      this.reportModal.addEventListener('click', (e) => {
        if (e.target === this.reportModal) {
          this.closeReportModalFunc();
        }
      });
    }

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

    // Review mode navigation - will be set up when review mode is shown to avoid duplicates
  }

  /**
   * Set up review mode event listeners (called when entering review mode)
   */
  setupReviewModeListeners() {
    // Clone buttons to remove old listeners
    if (this.reviewPrevBtn) {
      const prevClone = this.reviewPrevBtn.cloneNode(true);
      this.reviewPrevBtn.parentNode.replaceChild(prevClone, this.reviewPrevBtn);
      this.reviewPrevBtn = prevClone;
      this.reviewPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.reviewPreviousQuestion();
      });
    }
    
    if (this.reviewNextBtn) {
      const nextClone = this.reviewNextBtn.cloneNode(true);
      this.reviewNextBtn.parentNode.replaceChild(nextClone, this.reviewNextBtn);
      this.reviewNextBtn = nextClone;
      this.reviewNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.reviewNextQuestion();
      });
    }
    
    if (this.reviewCategoryFilter) {
      // Remove old listener by cloning
      const filterClone = this.reviewCategoryFilter.cloneNode(true);
      this.reviewCategoryFilter.parentNode.replaceChild(filterClone, this.reviewCategoryFilter);
      this.reviewCategoryFilter = filterClone;
      this.reviewCategoryFilter.addEventListener('change', () => this.applyReviewFilters());
    }
    
    if (this.reviewDifficultyFilter) {
      // Remove old listener by cloning
      const diffClone = this.reviewDifficultyFilter.cloneNode(true);
      this.reviewDifficultyFilter.parentNode.replaceChild(diffClone, this.reviewDifficultyFilter);
      this.reviewDifficultyFilter = diffClone;
      this.reviewDifficultyFilter.addEventListener('change', () => this.applyReviewFilters());
    }
    
    if (this.reviewBackBtn) {
      const backClone = this.reviewBackBtn.cloneNode(true);
      this.reviewBackBtn.parentNode.replaceChild(backClone, this.reviewBackBtn);
      this.reviewBackBtn = backClone;
      this.reviewBackBtn.addEventListener('click', () => {
        if (this.currentResults) {
          this.showResults();
        } else {
          this.renderStartScreen();
        }
      });
    }
    
    if (this.reviewStartBtn) {
      const startClone = this.reviewStartBtn.cloneNode(true);
      this.reviewStartBtn.parentNode.replaceChild(startClone, this.reviewStartBtn);
      this.reviewStartBtn = startClone;
      this.reviewStartBtn.addEventListener('click', () => {
        this.renderStartScreen();
      });
    }
  }

  /**
   * Show review mode screen
   */
  showReviewMode() {
    this.showScreen('review-screen');
    
    // Get all questions from the quiz that was just completed
    this.reviewQuestions = [...this.quizEngine.questions];
    this.currentReviewIndex = 0;
    
    // Set up event listeners (removes duplicates)
    this.setupReviewModeListeners();
    
    // Populate category filter
    this.populateReviewCategoryFilter();
    
    // Apply initial filters and render
    this.applyReviewFilters();
  }

  /**
   * Populate category filter dropdown
   */
  populateReviewCategoryFilter() {
    if (!this.reviewCategoryFilter) return;
    
    // Get unique categories from questions
    const categories = [...new Set(this.reviewQuestions.map(q => q.category))];
    
    // Clear existing options except "All Categories"
    this.reviewCategoryFilter.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
      this.reviewCategoryFilter.appendChild(option);
    });
  }

  /**
   * Apply filters to review questions
   */
  applyReviewFilters() {
    const category = this.reviewCategoryFilter ? this.reviewCategoryFilter.value : '';
    const difficulty = this.reviewDifficultyFilter ? this.reviewDifficultyFilter.value : '';
    
    let filtered = [...this.quizEngine.questions];
    
    if (category) {
      filtered = filtered.filter(q => q.category === category);
    }
    
    if (difficulty) {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }
    
    this.reviewQuestions = filtered;
    this.currentReviewIndex = 0;
    this.renderReviewQuestion();
  }

  /**
   * Render current review question
   */
  renderReviewQuestion() {
    if (this.reviewQuestions.length === 0) {
      this.reviewQuestionText.textContent = 'No questions match the selected filters.';
      this.reviewOptionsContainer.innerHTML = '';
      this.reviewExplanations.innerHTML = '';
      if (this.reviewPrevBtn) this.reviewPrevBtn.disabled = true;
      if (this.reviewNextBtn) this.reviewNextBtn.disabled = true;
      return;
    }
    
    const question = this.reviewQuestions[this.currentReviewIndex];
    
    // Find user's answer for this question
    const userAnswer = this.quizEngine.answers.find(a => a.questionId === question.id);
    const userSelectedIndex = userAnswer ? userAnswer.selectedIndex : null;
    const userWasCorrect = userAnswer ? userAnswer.isCorrect : null;
    
    // Update counter
    this.reviewQuestionCounter.textContent = `Question ${this.currentReviewIndex + 1} of ${this.reviewQuestions.length}`;
    
    // Update navigation buttons
    if (this.reviewPrevBtn) this.reviewPrevBtn.disabled = this.currentReviewIndex === 0;
    if (this.reviewNextBtn) this.reviewNextBtn.disabled = this.currentReviewIndex === this.reviewQuestions.length - 1;
    
    // Update question info
    if (this.reviewQuestionId) this.reviewQuestionId.textContent = `ID: ${question.id}`;
    if (this.reviewDifficultyBadge) {
      this.reviewDifficultyBadge.textContent = question.difficulty;
      this.reviewDifficultyBadge.className = `difficulty-badge ${question.difficulty}`;
    }
    if (this.reviewQuestionText) this.reviewQuestionText.textContent = question.question;
    
    // Render options with correct answer and user selection highlighted
    if (this.reviewOptionsContainer) {
      this.reviewOptionsContainer.innerHTML = '';
      question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        let optionClasses = 'review-option';
        
        // Add classes based on correctness and user selection
        if (index === question.correctIndex) {
          optionClasses += ' correct';
        }
        if (userSelectedIndex !== null && index === userSelectedIndex) {
          optionClasses += ' user-selected';
          if (!userWasCorrect) {
            optionClasses += ' user-incorrect';
          }
        }
        
        optionDiv.className = optionClasses;
        
        const optionText = document.createElement('span');
        optionText.className = 'review-option-text';
        optionText.textContent = option;
        optionDiv.appendChild(optionText);
        
        // Add badges
        const badgeContainer = document.createElement('span');
        badgeContainer.className = 'badge-container';
        
        if (index === question.correctIndex) {
          const correctBadge = document.createElement('span');
          correctBadge.className = 'correct-badge';
          correctBadge.textContent = '✓ Correct';
          badgeContainer.appendChild(correctBadge);
        }
        
        if (userSelectedIndex !== null && index === userSelectedIndex && !userWasCorrect) {
          const userBadge = document.createElement('span');
          userBadge.className = 'user-badge';
          userBadge.textContent = 'Your Answer';
          badgeContainer.appendChild(userBadge);
        } else if (userSelectedIndex !== null && index === userSelectedIndex && userWasCorrect) {
          const userBadge = document.createElement('span');
          userBadge.className = 'user-badge correct-user';
          userBadge.textContent = 'Your Answer';
          badgeContainer.appendChild(userBadge);
        }
        
        if (badgeContainer.children.length > 0) {
          optionDiv.appendChild(badgeContainer);
        }
        
        this.reviewOptionsContainer.appendChild(optionDiv);
      });
    }
    
    // Render explanations
    if (this.reviewExplanations) {
      this.reviewExplanations.innerHTML = '<h4>Explanations:</h4>';
      
      question.options.forEach((option, index) => {
        const explanationDiv = document.createElement('div');
        explanationDiv.className = `explanation-item ${index === question.correctIndex ? 'correct-explanation' : ''}`;
        
        const optionLabel = document.createElement('strong');
        optionLabel.textContent = `${option}: `;
        explanationDiv.appendChild(optionLabel);
        
        const explanationText = document.createElement('span');
        if (index === question.correctIndex) {
          explanationText.textContent = question.correctResponse;
        } else {
          explanationText.textContent = question.incorrectResponses[index] || 'No explanation available.';
        }
        explanationDiv.appendChild(explanationText);
        
        this.reviewExplanations.appendChild(explanationDiv);
      });
    }
  }

  /**
   * Navigate to previous question in review mode
   */
  reviewPreviousQuestion() {
    if (this.currentReviewIndex > 0) {
      this.currentReviewIndex--;
      this.renderReviewQuestion();
    }
  }

  /**
   * Navigate to next question in review mode
   */
  reviewNextQuestion() {
    if (this.currentReviewIndex < this.reviewQuestions.length - 1) {
      this.currentReviewIndex++;
      this.renderReviewQuestion();
    }
  }

  /**
   * Update mute icon based on mute state
   * @param {boolean} muted - Muted state
   */
  updateMuteIcon(muted) {
    if (this.muteIcon) {
      this.muteIcon.textContent = muted ? '🔇' : '🔊';
      console.log('Mute icon updated:', muted ? 'muted' : 'unmuted');
    }
  }

  /**
   * Update volume display
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  updateVolumeDisplay(volume) {
    if (this.volumeDisplay) {
      this.volumeDisplay.textContent = `${Math.round(volume * 100)}%`;
    }
  }

  /**
   * Share results to clipboard
   */
  async shareResults() {
    if (!this.currentResults) {
      return;
    }

    const results = this.currentResults;
    const category = results.category || 'Random';
    
    // Format results text
    const shareText = `AppInterface Quiz Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score: ${results.score} points
Correct: ${results.correctCount} / ${results.totalQuestions} (${results.percentage}%)
Category: ${category}
Difficulty: ${results.difficulty || 'Mixed (Easy → Medium → Hard)'}

Breakdown:
- Easy: ${this.getDifficultyBreakdown(results.answers, 'easy')}
- Medium: ${this.getDifficultyBreakdown(results.answers, 'medium')}
- Hard: ${this.getDifficultyBreakdown(results.answers, 'hard')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    try {
      // Use fallback method (more reliable, works in all contexts)
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        this.showShareFeedback('Results copied to clipboard!');
      } else {
        // Fallback: try modern API if execCommand failed
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareText);
          this.showShareFeedback('Results copied to clipboard!');
        } else {
          throw new Error('Copy command failed');
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      this.showShareFeedback('Failed to copy. Please try again.');
    }
  }

  /**
   * Get difficulty breakdown for share text
   * @param {Array} answers - Answer array
   * @param {string} difficulty - Difficulty level
   * @returns {string} Formatted breakdown
   */
  getDifficultyBreakdown(answers, difficulty) {
    let correct = 0;
    let total = 0;
    
    answers.forEach((answer, index) => {
      const question = this.quizEngine.questions[index];
      if (question && question.difficulty === difficulty) {
        total++;
        if (answer.isCorrect) {
          correct++;
        }
      }
    });
    
    return total > 0 ? `${correct}/${total}` : 'N/A';
  }

  /**
   * Show feedback message for share action
   * @param {string} message - Feedback message
   */
  showShareFeedback(message) {
    if (this.shareBtn) {
      const originalText = this.shareBtn.textContent;
      this.shareBtn.textContent = message;
      this.shareBtn.disabled = true;
      
      setTimeout(() => {
        this.shareBtn.textContent = originalText;
        this.shareBtn.disabled = false;
      }, 2000);
    }
  }

  /**
   * Update theme icon based on current theme
   * @param {string} theme - Current theme ('light' or 'dark')
   */
  updateThemeIcon(theme) {
    if (this.themeIcon) {
      this.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  /**
   * Open report modal
   */
  openReportModal() {
    console.log('openReportModal called');
    console.log('reportModal:', this.reportModal);
    
    if (!this.reportModal) {
      console.error('Report modal not found!');
      return;
    }
    
    // Get current question from quiz engine
    const question = this.quizEngine.getCurrentQuestion();
    console.log('currentQuestion:', question);
    
    if (!question) {
      console.error('No current question!');
      return;
    }
    if (this.reportQuestionText) {
      this.reportQuestionText.textContent = question.question;
    }

    // Reset form
    if (this.reportReason) {
      this.reportReason.value = '';
    }
    if (this.reportDetails) {
      this.reportDetails.value = '';
    }

    // Show modal - use setProperty to override !important
    this.reportModal.style.setProperty('display', 'flex', 'important');
    console.log('Modal should be visible now');
  }

  /**
   * Close report modal
   */
  closeReportModalFunc() {
    if (this.reportModal) {
      this.reportModal.style.display = 'none';
    }
  }

  /**
   * Submit report
   */
  submitReport() {
    const question = this.quizEngine.getCurrentQuestion();
    
    if (!question) {
      alert('No question to report. Please start a quiz first.');
      return;
    }

    const reason = this.reportReason?.value;
    if (!reason) {
      alert('Please select a reason for reporting.');
      return;
    }
    const details = this.reportDetails?.value || '';

    // Get pack information if available
    const packId = question.packId || 'builtin';
    const packSource = question.packSource || 'builtin';

    const reportData = {
      questionId: question.id,
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      reason: reason,
      details: details,
      packId: packId,
      packSource: packSource
    };

    const success = storageManager.saveReport(reportData);
    
    if (success) {
      // Determine reporting method based on pack
      const reportingInfo = this.getReportingInfo(packId, packSource);
      
      if (reportingInfo.method === 'github') {
        this.createGitHubIssue(reportData);
      } else if (reportingInfo.method === 'email') {
        this.createEmailReport(reportData, reportingInfo.contactEmail, reportingInfo.packName);
      } else {
        // Local storage only
        alert('Report saved locally. This question pack does not support external reporting.');
      }
      
      this.closeReportModalFunc();
    } else {
      alert('Failed to save report. Please try again.');
    }
  }

  /**
   * Get reporting information for a pack
   * @param {string} packId - Pack identifier
   * @param {string} packSource - Pack source ('builtin', 'api', 'upload')
   * @returns {Object} Reporting info {method: string, contactEmail: string|null, packName: string}
   */
  getReportingInfo(packId, packSource) {
    // Try to get pack metadata if questionPackManager is available
    let packMetadata = null;
    if (window.questionPackManager) {
      packMetadata = window.questionPackManager.getPackMetadata(packId);
    }

    // Built-in packs: use GitHub reporting
    if (packSource === 'builtin') {
      return {
        method: 'github',
        contactEmail: null,
        packName: packMetadata?.packName || 'Built-in Pack'
      };
    }
    
    // Custom uploaded packs: check for contact email
    if (packSource === 'upload') {
      const contactEmail = packMetadata?.contactEmail || packMetadata?.metadata?.contactEmail;
      if (contactEmail) {
        return {
          method: 'email',
          contactEmail: contactEmail,
          packName: packMetadata?.packName || packMetadata?.metadata?.packName || 'Custom Pack'
        };
      }
      // No contact email: local storage only
      return {
        method: 'none',
        contactEmail: null,
        packName: packMetadata?.packName || 'Custom Pack'
      };
    }
    
    // Secure API packs: check for contact email
    if (packSource === 'api') {
      const contactEmail = packMetadata?.contactEmail || packMetadata?.metadata?.contactEmail;
      if (contactEmail) {
        return {
          method: 'email',
          contactEmail: contactEmail,
          packName: packMetadata?.packName || packMetadata?.metadata?.packName || 'Internal Pack'
        };
      }
      // No contact email: local storage only
      return {
        method: 'none',
        contactEmail: null,
        packName: packMetadata?.packName || 'Internal Pack'
      };
    }
    
    // Default: GitHub reporting (backwards compatible)
    return {
      method: 'github',
      contactEmail: null,
      packName: 'Unknown Pack'
    };
  }

  /**
   * Create email report for non-public question packs
   * @param {Object} reportData - Report data object
   * @param {string} contactEmail - Contact email address
   * @param {string} packName - Pack name
   */
  createEmailReport(reportData, contactEmail, packName) {
    const reasonLabels = {
      'incorrect': 'Question or answer is incorrect',
      'unclear': 'Question is unclear or confusing',
      'explanation': 'Explanation is confusing or wrong',
      'typo': 'Typo or grammar error',
      'other': 'Other issue'
    };

    const subject = encodeURIComponent(`Question Report: ${reportData.questionId} (${reportData.difficulty})`);
    
    const body = encodeURIComponent(`Hello,

I'm reporting an issue with a question from the "${packName}" question pack.

Question ID: ${reportData.questionId}
Category: ${reportData.category || 'N/A'}
Difficulty: ${reportData.difficulty}
Reason: ${reasonLabels[reportData.reason] || reportData.reason}

Question Text:
${reportData.question}

Additional Details:
${reportData.details || 'None provided'}

---
This report was submitted from the quiz application.`);

    const mailtoUrl = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    
    // Open email client
    window.location.href = mailtoUrl;
    
    // Show confirmation
    alert(`Thank you for reporting this question! Opening email client to send report to ${contactEmail}...`);
  }

  /**
   * Create GitHub issue for question report
   * @param {Object} reportData - Report data object
   */
  createGitHubIssue(reportData) {
    // Get repository info from config or use defaults
    const repoOwner = this.getRepoOwner();
    const repoName = this.getRepoName();
    
    if (!repoOwner || !repoName || repoOwner === 'YOUR_GITHUB_USERNAME') {
      // Fallback: just show success message
      alert('Thank you for reporting this question! Your feedback helps improve the quiz.\n\nNote: GitHub issue creation requires repository configuration. Please update window.quizConfig in index.html.');
      return;
    }

    // Format issue title
    const title = encodeURIComponent(`Question Report: ${reportData.questionId} (${reportData.difficulty})`);
    
    // Format issue body
    const reasonLabels = {
      'incorrect': 'Question or answer is incorrect',
      'unclear': 'Question is unclear or confusing',
      'explanation': 'Explanation is confusing or wrong',
      'typo': 'Typo or grammar error',
      'other': 'Other issue'
    };
    
    // Include pack info if available (but only for built-in packs)
    const packInfo = reportData.packSource === 'builtin' && reportData.packId 
      ? `**Question Pack:** ${reportData.packId}\n` 
      : '';
    
    const body = encodeURIComponent(`## Question Report

**Question ID:** ${reportData.questionId}
**Category:** ${reportData.category || 'N/A'}
**Difficulty:** ${reportData.difficulty}
${packInfo}**Reason:** ${reasonLabels[reportData.reason] || reportData.reason}

**Question Text:**
${reportData.question}

**Additional Details:**
${reportData.details || 'None provided'}

---
*This report was submitted from the quiz application.*`);

    // Create GitHub issue URL
    const issueUrl = `https://github.com/${repoOwner}/${repoName}/issues/new?title=${title}&body=${body}&labels=question-report`;
    
    // Open in new tab
    window.open(issueUrl, '_blank');
    
    // Show confirmation
    alert('Thank you for reporting this question! Opening GitHub issue page...');
  }

  /**
   * Get repository owner from config or environment
   * @returns {string|null} Repository owner
   */
  getRepoOwner() {
    // Try to get from window config (can be set in HTML)
    if (window.quizConfig && window.quizConfig.repoOwner) {
      return window.quizConfig.repoOwner;
    }
    // Could also try to detect from current page URL if on GitHub Pages
    return null;
  }

  /**
   * Get repository name from config or environment
   * @returns {string|null} Repository name
   */
  getRepoName() {
    // Try to get from window config (can be set in HTML)
    if (window.quizConfig && window.quizConfig.repoName) {
      return window.quizConfig.repoName;
    }
    // Could also try to detect from current page URL if on GitHub Pages
    return null;
  }

  /**
   * Export reports to clipboard
   */
  async exportReports() {
    const reports = storageManager.getReports();
    
    if (reports.length === 0) {
      alert('No reports to export.');
      return;
    }

    const reportsText = storageManager.exportReports();

    try {
      // Use fallback method (more reliable)
      const textArea = document.createElement('textarea');
      textArea.value = reportsText;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        alert(`Exported ${reports.length} report(s) to clipboard!`);
      } else {
        // Fallback: try modern API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(reportsText);
          alert(`Exported ${reports.length} report(s) to clipboard!`);
        } else {
          throw new Error('Copy command failed');
        }
      }
    } catch (error) {
      console.error('Failed to export reports:', error);
      alert('Failed to copy reports. Please try again.');
    }
  }
}

