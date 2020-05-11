import { promises } from 'fs';
import { buildChainDetailsType } from './../Collatz.js';
/**
 * WebAssembly (from C code) implementation.
 * Node have experimental support for direct wasm import but
 * online runners not always allows experimental features.
 * @implements {CollatzConjecture}
 */
export class CollatzWasm {
    static memoryStates = new WeakMap();
    constructor() {
        this.wasmDetermine = null;
        this.loaded = false;
    }

    async determineLongestChain(ceilingToInvestigate) {
        if (!this.loaded) {
            await this.load();
            this.loaded = true;
        }
        const result = this.wasmDetermine(ceilingToInvestigate);
        return buildChainDetailsType(result[0], result[1]);
    }

    /**
     * Loads and instantiates WASM module.
     * @private
     */
    async load() {
        const syscall = CollatzWasm.syscall;
        let instance;
        await promises.readFile('./modules/wasm/collatz.wasm')
            .then(bytes => WebAssembly.instantiate(bytes, {
                env: {
                    __syscall1: function __syscall1(n, a) { return syscall(instance, n, [a]); },
                    __syscall3: function __syscall3(n, a, b, c) { return syscall(instance, n, [a, b, c]); },
                    __syscall6: function __syscall6(n, a, b, c, d, e, f) { return syscall(instance, n, [a, b, c, d, e, f]); },
                }
            })).then(results => {
                instance = results.instance;
                this.wasmDetermine = function (number) {
                    const memPointer = instance.exports.determineLongestChain(number);
                    const memBuffer = instance.exports.memory.buffer.slice(memPointer);
                    const result = new Int32Array(memBuffer).slice(0, 2);
                    return result;
                };
            }).catch(console.error);
    }

    /**
     * Implementation of missing syscalls.
     * @private
     * @param {*} instance WASM instance.
     * @param {*} n Syscall number (%rax).
     * @param {*} args Parameters for Syscall.
     * @returns {*} Syscall return (%rax).
     */
    static syscall(instance, n, args) {
        switch (n) {
            case /* mmap2 */ 192:
                const memory = instance.exports.memory;
                let memoryState = CollatzWasm.memoryStates.get(instance);
                const requested = args[1];
                if (!memoryState) {
                    memoryState = {
                        object: memory,
                        currentPosition: memory.buffer.byteLength,
                    };
                    CollatzWasm.memoryStates.set(instance, memoryState);
                }
                let cur = memoryState.currentPosition;
                if (cur + requested > memory.buffer.byteLength) {
                    const need = Math.ceil((cur + requested - memory.buffer.byteLength) / 65536);
                    memory.grow(need);
                }
                memoryState.currentPosition += requested;
                return cur;
        }
    }
}