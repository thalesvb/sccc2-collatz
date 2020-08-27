#define WASM_EXPORT __attribute__((visibility("default")))

// https://mbebenita.github.io/WasmExplorer/
// https://webassembly.studio/
// Plain C Code works using long instead of unsigned int,
// but online compiler bugs WASM file by handling them as int
// and that caused overflow.
#include <stdio.h>
#include <stdlib.h>

unsigned int collatzChainLength(unsigned int number);
unsigned int nextTerm(unsigned int term);
/**
 * Determine the longest chain for a range of numbers between 0 < i < upperBound.
 * @param upperBound
 * @return Array containing the number with the longest chain and number of terms in that chain.
 */
unsigned int* determineLongestChain(unsigned int upperBound);

int main(int argc, char** argv) {
    unsigned int upperBound = 1000000;
    if (argc == 2) {
        upperBound = atoi(argv[1]);
    }
    unsigned int* result = determineLongestChain(upperBound);
    printf("Number with longest chain was %d with %d terms.\n", result[0], result[1]);
    return 0;
}

WASM_EXPORT
unsigned int* determineLongestChain(unsigned int upperBound) {
    unsigned int calculatedLength = 0;
    unsigned int* lgChain = (unsigned int*) malloc(2*sizeof(unsigned int));
    lgChain[0] = lgChain[1] = 1;
    for (unsigned int i=0; i<upperBound; ++i) {
        calculatedLength = collatzChainLength(i+1);
        if (calculatedLength > lgChain[1]) {
            lgChain[0] = i+1;
            lgChain[1] = calculatedLength;
        }
    }
    return lgChain;
}

WASM_EXPORT
unsigned int collatzChainLength(unsigned int number) {
    unsigned int n = number;
    unsigned int termsCount = 1;
    if (number > 1) {
        while (n > 1) {
            n = nextTerm(n);
            ++termsCount;
        }
    }
    return termsCount;
}

WASM_EXPORT
unsigned int nextTerm(unsigned int term) {
    if(term%2) {
        return 3 * term + 1;
    }
    return term / 2;
}