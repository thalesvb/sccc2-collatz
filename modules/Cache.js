/**
 * Provides a suitable cache for Collatz Conjecture processing.
 */
export class CacheFactory {
    /**
     * Provides a suitable {@link Cache}.
     * @param {Object} [options]
     * @param {boolean} [options.async] - Cache for Async Processing.
     * @param {SharedArrayBuffer} [options.asyncBuffer] - Shared buffer for Async. Required for Async processing.
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
     * Read required amount of terms to decompose a number.
     * @param {number} number - Number to be decomposed
     * @returns {number} Required amount of terms to decompose it. 
     */
    read(number) {
        throw new SyntaxError("Missing implementation");
    }
    /**
     * Stores required amount of terms to decompose a number.
     * @param {number} number - Value
     * @param {number} termsCount - Number of terms to decompose it.
     */
    store(number, termsCount) {
        throw new SyntaxError("Missing implementation");
    }
}
/**
 * Synchronous cache for Synchronous Collatz.
 * @implements Cache
 */
class CacheSync extends Cache {
    /**
     * @constructs
     * @param {number} [iSize] - Initial cache size.
     */
    constructor(iSize) {
        super();
        let iCacheSize = (iSize && iSize > 0 ? iSize : 0);
        this.cache = new Array(iCacheSize + 1); // {}
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
 * @implements Cache
 */
class CacheAsync extends Cache {
    constructor(sharedArrayBuffer) {
        super();
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