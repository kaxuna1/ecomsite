import { createClient } from 'redis';
import { env } from '../config/env';

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let connectPromise: Promise<RedisClient | null> | null = null;

const buildRedisOptions = () => {
  if (env.redisUrl) {
    return { url: env.redisUrl };
  }

  if (!env.redisHost) {
    return null;
  }

  const socket: { host: string; port?: number; tls?: boolean } = {
    host: env.redisHost,
    port: env.redisPort ?? 6379
  };

  if (env.redisTls) {
    socket.tls = true;
  }

  const options: { socket: typeof socket; password?: string } = { socket };
  if (env.redisPassword) {
    options.password = env.redisPassword;
  }

  return options;
};

export async function getRedisClient(): Promise<RedisClient | null> {
  if (client) return client;

  const options = buildRedisOptions();
  if (!options) return null;

  if (!connectPromise) {
    connectPromise = (async () => {
      try {
        const newClient = createClient(options as any);
        newClient.on('error', (error) => {
          console.error('Redis error:', error);
        });
        await newClient.connect();
        client = newClient;
        return newClient;
      } catch (error) {
        console.error('Failed to connect to Redis:', error);
        connectPromise = null;
        return null;
      }
    })();
  }

  return connectPromise;
}
