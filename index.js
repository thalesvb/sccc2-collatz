import { CollatzConjecture } from './modules/Collatz.js';
import { Monitor } from "./modules/Monitor.js";

let monitor = new Monitor().start();
let mMaximum = CollatzConjecture.determineLongestChain(1000000);
mMaximum.then(
    mMaximum => {
        console.log(mMaximum);
        monitor.end();
        monitor.display();
    }
);