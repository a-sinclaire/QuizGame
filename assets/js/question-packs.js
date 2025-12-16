// Question Pack Manager
// Handles loading questions from multiple sources:
// 1. Built-in packs (bundled with app)
// 2. Secure API packs (from authenticated endpoint)
// 3. Custom packs (uploaded by users, stored locally)

import { storageManager } from './storage.js';

class QuestionPackManager {
  constructor() {
    this.builtInPacks = new Map(); // packId -> questions
    this.securePacks = new Map();  // packId -> questions (from API)
    this.customPacks = new Map();  // packId -> questions (uploaded)
    this.packMetadata = new Map(); // packId -> metadata
  }

  /**
   * Register a built-in question pack
   * @param {string} packId - Unique pack identifier
   * @param {string} packName - Display name
   * @param {Object} questions - Question registry object (category -> questions[])
   * @param {Object} metadata - Optional metadata (author, contactEmail, etc.)
   */
  registerBuiltInPack(packId, packName, questions, metadata = {}) {
    this.builtInPacks.set(packId, questions);
    
    // Add pack metadata to all questions
    for (const categoryQuestions of Object.values(questions)) {
      if (Array.isArray(categoryQuestions)) {
        categoryQuestions.forEach(q => {
          q.packId = packId;
          q.packSource = 'builtin';
        });
      } else if (categoryQuestions.questions) {
        categoryQuestions.questions.forEach(q => {
          q.packId = packId;
          q.packSource = 'builtin';
        });
      }
    }
    
    this.packMetadata.set(packId, {
      packId,
      packName,
      packSource: 'builtin',
      packVersion: metadata.packVersion || '1.0.0',
      questionCount: this.countQuestions(questions),
      enabled: true,
      author: metadata.author || null,
      contactEmail: metadata.contactEmail || null
    });
  }

