import { createSubscriber } from 'svelte/reactivity';

export class Time {
	#subscribe;

	constructor(interval: number) {
		this.#subscribe = createSubscriber((update) => {
			const intervalId = setInterval(update, interval);
			return () => {
				clearInterval(intervalId);
			};
		});
	}

	get current() {
		this.#subscribe();
		return Date.now();
	}
}

export default new Time(50);
