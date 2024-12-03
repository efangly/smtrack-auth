import { CacheModuleAsyncOptions } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-store";

export const RedisOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  useFactory: async () => {
    const store = await redisStore({
      socket: {
        host: process.env.RADIS_HOST,
        port: Number(process.env.RADIS_PORT),
        passphrase: process.env.RADIS_PASSWORD,
      },
      ttl: 60,
    });
    return {
      store: () => store,
    };
  },
};