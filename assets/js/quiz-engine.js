// Quiz Engine - Core quiz logic and state management

import { getQuestions, shuffleArray } from './questions/index.js';

export class QuizEngine {
  constructor() {
    this.reset();
  }

  /**
   * Reset quiz state
   */
  reset() {
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.totalPoints = 0;
    this.correctCount = 0;
    this.answers = []; // Store user's answers
    this.difficulty = null;
    this.category = null;
    this.hintsUsed = {}; // Track hints used per question
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Start a new quiz with automatic difficulty progression
   * @param {string|null} category - Category name, 'random' for all categories, or null for all
   * @param {boolean} shuffleQuestions - Whether to shuffle questions within each difficulty
   * @param {boolean} shuffleOptions - Whether to shuffle answer options
   */
  startQuiz(category = null, shuffleQuestions = true, shuffleOptions = true) {
    this.reset();
    
    // Handle 'random' category as null (all categories)
    if (category === 'random') {
      category = null;
    }
    
    this.category = category;
    
    // Get questions from all difficulty levels for the selected category
    const easyQuestions = getQuestions(category, 'easy');
    const mediumQuestions = getQuestions(category, 'medium');
    const hardQuestions = getQuestions(category, 'hard');
    
    // Combine questions in progression order: easy -> medium -> hard
    let questions = [];
    
    // Shuffle within each difficulty level if requested
    if (shuffleQuestions) {
      questions = [
        ...shuffleArray(easyQuestions),
        ...shuffleArray(mediumQuestions),
        ...shuffleArray(hardQuestions)
      ];
    } else {
      questions = [
        ...easyQuestions,
        ...mediumQuestions,
        ...hardQuestions
      ];
    }
    
    if (questions.length === 0) {
      throw new Error(`No questions found for category: ${category}`);
    }
    
    // Shuffle options for each question if requested
    if (shuffleOptions) {
      questions = questions.map(q => this.shuffleQuestionOptions(q));
    }
    
    this.questions = questions;
    this.startTime = Date.now();
    
    console.log(`Quiz started with ${this.questions.length} questions:`);
    console.log(`  Easy: ${easyQuestions.length}, Medium: ${mediumQuestions.length}, Hard: ${hardQuestions.length}`);
    console.log('Question order:', this.questions.map(q => `${q.difficulty}-${q.id}`));
    
    return this.questions.length;
  }

  /**
   * Shuffle options for a question and update correctIndex
   * @param {Object} question - Question object
   * @returns {Object} Question with shuffled options
   */
  shuffleQuestionOptions(question) {
    const shuffled = {
      ...question,
      options: shuffleArray([...question.options])
    };
    
    // Find new correct index
    const correctAnswer = question.options[question.correctIndex];
    shuffled.correctIndex = shuffled.options.indexOf(correctAnswer);
    
    // Update incorrectResponses to match new indices
    const newIncorrectResponses = {};
    question.options.forEach((option, oldIndex) => {
      if (oldIndex !== question.correctIndex) {
        const newIndex = shuffled.options.indexOf(option);
        if (newIndex !== -1 && newIndex !== shuffled.correctIndex) {
          newIncorrectResponses[newIndex] = question.incorrectResponses[oldIndex];
        }
      }
    });
    shuffled.incorrectResponses = newIncorrectResponses;
    
    return shuffled;
  }

  /**
   * Get current question
   * @returns {Object|null} Current question object or null if no more questions
   */
  getCurrentQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    const question = this.questions[this.currentQuestionIndex];
    // Update current difficulty based on current question
    this.difficulty = question.difficulty;
    return question;
  }

  /**
   * Submit an answer
   * @param {number} selectedIndex - Index of selected answer
   * @returns {Object} Result object with isCorrect, feedback, points, etc.
   */
  submitAnswer(selectedIndex) {
    const question = this.getCurrentQuestion();
    if (!question) {
      throw new Error('No current question');
    }

    const isCorrect = selectedIndex === question.correctIndex;
    const points = isCorrect ? (question.points || this.getDefaultPoints(question.difficulty)) : 0;
    
    // Update score
    if (isCorrect) {
      this.score += points;
      this.correctCount++;
    }
    this.totalPoints += (question.points || this.getDefaultPoints(question.difficulty));

    // Store answer
    this.answers.push({
      questionId: question.id,
      selectedIndex,
      correctIndex: question.correctIndex,
      isCorrect,
      points,
      question: question.question,
      options: [...question.options],
      timeSpent: Date.now() - (this.startTime || Date.now())
    });

    // Get feedback
    const feedback = isCorrect 
      ? question.correctResponse 
      : question.incorrectResponses[selectedIndex] || 'Incorrect answer.';

    return {
      isCorrect,
      feedback,
      points,
      correctIndex: question.correctIndex,
      selectedIndex
    };
  }

