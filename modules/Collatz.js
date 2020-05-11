// /**
//  * Collatz conjecture implementation.
//  * Provides a {@link CollatzSync Synchronous} and {@link CollatzAsync Asynchronous} variant.
//  * @module Collatz
//  */

import { Worker } from 'worker_threads';
import R from 'ramda';
import { CacheBuilder } from './Cache.js';
import { CollatzWasm } from './wasm/CollatzWasm.js';

/**
 * @typedef {Object} ChainDetail Details from a chain calculation.
 * @property {number} number - Number evaluated.
 * @property {number} terms - Number of terms calculated for this number.
 * @public
 */

/**
 * Builds ChainDetail typed object.
 * @param {number} [number]
 * @param {number} [terms]
 * @package
 * @see ChainDetail
 */
export function buildChainDetailsType(number, terms) {
    return {
        number: (number ? number : 0),
        terms: (terms ? terms : 0)
    };
}

/**
 * Collatz Conjecture implementation factory.
 */
export class CollatzFactory {
    /**
     * @param {Object} [options] - Options to create instance.
     * @param {string} [options.type] - Way to solve (sync/async/functional/wasm). Defaults to sync.
     * @param {Cache} [options.cache] - Pre-built cache.
     */
    static create(options) {
        if (options && options.type) {
            switch (options.type) {
                case "async": return new CollatzAsync(options);
                case "functional": return new CollatzFunctional(options);
                case "wasm": return new CollatzWasm(options);
            }
        }
        return new CollatzSync(options);
    }
}

/**
 * Collatz Conjecture implementation.
 * You can {@link https://en.wikipedia.org/wiki/Collatz_conjecture read more about this conjecture on Wikipedia}.
 * @interface
 */
class CollatzConjecture {
    /**
     * Determine longest chain for a number interval defined by 1 < i < <code>ceilingToInvestigate</code>.
     * @public
     * @param {number} ceilingToInvestigate - Upper bound to be investigated.
     */
    async determineLongestChain(ceilingToInvestigate) {
        throw new SyntaxError("Missing implementation");
    }
}

/**
 * Base implementation for sync/async.
 * Relies on {@link https://en.wikipedia.org/wiki/Dynamic_programming Dynamic Programming bottom-up approach}
 * to speed up calculation with cache.
 * @abstract
 * @implements {CollatzConjecture}
 */
class CollatzDynProg {
    /**
     * @param {Object} [options] - Options to create instance.
     * @param {Cache} [options.cache] - Cache to be used by runtime.
     */
    constructor(options) {
        this.cache = null;
        if (options && options.cache) {
            this.cache = options.cache;
        }
    }

    /**
     * Determine longest chain for a number interval defined by 1 < i < <code>ceilingToInvestigate</code>.
     * @abstract
     * @public
     * @param {number} ceilingToInvestigate - Upper bound to be investigated.
     */
    async determineLongestChain(ceilingToInvestigate) {
        throw new SyntaxError("Missing implementation");
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
        return buildChainDetailsType(number, totalTerms);
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
     * Comparator to determine which one has longest term chain, returning it.
     * @param {ChainDetail} a 
     * @param {ChainDetail} b 
     */
    static pickLongestChain(a, b) {
        return a.terms > b.terms ? a : b;
    }
}
/**
 * Runs synchronous determination in main thread.
 * @extends CollatzDynProg
 */
class CollatzSync extends CollatzDynProg {
    async determineLongestChain(ceilingToInvestigate) {
        this.cache = new CacheBuilder().build(ceilingToInvestigate);
        let longestChain = buildChainDetailsType();
        for (let i = 2; i <= ceilingToInvestigate; ++i) {
            let chainDetails = this.calculateChainLength(i);
            longestChain = this.constructor.pickLongestChain(longestChain, chainDetails);
        }
        return longestChain;
    }
}
/**
 * Runs asynchronous determination with work processes.
 * Builds up a queue for each worker distributing terms to each one of them.
 * The queue for 2 workers would be: 
 * | Worker \ Queue pos. | 1 | 2 | 3 | ... |
 * | ---                 | - | - | - | -   |
 * | 1                   | 2 | 4 | 6 | ... |
 * | 2                   | 3 | 5 | 7 | ... |
 * @extends CollatzDynProg
 */
class CollatzAsync extends CollatzDynProg {
    async determineLongestChain(ceilingToInvestigate) {
        let numOfWorkers = 5;
        let numOfWorkersCompleted = 0;
        let longestChain = buildChainDetailsType();
        let sharedBuffer = new SharedArrayBuffer((ceilingToInvestigate + 1) * Int32Array.BYTES_PER_ELEMENT);
        let workerPool = Array.from({ length: numOfWorkers }, () => new Worker('./collatz_worker.js'));
        let signalAllWorkersCompleted;
        workerPool.forEach(worker => {
            worker.postMessage({ init: true, buffer: sharedBuffer });
            worker.addListener('message', message => {
                longestChain = this.constructor.pickLongestChain(longestChain, message.longestChain);
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
export class CollatzAsyncWorker {
    /**
     * 
     * @param {external:SharedArrayBuffer} sharedBuffer - Shared buffer across the Workers.
     */
    constructor(sharedBuffer) {
        let cache = new CacheBuilder().async().sharedBuffer(sharedBuffer).build();
        this.collatz = CollatzFactory.create({ type: "async", cache: cache });
    }
    /**
     * Map-reduce task to find the longest chain among the numbers.
     * @param {number[]} numbers - Numbers to process.
     * @returns {ChainDetail} Number with longest chain.
     */
    reduceToLongestChain(numbers) {
        return numbers.map(number => this.collatz.calculateChainLength(number))
            .reduce(CollatzDynProg.pickLongestChain);
    }
}

/**
 * Functional programming variant for Collatz Conjecture.
 * Uses {@link https://ramdajs.com/ Ramda}.
 * @implements {CollatzConjecture}
 */
class CollatzFunctional {
    async determineLongestChain(ceilingToInvestigate) {
        const isEven = n => (n % 2 === 0);
        const nextTerm = n => isEven(n) ? n/2 : 3*n+1;
        const collatzTerms = i => R.append(1, R.unfold(term => (term === 1 ? false : [term, nextTerm(term)]), i));
        const collatzTermsCount = i => [i, collatzTerms(i).length];
        const largestChain = (calculated, b) => {
            let resolvedB = collatzTermsCount(b);
            return calculated[1] > resolvedB[1] ? calculated : resolvedB;
        }
        const result = R.reduce(largestChain, [1,1], R.range(1, ceilingToInvestigate+1));
        return buildChainDetailsType(result[0], result[1]);
    }
}