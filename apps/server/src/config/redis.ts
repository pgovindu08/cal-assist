import { env } from './env';

let redis: {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number }) => Promise<unknown>;
  del: (key: string) => Promise<number>;
} | null = null;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export { redis };

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    if (!redis) return;
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  },

  async del(key: string): Promise<void> {
    if (!redis) return;
    await redis.del(key);
  },
};
