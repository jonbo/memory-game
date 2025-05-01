export class SeededRandom {
	seed: number;

	constructor(seed: number) {
		this.seed = seed;
	}

	// xorshift algorithm for generating pseudo-random numbers
	next(): number {
		let result = this.seed;
		result ^= result << 13;
		result ^= result >> 17;
		result ^= result << 5;
		this.seed = result;
		return (result >>> 0) / 4294967296;
	}

	// Returns a random integer between min (inclusive) and max (exclusive)
	randomInt(min: number, max: number): number {
		return Math.floor(this.next() * (max - min)) + min;
	}
}
