<script lang="ts">
	import { tick } from 'svelte';
	import Controls from './components/Controls.svelte';
	import Stats from './components/Stats.svelte';
	import Grid from './components/Grid.svelte';
	import type { CellState, PresetSettings, CellDisplayState } from './types'; // Define these types

	// --- Game Settings & State ---
	let settings = $state({
		rows: 8,
		cols: 8,
		numItems: 9,
		flashTime: 1, // seconds
		maxAttempts: 0, // 0 = unlimited
		easyMode: true,
		selectedPreset: 'advanced' // Start with a preset
	});

	let gameState = $state({
		gameActive: false,
		statusMessage: 'Select settings and press "Start New Game"',
		attempts: 0,
		currentExpectedNumber: 1,
		gameTime: 0, // seconds
		timerInterval: null as ReturnType<typeof setInterval> | null,
		startTime: 0,
		cellsData: [] as CellState[], // Holds the state for each cell
		numberPositions: new Map<string, number>(), // "row-col" -> number
		selectedIndices: new Set<number>(), // Indices of correctly selected cells
		isFlashing: false,
		isRevealing: false, // For showing numbers on game over
	});

	const presets: Record<string, PresetSettings> = {
		beginner: { rows: 4, cols: 4, numItems: 5, flashTime: 1.5 },
		advanced: { rows: 8, cols: 8, numItems: 9, flashTime: 1 },
	};

	// Apply initial preset
	applyPreset(settings.selectedPreset);

	// --- Derived State ---
	const totalCells = $derived(settings.rows * settings.cols);

	// --- Effects ---
	$effect(() => {
		// Recalculate cell data when grid size changes (and game not active)
		if (!gameState.gameActive) {
			initializeGridState();
		}
	});

	$effect(() => {
		// Cleanup timer on component unmount or when game becomes inactive
		const currentTimer = gameState.timerInterval;
		const active = gameState.gameActive;
		return () => {
			if (!active && currentTimer) {
				clearInterval(currentTimer);
				gameState.timerInterval = null;
			}
		};
	});


	// --- Functions ---

	function initializeGridState() {
		gameState.cellsData = Array.from({ length: totalCells }, (_, index) => ({
			number: null, // Actual number in the cell
			displayNumber: null, // Number currently shown
			state: 'default' as CellDisplayState,
		}));
		gameState.numberPositions.clear();
		gameState.selectedIndices.clear();
		gameState.currentExpectedNumber = 1;
		gameState.attempts = 0;
		gameState.gameTime = 0;
		gameState.isFlashing = false;
		gameState.isRevealing = false;
	}

	function applyPreset(presetName: string) {
		settings.selectedPreset = presetName;
		if (presetName !== 'custom') {
			const preset = presets[presetName];
			if (preset) {
				settings.rows = preset.rows;
				settings.cols = preset.cols;
				settings.numItems = preset.numItems;
				settings.flashTime = preset.flashTime;
				// Keep maxAttempts and easyMode as they are, or reset them if desired
				// settings.maxAttempts = 0;
				// settings.easyMode = true;
			}
		}
		// No need to call initializeGridState here, $effect handles it
	}

	function handleSettingsChange(field: keyof typeof settings, value: number | boolean | string) {
		if (typeof field === 'string' && field in settings) {
			// Type assertion needed because TS doesn't know 'field' matches a key correctly
			(settings as any)[field] = value;

			// If a setting other than preset is changed, switch to custom
			if (field !== 'selectedPreset') {
				settings.selectedPreset = 'custom';
			}

			// Validate numeric inputs
			if (field === 'rows') settings.rows = Math.min(Math.max(settings.rows, 2), 12);
			if (field === 'cols') settings.cols = Math.min(Math.max(settings.cols, 2), 12);
			if (field === 'numItems') {
				settings.numItems = Math.min(Math.max(settings.numItems, 1), Math.min(totalCells, 20)); // Ensure numItems <= totalCells and <= 20
			}
			if (field === 'flashTime') settings.flashTime = Math.min(Math.max(settings.flashTime, 0.1), 5);
			if (field === 'maxAttempts') settings.maxAttempts = Math.max(settings.maxAttempts, 0);
		}
	}


	function startGame() {
		if (gameState.gameActive) return;

		// Ensure numItems is valid before starting
		if (settings.numItems > totalCells) {
			gameState.statusMessage = `Cannot start: Number of items (${settings.numItems}) exceeds grid size (${totalCells}).`;
			settings.numItems = totalCells; // Adjust automatically
			return;
		}


		stopTimer();
		initializeGridState(); // Reset grid state completely
		gameState.gameActive = true;
		gameState.statusMessage = 'Generating board...';

		// Use tick to ensure UI updates before potentially blocking generation
		tick().then(() => {
			generateNumberPositions();
			flashNumbers();
		});
	}

	function generateNumberPositions() {
		const usedIndices = new Set<number>();
		gameState.numberPositions.clear();

		for (let i = 1; i <= settings.numItems; i++) {
			let index: number;
			do {
				index = Math.floor(Math.random() * totalCells);
			} while (usedIndices.has(index));

			usedIndices.add(index);
			gameState.cellsData[index].number = i; // Store the actual number

			const row = Math.floor(index / settings.cols);
			const col = index % settings.cols;
			gameState.numberPositions.set(`${row}-${col}`, i);
		}
	}

	function flashNumbers() {
		gameState.isFlashing = true;
		gameState.statusMessage = 'Remember the positions...';

		// Show numbers
		gameState.cellsData.forEach((cell, index) => {
			if (cell.number !== null) {
				cell.displayNumber = cell.number;
				cell.state = 'flash';
			}
		});

		// Hide numbers after flashTime
		setTimeout(() => {
			gameState.cellsData.forEach(cell => {
				if (cell.state === 'flash') {
					cell.displayNumber = null;
					cell.state = 'default';
				}
			});
			gameState.isFlashing = false;
			gameState.statusMessage = `Click cells in order: 1 to ${settings.numItems}`;
			startTimer();
		}, settings.flashTime * 1000);
	}

	function handleCellClick(row: number, col: number) {
		if (!gameState.gameActive || gameState.isFlashing || gameState.isRevealing) return;

		const index = row * settings.cols + col;
		const cell = gameState.cellsData[index];
		const targetNumber = gameState.numberPositions.get(`${row}-${col}`);

		// Ignore clicks on already correctly selected cells or cells being processed
		if (cell.state === 'correct' || cell.state === 'wrong') {
			return;
		}

		if (targetNumber !== undefined) { // Clicked on a cell with a number
			if (targetNumber === gameState.currentExpectedNumber) {
				// Correct selection
				cell.displayNumber = targetNumber;
				cell.state = 'correct';
				gameState.selectedIndices.add(index);
				gameState.currentExpectedNumber++;

				if (gameState.selectedIndices.size === settings.numItems) {
					endGame(true); // Won
				} else {
					// Update status for next number
					gameState.statusMessage = `Correct! Find number ${gameState.currentExpectedNumber}.`;
				}

			} else {
				// Wrong number selection
				handleIncorrectSelection(index, targetNumber);
			}
		} else {
			// Clicked on an empty cell
			handleIncorrectSelection(index, null);
		}
	}

	function handleIncorrectSelection(index: number, clickedNumber: number | null) {
		gameState.attempts++;
		const cell = gameState.cellsData[index];

		// Temporarily show the wrong number (if any) or just mark as wrong
		cell.displayNumber = clickedNumber;
		cell.state = 'wrong';

		const attemptsLeft = settings.maxAttempts > 0 ? settings.maxAttempts - gameState.attempts : Infinity;
		const attemptsText = settings.maxAttempts > 0 ? ` (${gameState.attempts}/${settings.maxAttempts} attempts)` : ` (${gameState.attempts} attempts)`;

		// Check for game over immediately
		if (attemptsLeft <= 0) {
			gameState.statusMessage = `Wrong!${attemptsText}`;
			setTimeout(() => endGame(false), 100); // Short delay before ending
			return; // Don't proceed further
		}

		// Revert the wrong cell after a delay
		setTimeout(() => {
			// Check if the cell wasn't corrected in the meantime (unlikely but safe)
			if (cell.state === 'wrong') {
				cell.displayNumber = null;
				cell.state = 'default';
			}

			// Handle easy vs hard mode *after* the wrong cell is cleared
			if (!settings.easyMode) {
				// Hard mode: Reset all correct selections
				clearSelectionsForHardMode();
				gameState.statusMessage = `Wrong! Start again from 1.${attemptsText}`;
			} else {
				// Easy mode: Just continue
				gameState.statusMessage = `Wrong! Try finding ${gameState.currentExpectedNumber}.${attemptsText}`;
			}

		}, 500); // Delay for showing the wrong state
	}


	function clearSelectionsForHardMode() {
		gameState.selectedIndices.forEach(idx => {
			gameState.cellsData[idx].state = 'default';
			gameState.cellsData[idx].displayNumber = null;
		});
		gameState.selectedIndices.clear();
		gameState.currentExpectedNumber = 1;
	}


	function startTimer() {
		stopTimer(); // Clear existing timer first
		gameState.startTime = Date.now();
		gameState.gameTime = 0;
		updateTimerDisplay(); // Update immediately
		gameState.timerInterval = setInterval(updateTimerDisplay, 1000);
	}

	function stopTimer() {
		if (gameState.timerInterval) {
			clearInterval(gameState.timerInterval);
			gameState.timerInterval = null;
		}
	}

	function updateTimerDisplay() {
		if (gameState.gameActive) {
			gameState.gameTime = Math.floor((Date.now() - gameState.startTime) / 1000);
		}
		// No need to manually update DOM, Stats component reacts to gameTime prop
	}

	function endGame(won: boolean) {
		stopTimer();
		gameState.gameActive = false;
		gameState.isRevealing = !won; // Set revealing flag if lost

		if (won) {
			gameState.statusMessage = `Congratulations! You won in ${gameState.gameTime} seconds!`;
		} else {
			gameState.statusMessage = `Game over! You used ${gameState.attempts} attempts.`;
			// Reveal all numbers on loss
			gameState.cellsData.forEach(cell => {
				if (cell.number !== null && cell.state !== 'correct') {
					cell.displayNumber = cell.number;
					// Optionally add a 'revealed' state for different styling
					cell.state = 'flash'; // Reuse flash style for reveal
				}
			});
		}
	}

</script>

<main>
	<h1>Memory Board Game</h1>

	<Controls
		rows={settings.rows}
		cols={settings.cols}
		numItems={settings.numItems}
		flashTime={settings.flashTime}
		maxAttempts={settings.maxAttempts}
		easyMode={settings.easyMode}
		gameActive={gameState.gameActive}
		selectedPreset={settings.selectedPreset}
		presets={presets}
		onSettingsChange={handleSettingsChange}
		onPresetChange={applyPreset}
		onStartGame={startGame}
	/>

	<Stats
		gameTime={gameState.gameTime}
		statusMessage={gameState.statusMessage}
	/>

	{#key settings.rows + '-' + settings.cols} <!-- Re-render Grid if dimensions change -->
		<Grid
			rows={settings.rows}
			cols={settings.cols}
			cellsData={gameState.cellsData}
			onCellClick={handleCellClick}
		/>
	{/key}

</main>

<style>
	main {
		font-family: Arial, sans-serif;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px;
		background-color: #f0f0f0;
		max-width: 900px; /* Max width for the whole app */
		margin: 0 auto; /* Center the app */
	}

	h1 {
		color: #333;
		margin-bottom: 20px;
	}

	/* Add other global styles if needed */
</style>
