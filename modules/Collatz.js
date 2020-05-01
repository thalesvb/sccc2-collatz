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
     * @returns {ChainDetail} Chain details for provided initial number.
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
        return this.constructor._buildChainDetailsType(iNumber, iTotalTerms);
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
     * @typedef {Object} ChainDetail Details from a chain calculation.
     * @property {number} number - Number evaluated.
     * @property {number} terms - Number of terms calculated for this number.
     */
    /**
     * Builds ChainDetail typed object.
     * @param {number} [number]
     * @param {number} [terms]
     * @private
     * @see ChainDetail
     */
    static _buildChainDetailsType(number, terms) {
        return {
            number: (number ? number : 0),
            terms: (terms ? terms : 0)
        };
    }
    /**
     * 
     * @param {number} iCeilingtoInvestigation
     * @returns {ChainDetail} Details of longest chain calculated.
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
        let mLongestChain = this._buildChainDetailsType();
        let oCollatz = new CollatzConjecture({ syncSize: iCeilingtoInvestigation });
        for (let i = 2; i <= iCeilingtoInvestigation; ++i) {
            let mChainDetails = oCollatz.calculateChainLength(i);
            if (mChainDetails.terms > mLongestChain.terms) {
                mLongestChain.number = i;
                mLongestChain.terms = mChainDetails.terms;
            }
        }
        return mLongestChain;
    }

    /**
     * Runs asynchronous determination with work process.
     * Builds up a queue for each worker distributing terms to each one of them.
     * The queue for 2 workers would be: 
     * | Worker \ Queue pos. | 1 | 2 | 3 | ... |
     * | ---                 | - | - | - | -   |
     * | 1                   | 2 | 4 | 6 | ... |
     * | 2                   | 3 | 5 | 7 | ... |
     * @see determineLongestChain
     * @private
     * @param {number} iCeilingtoInvestigation
     * @param {number} iWorkers - Quantity of Workers to spawn.
     */
    static async _determineLongestChainAsync(iCeilingtoInvestigation, iWorkers) {
        let iWorkersCompleted = 0;
        let mLongestChain = this._buildChainDetailsType();
        let aSharedBuffer = new SharedArrayBuffer((iCeilingtoInvestigation + 1) * Int32Array.BYTES_PER_ELEMENT);
        let aWorkerPool = Array.from({ length: iWorkers }, () => new Worker('./collatz_worker.js'));
        let resultResolve;
        aWorkerPool.forEach(worker => {
            worker.postMessage({ init: true, buffer: aSharedBuffer });
            worker.addListener('message', message => {
                message.result.forEach(chainDetail => {
                    if (chainDetail.terms > mLongestChain.terms) {
                        mLongestChain.number = chainDetail.number;
                        mLongestChain.terms = chainDetail.terms;
                    }
                });
                if (++iWorkersCompleted === iWorkers) {
                    resultResolve();
                }
            })
        });
        let pAwaitResults = new Promise(function (resolve, reject) {
            resultResolve = resolve;
            let aWorkerQueue = Array.from({ length: iWorkers }, () => new Array());
            for (let i = 2; i <= iCeilingtoInvestigation; ++i) {
                aWorkerQueue[i % iWorkers].push(i);
            }
            aWorkerPool.forEach((worker, index) => worker.postMessage({ numbersQueue: aWorkerQueue[index] }));
        });
        await pAwaitResults;
        aWorkerPool.forEach(worker => worker.terminate());
        return mLongestChain;
    }
}