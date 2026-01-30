import { LRUCache } from 'lru-cache';

export interface KeyboardMonitorConfig {
  debounceMs: number;
  minContextLength: number;
  onSuggestionReady: (suggestion: string, context: string) => void;
  onClear: () => void;
  onBufferUpdate?: (buffer: string) => void;
  getSuggestion: (context: string, signal: AbortSignal) => Promise<string>;
}

export interface AutoTriggerConfig {
  enabled: boolean;
  delayMs: number; // Default 3000ms
}

export class KeyboardMonitor {
  private buffer = '';
  private debounceTimer: NodeJS.Timeout | null = null;
  private autoTriggerTimer: NodeJS.Timeout | null = null;
  private abortController = new AbortController();
  private cache = new LRUCache<string, string>({ max: 25 });
  private config: KeyboardMonitorConfig;
  private currentSuggestion = '';
  private autoTriggerConfig: AutoTriggerConfig = {
    enabled: false,
    delayMs: 3000, // Default 3 seconds like Kilo Code
  };
  
  constructor(config: KeyboardMonitorConfig) {
    this.config = config;
  }

  /**
   * Set auto-trigger configuration.
   */
  setAutoTriggerConfig(config: Partial<AutoTriggerConfig>): void {
    this.autoTriggerConfig = { ...this.autoTriggerConfig, ...config };
    console.log('[KeyboardMonitor] Auto-trigger config updated:', this.autoTriggerConfig);
    
    // If disabled, clear any pending auto-trigger
    if (!this.autoTriggerConfig.enabled) {
      this.clearAutoTriggerTimer();
    }
  }

  /**
   * Get current auto-trigger configuration.
   */
  getAutoTriggerConfig(): AutoTriggerConfig {
    return { ...this.autoTriggerConfig };
  }

  /**
   * Append a character to the buffer (used for real-time keystroke capture).
   * This resets the auto-trigger debounce timer.
   */
  appendCharacter(char: string, isBackspace: boolean = false): void {
    // Hide current suggestion when user continues typing
    if (this.currentSuggestion) {
      this.config.onClear();
      this.currentSuggestion = '';
    }

    if (isBackspace) {
      // Remove last character
      this.buffer = this.buffer.slice(0, -1);
    } else {
      // Append character
      this.buffer += char;
    }
    
    this.config.onBufferUpdate?.(this.buffer);
    
    // Reset auto-trigger timer on each keystroke
    if (this.autoTriggerConfig.enabled) {
      this.resetAutoTriggerTimer();
    }
  }

  /**
   * Reset the auto-trigger debounce timer.
   * Called on each keystroke to wait for pause.
   */
  private resetAutoTriggerTimer(): void {
    this.clearAutoTriggerTimer();
    
    if (this.buffer.length >= this.config.minContextLength) {
      this.autoTriggerTimer = setTimeout(() => {
        console.log('[KeyboardMonitor] Auto-trigger firing after', this.autoTriggerConfig.delayMs, 'ms pause');
        this.fetchSuggestion();
      }, this.autoTriggerConfig.delayMs);
    }
  }

  /**
   * Clear the auto-trigger timer.
   */
  private clearAutoTriggerTimer(): void {
    if (this.autoTriggerTimer) {
      clearTimeout(this.autoTriggerTimer);
      this.autoTriggerTimer = null;
    }
  }
  

  setContext(context: string, immediate: boolean = false): void {
    this.buffer = context;
    this.config.onBufferUpdate?.(this.buffer);
    
    // Clear previous timer and abort pending requests
    this.clearTimerAndAbort();
    this.clearAutoTriggerTimer();
    
    // Start new debounce timer or fetch immediately
    if (this.buffer.length >= this.config.minContextLength) {
      if (immediate) {
        this.fetchSuggestion();
      } else {
        this.debounceTimer = setTimeout(
          () => this.fetchSuggestion(),
          this.config.debounceMs
        );
      }
    }
  }

  async triggerSuggestion(): Promise<void> {
    if (this.buffer.length >= this.config.minContextLength) {
      await this.fetchSuggestion();
    }
  }

  private async fetchSuggestion(): Promise<void> {
    const context = this.buffer;
    
    if (context.length < this.config.minContextLength) {
      return;
    }
    
    // Check cache first
    const cached = this.cache.get(context);
    if (cached) {
      console.log('[KeyboardMonitor] Cache hit for:', context.slice(0, 30));
      this.currentSuggestion = cached;
      this.config.onSuggestionReady(cached, context);
      return;
    }

    // Create new abort controller for this request
    this.abortController = new AbortController();
    
    try {
      console.log('[KeyboardMonitor] Fetching suggestion for:', context.slice(0, 50));
      
      const suggestion = await this.config.getSuggestion(
        context,
        this.abortController.signal
      );
      
      // Validate context hasn't changed during fetch
      if (this.buffer !== context) {
        console.log('[KeyboardMonitor] Context changed during fetch, discarding');
        return;
      }
      
      if (suggestion && suggestion.length > 0) {
        this.cache.set(context, suggestion);
        this.currentSuggestion = suggestion;
        this.config.onSuggestionReady(suggestion, context);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('[KeyboardMonitor] Request aborted');
      } else {
        console.error('[KeyboardMonitor] Error fetching suggestion:', error);
      }
    }
  }

  private clearTimerAndAbort(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.abortController.abort();
  }

  clearBuffer(): void {
    this.buffer = '';
    this.currentSuggestion = '';
    this.clearAutoTriggerTimer();
    this.config.onBufferUpdate?.('');
    // Note: Don't call onClear() here - main.ts handles overlay hiding separately
  }

  getCurrentSuggestion(): string {
    return this.currentSuggestion;
  }

  getBuffer(): string {
    return this.buffer;
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}
