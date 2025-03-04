const axios = require("axios");
const CacheManager = require("./cacheManager");

class ConfigInterface {
    constructor() {
        this.cacheManager = new CacheManager({
            ttl: process.env.CONFIG_CACHE_TTL || 300, // 5 minutes default
            maxKeys: process.env.CONFIG_CACHE_MAX_KEYS || 1000,
            checkperiod: 60
        });

        this.retryConfig = {
            maxRetries: process.env.CONFIG_MAX_RETRIES || 3,
            retryDelay: process.env.CONFIG_RETRY_DELAY || 1000,
        };

        this.cacheManager.setOnExpired((key, value) => {
            this.refreshConfig(key).catch(() => {});
        });
    }

    async getInterfaceMappingConfig(path, logger) {
        try {
            // Try to get from cache first
            const cachedConfig = this.cacheManager.get(path, logger);
            if (cachedConfig) {
                return cachedConfig;
            }

            // If not in cache, fetch from server
            return await this.fetchConfigWithRetry(path, logger);
        } catch (error) {
            logger.error("Failed to get interface mapping config", {
                path,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async fetchConfigWithRetry(path, logger, attempt = 1) {
        try {
            const response = await axios.get(process.env.configServerUrl + path);
            logger.info("InterfaceMappingConfig retrieved", { path });
            
            // Cache the successful response
            const cacheSuccess = this.cacheManager.set(path, response.data, undefined, logger);
            if (!cacheSuccess) {
                logger.warn("Failed to cache config", { path });
            }

            return response.data;
        } catch (error) {
            if (attempt < this.retryConfig.maxRetries) {
                logger.warn("Retrying config fetch", {
                    path,
                    attempt,
                    maxRetries: this.retryConfig.maxRetries
                });

                await new Promise(resolve => 
                    setTimeout(resolve, this.retryConfig.retryDelay * attempt)
                );

                return this.fetchConfigWithRetry(path, logger, attempt + 1);
            }

            throw error;
        }
    }

    async refreshConfig(path) {
        const logger = global.logger || console;
        try {
            await this.fetchConfigWithRetry(path, logger);
        } catch (error) {
            logger.error("Failed to refresh config", {
                path,
                error: error.message
            });
        }
    }

    getCacheStats() {
        return this.cacheManager.getStats();
    }

    invalidateCache(path, logger) {
        return this.cacheManager.del(path, logger);
    }

    flushCache(logger) {
        return this.cacheManager.flush(logger);
    }
}

module.exports = new ConfigInterface();