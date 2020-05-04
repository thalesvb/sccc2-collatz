import { CollatzFactory } from './modules/Collatz.js';
import { Monitor } from "./modules/Monitor.js";

let upperLimitToInvestigate = 1000000;
let runAsync = (process.argv[2] === "async");
let monitor = new Monitor().start();
let collatz = CollatzFactory.create({async: runAsync});
collatz.determineLongestChain(upperLimitToInvestigate).then(
    maximum => {
        monitor.end();
        console.log("Sync:");
        console.log(maximum);
        monitor.display();
    }
);