  /**
   * Load a question pack from a secure API endpoint
   * @param {string} apiUrl - API endpoint URL
   * @param {string} authToken - Authentication token
   * @param {string} packId - Pack identifier to fetch
   * @returns {Promise<Object>} Pack data
   */
  async loadSecurePack(apiUrl, authToken, packId) {
    try {
      const response = await fetch(`${apiUrl}/packs/${packId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load pack: ${response.statusText}`);
      }

      const packData = await response.json();
      this.validatePackStructure(packData);
      
      // Store in secure packs
      this.securePacks.set(packId, packData.categories);
      this.packMetadata.set(packId, {
        ...packData.metadata,
        packId,
        packSource: 'api',
        enabled: true,
        author: packData.metadata?.author || null,
        contactEmail: packData.metadata?.contactEmail || null
      });

      // Cache in IndexedDB with expiration
      await this.cachePack(packId, packData, 'api');

      return packData;
    } catch (error) {
      console.error('Error loading secure pack:', error);
      throw error;
    }
  }

  /**
   * Load a question pack from GitLab private repository
   * @param {string} gitlabUrl - GitLab instance URL (e.g., https://gitlab.cee.redhat.com)
   * @param {string} repoPath - Repository path (e.g., username/repo-name or group/repo-name)
   * @param {string} token - GitLab personal access token
   * @param {string|Array<string>} packFiles - Path(s) to pack JSON file(s) in repository
   * @returns {Promise<Object|Array<Object>>} Pack data or array of pack data
   */
  async loadFromGitLab(gitlabUrl, repoPath, token, packFiles) {
    const files = Array.isArray(packFiles) ? packFiles : [packFiles];
    const loadedPacks = [];

    for (const packFile of files) {
      try {
        // Encode repository path and file path for URL
        const encodedRepoPath = encodeURIComponent(repoPath);
        const encodedFilePath = encodeURIComponent(packFile);
        
        // GitLab API endpoint for raw file content
        const fileUrl = `${gitlabUrl}/api/v4/projects/${encodedRepoPath}/repository/files/${encodedFilePath}/raw`;
        
        const response = await fetch(fileUrl, {
          headers: {
            'PRIVATE-TOKEN': token
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(`Unauthorized: Invalid GitLab token or insufficient permissions for ${packFile}`);
          }
          if (response.status === 404) {
            throw new Error(`Not found: Pack file ${packFile} not found in repository or you don't have access`);
          }
          throw new Error(`Failed to load pack ${packFile}: ${response.status} ${response.statusText}`);
        }

        const packData = await response.json();
        this.validatePackStructure(packData);
        
        const packId = packData.packId || `gitlab-${Date.now()}`;
        
        // Store in secure packs (from API)
        this.securePacks.set(packId, packData.categories);
        this.packMetadata.set(packId, {
          ...packData.metadata,
          packId,
          packSource: 'api',
          enabled: true,
          author: packData.metadata?.author || null,
          contactEmail: packData.metadata?.contactEmail || null,
          gitlabRepo: repoPath,
          gitlabFile: packFile
        });

        // Cache in IndexedDB with expiration (7 days)
        await this.cachePack(packId, packData, 'api');

        loadedPacks.push(packData);
      } catch (error) {
        // Only log non-401/403 errors (401/403 are expected when token expires)
        if (!error.message.includes('Unauthorized') && !error.message.includes('403')) {
          console.error(`Error loading pack ${packFile} from GitLab:`, error);
        }
        throw error;
      }
    }

    return files.length === 1 ? loadedPacks[0] : loadedPacks;
  }

  /**
   * Load a custom question pack from uploaded file
   * @param {File} file - Uploaded JSON file
   * @returns {Promise<Object>} Pack data
   */
  async loadCustomPack(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const packData = JSON.parse(e.target.result);
          this.validatePackStructure(packData);
          
          const packId = packData.packId || `custom-${Date.now()}`;
          
          // Store in custom packs
          this.customPacks.set(packId, packData.categories);
          this.packMetadata.set(packId, {
            ...packData.metadata,
            packId,
            packSource: 'upload',
            enabled: true,
            author: packData.metadata?.author || null,
            contactEmail: packData.metadata?.contactEmail || null
          });

          // Store in IndexedDB
          await this.cachePack(packId, packData, 'upload');

          resolve(packData);
        } catch (error) {
          reject(new Error(`Invalid pack file: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Validate question pack structure
   * @param {Object} packData - Pack data to validate
   * @throws {Error} If structure is invalid
   */
  validatePackStructure(packData) {
    if (!packData.packId || !packData.packName) {
      throw new Error('Pack must have packId and packName');
    }

    if (!packData.categories || typeof packData.categories !== 'object') {
      throw new Error('Pack must have categories object');
    }

    // Validate metadata if present
    if (packData.metadata) {
      if (packData.metadata.contactEmail && !this.isValidEmail(packData.metadata.contactEmail)) {
        throw new Error('Invalid contact email format');
      }
    }

    // Validate each category has questions array
    for (const [categoryId, categoryData] of Object.entries(packData.categories)) {
      if (!categoryData.questions || !Array.isArray(categoryData.questions)) {
        throw new Error(`Category ${categoryId} must have questions array`);
      }

      // Validate question structure and add pack metadata
      for (const question of categoryData.questions) {
        this.validateQuestion(question);
        // Add pack metadata to question for tracking
        question.packId = packData.packId;
        question.packSource = packData.packSource || 'upload';
      }
    }
  }

  /**
   * Simple email validation
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate a single question structure
   * @param {Object} question - Question to validate
   * @throws {Error} If question is invalid
   */
  validateQuestion(question) {
    const required = ['id', 'question', 'options', 'correctIndex', 'category', 'difficulty', 'points'];
    for (const field of required) {
      if (!(field in question)) {
        throw new Error(`Question missing required field: ${field}`);
      }
    }

    if (!Array.isArray(question.options) || question.options.length < 2) {
      throw new Error('Question must have at least 2 options');
    }

    if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
      throw new Error('correctIndex must be valid option index');
    }

    if (!['easy', 'medium', 'hard'].includes(question.difficulty)) {
      throw new Error('difficulty must be easy, medium, or hard');
    }
  }

  /**
   * Get all questions from enabled packs, merged by category
   * Only includes secure packs if user is authenticated
   * @returns {Object} Merged question registry (category -> questions[])
   */
  getMergedQuestions() {
    const merged = {};
    const isAuthenticated = this.checkAuthentication();

    // Helper to merge questions into registry
    const mergePack = (packCategories) => {
      if (!packCategories || typeof packCategories !== 'object') {
        console.warn('Invalid packCategories structure:', packCategories);
        return;
      }
      
      for (const [categoryId, categoryData] of Object.entries(packCategories)) {
        if (!merged[categoryId]) {
          merged[categoryId] = [];
        }
        
        // Handle different pack structures
        let questions = [];
        if (Array.isArray(categoryData)) {
          // If categoryData is already an array of questions
          questions = categoryData;
        } else if (categoryData && Array.isArray(categoryData.questions)) {
          // If categoryData has a questions property (standard structure)
          questions = categoryData.questions;
        } else {
          console.warn(`Invalid category structure for ${categoryId}:`, categoryData);
          continue;
        }
        
        // Ensure questions is an array before spreading
        if (Array.isArray(questions) && questions.length > 0) {
          merged[categoryId].push(...questions);
        }
      }
    };

    // Merge built-in packs (always available)
    for (const [packId, packCategories] of this.builtInPacks) {
      const metadata = this.packMetadata.get(packId);
      if (metadata && metadata.enabled) {
        mergePack(packCategories);
      }
    }

    // Merge secure packs (only if authenticated)
    if (isAuthenticated) {
      for (const [packId, packCategories] of this.securePacks) {
        const metadata = this.packMetadata.get(packId);
        if (metadata && metadata.enabled) {
          mergePack(packCategories);
        }
      }
    }

    // Merge custom packs (always available - user uploaded)
    for (const [packId, packCategories] of this.customPacks) {
      const metadata = this.packMetadata.get(packId);
      if (metadata && metadata.enabled) {
        mergePack(packCategories);
      }
    }

    return merged;
  }

  /**
   * Get all available categories from all enabled packs
   * @returns {Array} Array of category names
   */
  getMergedCategories() {
    const mergedQuestions = this.getMergedQuestions();
    return Object.keys(mergedQuestions);
  }

  /**
   * Get a question by its ID from any enabled pack
   * @param {string} questionId - Question ID
   * @returns {Object|null} Question object or null if not found
   */
  getQuestionById(questionId) {
    const mergedQuestions = this.getMergedQuestions();
    for (const categoryQuestions of Object.values(mergedQuestions)) {
      const found = categoryQuestions.find(q => q.id === questionId);
      if (found) return found;
    }
    return null;
  }

  /**
   * Get all pack metadata
   * @returns {Array} Array of pack metadata objects
   */
  getAllPackMetadata() {
    return Array.from(this.packMetadata.values());
  }

  /**
   * Get pack metadata by pack ID
   * @param {string} packId - Pack identifier
   * @returns {Object|null} Pack metadata or null
   */
  getPackMetadata(packId) {
    return this.packMetadata.get(packId) || null;
  }

  /**
   * Enable or disable a pack
   * @param {string} packId - Pack identifier
   * @param {boolean} enabled - Enable/disable flag
   */
  setPackEnabled(packId, enabled) {
    const metadata = this.packMetadata.get(packId);
    if (metadata) {
      metadata.enabled = enabled;
      this.packMetadata.set(packId, metadata);
      // Persist preference
      storageManager.savePackPreference(packId, enabled);
    }
  }

  /**
   * Remove a custom pack
   * @param {string} packId - Pack identifier
   */
  async removeCustomPack(packId) {
    const metadata = this.packMetadata.get(packId);
    if (metadata && metadata.packSource === 'upload') {
      this.customPacks.delete(packId);
      this.packMetadata.delete(packId);
      await this.removeCachedPack(packId);
      storageManager.removePackPreference(packId);
    }
  }

  /**
   * Count total questions in a pack
   * @param {Object} categories - Categories object
   * @returns {number} Total question count
   */
  countQuestions(categories) {
    let count = 0;
    for (const categoryData of Object.values(categories)) {
      if (categoryData.questions) {
        count += categoryData.questions.length;
      }
    }
    return count;
  }

  /**
   * Cache a pack in IndexedDB
   * @param {string} packId - Pack identifier
   * @param {Object} packData - Pack data
   * @param {string} source - Source type ('api' or 'upload')
   */
  async cachePack(packId, packData, source) {
    try {
      const cacheData = {
        packId,
        packData,
        source,
        cachedAt: Date.now(),
        expiresAt: source === 'api' ? Date.now() + (7 * 24 * 60 * 60 * 1000) : null // 7 days for API packs
      };
      await storageManager.saveCachedPack(packId, cacheData);
    } catch (error) {
      console.warn('Failed to cache pack:', error);
    }
  }

  /**
   * Remove cached pack from IndexedDB
   * @param {string} packId - Pack identifier
   */
  async removeCachedPack(packId) {
    try {
      await storageManager.removeCachedPack(packId);
    } catch (error) {
      console.warn('Failed to remove cached pack:', error);
    }
  }

  /**
   * Load cached packs from storage on startup
   * Only loads secure/API packs if user is authenticated
   */
  async loadCachedPacks() {
    try {
      const cachedPacksObj = storageManager.getCachedPacks();
      
      // cachedPacksObj is an object (packId -> cacheData), convert to array
      const cachedPacks = Object.entries(cachedPacksObj).map(([packId, cached]) => ({
        packId,
        ...cached
      }));
      
      // Check if user is authenticated (for secure packs)
      const isAuthenticated = this.checkAuthentication();
      
      for (const cached of cachedPacks) {
        // Check expiration for API packs
        if (cached.expiresAt && Date.now() > cached.expiresAt) {
          await this.removeCachedPack(cached.packId);
          continue;
        }

        // For secure/API packs, only load if authenticated
        if (cached.source === 'api' && !isAuthenticated) {
          // Don't load secure packs if not authenticated
          // Don't even keep metadata - completely hide them
          continue;
        }

        const packData = cached.packData;
        this.validatePackStructure(packData);

        if (cached.source === 'api') {
          // Only load secure packs if authenticated
          if (isAuthenticated) {
            this.securePacks.set(cached.packId, packData.categories);
            this.packMetadata.set(cached.packId, {
              ...packData.metadata,
              packId: cached.packId,
              packSource: cached.source,
              enabled: storageManager.getPackPreference(cached.packId) !== false
            });
          }
          // If not authenticated, skip entirely (already handled above)
        } else if (cached.source === 'upload') {
          this.customPacks.set(cached.packId, packData.categories);
          this.packMetadata.set(cached.packId, {
            ...packData.metadata,
            packId: cached.packId,
            packSource: cached.source,
            enabled: storageManager.getPackPreference(cached.packId) !== false
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load cached packs:', error);
    }
  }

  /**
   * Check if user is authenticated (has GitLab OAuth token)
   * @returns {boolean} True if authenticated
   */
  checkAuthentication() {
    if (typeof window === 'undefined') return false;
    
    // Check for GitLab OAuth token in sessionStorage
    // Use the same keys as GitLabOAuth class
    const token = sessionStorage.getItem('gitlab_oauth_token');
    const expiry = sessionStorage.getItem('gitlab_token_expiry');
    
    if (!token || !expiry) {
      return false;
    }
    
    // Check if token expired (with 5 minute buffer)
    if (Date.now() > parseInt(expiry) - 5 * 60 * 1000) {
      return false;
    }
    
    return true;
  }
}

export const questionPackManager = new QuestionPackManager();

