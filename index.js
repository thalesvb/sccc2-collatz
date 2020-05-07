import { CollatzFactory } from './modules/Collatz.js';
import { Monitor } from "./modules/Monitor.js";

let upperLimitToInvestigate = 1000000;
let runType = (process.argv[2]);
let monitor = new Monitor().start();
let collatz = CollatzFactory.create({type: runType});
collatz.determineLongestChain(upperLimitToInvestigate).then(
    maximum => {
        monitor.end();
        console.log(`Number with longest chain was ${maximum.number} with ${maximum.terms} terms.`);
        monitor.display();
    }
);  