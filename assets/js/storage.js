// LocalStorage management for quiz data

const STORAGE_KEYS = {
  HIGH_SCORES: 'quiz_high_scores',
  STATISTICS: 'quiz_statistics',
  INCOMPLETE_QUIZ: 'quiz_incomplete',
  REPORTS: 'quiz_reports'
};

export class StorageManager {
  /**
   * Save high score for a category
   * @param {string} category - Category name
   * @param {Object} scoreData - Score data object
   */
  saveHighScore(category, scoreData) {
    const scores = this.getHighScores();
    
    if (!scores[category]) {
      scores[category] = [];
    }
    
    // Add new score with timestamp
    scores[category].push({
      ...scoreData,
      timestamp: Date.now(),
      date: new Date().toISOString()
    });
    
    // Sort by score (descending) and keep top 10
    scores[category].sort((a, b) => b.score - a.score);
    scores[category] = scores[category].slice(0, 10);
    
    try {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(scores));
      return true;
    } catch (error) {
      console.error('Error saving high score:', error);
      return false;
    }
  }

  /**
   * Get high scores for a category
   * @param {string|null} category - Category name or null for all
   * @returns {Object|Array} High scores object or array
   */
  getHighScores(category = null) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
      const scores = data ? JSON.parse(data) : {};
      
      if (category) {
        return scores[category] || [];
      }
      return scores;
    } catch (error) {
      console.error('Error reading high scores:', error);
      return category ? [] : {};
    }
  }

  /**
   * Get best score for a category
   * @param {string} category - Category name
   * @returns {Object|null} Best score object or null
   */
  getBestScore(category) {
    const scores = this.getHighScores(category);
    return scores && scores.length > 0 ? scores[0] : null;
  }

  /**
   * Update statistics
   * @param {Object} statsUpdate - Statistics to update
   */
  updateStatistics(statsUpdate) {
    const stats = this.getStatistics();
    
    // Merge updates
    const updatedStats = {
      totalQuizzes: (stats.totalQuizzes || 0) + 1,
      totalQuestions: (stats.totalQuestions || 0) + (statsUpdate.totalQuestions || 0),
      correctAnswers: (stats.correctAnswers || 0) + (statsUpdate.correctCount || 0),
      totalPoints: (stats.totalPoints || 0) + (statsUpdate.score || 0),
      categoriesPlayed: stats.categoriesPlayed || {},
      lastPlayed: Date.now()
    };
    
    // Update category-specific stats
    if (statsUpdate.category) {
      if (!updatedStats.categoriesPlayed[statsUpdate.category]) {
        updatedStats.categoriesPlayed[statsUpdate.category] = {
          quizzes: 0,
          questions: 0,
          correct: 0,
          points: 0
        };
      }
      const catStats = updatedStats.categoriesPlayed[statsUpdate.category];
      catStats.quizzes += 1;
      catStats.questions += (statsUpdate.totalQuestions || 0);
      catStats.correct += (statsUpdate.correctCount || 0);
      catStats.points += (statsUpdate.score || 0);
    }
    
    try {
      localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(updatedStats));
      return updatedStats;
    } catch (error) {
      console.error('Error updating statistics:', error);
      return stats;
    }
  }

  /**
   * Get statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATISTICS);
      return data ? JSON.parse(data) : {
        totalQuizzes: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        totalPoints: 0,
        categoriesPlayed: {}
      };
    } catch (error) {
      console.error('Error reading statistics:', error);
      return {
        totalQuizzes: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        totalPoints: 0,
        categoriesPlayed: {}
      };
    }
  }

  /**
   * Save incomplete quiz state
   * @param {Object} quizState - Quiz state to save
   */
  saveIncompleteQuiz(quizState) {
    try {
      localStorage.setItem(STORAGE_KEYS.INCOMPLETE_QUIZ, JSON.stringify(quizState));
      return true;
    } catch (error) {
      console.error('Error saving incomplete quiz:', error);
      return false;
    }
  }

  /**
   * Get incomplete quiz state
   * @returns {Object|null} Incomplete quiz state or null
   */
  getIncompleteQuiz() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INCOMPLETE_QUIZ);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading incomplete quiz:', error);
      return null;
    }
  }

  /**
   * Clear incomplete quiz
   */
  clearIncompleteQuiz() {
    try {
      localStorage.removeItem(STORAGE_KEYS.INCOMPLETE_QUIZ);
      return true;
    } catch (error) {
      console.error('Error clearing incomplete quiz:', error);
      return false;
    }
  }

  /**
   * Reset all stored data
   * @returns {boolean} Success status
   */
  resetAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error resetting storage:', error);
      return false;
    }
  }

  /**
   * Save a question report
   * @param {Object} reportData - Report data object
   */
  saveReport(reportData) {
    try {
      const reports = this.getReports();
      reports.push({
        ...reportData,
        id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        date: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      return true;
    } catch (error) {
      console.error('Error saving report:', error);
      return false;
    }
  }

  /**
   * Get all reports
   * @returns {Array} Array of report objects
   */
  getReports() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading reports:', error);
      return [];
    }
  }

  /**
   * Clear all reports
   */
  clearReports() {
    try {
      localStorage.removeItem(STORAGE_KEYS.REPORTS);
      return true;
    } catch (error) {
      console.error('Error clearing reports:', error);
      return false;
    }
  }

  /**
   * Export reports as JSON
   * @returns {string} JSON string of reports
   */
  exportReports() {
    const reports = this.getReports();
    return JSON.stringify(reports, null, 2);
  }

  /**
   * Check if storage is available
   * @returns {boolean}
   */
  isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const storageManager = new StorageManager();

