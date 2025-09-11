import { createClient, RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient: RedisClientType = createClient({
    url: REDIS_URL,
});

redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err);
});
redisClient.on("connect", () => {
    console.log("✅ Redis connected");
});

export async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
}