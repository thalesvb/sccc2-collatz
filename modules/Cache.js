/**
 * Provides a suitable cache for Collatz Conjecture processing.
 */
export class CacheFactory {
    /**
     * 
     * @param {Object} [mOptions]
     * @param {boolean} [mOptions.async] - Cache for Async Processing.
     * @param {SharedArrayBuffer} [mOptions.asyncBuffer] - Shared buffer for Async. Required for async processing.
     * @param {number} [mOptions.syncSize] - Cache size (Sync processing).
     * @returns {Cache} Cache object,
     */
    static create(mOptions){
        let iSize;
        if(mOptions) {
            if (mOptions.async) {
                return new CacheAsync(mOptions.asyncBuffer);
            } else {
                iSize = mOptions.syncSize;
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
     * 
     * @param {number} iValue - Value to be decomposed
     * @returns {number} Required amount of terms to decompose it. 
     */
    get(iValue) {
        throw new SyntaxError("Missing implementation");
    }
    /**
     * Stores required amount of terms to decompose a value.
     * @param {number} iValue - Value
     * @param {number} iTermsCount - Number of terms to decompose it.
     */
    set(iValue, iTermsCount) {
        throw new SyntaxError("Missing implementation");
    }
}
/**
 * @class
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
    get(iValue) {
        return this.cache[iValue];
    }
    set(iValue, iStepsCount) {
        this.cache[iValue] = iStepsCount;
    }
}

class CacheAsync extends Cache {
    constructor(sharedArrayBuffer) {
        super();
        this.cache = new Int32Array(sharedArrayBuffer);
        this.cache[1] = 1;
    }
    get(iValue) {
        let iTermsCount = Atomics.load(this.cache, iValue);
        if (!iTermsCount) {
            Atomics.wait(this.cache, iValue, 0);
            iTermsCount = Atomics.load(this.cache, iValue);
        }
        return iTermsCount;
    }
    set(iValue, iTermsCount) {
        Atomics.store(this.cache,iValue,iTermsCount);
        Atomics.notify(this.cache, iValue);
    }
}