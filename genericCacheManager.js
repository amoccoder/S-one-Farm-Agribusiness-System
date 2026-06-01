const redis = require('redis');

class GenericCacheManager {
    constructor(serviceName) {
        this.serviceName = serviceName;
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) return;

        try {
            this.client = redis.createClient({
                url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`,
                password: process.env.REDIS_PASSWORD || undefined
            });

            this.client.on('error', (err) => console.error(`${this.serviceName} Redis Client Error`, err));
            this.client.on('ready', () => {
                this.isConnected = true;
                console.log(`${this.serviceName}: Connected to Redis.`);
            });

            await this.client.connect();
        } catch (err) {
            console.error(`${this.serviceName}: Failed to connect to Redis`, err);
        }
    }

    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
            console.log(`${this.serviceName}: Disconnected from Redis.`);
        }
    }

    async get(key) {
        if (!this.isConnected) return null;
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key, value, ttlSeconds = 3600) {
        if (!this.isConnected) return;
        await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    }

    async del(key) {
        if (!this.isConnected) return;
        await this.client.del(key);
    }

    getStatus() {
        return {
            connected: this.isConnected,
            service: this.serviceName
        };
    }
}

module.exports = GenericCacheManager;