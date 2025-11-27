// Simple in-memory cache for frequently accessed data (FREE - no Redis needed)
// For production with multiple servers, consider upgrading to Redis

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class InMemoryCache {
  private store: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.store = new Map();
    
    // Cleanup expired entries every 2 minutes for better memory management at scale
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { data, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    
    return true;
  }

  getStats(): { size: number; keys: string[] } {
    this.cleanup(); // Clean before returning stats
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Global singleton instance
const globalForCache = global as unknown as { cache: InMemoryCache };

export const cache = 
  globalForCache.cache || new InMemoryCache();

if (process.env.NODE_ENV !== 'production') {
  globalForCache.cache = cache;
}

// Cache key helpers
export const CACHE_KEYS = {
  SCHOOLS_ALL: 'schools:all',
  SCHOOLS_BY_LGA: (lgaCode: string) => `schools:lga:${lgaCode}`,
  SCHOOL_BY_CODE: (lgaCode: string, schoolCode: string) => 
    `schools:${lgaCode}:${schoolCode}`,
  STATS: 'stats:all',
  LGA_STATS: 'stats:lga',
};

// Common TTL values
export const CACHE_TTL = {
  SHORT: 60 * 1000,        // 1 minute
  MEDIUM: 5 * 60 * 1000,   // 5 minutes
  LONG: 30 * 60 * 1000,    // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
};
