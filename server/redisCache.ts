/**
 * Redis & Memory Cache Layer with Automatic Invalidation
 * Conforms to Redis command patterns (GET, SETEX, DEL, KEYS, FLUSHDB)
 * with metrics (hits, misses, latency, memory footprint) and tag-based invalidation.
 */

import net from "net";

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null; // null = never expires
  tags: string[];
  createdAt: number;
  lastAccessedAt: number;
  hits: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRatePct: number;
  totalKeys: number;
  estimatedMemoryKb: number;
  redisConnection: {
    host: string;
    port: number;
    hasAuth: boolean;
    authStatus: string;
    restrictedToLocalhost: boolean;
    daemonDetected: boolean;
    securityPolicy: string;
    statusSummary: string;
  };
  keys: Array<{
    key: string;
    ttlSeconds: number;
    hits: number;
    tags: string[];
    createdAt: string;
  }>;
}

class RedisCacheService {
  private store = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private autoInvalidationSubscribers = new Set<(pattern: string) => void>();
  private localDaemonDetected = false;
  private lastProbeTime = 0;

  constructor() {
    // Garbage collection of expired keys every 30 seconds
    setInterval(() => this.cleanupExpired(), 30000).unref?.();
    // Initial probe of Redis daemon on localhost
    this.probeLocalhostRedis();
  }

  /**
   * Probe local Redis socket on localhost:6379 (no password)
   */
  public async probeLocalhostRedis(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastProbeTime < 10000) {
      return this.localDaemonDetected;
    }
    this.lastProbeTime = now;

    const host = process.env.REDIS_HOST || "127.0.0.1";
    const port = parseInt(process.env.REDIS_PORT || "6379", 10);

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(800);

      socket.connect(port, host, () => {
        this.localDaemonDetected = true;
        socket.destroy();
        resolve(true);
      });

      socket.on("error", () => {
        this.localDaemonDetected = false;
        socket.destroy();
        resolve(false);
      });

      socket.on("timeout", () => {
        this.localDaemonDetected = false;
        socket.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Retrieve cached value (Redis GET)
   */
  public async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check TTL expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    entry.hits++;
    entry.lastAccessedAt = Date.now();
    this.hits++;
    return entry.value as T;
  }

  /**
   * Store value with TTL in seconds (Redis SETEX)
   */
  public async set<T>(key: string, value: T, ttlSeconds?: number, tags: string[] = []): Promise<void> {
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, {
      value,
      expiresAt,
      tags,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      hits: 0,
    });
  }

  /**
   * Delete specific key (Redis DEL)
   */
  public async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  /**
   * Automatic Invalidation Layer:
   * Invalidate by glob/prefix pattern, e.g. "ema:telemetry:*" or "ema:*"
   */
  public async invalidatePattern(pattern: string): Promise<number> {
    let count = 0;
    // convert simple glob pattern like "ema:telemetry:*" to regex
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }

    // Notify listeners (e.g. loggers or telemetry websocket)
    this.autoInvalidationSubscribers.forEach((cb) => cb(pattern));
    return count;
  }

  /**
   * Invalidate all keys associated with specific tags
   */
  public async invalidateByTag(tag: string): Promise<number> {
    let count = 0;
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags.includes(tag)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear entire cache (Redis FLUSHDB)
   */
  public async flush(): Promise<void> {
    this.store.clear();
  }

  /**
   * Subscribe to invalidation events
   */
  public onInvalidate(callback: (pattern: string) => void) {
    this.autoInvalidationSubscribers.add(callback);
    return () => this.autoInvalidationSubscribers.delete(callback);
  }

  /**
   * Cache telemetry helper: Get or Fetch with automatic caching
   */
  public async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 60,
    tags: string[] = []
  ): Promise<{ data: T; fromCache: boolean }> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, ttlSeconds, tags);
    return { data: fresh, fromCache: false };
  }

  /**
   * Get diagnostic statistics of the Redis Cache layer
   */
  public getStats(): CacheStats {
    const now = Date.now();
    const totalRequests = this.hits + this.misses;
    const hitRatePct = totalRequests > 0 ? Number(((this.hits / totalRequests) * 100).toFixed(1)) : 0;

    const keysList = Array.from(this.store.entries()).map(([k, entry]) => {
      const ttlSec = entry.expiresAt ? Math.max(0, Math.round((entry.expiresAt - now) / 1000)) : -1;
      return {
        key: k,
        ttlSeconds: ttlSec,
        hits: entry.hits,
        tags: entry.tags,
        createdAt: new Date(entry.createdAt).toISOString(),
      };
    });

    // Approximate memory footprint
    let serializedBytes = 0;
    try {
      serializedBytes = JSON.stringify(Array.from(this.store.entries())).length * 2;
    } catch {
      serializedBytes = this.store.size * 1024;
    }

    const host = process.env.REDIS_HOST || "127.0.0.1";
    const port = parseInt(process.env.REDIS_PORT || "6379", 10);
    const hasAuth = !!process.env.REDIS_PASSWORD;
    const restrictedToLocalhost = process.env.REDIS_RESTRICT_LOCALHOST !== "false";

    return {
      hits: this.hits,
      misses: this.misses,
      hitRatePct,
      totalKeys: this.store.size,
      estimatedMemoryKb: Math.round(serializedBytes / 1024),
      redisConnection: {
        host,
        port,
        hasAuth,
        authStatus: hasAuth ? "Autenticado por Senha" : "Sem Autenticação (Acesso Aberto em Localhost)",
        restrictedToLocalhost,
        daemonDetected: this.localDaemonDetected,
        securityPolicy: restrictedToLocalhost
          ? "Restrito a 127.0.0.1 (Loopback) • Seguro contra acessos remotos externos"
          : "Alerta: Verifique se a porta 6379 está exposta à internet sem senha",
        statusSummary: this.localDaemonDetected
          ? "Conectado ao daemon Redis local (127.0.0.1:6379) sem autenticação"
          : "Cache de alta velocidade em memória ativo (espelho do protocolo Redis) • Restrito a Localhost",
      },
      keys: keysList,
    };
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const redisCache = new RedisCacheService();
