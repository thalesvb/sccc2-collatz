import { parentPort } from 'worker_threads';
import { CollatzConjecture } from './modules/Collatz.js';

let oCollatz;
parentPort.addListener('message', message => {
    if(message.init) {
        oCollatz = new CollatzConjecture({async:true, asyncBuffer: message.buffer});
    } else {
        let calculatedTermsPerNumber = message.numbersQueue.map(number => oCollatz.calculateChainLength(number));
        parentPort.postMessage({result: calculatedTermsPerNumber});
    }
});