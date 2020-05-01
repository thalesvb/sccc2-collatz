import { parentPort } from 'worker_threads';
import { CollatzConjecture } from './modules/Collatz.js';

let oCollatz;
parentPort.addListener('message', message => {
    if(message.init) {
        oCollatz = new CollatzConjecture({async:true, asyncBuffer: message.buffer});
    } else {
        let mLongestChain = message.numbersQueue.map(number => oCollatz.calculateChainLength(number)).reduce(CollatzConjecture.pickLongestChain);
        parentPort.postMessage({longestChain: mLongestChain});
    }
});