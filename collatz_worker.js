import { parentPort } from 'worker_threads';
import { CollatzConjecture } from './modules/Collatz.js';

parentPort.addListener('message', message => {
    let oCollatz = new CollatzConjecture(message.buffer);
    let iChainLength = oCollatz.calculateChainLength(message.number);
    parentPort.postMessage({number: message.number, totalTerms : iChainLength, collatz : oCollatz});
});