import { LRUCache } from 'lru-cache';

export interface KeyboardMonitorConfig {
  debounceMs: number;
  minContextLength: number;
  onSuggestionReady: (suggestion: string, context: string) => void;
  onClear: () => void;
  onBufferUpdate?: (buffer: string) => void;
  getSuggestion: (context: string, signal: AbortSignal) => Promise<string>;
}

export class KeyboardMonitor {
  private buffer = '';
  private debounceTimer: NodeJS.Timeout | null = null;
  private abortController = new AbortController();
  private cache = new LRUCache<string, string>({ max: 25 });
  private config: KeyboardMonitorConfig;
  private currentSuggestion = '';
  
  constructor(config: KeyboardMonitorConfig) {
    this.config = config;
  }

  setContext(context: string): void {
    this.buffer = context;
    this.config.onBufferUpdate?.(this.buffer);
    
    // Clear previous timer and abort pending requests
    this.clearTimerAndAbort();
    
    // Start new debounce timer
    if (this.buffer.length >= this.config.minContextLength) {
      this.debounceTimer = setTimeout(
        () => this.fetchSuggestion(),
        this.config.debounceMs
      );
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
    this.config.onBufferUpdate?.('');
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
