import { CollatzConjecture } from './modules/Collatz.js';

let mMaximum = CollatzConjecture.determineLongestChain(1000000);
console.log(mMaximum);