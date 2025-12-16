// Theme Manager - Handles theme switching

export class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.darkThemeLink = null;
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }
  
  /**
   * Initialize dark theme link reference
   */
  initDarkThemeLink() {
    if (!this.darkThemeLink) {
      this.darkThemeLink = document.getElementById('dark-theme');
    }
  }

  /**
   * Initialize theme manager
   */
  init() {
    this.initDarkThemeLink();
    // Load saved theme preference
    this.loadTheme();
    
    // Apply theme
    this.applyTheme(this.currentTheme);
  }

  /**
   * Load theme from localStorage
   */
  loadTheme() {
    try {
      const savedTheme = localStorage.getItem('quiz_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        this.currentTheme = savedTheme;
      } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          this.currentTheme = 'dark';
        }
      }
    } catch (error) {
      console.warn('Could not load theme preference:', error);
    }
  }

  /**
   * Apply theme
   * @param {string} theme - 'light' or 'dark'
   */
  applyTheme(theme) {
    this.currentTheme = theme;
    this.initDarkThemeLink();
    
    // Set data attribute on root element
    document.documentElement.setAttribute('data-theme', theme);
    
    // Enable/disable dark theme stylesheet
    if (this.darkThemeLink) {
      if (theme === 'dark') {
        this.darkThemeLink.media = 'all';
        console.log('Dark theme enabled');
      } else {
        this.darkThemeLink.media = 'none';
        console.log('Dark theme disabled');
      }
    } else {
      console.warn('Dark theme link not found');
    }
    
    // Save preference
    try {
      localStorage.setItem('quiz_theme', theme);
    } catch (error) {
      console.warn('Could not save theme preference:', error);
    }
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
    return newTheme;
  }

  /**
   * Get current theme
   * @returns {string} Current theme ('light' or 'dark')
   */
  getTheme() {
    return this.currentTheme;
  }
}

// Export singleton instance
export const themeManager = new ThemeManager();

