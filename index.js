import yargs from 'yargs';
import { CollatzFactory } from './modules/Collatz.js';
import { Monitor } from "./modules/Monitor.js";

const argv = yargs
.option("runType", {
    alias: "r",
    describe: "Run Type. Available values are:\n sync: Synchronous\n async: Asynchronous\n functional: Functional\n wasm: WebAssembly",
    type: "string"})
.default("runType", "sync")
.option("upperLimit", {
    alias: "l",
    describe: "Upper limit to investigate.",
    type: "number" })
.default("upperLimit", 1000000)
.help()
.alias("help", "h")
.argv;

let upperLimitToInvestigate = argv.upperLimit;
let runType = argv.runType;

let monitor = new Monitor().start();
let collatz = CollatzFactory.create({type: runType});
collatz.determineLongestChain(upperLimitToInvestigate).then(
    maximum => {
        monitor.end();
        console.log(`Number with longest chain was ${maximum.number} with ${maximum.terms} terms.`);
        monitor.display();
    }
);  