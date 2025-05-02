export class SeededRandom {
	#seed: number;

	constructor(seed: number) {
		this.#seed = seed;
		this.warmUp();
	}
	// Warm up the generator by discarding the first few values
	warmUp() {
		for (let i = 0; i < 10; i++) {
			this.next();
		}
	}
	set seed(value: number) {
		this.#seed = value;
		this.warmUp();
	}

	// xorshift algorithm for generating pseudo-random numbers
	next(): number {
		let result = this.#seed;
		result ^= result << 13;
		result ^= result >> 17;
		result ^= result << 5;
		this.#seed = result;
		return (result >>> 0) / 4294967296;
	}

	// Returns a random integer between min (inclusive) and max (exclusive)
	randomInt(min: number, max: number): number {
		return Math.floor(this.next() * (max - min)) + min;
	}
}
