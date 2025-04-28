<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { PresetSettings, GameStatus, GameSettings } from '$lib/types';

	let {
		settings = $bindable(),
		gameStatus = 'initial',
		presets,
		onSettingsChange,
		onPresetChange,
		onStartGame,
		onSurrender
	} = $props<{
		settings: GameSettings;
		gameStatus?: GameStatus;
		presets: Record<string, PresetSettings>;
		onSettingsChange: (settings: GameSettings) => void;
		onPresetChange: (presetName: string) => void;
		onStartGame: () => void;
		onSurrender: () => void;
	}>();

	const isGameActive = $derived(gameStatus === 'active' || gameStatus === 'flashing');
	let showSettings = $state(true); // Control settings visibility
	function handleInputChange() {
		// Validate numeric inputs
		settings.rows = Math.min(Math.max(settings.rows, 2), 12);
		settings.cols = Math.min(Math.max(settings.cols, 2), 12);

		const totalCells = settings.rows * settings.cols;

		settings.numItems = Math.min(Math.max(settings.numItems, 1), Math.min(totalCells, 20)); // Ensure numItems <= totalCells and <= 20

		settings.flashTime = Math.min(Math.max(settings.flashTime, 0.1), 5);
		settings.maxAttempts = Math.max(settings.maxAttempts, 0);

		onSettingsChange(settings);
	}
	function handlePresetChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		onPresetChange(target.value);
	}
</script>

<div class="presets">
	<div class="preset-controls">
		<label>
			Difficulty:
			<select
				id="preset-select"
				value={settings.selectedPreset}
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
		<button
			class="settings-toggle"
			onclick={() => (showSettings = !showSettings)}
			title={showSettings ? 'Hide settings' : 'Show settings'}
		>
			⚙️
		</button>
	</div>
</div>

{#if showSettings}
	<div class="controls" transition:slide>
		<label>
			Rows:
			<input
				type="number"
				id="rows-input"
				min="2"
				max="12"
				bind:value={settings.rows}
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
				bind:value={settings.cols}
				oninput={handleInputChange}
				disabled={isGameActive}
			/>
		</label>
		<label>
			Number of items:
			<input
				type="number"
				id="numItems-input"
				min="1"
				max="20"
				bind:value={settings.numItems}
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
				bind:value={settings.flashTime}
				oninput={handleInputChange}
				disabled={isGameActive}
			/>
		</label>
		<label title="(0 = unlimited)">
			Max attempts:
			<input
				type="number"
				id="maxAttempts-input"
				min="0"
				max="100"
				bind:value={settings.maxAttempts}
				oninput={handleInputChange}
				disabled={isGameActive}
			/>
		</label>
		<label title="When checked, resets all selections on a mistake" class="checkbox-label">
			<span>All Or Nothing</span>:
			<input
				type="checkbox"
				id="allOrNothing-checkbox"
				bind:checked={settings.allOrNothing}
				onchange={handleInputChange}
				disabled={isGameActive}
			/>
		</label>
	</div>
{/if}

<div class="controls">
	<button id="start-button" onclick={onStartGame}>Start New Game</button>
	{#if isGameActive}
		<button id="surrender-button" onclick={onSurrender} class="surrender">Surrender</button>
	{/if}
</div>

<style>
	.presets {
		margin-bottom: 20px; /* Increased spacing */
		text-align: center; /* Center the preset dropdown */
	}

	.presets label {
		font-weight: bold;
		color: #555;
	}

	.preset-controls {
		display: flex;
		align-items: center;
		gap: 10px;
		justify-content: center;
	}

	.settings-toggle {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.2em;
		padding: 5px;
		border-radius: 50%;
		transition: background-color 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
	}

	.settings-toggle:hover {
		background-color: rgba(0, 0, 0, 0.1);
		transform: rotate(30deg);
	}

	.controls {
		margin-bottom: 20px;
		display: flex;
		gap: 15px; /* Increased gap */
		flex-wrap: wrap;
		justify-content: center;
		align-items: center; /* Align items vertically */
		background-color: #fff; /* White background for the controls area */
		padding: 20px; /* Add padding */
		border-radius: 8px; /* Rounded corners */
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Subtle shadow */
	}

	.controls label {
		display: flex;
		align-items: center;
		gap: 8px; /* Increased gap within label */
		color: #333; /* Darker text */
	}

	.checkbox-label {
		position: relative;
		display: flex;
		align-items: center;
		gap: 5px;
		cursor: pointer; /* Indicate it's clickable */
	}

	.checkbox-label span {
		user-select: none; /* Prevent text selection */
	}

	.tooltip {
		font-size: 12px;
		color: #777;
		margin-left: 5px;
	}

	select,
	input[type='number'],
	button {
		padding: 10px 15px; /* Further increased padding */
		border-radius: 5px;
		border: 1px solid #ccc;
		font-size: 14px;
		transition:
			border-color 0.2s,
			box-shadow 0.2s; /* Add transitions */
	}

	select:focus,
	input[type='number']:focus {
		border-color: #4caf50; /* Highlight focus */
		box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2); /* Focus ring */
		outline: none;
	}

	input[type='number'] {
		width: 65px; /* Slightly wider */
	}

	button {
		background-color: #4caf50;
		color: white;
		border: none;
		cursor: pointer;
		transition:
			background-color 0.2s,
			transform 0.1s; /* Add transform transition */
		font-weight: bold;
	}

	button:hover {
		background-color: #45a049;
		transform: translateY(-1px); /* Slight lift on hover */
	}

	button:active {
		transform: translateY(0); /* Press down effect */
	}

	#start-button {
		/* Specific styles if needed */
	}

	#surrender-button {
		background-color: #f44336; /* Red for surrender */
	}
	#surrender-button:hover {
		background-color: #e53935; /* Darker red on hover */
	}

	/* Style for disabled inputs */
	input:disabled,
	select:disabled,
	button:disabled {
		background-color: #e0e0e0;
		cursor: not-allowed;
		opacity: 0.7;
	}
	.checkbox-label input[type='checkbox']:disabled + span {
		color: #999; /* Grey out text for disabled checkbox */
	}
</style>
