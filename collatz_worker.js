import { parentPort } from 'worker_threads';
import { CollatzConjecture } from './modules/Collatz.js';

let oCollatz;
parentPort.addListener('message', message => {
    if(message.init) {
        oCollatz = new CollatzConjecture({async:true, asyncBuffer: message.buffer});
    } else {
        message.numbersQueue.forEach(number => {
            let iChainLength = oCollatz.calculateChainLength(number);
            parentPort.postMessage({number: number, totalTerms : iChainLength});
        })
    }
});