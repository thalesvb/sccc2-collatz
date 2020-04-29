/**
 * Stores calculation about the number of existing terms for a value sequence.
 * (Dynamic Programming technique).
 * For the first positive integer 1 there is only one term: 1 itself.
 * This is the initial cache entry.
 * @class
 */
export class CacheTermsCount {
    /**
     * @constructs
     * @param {number} [iSize] - Initial cache size.
     */
    constructor(iSize) {
        let iCacheSize = (iSize ? iSize : 0);
        this.cache = new Array(iCacheSize+1); // {}
        this.cache[1] = 1;
    }
    /**
     * 
     * @param {number} iValue - Value to be decomposed
     * @returns {number} - Required amount of steps to decompose it. 
     */
    get(iValue) {
        return this.cache[iValue];
    }
    /**
     * Stores required amount of steps to decompose a value.
     * @param {number} iValue - Value
     * @param {number} iStepsCount - Number of steps to decompose it.
     */
    set(iValue, iStepsCount) {
        this.cache[iValue] = iStepsCount;
    }
}