const NodeCache = require('node-cache');

class CacheManager {
    constructor(options = {}) {
        this.cache = new NodeCache({
            stdTTL: options.ttl || 300, // Default TTL: 5 minutes
            checkperiod: options.checkperiod || 60, // Cleanup every 1 minute
            maxKeys: options.maxKeys || -1, // No limit by default
            useClones: false
        });

        this.cache.on('expired', (key, value) => {
            if (this.onExpired) {
                this.onExpired(key, value);
            }
        });

        this.cache.on('error', (err) => {
            if (this.onError) {
                this.onError(err);
            }
        });
    }

    get(key, logger) {
        try {
            const value = this.cache.get(key);
            if (value === undefined) {
                logger.debug(`Cache miss for key: ${key}`);
                return null;
            }
            logger.debug(`Cache hit for key: ${key}`);
            return value;
        } catch (error) {
            logger.error(`Error getting cache key: ${key}`, error);
            return null;
        }
    }

    set(key, value, ttl = undefined, logger) {
        try {
            const success = this.cache.set(key, value, ttl);
            if (!success) {
                logger.warn(`Failed to set cache key: ${key}`);
                return false;
            }
            logger.debug(`Successfully set cache key: ${key}`);
            return true;
        } catch (error) {
            logger.error(`Error setting cache key: ${key}`, error);
            return false;
        }
    }

    del(key, logger) {
        try {
            const count = this.cache.del(key);
            logger.debug(`Deleted ${count} keys from cache`);
            return count > 0;
        } catch (error) {
            logger.error(`Error deleting cache key: ${key}`, error);
            return false;
        }
    }

    flush(logger) {
        try {
            this.cache.flushAll();
            logger.info('Cache flushed successfully');
            return true;
        } catch (error) {
            logger.error('Error flushing cache', error);
            return false;
        }
    }

    getStats() {
        return this.cache.getStats();
    }

    setOnExpired(callback) {
        this.onExpired = callback;
    }

    setOnError(callback) {
        this.onError = callback;
    }
}

module.exports = CacheManager;