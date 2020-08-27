// GoLang wasm: https://github.com/golang/go/wiki/WebAssembly
// TinyGO: https://tinygo.org/webassembly/webassembly/
// https://marianogappa.github.io/software/2020/04/01/webassembly-tinygo-cheesse/

package main

func main() {
	upperBound := 1000000
	result := determineLongestChain(upperBound)
	println(result[0])
	println(result[1])
}

//export determineLongestChain
func determineLongestChain(upperBound int) [2]int {
	lgChain := [2]int{1, 1}
	i := 0
	for i < upperBound {
		calculatedLength := collatzChainLength(i + 1)
		if calculatedLength > lgChain[1] {
			lgChain[0] = i + 1
			lgChain[1] = calculatedLength
		}
		i++
	}
	return lgChain
}

func collatzChainLength(number int) int {
	n := number
	termsCount := 1
	if number > 1 {
		for n > 1 {
			n = nextTerm(n)
			termsCount++
		}
	}
	return termsCount
}

func nextTerm(term int) int {
	if term%2 != 0 {
		return 3*term + 1
	}
	return term / 2
}
