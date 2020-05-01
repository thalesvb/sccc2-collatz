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
     * @param {Object} [options] - Options to create instance.
     * @param {boolean} [options.async=false] - Async processing.
     * @param {SharedArrayBuffer} [options.asyncBuffer] - Shared buffer for Async. Required for async processing.
     * @param {number} [options.syncSize] - Cache size (Sync processing).
     */
    constructor(options) {
        this.cache = CacheFactory.create(options);
    }
    /**
     * Determine chain length for a number.
     * DynProg bottom-up approach: all terms below current term were already calculated
     * and stored on cache. Only need to calculate ones above <code>number</code> and fetch computated result
     * for the first one below.
     * @param {number} number - Initial number of sequence.
     * @returns {ChainDetail} Chain details for provided initial number.
     */
    calculateChainLength(number) {
        let partialTermsCount = 0;
        let currentTerm = number;

        while (currentTerm >= number) {
            ++partialTermsCount;
            currentTerm = this.step(currentTerm);
        }
        let totalTerms = partialTermsCount + this.cache.read(currentTerm);
        this.cache.store(number, totalTerms);
        return this.constructor._buildChainDetailsType(number, totalTerms);
    }
    /**
     * Returns calculated value for current iteraction.
     * The formula is:
     * <ul>
     *  <li>n → n/2 (n is even)</li>
     *  <li>n → 3n+1 (n is odd)</li>
     * </ul>
     * @param {number} term - Current term (n)
     * @returns {number} Next term
     * @private
     */
    step(term) {
        let isEven = (term % 2 == 0 ? true : false);
        let nextTerm;
        if (isEven) {
            nextTerm = parseInt(term / 2);
        } else {
            nextTerm = 3 * term + 1;
        }
        return nextTerm;
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
     * @param {number} ceilingToInvestigate - Maximum positive number to investigate the longest chain.
     * @param {boolean} [async] - Run async if <code>true</code>. Otherwise runs single-threaded.
     * @returns {ChainDetail} Details of longest chain calculated.
     */
    static async determineLongestChain(ceilingToInvestigate, async) {
        if (async) {
            return this._determineLongestChainAsync(ceilingToInvestigate, 5);
        } else {
            return this._determineLongestChainSync(ceilingToInvestigate);
        }
    }
    static pickLongestChain(a, b){
        return a.terms > b.terms ? a : b;
    }

    /**
     * Run synchronous determination.
     * @see determineLongestChain
     * @private
     * @param {*} ceilingToInvestigate 
     */
    static async _determineLongestChainSync(ceilingToInvestigate) {
        let longestChain = this._buildChainDetailsType();
        let collatz = new CollatzConjecture({ syncSize: ceilingToInvestigate });
        for (let i = 2; i <= ceilingToInvestigate; ++i) {
            let chainDetails = collatz.calculateChainLength(i);
            longestChain = this.pickLongestChain(longestChain, chainDetails);
        }
        return longestChain;
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
     * @param {number} ceilingToInvestigate
     * @param {number} numOfWorkers - Quantity of Workers to spawn.
     */
    static async _determineLongestChainAsync(ceilingToInvestigate, numOfWorkers) {
        let numOfWorkersCompleted = 0;
        let longestChain = this._buildChainDetailsType();
        let sharedBuffer = new SharedArrayBuffer((ceilingToInvestigate + 1) * Int32Array.BYTES_PER_ELEMENT);
        let workerPool = Array.from({ length: numOfWorkers }, () => new Worker('./collatz_worker.js'));
        let signalAllWorkersCompleted;
        workerPool.forEach(worker => {
            worker.postMessage({ init: true, buffer: sharedBuffer });
            worker.addListener('message', message => {
                longestChain = this.pickLongestChain(longestChain, message.longestChain);
                if (++numOfWorkersCompleted === numOfWorkers) {
                    signalAllWorkersCompleted();
                }
            })
        });
        let workersProcessing = new Promise(function (resolve, reject) {
            signalAllWorkersCompleted = resolve;
            let workerQueue = Array.from({ length: numOfWorkers }, () => new Array());
            for (let i = 2; i <= ceilingToInvestigate; ++i) {
                workerQueue[i % numOfWorkers].push(i);
            }
            workerPool.forEach((worker, index) => worker.postMessage({ numbersQueue: workerQueue[index] }));
        });
        await workersProcessing;
        workerPool.forEach(worker => worker.terminate());
        return longestChain;
    }
}

/**
 * Worker implementation for Asynchronous Collatz.
 * It does a simple task to find the longest chain for a bunch of numbers.
 */
export class CollatzWorker {
    /**
     * 
     * @param {SharedArrayBuffer} sharedBuffer - Shared buffer among the Worker threads.
     */
    constructor(sharedBuffer) {
        this.collatz = new CollatzConjecture({async:true, asyncBuffer: sharedBuffer});
    }
    /**
     * Map-reduce task to find the longest chain among the numbers.
     * @param {number[]} numbers - Numbers to process.
     * @returns {ChainDetail} Number with longest chain.
     */
    reduceToLongestChain(numbers) {
        return numbers.map(number => this.collatz.calculateChainLength(number))
                      .reduce(CollatzConjecture.pickLongestChain);
    }
}