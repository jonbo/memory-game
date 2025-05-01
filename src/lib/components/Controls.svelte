<script lang="ts">
	import { untrack } from 'svelte';
	import { slide } from 'svelte/transition';
	import type { PresetSettings, GameStatus, GameSettings } from '$lib/types';
	import NumberInput from './inputs/NumberInput.svelte';
	import ToggleInput from './inputs/ToggleInput.svelte';
	import SettingInput from './inputs/SettingInput.svelte';

	const metaSettings = {
		rows: { min: 2, max: 12 },
		cols: { min: 2, max: 12 },
		numItems: { min: 1, max: 20 },
		flashTime: { min: 0.1, max: 30, step: 0.1 },
		maxAttempts: { min: 0, max: 100 }
	};

	const presets: Record<string, PresetSettings> = {
		beginner: {
			rows: 4,
			cols: 4,
			numItems: 5,
			flashTime: 1.5,
			maxAttempts: 0,
			allOrNothing: false,
			unordered: false
		},
		intermediate: {
			rows: 6,
			cols: 6,
			numItems: 7,
			flashTime: 2,
			maxAttempts: 0,
			allOrNothing: false,
			unordered: false
		},
		expert: {
			rows: 8,
			cols: 8,
			numItems: 9,
			flashTime: 2.2,
			maxAttempts: 0,
			allOrNothing: false,
			unordered: false
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
		onSurrender,
		onForceReady,
		readyAutoStartTime
	} = $props<{
		settings: GameSettings;
		gameStatus?: GameStatus;
		onSettingsChange: (settings: GameSettings) => void;
		onStartGame: () => void;
		onSurrender: () => void;
		onForceReady: () => void;
		readyAutoStartTime: number;
	}>();

	const isGameActive = $derived(gameStatus === 'active' || gameStatus === 'flashing');
	let showSettings = $state(false); // Control settings visibility

	const CUSTOM_PRESET_KEY = 'customPresets';
	let customPresets: Record<string, PresetSettings> = $state(
		JSON.parse(localStorage.getItem(CUSTOM_PRESET_KEY) ?? '{}')
	);

	let currentTime = $state(Date.now());
	setInterval(() => {
		currentTime = Date.now();
	}, 50); // Since we're only roughly tracking the time (0.1s)
	const timeUntilStart = $derived(readyAutoStartTime - currentTime);

	function areSettingsEqual(settingsA: GameSettings, settingsB?: PresetSettings): boolean {
		if (!settingsB) return false;
		const keys: (keyof PresetSettings)[] = [
			'rows',
			'cols',
			'numItems',
			'flashTime',
			'maxAttempts',
			'allOrNothing',
			'unordered'
			//'seed' // skip for now
		];
		return keys.every((key) => settingsA[key] === settingsB[key]);
	}

	function hasSettingChanged(key: keyof PresetSettings): boolean {
		const preset =
			settings.selectedPreset === 'custom'
				? undefined
				: presets[settings.selectedPreset] || customPresets[settings.selectedPreset];
		return preset ? settings[key] !== preset[key] : false;
	}

	const hasUnsavedChanges = $derived(
		settings.selectedPreset === 'custom' ||
			(settings.selectedPreset in customPresets &&
				!areSettingsEqual(settings, customPresets[settings.selectedPreset]))
	);

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

		onSettingsChange(settings);
	}

	function applyPreset(presetName: string) {
		const preset = presets[presetName] || customPresets[presetName];
		if (!preset) {
			return;
		}

		Object.assign(settings, preset);
		settings.selectedPreset = presetName;
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

		const { rows, cols, numItems, flashTime, maxAttempts, allOrNothing, unordered } = settings;
		const newPreset: PresetSettings = {
			rows,
			cols,
			numItems,
			flashTime,
			maxAttempts,
			allOrNothing,
			unordered
			//seed // skip saving seed for custom presets
		};

		customPresets[presetName] = newPreset;
		localStorage.setItem(CUSTOM_PRESET_KEY, JSON.stringify(customPresets));
		settings.selectedPreset = presetName;
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
				<option disabled value="custom">Custom{hasUnsavedChanges ? '*' : ''}</option>
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
				title={settings.selectedPreset in customPresets ? 'Save Preset' : 'Save as custom preset'}
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
		<SettingInput label="Rows" changed={hasSettingChanged('rows')}>
			<NumberInput
				bind:value={settings.rows}
				min={metaSettings.rows.min}
				max={metaSettings.rows.max}
				disabled={isGameActive}
				onNumberChange={handleInputChange}
			/>
		</SettingInput>
		<SettingInput label="Columns" changed={hasSettingChanged('cols')}>
			<NumberInput
				bind:value={settings.cols}
				min={metaSettings.cols.min}
				max={Math.min(settings.rows * settings.cols, metaSettings.cols.max)}
				disabled={isGameActive}
				onNumberChange={handleInputChange}
			/>
		</SettingInput>
		<SettingInput label="Number of items" changed={hasSettingChanged('numItems')}>
			<NumberInput
				bind:value={settings.numItems}
				min={metaSettings.numItems.min}
				max={metaSettings.numItems.max}
				disabled={isGameActive}
				onNumberChange={handleInputChange}
			/>
		</SettingInput>
		<SettingInput label="Flash time (s)" changed={hasSettingChanged('flashTime')}>
			<NumberInput
				bind:value={settings.flashTime}
				min={metaSettings.flashTime.min}
				max={metaSettings.flashTime.max}
				step={metaSettings.flashTime.step}
				disabled={isGameActive}
				onNumberChange={handleInputChange}
			/>
		</SettingInput>
		<SettingInput label="Max attempts" changed={hasSettingChanged('maxAttempts')}>
			<NumberInput
				bind:value={settings.maxAttempts}
				min={metaSettings.maxAttempts.min}
				max={metaSettings.maxAttempts.max}
				disabled={isGameActive}
				onNumberChange={handleInputChange}
			/>
		</SettingInput>
		<SettingInput label="All Or Nothing" changed={hasSettingChanged('allOrNothing')}>
			<ToggleInput
				bind:checked={settings.allOrNothing}
				disabled={isGameActive}
				onchange={handleInputChange}
			/>
		</SettingInput>
		<SettingInput label="Unordered Mode" changed={hasSettingChanged('unordered')}>
			<ToggleInput
				bind:checked={settings.unordered}
				disabled={isGameActive}
				onchange={handleInputChange}
			/>
		</SettingInput>
		<SettingInput label="Seed" changed={false}>
			<NumberInput
				bind:value={settings.seed}
				min={0}
				max={Number.MAX_SAFE_INTEGER}
				disabled={isGameActive}
				onNumberChange={handleInputChange}
				smallMode={true}
			/>
		</SettingInput>
	</div>
{/if}

<div class="controls main-controls">
	<button
		class={{
			solo: gameStatus !== 'active' && gameStatus !== 'flashing'
		}}
		id="start-button"
		onclick={onStartGame}
		disabled={gameStatus === 'flashing'}
	>
		Start New Game
	</button>
	{#if gameStatus === 'flashing'}
		<button id="ready-button" onclick={onForceReady} class="ready"
			>Ready! ({(timeUntilStart / 1000).toFixed(1)}s)</button
		>
	{:else if gameStatus === 'active'}
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

	select,
	button {
		padding: 10px 15px; /* Further increased padding */
		border-radius: 5px;
		border: 1px solid #ccc;
		font-size: 14px;
		transition:
			border-color 0.2s,
			box-shadow 0.2s; /* Add transitions */
	}

	select {
		padding: 5px;
		border: none;
		font-size: 14px;
		transition: box-shadow 0.2s;
		background: transparent;
	}

	select:focus {
		border-color: #4caf50; /* Highlight focus */
		box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2); /* Focus ring */
		outline: none;
	}

	select:focus {
		box-shadow: none;
		outline: none;
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
	select:disabled,
	button:disabled {
		background-color: #e0e0e0;
		cursor: not-allowed;
		opacity: 0.7;
	}
</style>
