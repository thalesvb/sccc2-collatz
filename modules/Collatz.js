import { CacheTermsCount } from './Cache.js';
/**
 * Collatz Conjecture implementation.
 * You can {@link https://en.wikipedia.org/wiki/Collatz_conjecture read more about this conjecture on Wikipedia}.
 * Relies on {@link https://en.wikipedia.org/wiki/Dynamic_programming Dynamic Programming bottom-up approach}
 * to speed up calculation.
 */
export class CollatzConjecture {
    constructor(iCeilingInteractions) {
        this.oCache = new CacheTermsCount(iCeilingInteractions);
    }
    /**
     * Determine chain length for a number.
     * DynProg bottom-up approach: all terms below current term were already calculated
     * and stored on cache. Only need to calculate ones above iNumber and fetch computated result
     * for the first below.
     * @param {number} iNumber - Initial number of sequence.
     * @returns {number} Nº of terms in this sequence (chain length).
     */
    calculateChainLength(iNumber) {
        let iPartialTerms = 0;
        let iValue = iNumber;

        while (iValue >= iNumber) {
            ++iPartialTerms;
            iValue = this.step(iValue);
        }
        let iTotalTerms = iPartialTerms + this.oCache.get(iValue);
        this.oCache.set(iNumber, iTotalTerms);
        return iTotalTerms;
    }
    /**
     * Returns calculated value for current iteraction.
     * The formula is:
     * <ul>
     *  <li>n → n/2 (n is even)</li>
     *  <li>n → 3n+1 (n is odd)</li>
     * </ul>
     * @param {number} step_value - Current step value (n)
     * @returns {number} Value calculated (term)
     * @private
     */
    step(value) {
        let bEven = (value % 2 == 0 ? true : false);
        let iValueCalculated;
        if (bEven) {
            iValueCalculated = parseInt(value / 2);
        } else {
            iValueCalculated = 3 * value + 1;
        }
        return iValueCalculated;
    }
    /**
     * @typedef {Object} LongestChainDetails Details from longest calculated chain.
     * @property {number} number - Number with the longest chain in number interval.
     * @property {number} terms - Number of terms calculated for this number.
     */
    /**
     * a
     * @param {number} iCeilingtoInvestigation
     * @returns {LongestChainDetails} Details - Details of longest chain calculated.
     */
    static determineLongestChain(iCeilingtoInvestigation) {
        let mLongestDetails = { number: 0, terms: 0 };
        let oCollatz = new CollatzConjecture(iCeilingtoInvestigation);
        for (let i = 2; i <= iCeilingtoInvestigation; ++i) {
            let iTotalTerms = oCollatz.calculateChainLength(i);
            if (iTotalTerms > mLongestDetails.terms) {
                mLongestDetails.number = i;
                mLongestDetails.terms = iTotalTerms;
            }
        }
        return mLongestDetails;
    }
}