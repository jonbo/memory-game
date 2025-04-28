<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import type { PresetSettings, GameStatus, GameSettings } from '$lib/types';

	const metaSettings = {
		rows: { min: 2, max: 12 },
		cols: { min: 2, max: 12 },
		numItems: { min: 1, max: 20 },
		flashTime: { min: 0.1, max: 5, step: 0.1 },
		maxAttempts: { min: 0, max: 100 }
	};

	const presets: Record<string, PresetSettings> = {
		beginner: {
			rows: 4,
			cols: 4,
			numItems: 5,
			flashTime: 1.2,
			maxAttempts: 0,
			allOrNothing: false
		},
		intermediate: {
			rows: 6,
			cols: 6,
			numItems: 7,
			flashTime: 1.5,
			maxAttempts: 0,
			allOrNothing: false
		},
		expert: {
			rows: 8,
			cols: 8,
			numItems: 9,
			flashTime: 2,
			maxAttempts: 0,
			allOrNothing: false
		}
	};

	function clamp(value: number, min: number, max: number): number {
		return Math.min(Math.max(value, min), max);
	}

	let {
		settings = $bindable(),
		gameStatus = 'initial',
		onSettingsChange,
		onStartGame,
		onSurrender
	} = $props<{
		settings: GameSettings;
		gameStatus?: GameStatus;
		onSettingsChange: (settings: GameSettings) => void;
		onStartGame: () => void;
		onSurrender: () => void;
	}>();

	const isGameActive = $derived(gameStatus === 'active' || gameStatus === 'flashing');
	let showSettings = $state(false); // Control settings visibility
	let hasUnsavedChanges = $state(false); // Track unsaved changes

	const CUSTOM_PRESET_KEY = 'customPresets';
	let customPresets = $state(JSON.parse(localStorage.getItem(CUSTOM_PRESET_KEY) ?? '{}'));

	function handleInputChange() {
		settings.rows = clamp(settings.rows, metaSettings.rows.min, metaSettings.rows.max);
		settings.cols = clamp(settings.cols, metaSettings.cols.min, metaSettings.cols.max);

		const totalCells = settings.rows * settings.cols;
		settings.numItems = clamp(
			settings.numItems,
			metaSettings.numItems.min,
			Math.min(totalCells, metaSettings.numItems.max)
		);
		settings.flashTime = clamp(
			settings.flashTime,
			metaSettings.flashTime.min,
			metaSettings.flashTime.max
		);
		settings.maxAttempts = clamp(
			settings.maxAttempts,
			metaSettings.maxAttempts.min,
			metaSettings.maxAttempts.max
		);
		// This allows changing custom presets, but not default ones
		if (!(settings.selectedPreset in customPresets)) {
			settings.selectedPreset = 'custom'; // Set to custom when user changes settings
		}

		if (settings.selectedPreset === 'custom' || settings.selectedPreset in customPresets) {
			hasUnsavedChanges = true;
		}

		onSettingsChange(settings);
	}

	function applyPreset(presetName: string) {
		const preset = presets[presetName] || customPresets[presetName];
		if (!preset) {
			return;
		}
		settings = { ...preset, selectedPreset: presetName };
		hasUnsavedChanges = false;
		onSettingsChange(settings);
	}
	// Ensure the selected preset is applied
	applyPreset(settings.selectedPreset);

	function handlePresetChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const presetName = target.value;

		applyPreset(presetName);
	}

	function saveCustomPreset() {
		const presetName = !(settings.selectedPreset in customPresets)
			? `Custom ${Object.keys(customPresets).length + 1}`
			: settings.selectedPreset;

		const { rows, cols, numItems, flashTime, maxAttempts, allOrNothing } = settings;
		const newPreset: PresetSettings = {
			rows,
			cols,
			numItems,
			flashTime,
			maxAttempts,
			allOrNothing
		};

		customPresets[presetName] = newPreset;
		localStorage.setItem(CUSTOM_PRESET_KEY, JSON.stringify(customPresets));
		settings.selectedPreset = presetName;
		hasUnsavedChanges = false;
	}

	function renameCustomPreset(oldName: string) {
		const newName = prompt('Enter new name:', oldName);
		if (!newName || newName === oldName || newName in customPresets) return;

		const preset = customPresets[oldName];
		delete customPresets[oldName];
		customPresets[newName] = preset;
		localStorage.setItem(CUSTOM_PRESET_KEY, JSON.stringify(customPresets));

		if (settings.selectedPreset === oldName) {
			settings.selectedPreset = newName;
		}
	}

	function deleteCustomPreset(name: string) {
		if (!confirm(`Delete preset "${name}"?`)) return;

		delete customPresets[name];
		localStorage.setItem(CUSTOM_PRESET_KEY, JSON.stringify(customPresets));

		if (settings.selectedPreset === name) {
			settings.selectedPreset = 'custom';
		}
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
				<option value="custom">Custom{hasUnsavedChanges ? '*' : ''}</option>
				{#each Object.keys(presets) as presetName}
					<option value={presetName}
						>{presetName.charAt(0).toUpperCase() + presetName.slice(1)}</option
					>
				{/each}
				{#each Object.keys(customPresets) as presetName}
					<option value={presetName}
						>{presetName}
						{settings.selectedPreset === presetName && hasUnsavedChanges ? '*' : ''}</option
					>
				{/each}
			</select>
		</label>

		{#if settings.selectedPreset === 'custom' || settings.selectedPreset in customPresets}
			<button
				class="icon-button"
				onclick={saveCustomPreset}
				disabled={isGameActive}
				title="Save as custom preset"
			>
				💾
			</button>
		{/if}
		{#if settings.selectedPreset in customPresets}
			<button
				class="icon-button"
				onclick={() => renameCustomPreset(settings.selectedPreset)}
				disabled={isGameActive}
				title="Rename preset"
			>
				🏷️
			</button>
			<button
				class="icon-button"
				onclick={() => deleteCustomPreset(settings.selectedPreset)}
				disabled={isGameActive}
				title="Delete preset"
			>
				🗑️
			</button>
		{/if}

		<button
			class="icon-button settings-toggle"
			onclick={() => (showSettings = !showSettings)}
			title={showSettings ? 'Hide settings' : 'Show settings'}
		>
			⚙️
		</button>
	</div>
</div>

{#if showSettings}
	<div class="controls" transition:slide>
		<div class="setting">
			<label>
				<span>Rows</span>
				<input
					type="number"
					id="rows-input"
					bind:value={settings.rows}
					oninput={handleInputChange}
					disabled={isGameActive}
				/>
			</label>
		</div>
		<div class="setting">
			<label>
				<span>Columns</span>
				<input
					type="number"
					id="cols-input"
					bind:value={settings.cols}
					oninput={handleInputChange}
					disabled={isGameActive}
				/>
			</label>
		</div>
		<div class="setting">
			<label>
				<span>Number of items</span>
				<input
					type="number"
					id="numItems-input"
					bind:value={settings.numItems}
					oninput={handleInputChange}
					disabled={isGameActive}
				/>
			</label>
		</div>
		<div class="setting">
			<label>
				<span>Flash time (s)</span>
				<input
					type="number"
					id="flashTime-input"
					step={metaSettings.flashTime.step}
					bind:value={settings.flashTime}
					oninput={handleInputChange}
					disabled={isGameActive}
				/>
			</label>
		</div>
		<div class="setting">
			<label title="(0 = unlimited)">
				<span>Max attempts</span>
				<input
					type="number"
					id="maxAttempts-input"
					bind:value={settings.maxAttempts}
					oninput={handleInputChange}
					disabled={isGameActive}
				/>
			</label>
		</div>
		<div class="setting">
			<label title="When checked, resets all selections on a mistake" class="checkbox-label">
				<span>All Or Nothing</span>
				<input
					type="checkbox"
					id="allOrNothing-checkbox"
					bind:checked={settings.allOrNothing}
					onchange={handleInputChange}
					disabled={isGameActive}
				/>
			</label>
		</div>
	</div>
{/if}

<div class="controls main-controls">
	<button
		class={{
			solo: !isGameActive
		}}
		id="start-button"
		onclick={onStartGame}>Start New Game</button
	>
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
		display: grid;
		grid-template-columns: 1fr;
		gap: 6px;
		width: 100%;
		max-width: 800px;
		margin: 0 auto 20px;
		background-color: #fff; /* White background for the controls area */
		padding: 20px; /* Add padding */
		border-radius: 8px; /* Rounded corners */
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Subtle shadow */
	}
	.controls.main-controls {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (min-width: 768px) {
		.controls {
			grid-template-columns: repeat(2, 1fr);
			gap: 15px;
		}
	}

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

	select,
	input[type='number'] {
		padding: 5px;
		border: none;
		font-size: 14px;
		transition: box-shadow 0.2s;
		background: transparent;
	}

	select:focus,
	input[type='number']:focus {
		border-color: #4caf50; /* Highlight focus */
		box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2); /* Focus ring */
		outline: none;
	}

	select:focus,
	input[type='number']:focus {
		box-shadow: none;
		outline: none;
	}

	.controls label:focus-within {
		border-color: #4caf50;
		box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
	}
	.controls span {
		border-right: 1px solid #ccc;
		display: inline-flex;
		height: 100%;
		align-items: center;
		padding: 10px;
		background: #f7f7f7;
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

	#start-button.solo {
		grid-column: 1 / -1;
	}

	#surrender-button {
		background-color: #f44336; /* Red for surrender */
	}
	#surrender-button:hover {
		background-color: #e53935; /* Darker red on hover */
	}

	.icon-button {
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

	.icon-button:hover {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.icon-button.settings-toggle:hover {
		transform: rotate(30deg);
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
