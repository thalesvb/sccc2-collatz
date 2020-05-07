import { parentPort } from 'worker_threads';
import { CollatzAsyncWorker } from './modules/Collatz.js';

let worker;
parentPort.addListener('message', message => {
    if(message.init) {
        worker = new CollatzAsyncWorker(message.buffer);
    } else {
        let longestChain = worker.reduceToLongestChain(message.numbersQueue);
        parentPort.postMessage({longestChain: longestChain});
    }
});