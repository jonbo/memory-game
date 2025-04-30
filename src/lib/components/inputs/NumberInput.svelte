<script lang="ts">
	import { tick } from 'svelte';

	let {
		value = $bindable(0),
		label,
		min,
		max,
		step,
		disabled,
		onNumberChange = () => {}
	} = $props<{
		value: number;
		label: string;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		onNumberChange: (value: number) => void;
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

<div class="setting">
	<label>
		<span>{label}</span>
		<div class="number-input">
			<button {disabled} onclick={decrement} class="step-btn" type="button">-</button>
			<input type="number" {value} {min} {max} {step} {disabled} onchange={handleInput} />
			<button {disabled} onclick={increment} class="step-btn" type="button">+</button>
		</div>
	</label>
</div>

<style>
	.setting {
		width: 100%;
		color: #333;
		background-color: #fff;
		border: 1px solid #ccc;
		border-radius: 5px;
		padding-right: 5px;
		overflow: hidden;
	}

	.setting label {
		display: flex;
		align-items: center;
		width: 100%;
		height: 100%;
		justify-content: space-between;
	}

	.setting span {
		border-right: 1px solid #ccc;
		display: inline-flex;
		height: 100%;
		align-items: center;
		padding: 10px;
		background: #f7f7f7;
	}

	.number-input {
		display: flex;
		align-items: center;
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

	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.step-btn {
		background: none;
		border: none;
		color: #4caf50;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
		padding: 0 8px;
		transition: background-color 0.2s;
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

	label:focus-within {
		border-color: #4caf50;
		box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
	}
</style>
