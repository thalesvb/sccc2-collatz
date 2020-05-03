import { CollatzFactory } from './modules/Collatz.js';
import { Monitor } from "./modules/Monitor.js";

let monitor = new Monitor().start();
let collatz = CollatzFactory.create({async: false});
collatz.determineLongestChain(1000000).then(
    maximum => {
        monitor.end();
        console.log("Sync:");
        console.log(maximum);
        monitor.display();
    }
);