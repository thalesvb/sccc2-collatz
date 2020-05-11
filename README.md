SAP Community Coding Challenge #2: Collatz Conjecture
===

This is a submission to [SAP Community Coding Challenge #2][community_challenge].

There are four implementations provided:

Synchronous
---

Plain good ol' single thread implementation.
This is the faster, memory friendly.

Functional
---
A more functional syntax approaching.
It is more declarative, breaking the problem into small parts to be solved.
First attempt with Ramda, so there are things that could be better.

Asynchronous
---

This is an async implementation based on shared buffer between workers.
I already knew that asynchronous would perform worse, because of
worker implied overhead, waiting for previous calculated data be resolved.

The main reason to still do it is refresh some concepts (and remember bottlenecks), recheck some JSDoc flaws and also try other things.
The code mainly:

* Uses Workers to distribute workload.
* Relies on [Atomics][atomics_ref] to control data dependency, stalling worker thread until calculation for required data chain is done.
* Dropped Node modules syntax to use ES6 one, since it looks like TypeScript (which I uses more whenever need to code JS-like).

From first to last interaction, it had a improvement of:

* 8x speed up.
* 50% less memory usage.

But is still 3x slower and way more memory intensive than Synchronous code.
There is margin to squeeze more, but is enough for now.

WebAssembly (Experimental)
---

Because why not? Actually compiled from C code.
It is a simple code, eventually you'll find overflow erros (wrong answers when checking above 1000000)
You need to compile collatz.c to collatz.wasm first before using this run type.

How to run
---

Synhronous:
```Shell
npm start
```
Asynchronous:
```Shell
npm start -- -r async
```

Functional:
```Shell
npm start -- -r functional
```

WebAssembly:
```Shell
npm start -- -r wasm
```

Change upper limit to investigate
```Shell
npm start -- -l <upperLimit>
```

Observations
---
There were a few problems to create a online runnable demo because of ES6 modules syntax (they almost enforces Node syntax), even with ``"type": "module"`` on ``package.json``.
ESM module comes to the rescue!


[community_challenge]: https://blogs.sap.com/2020/04/27/sap-community-coding-challenge-nr.2/
[atomics_ref]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Atomics