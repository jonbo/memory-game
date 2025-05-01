<script lang="ts">
	import { tick } from 'svelte';

	let {
		value = $bindable(0),
		min,
		max,
		step,
		disabled,
		onNumberChange = () => {},
		smallMode = false
	} = $props<{
		value: number;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		onNumberChange: (value: number) => void;
		smallMode?: boolean;
	}>();

	function increment() {
		if (disabled) return;
		if (max !== undefined && value >= max) return;
		value += step ?? 1;
		onNumberChange(value);
	}

	function decrement() {
		if (disabled) return;
		if (min !== undefined && value <= min) return;
		value -= step ?? 1;
		onNumberChange(value);
	}

	async function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		let newValue = +input.value;

		if (min !== undefined) newValue = Math.max(min, newValue);
		if (max !== undefined) newValue = Math.min(max, newValue);

		value = newValue;
		input.value = value; // This is needed for some reason
		onNumberChange(value);
	}
</script>

<div class="number-input">
	<button {disabled} onclick={decrement} class="step-btn decrease" type="button">-</button>
	<input
		class:small={smallMode}
		type="number"
		{value}
		{min}
		{max}
		{step}
		{disabled}
		onchange={handleInput}
	/>
	<button {disabled} onclick={increment} class="step-btn increase" type="button">+</button>
</div>

<style>
	.number-input {
		display: flex;
		align-items: center;
		width: 100%;
	}

	input[type='number'] {
		width: 65px;
		padding: 5px;
		border: none;
		font-size: 14px;
		transition: box-shadow 0.2s;
		background: transparent;
		text-align: center;
		-moz-appearance: textfield;
	}
	input[type='number']:not(:disabled) {
		font-weight: 700;
	}

	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.step-btn {
		background: none;
		border: none;

		font-size: 18px;
		font-weight: bold;
		cursor: pointer;
		padding: 0 8px;
		transition: background-color 0.2s;
	}
	.decrease {
		color: red;
	}
	.increase {
		color: green;
	}

	.step-btn:hover:not(:disabled) {
		background-color: rgba(76, 175, 80, 0.1);
	}

	.step-btn:disabled {
		color: #ccc;
		cursor: not-allowed;
	}

	input:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}
	input[type='number'].small {
		font-size: 47%;
	}
</style>
