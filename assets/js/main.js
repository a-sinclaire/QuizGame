// Main application entry point
// Wires together quiz engine and UI controller

import { QuizEngine } from './quiz-engine.js';
import { UIController } from './ui-controller.js';
import { getCategories, getQuestionById, questionRegistry } from './questions/index.js';
import { storageManager } from './storage.js';
import { soundManager } from './sound-manager.js';
import { themeManager } from './theme-manager.js';
import { questionPackManager } from './question-packs.js';
import { GitLabOAuth } from './gitlab-oauth.js';

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
    // Make questionPackManager available globally for reporting
    window.questionPackManager = questionPackManager;
    
    // Register built-in pack with question pack manager
    questionPackManager.registerBuiltInPack(
      'builtin-public',
      'Public Questions',
      questionRegistry,
      {
        author: 'Quiz Maintainers',
        contactEmail: null, // Public pack, use GitHub for reporting
        packVersion: '1.0.0'
      }
    );
    
    // Load cached packs from storage
    questionPackManager.loadCachedPacks().then(() => {
      // Update UI with loaded packs (after DOM is ready)
      setTimeout(() => {
        if (document.getElementById('category-selector')) {
          this.updateCategorySelector();
        }
        // Check for incomplete quiz AFTER packs are loaded (so secure pack questions can be found)
        this.checkForIncompleteQuiz();
      }, 100);
    });
    
    // Set up GitLab pack loader (after DOM is ready)
    setTimeout(() => {
      if (document.getElementById('load-gitlab-packs-btn')) {
        this.setupGitLabLoader();
      }
    }, 100);
    
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
    
    // Note: checkForIncompleteQuiz() is now called after packs are loaded
    // to ensure secure pack questions are available when resuming

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
      // Clear any incomplete quiz when starting new
      storageManager.clearIncompleteQuiz();
      
      const questionCount = this.quizEngine.startQuiz(category, true, true);
      console.log(`Started quiz with ${questionCount} questions from category: ${category || 'all'}`);
      
      // Hide resume banner and show category selector
      const resumeContainer = document.getElementById('resume-quiz-container');
      const categorySelector = document.querySelector('.category-selector');
      const welcomeText = document.querySelector('#start-screen > p');
      
      if (resumeContainer) {
        resumeContainer.style.display = 'none';
      }
      if (categorySelector) {
        categorySelector.style.display = 'flex';
      }
      if (welcomeText) {
        welcomeText.style.display = 'block';
      }
      
      this.uiController.renderQuizScreen();
      this.saveQuizState(); // Save initial state
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Resume incomplete quiz
   */
  resumeQuiz() {
    const savedState = storageManager.getIncompleteQuiz();
    if (!savedState) {
      console.warn('No incomplete quiz found');
      return;
    }

    try {
      // Restore quiz state
      this.quizEngine.restoreState(savedState, getQuestionById);
      console.log('Resumed quiz from question', this.quizEngine.currentQuestionIndex + 1);
      
      // Hide resume banner and show category selector (for when they come back)
      const resumeContainer = document.getElementById('resume-quiz-container');
      const categorySelector = document.querySelector('.category-selector');
      const welcomeText = document.querySelector('#start-screen > p');
      
      if (resumeContainer) {
        resumeContainer.style.display = 'none';
      }
      if (categorySelector) {
        categorySelector.style.display = 'flex';
      }
      if (welcomeText) {
        welcomeText.style.display = 'block';
      }
      
      // Show quiz screen
      this.uiController.renderQuizScreen();
    } catch (error) {
      console.error('Error resuming quiz:', error);
      alert('Error resuming quiz. Starting a new quiz instead.');
      storageManager.clearIncompleteQuiz();
      this.uiController.renderStartScreen();
    }
  }

  /**
   * Check for incomplete quiz and show resume option
   */
  checkForIncompleteQuiz() {
    const savedState = storageManager.getIncompleteQuiz();
    const categorySelector = document.querySelector('.category-selector');
    const welcomeText = document.querySelector('#start-screen > p');
    
    if (savedState) {
      // Show resume banner
      const resumeContainer = document.getElementById('resume-quiz-container');
      if (resumeContainer) {
        resumeContainer.style.display = 'block';
      }
      
      // Hide category selector and welcome text
      if (categorySelector) {
        categorySelector.style.display = 'none';
      }
      if (welcomeText) {
        welcomeText.style.display = 'none';
      }
      
      // Set up resume button
      const resumeBtn = document.getElementById('resume-quiz-btn');
      const dismissBtn = document.getElementById('dismiss-resume-btn');
      
      if (resumeBtn) {
        resumeBtn.onclick = () => {
          this.resumeQuiz();
        };
      }
      
      if (dismissBtn) {
        dismissBtn.onclick = () => {
          storageManager.clearIncompleteQuiz();
          resumeContainer.style.display = 'none';
          // Show category selector and welcome text
          if (categorySelector) {
            categorySelector.style.display = 'flex';
          }
          if (welcomeText) {
            welcomeText.style.display = 'block';
          }
        };
      }
    } else {
      // No incomplete quiz - ensure category selector is visible
      if (categorySelector) {
        categorySelector.style.display = 'flex';
      }
      if (welcomeText) {
        welcomeText.style.display = 'block';
      }
    }
  }

  /**
   * Save current quiz state
   */
  saveQuizState() {
    if (!storageManager.isAvailable()) {
      return;
    }

    // Don't save if quiz is complete
    if (this.quizEngine.isComplete()) {
      storageManager.clearIncompleteQuiz();
      return;
    }

    const state = this.quizEngine.exportState();
    storageManager.saveIncompleteQuiz(state);
  }

  /**
   * Move to next question or show results
   */
  nextQuestion() {
    const hasMore = this.quizEngine.nextQuestion();
    
    if (hasMore) {
      this.uiController.renderQuizScreen();
      this.saveQuizState(); // Save state after each question
    } else {
      // Quiz complete - clear incomplete quiz and save results
      storageManager.clearIncompleteQuiz();
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

  /**
   * Update category selector with dynamically loaded packs
   */
  updateCategorySelector() {
    const categorySelector = document.getElementById('category-selector');
    if (!categorySelector) return;
    
    // Get all available categories from pack manager
    const mergedQuestions = questionPackManager.getMergedQuestions();
    const categories = Object.keys(mergedQuestions);
    
    // Remove existing category buttons (except random and test-pack)
    const existingButtons = categorySelector.querySelectorAll('.category-btn[data-category]:not([data-category="random"]):not([data-category="test-pack"])');
    existingButtons.forEach(btn => btn.remove());
    
    // Add buttons for new categories
    categories.forEach(category => {
      if (category === 'test-pack' || category === 'random') return;
      
      // Check if button already exists
      if (categorySelector.querySelector(`[data-category="${category}"]`)) return;
      
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.setAttribute('data-category', category);
      
      // Find which pack this category belongs to by checking questions
      const questions = questionPackManager.getMergedQuestions();
      const categoryQuestions = questions[category] || [];
      
      // Find the pack that contains questions in this category
      let pack = null;
      if (categoryQuestions.length > 0) {
        // Get packId from first question
        const firstQuestion = categoryQuestions[0];
        const packId = firstQuestion.packId;
        if (packId) {
          pack = questionPackManager.getPackMetadata(packId);
        }
      }
      
      // Determine display name
      let displayName = pack?.packName || category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // Add lock icon if it's a secure pack (from API)
      if (pack && pack.packSource === 'api') {
        displayName = `🔒 ${displayName}`;
      }
      
      btn.textContent = displayName;
      categorySelector.appendChild(btn);
    });
    
    // Re-attach event listeners
    this.uiController.setupEventListeners();
  }

  /**
   * Set up GitLab pack loader UI with OAuth
   */
  setupGitLabLoader() {
    // Set up manual token loader (fallback)
    const loadBtn = document.getElementById('load-gitlab-packs-btn');
    const statusDiv = document.getElementById('gitlab-status');
    
    if (!loadBtn) return;
    
    loadBtn.addEventListener('click', async () => {
      const gitlabUrl = document.getElementById('gitlab-url')?.value.trim();
      const repoPath = document.getElementById('gitlab-repo')?.value.trim();
      const token = document.getElementById('gitlab-token')?.value.trim();
      const packsInput = document.getElementById('gitlab-packs')?.value.trim();
      
      // Validate inputs (packsInput can be empty for auto-discovery)
      if (!gitlabUrl || !repoPath || !token) {
        this.showGitLabStatus('Please fill in GitLab URL, Repository Path, and Token.', 'error');
        return;
      }
      
      // Parse pack files (one per line) - empty means auto-discover
      const packFiles = packsInput ? packsInput.split('\n').map(f => f.trim()).filter(f => f) : [];
      const packFilesToLoad = packFiles.length === 0 ? null : packFiles;
      
      // Disable button and show loading
      loadBtn.disabled = true;
      loadBtn.textContent = 'Loading...';
      this.showGitLabStatus('Loading packs from GitLab...', 'info');
      
      try {
        // Load packs from GitLab (packFilesToLoad is null if auto-discovery)
        await questionPackManager.loadFromGitLab(gitlabUrl, repoPath, token, packFilesToLoad);
        
        // If auto-discovery was used, get discovered pack files
        let finalPackFiles = packFilesToLoad;
        if (!packFilesToLoad) {
          finalPackFiles = Array.from(questionPackManager.packMetadata.values())
            .filter(metadata => metadata.packSource === 'api' && metadata.gitlabFile)
            .map(metadata => metadata.gitlabFile);
        }
        
        // Reload cached packs to ensure they're available
        await questionPackManager.loadCachedPacks();
        
        // Update category selector
        this.updateCategorySelector();
        
        // Show success
        const packCount = finalPackFiles ? finalPackFiles.length : questionPackManager.packMetadata.size;
        const message = packFilesToLoad
          ? `✅ Successfully loaded ${packCount} pack(s)! Categories updated.`
          : `✅ Auto-discovered and loaded ${packCount} pack(s)! Categories updated.`;
        this.showGitLabStatus(message, 'success');
        
        // Clear token field for security
        document.getElementById('gitlab-token').value = '';
        
        // Save GitLab config (without token) for convenience
        storageManager.saveGitLabConfig({
          gitlabUrl,
          repoPath,
          packFiles: finalPackFiles
        });
        
        // Update textarea with discovered files if auto-discovery was used
        if (!packFilesToLoad && finalPackFiles && finalPackFiles.length > 0) {
          document.getElementById('gitlab-packs').value = finalPackFiles.join('\n');
        }
        
      } catch (error) {
        console.error('Error loading GitLab packs:', error);
        this.showGitLabStatus(`❌ Error: ${error.message}`, 'error');
      } finally {
        loadBtn.disabled = false;
        loadBtn.textContent = 'Load Internal Packs';
      }
    });
    
    // Load saved GitLab config (if any)
    const savedConfig = storageManager.getGitLabConfig();
    
    if (savedConfig) {
      document.getElementById('gitlab-url').value = savedConfig.gitlabUrl || '';
      document.getElementById('gitlab-repo').value = savedConfig.repoPath || '';
      // Clear old pack file reference to trigger auto-discovery
      let packFiles = savedConfig.packFiles || [];
      if (packFiles.includes('packs/internal-basic-v1.json')) {
        console.log('[setupGitLabLoader] Old pack file detected, clearing to enable auto-discovery');
        packFiles = [];
        savedConfig.packFiles = null;
        storageManager.saveGitLabConfig(savedConfig);
      }
      // Show pack files if manually specified, otherwise leave empty for auto-discovery
      document.getElementById('gitlab-packs').value = packFiles.length > 0 ? packFiles.join('\n') : '';
      document.getElementById('gitlab-packs').placeholder = 'Leave empty to auto-discover all .json files in packs/ directory';
    } else {
      // Leave empty for auto-discovery by default
      document.getElementById('gitlab-packs').value = '';
      document.getElementById('gitlab-packs').placeholder = 'Leave empty to auto-discover all .json files in packs/ directory';
    }
    
    // Initialize OAuth if configured (moved to end of setupGitLabLoader)
    this.initializeOAuth();
  }

  /**
   * Initialize OAuth authentication
   */
  initializeOAuth() {
    const gitlabConfig = window.quizConfig?.gitlab;
    if (gitlabConfig?.url && gitlabConfig?.oauthAppId) {
      const oauth = new GitLabOAuth(gitlabConfig.url, gitlabConfig.oauthAppId);
      
      // Store config for callback page
      sessionStorage.setItem('gitlab_oauth_config', JSON.stringify(gitlabConfig));
      
      // Set up OAuth buttons
      this.setupOAuthButtons(oauth);
      
      // Check if already authenticated
      if (oauth.isAuthenticated()) {
        this.updateAuthStatus(oauth);
        // Auto-load packs if authenticated
        this.autoLoadPacks(oauth);
      }
    } else {
      // Hide GitLab loader section if not configured
      const loaderSection = document.getElementById('gitlab-loader-section');
      if (loaderSection) {
        loaderSection.style.display = 'none';
      }
    }
  }

  /**
   * Set up OAuth authentication buttons
   */
  setupOAuthButtons(oauth) {
    const authBtn = document.getElementById('gitlab-auth-btn');
    const logoutBtn = document.getElementById('gitlab-logout-btn');
    const authStatus = document.getElementById('gitlab-auth-status');
    
    if (authBtn) {
      // Clone to remove old listeners
      const authBtnClone = authBtn.cloneNode(true);
      authBtn.parentNode.replaceChild(authBtnClone, authBtn);
      
      authBtnClone.addEventListener('click', async () => {
        try {
          await oauth.startAuthFlow();
        } catch (error) {
          console.error('OAuth error:', error);
          this.showGitLabStatus(`❌ Error: ${error.message}`, 'error');
        }
      });
    }
    
    if (logoutBtn) {
      // Clone to remove old listeners
      const logoutBtnClone = logoutBtn.cloneNode(true);
      logoutBtn.parentNode.replaceChild(logoutBtnClone, logoutBtn);
      
      logoutBtnClone.addEventListener('click', async () => {
        // Clear token first
        oauth.clearToken();
        
        // Clear secure packs from memory immediately
        questionPackManager.securePacks.clear();
        
        // Remove secure pack metadata
        const packIdsToRemove = [];
        for (const [packId, metadata] of questionPackManager.packMetadata) {
          if (metadata.packSource === 'api') {
            packIdsToRemove.push(packId);
          }
        }
        packIdsToRemove.forEach(packId => {
          questionPackManager.packMetadata.delete(packId);
        });
        
        // Reload cached packs (will skip secure packs since not authenticated)
        await questionPackManager.loadCachedPacks();
        
        // Update UI to remove private categories (this will call setupEventListeners)
        this.updateCategorySelector();
        
        // Update auth status (must be after clearToken to properly hide logout button and indicator)
        await this.updateAuthStatus(oauth);
        
        this.showGitLabStatus('Logged out successfully. Private packs are no longer available.', 'info');
      });
    }
    
    // Update auth status on load
    this.updateAuthStatus(oauth);
  }

  /**
   * Update authentication status display
   */
  async updateAuthStatus(oauth) {
    const authBtn = document.getElementById('gitlab-auth-btn');
    const logoutBtn = document.getElementById('gitlab-logout-btn');
    const authStatus = document.getElementById('gitlab-auth-status');
    const authIndicator = document.getElementById('gitlab-auth-indicator');
    const authIndicatorText = document.getElementById('gitlab-auth-indicator-text');
    
    if (!authBtn || !logoutBtn || !authStatus) return;
    
    const isAuthenticated = oauth.isAuthenticated();
    
    if (isAuthenticated) {
      try {
        const user = await oauth.getCurrentUser();
        authStatus.style.display = 'block';
        authStatus.style.backgroundColor = 'var(--success-bg, #d4edda)';
        authStatus.style.color = 'var(--success-text, #155724)';
        authStatus.textContent = `✅ Authenticated as ${user.name || user.username}`;
        authStatus.style.display = 'block';
        authBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        
        // Update indicator
        if (authIndicator && authIndicatorText) {
          authIndicator.style.display = 'block';
          authIndicator.style.backgroundColor = 'var(--success-bg, #d4edda)';
          authIndicator.style.borderColor = 'var(--success-color, #28a745)';
          authIndicator.style.color = '#155724';
          authIndicatorText.textContent = `🔒 Authenticated as ${user.name || user.username}`;
        }
      } catch (error) {
        console.error('Error getting user info:', error);
        // Token might be invalid or expired, clear it
        oauth.clearToken();
        authStatus.style.display = 'none';
        authBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        
        // Update indicator
        if (authIndicator && authIndicatorText) {
          authIndicator.style.display = 'block';
          authIndicator.style.backgroundColor = 'var(--bg-secondary, #f5f5f5)';
          authIndicator.style.borderColor = 'var(--border-color, #e0e0e0)';
          authIndicator.style.color = '#1a1a1a';
          authIndicatorText.textContent = '🔓 Not authenticated';
        }
      }
    } else {
      // Not authenticated - hide logout button and status, show auth button
      authStatus.style.display = 'none';
      authBtn.style.display = 'block';
      logoutBtn.style.display = 'none';
      
      // Update indicator
      if (authIndicator && authIndicatorText) {
        authIndicator.style.display = 'block';
        authIndicator.style.backgroundColor = 'var(--bg-secondary, #f5f5f5)';
        authIndicator.style.borderColor = 'var(--border-color, #e0e0e0)';
        authIndicatorText.textContent = '🔓 Not authenticated';
      }
    }
  }

  /**
   * Auto-load packs after OAuth authentication
   */
  async autoLoadPacks(oauth) {
    const gitlabConfig = window.quizConfig?.gitlab;
    if (!gitlabConfig) return;
    
    // Get saved repo config or use defaults
    const savedConfig = storageManager.getGitLabConfig();
    const repoPath = savedConfig?.repoPath || gitlabConfig.defaultRepo || 'amsincla/quiz-packs-private';
    
    // Use saved pack files, or null to trigger auto-discovery
    // If saved config has old pack file, clear it to trigger discovery
    let packFiles = savedConfig?.packFiles;
    if (packFiles && packFiles.includes('packs/internal-basic-v1.json')) {
      console.log('[autoLoadPacks] Old pack file detected, clearing to trigger auto-discovery');
      packFiles = null; // Trigger auto-discovery
      if (savedConfig) {
        savedConfig.packFiles = null;
        storageManager.saveGitLabConfig(savedConfig);
      }
    }
    
    // If no pack files specified, will auto-discover from GitLab
    // Pass null to trigger auto-discovery in loadFromGitLab
    
    console.log('[autoLoadPacks] Starting auto-load for:', { repoPath, packFiles });
    
    try {
      const token = oauth.getStoredToken();
      if (!token) {
        console.log('[autoLoadPacks] No token available, loading cached packs only');
        // No token, but try to load cached packs anyway
        await questionPackManager.loadCachedPacks();
        this.updateCategorySelector();
        return;
      }
      
      console.log('[autoLoadPacks] Token available, checking cache...');
      
      // If packFiles is null, we'll discover them, so skip cache check (will discover and load)
      // Otherwise, check if all specified packs are cached
      let allPacksCached = false;
      if (packFiles && Array.isArray(packFiles) && packFiles.length > 0) {
        const cachedPacks = await storageManager.getCachedPacks();
        allPacksCached = packFiles.every(packFile => {
          // Check if any cached pack matches this file
          for (const [packId, cached] of Object.entries(cachedPacks)) {
            if (cached.gitlabFile === packFile || cached.packData?.packId) {
              const metadata = questionPackManager.getPackMetadata(packId);
              return metadata && questionPackManager.securePacks.has(packId);
            }
          }
          return false;
        });
      }
      
      // If packs are already cached and loaded, skip fetching
      if (allPacksCached) {
        console.log('[autoLoadPacks] Packs already cached and loaded, skipping fetch');
        await questionPackManager.loadCachedPacks(); // Ensure they're available
        this.updateCategorySelector();
        this.showGitLabStatus('✅ Secure packs loaded from cache!', 'success');
        return;
      }
      
      console.log('[autoLoadPacks] Fetching packs from GitLab...');
      
      // Try to fetch from GitLab (might fail if token expired, but cached packs will still work)
      try {
        const loadedPacks = await questionPackManager.loadFromGitLab(
          gitlabConfig.url,
          repoPath,
          token,
          packFiles
        );
        console.log('[autoLoadPacks] Successfully fetched packs from GitLab');
        
        // If auto-discovery was used, save discovered pack files to config
        if (!packFiles || (Array.isArray(packFiles) && packFiles.length === 0)) {
          // Get discovered pack files from the loaded packs
          const discoveredFiles = Array.from(questionPackManager.packMetadata.values())
            .filter(metadata => metadata.packSource === 'api' && metadata.gitlabFile)
            .map(metadata => metadata.gitlabFile);
          
          if (discoveredFiles.length > 0 && savedConfig) {
            savedConfig.packFiles = discoveredFiles;
            storageManager.saveGitLabConfig(savedConfig);
            console.log('[autoLoadPacks] Saved discovered pack files:', discoveredFiles);
          }
        }
        
        // After successful fetch, reload cached packs to ensure all are properly registered
        await questionPackManager.loadCachedPacks();
        this.updateCategorySelector();
        this.showGitLabStatus('✅ Packs loaded automatically!', 'success');
      } catch (fetchError) {
        console.error('[autoLoadPacks] Error fetching from GitLab:', fetchError);
        // Token might be expired, but cached packs should still work
        // Always try to load cached packs even if fetch failed
        try {
          await questionPackManager.loadCachedPacks();
          this.updateCategorySelector();
          
          // Check if we have any secure packs loaded
          const mergedQuestions = questionPackManager.getMergedQuestions();
          const secureCategories = Object.keys(mergedQuestions).filter(cat => {
            const questions = mergedQuestions[cat] || [];
            if (questions.length === 0) return false;
            const packId = questions[0].packId;
            const pack = questionPackManager.getPackMetadata(packId);
            return pack && pack.packSource === 'api';
          });
          
          if (secureCategories.length === 0) {
            // No secure packs loaded - show error
            this.showGitLabStatus(`⚠️ Could not load secure packs: ${fetchError.message}. Please try authenticating again.`, 'warning');
          } else {
            // Have cached packs - show warning
            this.showGitLabStatus('⚠️ Using cached secure packs. Some packs may be outdated.', 'warning');
          }
        } catch (cacheError) {
          console.error('[autoLoadPacks] Error loading cached packs:', cacheError);
          this.showGitLabStatus(`❌ Error loading packs: ${fetchError.message}`, 'error');
        }
      }
    } catch (error) {
      console.error('[autoLoadPacks] Unexpected error:', error);
      // Try to load cached packs anyway
      try {
        await questionPackManager.loadCachedPacks();
        this.updateCategorySelector();
      } catch (cacheError) {
        console.error('[autoLoadPacks] Error loading cached packs:', cacheError);
      }
    }
  }

  /**
   * Show GitLab status message
   */
  showGitLabStatus(message, type) {
    const statusDiv = document.getElementById('gitlab-status');
    if (!statusDiv) return;
    
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    // Set color based on type
    if (type === 'success') {
      statusDiv.style.backgroundColor = 'var(--success-bg, #d4edda)';
      statusDiv.style.color = 'var(--success-text, #155724)';
      statusDiv.style.borderColor = 'var(--success-border, #c3e6cb)';
    } else if (type === 'error') {
      statusDiv.style.backgroundColor = 'var(--error-bg, #f8d7da)';
      statusDiv.style.color = 'var(--error-text, #721c24)';
      statusDiv.style.borderColor = 'var(--error-border, #f5c6cb)';
    } else {
      statusDiv.style.backgroundColor = 'var(--info-bg, #d1ecf1)';
      statusDiv.style.color = 'var(--info-text, #0c5460)';
      statusDiv.style.borderColor = 'var(--info-border, #bee5eb)';
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

