const axios = require("axios");
const CacheManager = require("./cacheManager");

class ConfigInterface {
  constructor() {
    this.cacheManager = new CacheManager({
      ttl: process.env.CONFIG_CACHE_TTL || 300, // 5 minutes default
      maxKeys: process.env.CONFIG_CACHE_MAX_KEYS || 1000,
      checkperiod: 60
    });

    this.cacheManager.setOnExpired((key, value) => {
      // Optionally implement background refresh on expiry
      this.refreshConfig(key).catch(() => {});
    });

    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 5000
    };
  }

  async getInterfaceMappingConfig(path, logger) {
    try {
      // Try to get from cache first
      const cachedConfig = this.cacheManager.get(path, logger);
      if (cachedConfig) {
        return cachedConfig;
      }

      // If not in cache, fetch from server with retry mechanism
      const config = await this.fetchConfigWithRetry(path, logger);
      return config;
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
      const response = await axios.get(process.env.configServerUrl + path, {
        timeout: this.retryConfig.timeout
      });

      // Cache the successful response
      const success = this.cacheManager.set(path, response.data, undefined, logger);
      if (!success) {
        logger.warn("Failed to cache config", { path });
      }

      logger.info("InterfaceMappingConfig retrieved", {
        path,
        attempt,
        cacheStatus: success ? "cached" : "not-cached"
      });

      return response.data;
    } catch (error) {
      if (attempt < this.retryConfig.maxRetries) {
        logger.warn("Retrying config fetch", {
          path,
          attempt,
          error: error.message
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
    try {
      const logger = require("./logger"); // Assuming there's a logger module
      await this.fetchConfigWithRetry(path, logger);
    } catch (error) {
      // Silent fail for background refresh
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