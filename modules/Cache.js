// /**
//  * Cache implementation.
//  * @module Cache
//  */

/**
 * Provides a suitable cache for Collatz Conjecture processing.
 * Builder version.
*/
export class CacheBuilder {
    /**
     * Requests a async cache.
     */
    async() {
        this._async = true;
        return this;
    }
    /**
     * Provides a shared buffer for cache object.
     * Only relevant when builder has a {@link CacheBuilder#async async} aspect.
     * @param {external:SharedArrayBuffer} sharedBuffer - Buffer shared across workers.
     */
    sharedBuffer(sharedBuffer) {
        this._sharedBuffer = sharedBuffer;
        return this;
    }
    /**
     * Build Cache object.
     * @param {number} size - Number entries allocated in cache.
     * @returns {Cache} Cache object.
     */
    build(size) {
        if(this.async && !this.sharedBuffer) {
            this.sharedBuffer = new SharedArrayBuffer((size + 1) * Int32Array.BYTES_PER_ELEMENT);
        }
        return CacheFactory.create({
            async: this._async,
            asyncBuffer: this._sharedBuffer,
            syncSize: size
        })
    }
}
/**
 * Provides a suitable cache for Collatz Conjecture processing.
 * Factory version.
 * @private
 */
class CacheFactory {
    /**
     * Provides a suitable {@link Cache}.
     * @param {Object} [options]
     * @param {boolean} [options.async] - Cache for Async Processing.
     * @param {external:SharedArrayBuffer} [options.asyncBuffer] - Shared buffer for Async. Required for Async processing.
     * @param {number} [options.syncSize] - Cache size. Required for Sync processing.
     * @returns {Cache} Cache object.
     */
    static create(options) {
        let iSize;
        if (options) {
            if (options.async) {
                return new CacheAsync(options.asyncBuffer);
            } else {
                iSize = options.syncSize;
            }
        }
        return new CacheSync(iSize);
    }
}
/**
 * Stores calculation about the number of existing terms for a value sequence.
 * (Dynamic Programming technique).
 * For the first positive integer 1 there is only one term: 1 itself.
 * This is the initial cache entry.
 * @interface
 */
export class Cache {
    /**
     * Read chain length for a number.
     * @param {number} number - Number.
     * @returns {number} Amount of terms in its chain. 
     */
    read(number) {
        throw new SyntaxError("Missing implementation");
    }
    /**
     * Stores amount of terms in a number's chain.
     * @param {number} number - Number.
     * @param {number} termsCount - Amount of terms in its chain.
     */
    store(number, termsCount) {
        throw new SyntaxError("Missing implementation");
    }
}
/**
 * Synchronous cache for Synchronous Collatz.
 * @implements {Cache}
 */
class CacheSync {
    /**
     * @constructor
     * @param {number} [size] - Initial cache size.
     */
    constructor(size) {
        let iCacheSize = (size && size > 0 ? size : 0);
        this.cache = new Array(iCacheSize + 1);
        this.cache[1] = 1;
    }
    read(number) {
        return this.cache[number];
    }
    store(number, termsCount) {
        this.cache[number] = termsCount;
    }
}

/**
 * Asynchronous cache for Asynchronous Collatz.
 * 
 * Workers shares the same ArrayBuffer (memory space) to read and store chain lengths.
 * Dynamic Programming paradigm relies on reuse data already calculated to reduce working time, but due parallelism
 * that calculation may be still running in another worker.
 * Atomics wait/notify methods are a way to wait workers finish calculation and feed results into shared array,
 * and only then continue process on stalled ones. It is still a experimental feature.
 * 
 * @implements {Cache}
 */
class CacheAsync {
    /**
     * @constructor
     * @param {external:SharedArrayBuffer} sharedArrayBuffer - Shared buffer to connect with this cache instance.
     */
    constructor(sharedArrayBuffer) {
        this.cache = new Int32Array(sharedArrayBuffer);
        this.cache[1] = 1;
    }
    read(number) {
        let termsCount = Atomics.load(this.cache, number);
        if (!termsCount) {
            Atomics.wait(this.cache, number, 0);
            termsCount = Atomics.load(this.cache, number);
        }
        return termsCount;
    }
    store(number, termsCount) {
        Atomics.store(this.cache, number, termsCount);
        Atomics.notify(this.cache, number);
    }
}