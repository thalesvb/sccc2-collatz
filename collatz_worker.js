import { parentPort } from 'worker_threads';
import { CollatzConjecture } from './modules/Collatz.js';

let oCollatz;
parentPort.addListener('message', message => {
    if(message.init) {
        oCollatz = new CollatzConjecture({async:true, asyncBuffer: message.buffer});
    } else {
        let iChainLength = oCollatz.calculateChainLength(message.number);
        parentPort.postMessage({number: message.number, totalTerms : iChainLength, collatz : oCollatz});
    }
});