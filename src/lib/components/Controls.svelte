<script lang="ts">
	import type { PresetSettings, GameStatus } from '$lib/types';

	let {
		rows,
		cols,
		numItems,
		flashTime,
		maxAttempts,
		allOrNothing,
		gameStatus = 'initial',
		selectedPreset,
		presets,
		onSettingsChange,
		onPresetChange,
		onStartGame,
		onSurrender
	} = $props<{
		rows: number;
		cols: number;
		numItems: number;
		flashTime: number;
		maxAttempts: number;
		allOrNothing: boolean;
		gameStatus?: GameStatus;
		selectedPreset: string;
		presets: Record<string, PresetSettings>;
		onSettingsChange: (field: string, value: number | boolean) => void;
		onPresetChange: (presetName: string) => void;
		onStartGame: () => void;
		onSurrender: () => void;
	}>();

	function handleInputChange(event: Event) {
		const target = event.target as HTMLInputElement | HTMLSelectElement;
		const field = target.id.split('-')[0]; // e.g., 'rows' from 'rows-input'
		let value: number | boolean;

		if (target.type === 'checkbox') {
			value = (target as HTMLInputElement).checked;
		} else {
			value = target.type === 'number' ? parseFloat(target.value) : target.value;
		}
		onSettingsChange(field, value);
	}

	function handlePresetChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onPresetChange(target.value);
	}

	const isGameActive = $derived(gameStatus === 'active' || gameStatus === 'flashing');
</script>

<div class="presets">
	<label>
		Difficulty:
		<select
			id="preset-select"
			value={selectedPreset}
			onchange={handlePresetChange}
			disabled={isGameActive}
		>
			<option value="custom">Custom</option>
			{#each Object.keys(presets) as presetName}
				<option value={presetName}
					>{presetName.charAt(0).toUpperCase() + presetName.slice(1)}</option
				>
			{/each}
		</select>
	</label>
</div>

<div class="controls">
	<label>
		Rows:
		<input
			type="number"
			id="rows-input"
			min="2"
			max="12"
			bind:value={rows}
			oninput={handleInputChange}
			disabled={isGameActive}
		/>
	</label>
	<label>
		Columns:
		<input
			type="number"
			id="cols-input"
			min="2"
			max="12"
			bind:value={cols}
			oninput={handleInputChange}
			disabled={isGameActive}
		/>
	</label>
	<label>
		Number of items:
		<input
			type="number"
			id="items-input"
			min="1"
			max="20"
			bind:value={numItems}
			oninput={handleInputChange}
			disabled={isGameActive}
		/>
	</label>
	<label>
		Flash time (s):
		<input
			type="number"
			id="flashTime-input"
			min="0.1"
			max="5"
			step="0.1"
			bind:value={flashTime}
			oninput={handleInputChange}
			disabled={isGameActive}
		/>
	</label>
	<label title="(0 = unlimited)">
		Max attempts :
		<input
			type="number"
			id="maxAttempts-input"
			min="0"
			max="100"
			bind:value={maxAttempts}
			oninput={handleInputChange}
			disabled={isGameActive}
		/>
	</label>
	<label title="When checked, resets all selections on a mistake" class="checkbox-label">
		<span>All Or Nothing</span>:
		<input
			type="checkbox"
			id="allOrNothing-checkbox"
			bind:checked={allOrNothing}
			onchange={handleInputChange}
			disabled={isGameActive}
		/>
	</label>
</div>

<div class="controls">
	<button id="start-button" onclick={onStartGame}>Start New Game</button>
	{#if isGameActive}
		<button id="surrender-button" onclick={onSurrender} class="surrender">Surrender</button>
	{/if}
</div>

<style>
	.controls {
		margin-bottom: 20px;
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center; /* Align items vertically */
	}

	.controls label {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.checkbox-label {
		position: relative;
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.tooltip {
		font-size: 12px;
		color: #777;
		margin-left: 5px;
	}

	.presets {
		margin-bottom: 15px;
	}

	select,
	input[type='number'],
	button {
		padding: 8px 12px; /* Increased padding */
		border-radius: 5px;
		border: 1px solid #ccc;
		font-size: 14px; /* Slightly smaller font */
	}

	input[type='number'] {
		width: 60px;
	}

	button {
		background-color: #4caf50;
		color: white;
		border: none;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover {
		background-color: #45a049;
	}
	#surrender-button {
		background-color: #f44336;
	}
</style>
