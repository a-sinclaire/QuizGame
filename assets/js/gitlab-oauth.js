// GitLab OAuth Manager
// Handles OAuth authentication flow using PKCE (Proof Key for Code Exchange)

class GitLabOAuth {
  constructor(gitlabUrl, oauthAppId) {
    this.gitlabUrl = gitlabUrl;
    this.oauthAppId = oauthAppId;
    this.tokenStorageKey = 'gitlab_oauth_token';
    this.tokenExpiryKey = 'gitlab_token_expiry';
    this.codeVerifierKey = 'gitlab_code_verifier';
  }

  /**
   * Generate random string for PKCE
   * @param {number} length - Length of string
   * @returns {string} Random string
   */
  generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    return result;
  }

  /**
   * Generate code challenge from verifier (SHA256)
   * @param {string} verifier - Code verifier
   * @returns {Promise<string>} Base64URL encoded challenge
   */
  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Start OAuth flow - redirect to GitLab
   */
  async startAuthFlow() {
    // Generate PKCE code verifier and challenge
    const codeVerifier = this.generateRandomString(128);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    
    // Store verifier for later use
    sessionStorage.setItem(this.codeVerifierKey, codeVerifier);
    
    // Build authorization URL
    const redirectUri = `${window.location.origin}${window.location.pathname.replace(/index\.html$/, '')}oauth-callback.html`;
    const params = new URLSearchParams({
      client_id: this.oauthAppId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'api read_repository', // Full API access (includes write) + repository read access
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    const authUrl = `${this.gitlabUrl}/oauth/authorize?${params}`;
    
    // Redirect to GitLab
    window.location.href = authUrl;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   * @param {string} codeVerifier - PKCE code verifier
   * @returns {Promise<string>} Access token
   */
  async exchangeCodeForToken(code, codeVerifier) {
    // Use the same redirect URI that was used in the authorization request
    // This should match what's configured in GitLab OAuth app settings
    // Get from sessionStorage if available (set during auth flow), otherwise construct
    const redirectUri = sessionStorage.getItem('gitlab_redirect_uri') || 
                       `${window.location.origin}${window.location.pathname}`;
    
    try {
      const response = await fetch(`${this.gitlabUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.oauthAppId,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Token exchange failed: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error_description || errorJson.error || errorMessage;
        } catch {
          errorMessage = `${errorMessage}\n${errorText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      // Check for CORS or network errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        const corsError = new Error(
          'CORS error: Unable to connect to GitLab. This may be due to:\n' +
          '1. GitLab CORS settings not allowing requests from GitHub Pages\n' +
          '2. Network/firewall restrictions\n' +
          '3. Redirect URI mismatch in GitLab OAuth app configuration\n\n' +
          `Current redirect URI: ${redirectUri}\n` +
          'Please ensure this exact URI is registered in your GitLab OAuth application settings.'
        );
        corsError.originalError = error;
        throw corsError;
      }
      throw error;
    }
  }

  /**
   * Get stored access token
   * @returns {string|null} Access token or null
   */
  getStoredToken() {
    const token = sessionStorage.getItem(this.tokenStorageKey);
    const expiry = sessionStorage.getItem(this.tokenExpiryKey);
    
    if (!token || !expiry) {
      return null;
    }
    
    // Check if token expired (with 5 minute buffer)
    if (Date.now() > parseInt(expiry) - 5 * 60 * 1000) {
      this.clearToken();
      return null;
    }
    
    return token;
  }

  /**
   * Store access token
   * @param {string} token - Access token
   * @param {number} expiresIn - Expiration time in seconds
   */
  storeToken(token, expiresIn = 7200) {
    sessionStorage.setItem(this.tokenStorageKey, token);
    const expiry = Date.now() + (expiresIn * 1000);
    sessionStorage.setItem(this.tokenExpiryKey, expiry.toString());
  }

  /**
   * Clear stored token
   */
  clearToken() {
    sessionStorage.removeItem(this.tokenStorageKey);
    sessionStorage.removeItem(this.tokenExpiryKey);
    sessionStorage.removeItem(this.codeVerifierKey);
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return this.getStoredToken() !== null;
  }

  /**
   * Get current user info from GitLab
   * @returns {Promise<Object>} User info
   */
  async getCurrentUser() {
    const token = this.getStoredToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.gitlabUrl}/api/v4/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return await response.json();
  }

  /**
   * Check if user is member of a GitLab group
   * @param {string} groupPath - Group path (e.g., 'app-sre')
   * @returns {Promise<boolean>} True if member
   */
  async isGroupMember(groupPath) {
    try {
      const token = this.getStoredToken();
      if (!token) {
        return false;
      }

      const response = await fetch(`${this.gitlabUrl}/api/v4/groups/${encodeURIComponent(groupPath)}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const members = await response.json();
      const currentUser = await this.getCurrentUser();
      
      return members.some(member => member.id === currentUser.id);
    } catch (error) {
      console.error('Error checking group membership:', error);
      return false;
    }
  }
}

export { GitLabOAuth };

