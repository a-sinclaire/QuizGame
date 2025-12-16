// Sound Manager - Handles all audio feedback using Web Audio API

export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.volume = 0.5; // Default volume (0.0 to 1.0)
    this.muted = false;
    this.enabled = true;
    
    // Initialize audio context on first user interaction (required by browsers)
    this.initialized = false;
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }

  /**
   * Play a tone with specified frequency and duration
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in milliseconds
   * @param {string} type - Waveform type ('sine', 'square', 'triangle', 'sawtooth')
   */
  playTone(frequency, duration = 200, type = 'sine') {
    if (!this.enabled || this.muted || !this.initialized) return;
    
    if (!this.audioContext) {
      this.init();
      if (!this.audioContext) return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Envelope: fade in and out for smoother sound
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.volume, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000);

    oscillator.start(now);
    oscillator.stop(now + duration / 1000);
  }

  /**
   * Play correct answer sound (pleasant ascending tones)
   */
  playCorrect() {
    if (!this.enabled || this.muted) return;
    
    // Play a pleasant ascending chord
    this.playTone(523.25, 100, 'sine'); // C5
    setTimeout(() => {
      this.playTone(659.25, 100, 'sine'); // E5
    }, 50);
    setTimeout(() => {
      this.playTone(783.99, 150, 'sine'); // G5
    }, 100);
  }

  /**
   * Play incorrect answer sound (low descending tone)
   */
  playIncorrect() {
    if (!this.enabled || this.muted) return;
    
    // Play a low descending tone
    this.playTone(220, 300, 'sawtooth'); // A3
    setTimeout(() => {
      this.playTone(196, 200, 'sawtooth'); // G3
    }, 200);
  }

  /**
   * Play timer warning sound (urgent beep)
   */
  playTimerWarning() {
    if (!this.enabled || this.muted) return;
    
    // Play urgent beeping sound
    this.playTone(800, 100, 'square');
    setTimeout(() => {
      this.playTone(800, 100, 'square');
    }, 150);
  }

  /**
   * Set volume (0.0 to 1.0)
   * @param {number} volume - Volume level
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    // Save to localStorage
    try {
      localStorage.setItem('quiz_volume', this.volume.toString());
    } catch (error) {
      console.warn('Could not save volume preference:', error);
    }
  }

  /**
   * Get current volume
   * @returns {number} Current volume (0.0 to 1.0)
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.muted = !this.muted;
    // Save to localStorage
    try {
      localStorage.setItem('quiz_muted', this.muted.toString());
    } catch (error) {
      console.warn('Could not save mute preference:', error);
    }
    return this.muted;
  }

  /**
   * Check if muted
   * @returns {boolean} Muted state
   */
  isMuted() {
    return this.muted;
  }

  /**
   * Load preferences from localStorage
   */
  loadPreferences() {
    try {
      const savedVolume = localStorage.getItem('quiz_volume');
      if (savedVolume !== null) {
        this.volume = parseFloat(savedVolume);
      }
      
      const savedMuted = localStorage.getItem('quiz_muted');
      if (savedMuted !== null) {
        this.muted = savedMuted === 'true';
      }
    } catch (error) {
      console.warn('Could not load sound preferences:', error);
    }
  }

  /**
   * Enable/disable sound effects
   * @param {boolean} enabled - Enable state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Check if sound is enabled
   * @returns {boolean} Enabled state
   */
  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

