import { Worker } from 'worker_threads';
import { CacheFactory } from './Cache.js';
/**
 * Collatz Conjecture implementation.
 * You can {@link https://en.wikipedia.org/wiki/Collatz_conjecture read more about this conjecture on Wikipedia}.
 * Relies on {@link https://en.wikipedia.org/wiki/Dynamic_programming Dynamic Programming bottom-up approach}
 * to speed up calculation.
 */
export class CollatzConjecture {
    /**
     * 
     * @param {Object} [mOptions] - Options to create instance
     * @param {boolean} [mOptions.async=false] - Async processing
     * @param {SharedArrayBuffer} [mOptions.asyncBuffer] - Shared buffer for Async. Required for async processing.
     * @param {number} [mOptions.syncSize] - Cache size (Sync processing).
     */
    constructor(mOptions) {
        this.oCache = CacheFactory.create(mOptions);
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
     * Builds LongestChainDetails typed object.
     * @private
     * @see LongestChainDetails
     */
    static _buildChainDetailsType() {
        return {
            number: 0,
            terms: 0
        };
    }
    /**
     * 
     * @param {number} iCeilingtoInvestigation
     * @returns {LongestChainDetails} Details - Details of longest chain calculated.
     */
    static async determineLongestChain(iCeilingtoInvestigation, async) {
        if (async) {
            return this._determineLongestChainAsync(iCeilingtoInvestigation, 5);
        } else {
            return this._determineLongestChainSync(iCeilingtoInvestigation);
        }
    }

    /**
     * Run synchronous determination.
     * @see determineLongestChain
     * @private
     * @param {*} iCeilingtoInvestigation 
     */
    static async _determineLongestChainSync(iCeilingtoInvestigation) {
        let mLongestDetails = this._buildChainDetailsType();
        let oCollatz = new CollatzConjecture({ syncSize: iCeilingtoInvestigation });
        for (let i = 2; i <= iCeilingtoInvestigation; ++i) {
            let iTotalTerms = oCollatz.calculateChainLength(i);
            if (iTotalTerms > mLongestDetails.terms) {
                mLongestDetails.number = i;
                mLongestDetails.terms = iTotalTerms;
            }
        }
        return mLongestDetails;
    }

    /**
     * Runs asynchronous determination with work process.
     * @see determineLongestChain
     * @private
     * @param {number} iCeilingtoInvestigation
     * @param {number} iWorkers - Quantity of Workers to spawn.
     */
    static async _determineLongestChainAsync(iCeilingtoInvestigation, iWorkers) {
        let iNumbersCalculated = 1;
        let mLongestDetails = this._buildChainDetailsType();
        let aSharedBuffer = new SharedArrayBuffer((iCeilingtoInvestigation + 1) * Int32Array.BYTES_PER_ELEMENT);
        let aWorkerPool = Array.from({ length: iWorkers }, () => new Worker('./collatz_worker.js'));
        let aFutex = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
        let resultResolve;
        Atomics.store(aFutex, 0, 1);
        aWorkerPool.forEach(worker => {
            worker.postMessage({init:true, buffer: aSharedBuffer });
            worker.addListener('message', message => {
                let iTotalTerms = message.totalTerms;
                Atomics.wait(aFutex, 0, 0);
                Atomics.store(aFutex, 0, 0);
                if (iTotalTerms > mLongestDetails.terms) {
                    mLongestDetails.number = message.number;
                    mLongestDetails.terms = iTotalTerms;
                }
                Atomics.store(aFutex, 0, 1);
                Atomics.notify(aFutex, 0, 1);
                if (++iNumbersCalculated === iCeilingtoInvestigation) {
                    resultResolve();
                }
            })
        });
        var pAwaitResults = new Promise(function (resolve, reject) {
            resultResolve = resolve;
            for (let i = 2; i <= iCeilingtoInvestigation; ++i) {
                aWorkerPool[i % iWorkers].postMessage({ number: i });
            }
        });
        await pAwaitResults;
        aWorkerPool.forEach(worker => worker.terminate());
        return mLongestDetails;
    }
}