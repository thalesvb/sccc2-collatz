import { parentPort } from 'worker_threads';
import { CollatzWorker } from './modules/Collatz.js';

let worker;
parentPort.addListener('message', message => {
    if(message.init) {
        worker = new CollatzWorker(message.buffer);
    } else {
        let longestChain = worker.reduceToLongestChain(message.numbersQueue);
        parentPort.postMessage({longestChain: longestChain});
    }
});