  /**
   * Move to next question
   * @returns {boolean} True if there are more questions, false if quiz is complete
   */
  nextQuestion() {
    console.log(`Moving from question ${this.currentQuestionIndex} to ${this.currentQuestionIndex + 1}`);
    this.currentQuestionIndex++;
    const hasMore = this.currentQuestionIndex < this.questions.length;
    console.log(`  Has more questions: ${hasMore}, Total: ${this.questions.length}`);
    return hasMore;
  }

  /**
   * Get a hint for the current question
   * @returns {string|null} Hint text or null if no more hints
   */
  getHint() {
    const question = this.getCurrentQuestion();
    if (!question || !question.hints || question.hints.length === 0) {
      return null;
    }

    const questionId = question.id;
    const hintsUsed = this.hintsUsed[questionId] || 0;
    
    if (hintsUsed >= question.hints.length) {
      return null; // No more hints
    }

    // Track hint usage
    this.hintsUsed[questionId] = hintsUsed + 1;
    
    return question.hints[hintsUsed];
  }

  /**
   * Check if there are more hints available for current question
   * @returns {boolean}
   */
  hasMoreHints() {
    const question = this.getCurrentQuestion();
    if (!question || !question.hints) {
      return false;
    }
    const hintsUsed = this.hintsUsed[question.id] || 0;
    return hintsUsed < question.hints.length;
  }

  /**
   * Get quiz progress
   * @returns {Object} Progress info
   */
  getProgress() {
    return {
      current: this.currentQuestionIndex + 1,
      total: this.questions.length,
      percentage: Math.round(((this.currentQuestionIndex + 1) / this.questions.length) * 100)
    };
  }

  /**
   * Get quiz results
   * @returns {Object} Results summary
   */
  getResults() {
    this.endTime = Date.now();
    const totalTime = this.endTime - (this.startTime || this.endTime);
    
    return {
      score: this.score,
      totalPoints: this.totalPoints,
      correctCount: this.correctCount,
      totalQuestions: this.questions.length,
      percentage: this.questions.length > 0 
        ? Math.round((this.correctCount / this.questions.length) * 100) 
        : 0,
      difficulty: this.difficulty,
      category: this.category,
      answers: this.answers,
      totalTime,
      hintsUsed: this.hintsUsed
    };
  }

  /**
   * Get default points for a difficulty level
   * @param {string} difficulty - Difficulty level
   * @returns {number} Default points
   */
  getDefaultPoints(difficulty) {
    const pointsMap = {
      easy: 10,
      medium: 20,
      hard: 30
    };
    return pointsMap[difficulty] || 10;
  }

  /**
   * Check if quiz is complete
   * @returns {boolean}
   */
  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  /**
   * Export current quiz state for saving
   * @returns {Object} Quiz state object
   */
  exportState() {
    return {
      questions: this.questions.map(q => ({
        id: q.id,
        category: q.category,
        difficulty: q.difficulty
      })),
      currentQuestionIndex: this.currentQuestionIndex,
      score: this.score,
      totalPoints: this.totalPoints,
      correctCount: this.correctCount,
      answers: this.answers,
      difficulty: this.difficulty,
      category: this.category,
      hintsUsed: this.hintsUsed,
      startTime: this.startTime,
      timestamp: Date.now()
    };
  }

  /**
   * Restore quiz state from saved data
   * @param {Object} savedState - Saved quiz state
   * @param {Function} getQuestionById - Function to get full question by ID
   */
  restoreState(savedState, getQuestionById) {
    // Restore basic state
    this.currentQuestionIndex = savedState.currentQuestionIndex || 0;
    this.score = savedState.score || 0;
    this.totalPoints = savedState.totalPoints || 0;
    this.correctCount = savedState.correctCount || 0;
    this.answers = savedState.answers || [];
    this.difficulty = savedState.difficulty || null;
    this.category = savedState.category || null;
    this.hintsUsed = savedState.hintsUsed || {};
    this.startTime = savedState.startTime || null;

    // Restore full question objects
    this.questions = [];
    if (savedState.questions && Array.isArray(savedState.questions)) {
      for (const qRef of savedState.questions) {
        const fullQuestion = getQuestionById(qRef.id, qRef.category, qRef.difficulty);
        if (fullQuestion) {
          this.questions.push(fullQuestion);
        }
      }
    }
  }
}

