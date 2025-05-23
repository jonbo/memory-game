<script lang="ts">
	import { tick } from 'svelte';
	import Controls from './components/Controls.svelte';
	import Stats from './components/Stats.svelte';
	import Grid from './components/Grid.svelte';
	import type { CellState, CellDisplayState, GameStatus, GameSettings } from './types';
	import { SeededRandom } from '$lib/math';
	import time from '$lib/Time.svelte';

	// --- Game Settings & State ---
	let settings = $state<GameSettings>({
		selectedPreset: 'beginner', // Start with beginner preset
		// The settings below will be overridden by the preset
		rows: 4,
		cols: 4,
		numItems: 5,
		flashTime: 1.5,
		maxAttempts: 0, // 0 = unlimited
		allOrNothing: false,
		unordered: false,
		seed: Date.now()
	});

	let gameState = $state({
		gameStatus: 'initial' as GameStatus,
		statusMessage: 'Change any settings or press "Start New Game"',
		attempts: 0, // The wrong attempts
		currentExpectedNumber: 1,
		startTime: 0, // Timestamp when game started (ms) or 0 if not started
		endTime: 0, // Timestamp when game ended (ms) or 0 if not ended
		cellsData: [] as CellState[],
		readyAutoStartTime: 0 // The time when the game should start automatically by (after flashing)
	});

	let seeded = new SeededRandom(settings.seed);
	let shouldIncrementSeed = false;

	// --- Helper Functions ---
	function getCellIndex(row: number, col: number): number {
		return row * settings.cols + col;
	}

	function getCell(row: number, col: number): CellState {
		return gameState.cellsData[getCellIndex(row, col)];
	}

	function getSelectedCount(): number {
		return gameState.cellsData.filter((c) => c.selected).length;
	}

	// --- Derived State ---
	const totalCells = $derived(settings.rows * settings.cols);

	function getGameTime() {
		if (gameState.startTime === 0) return 0; // Game not started
		let endTime = gameState.endTime === 0 ? time.current : gameState.endTime;
		return Math.floor((endTime - gameState.startTime) / 1000);
	}

	// --- Functions ---

	function initializeGridState() {
		gameState.cellsData = Array.from({ length: totalCells }, (_, index) => ({
			number: null, // Actual number in the cell
			state: 'default' as CellDisplayState,
			selected: false
		}));
		gameState.currentExpectedNumber = 1;
		gameState.attempts = 0;

		gameState.startTime = 0;
		gameState.endTime = 0;
		gameState.gameStatus = 'initial';
	}

	function handleSettingsChange(settings: GameSettings) {
		// This assumes settings can only change when game is not in progress
		gameState.gameStatus = 'initial'; // Reset game status on settings change

		shouldIncrementSeed = false;
		initializeGridState();
	}

	async function startGame() {
		if (shouldIncrementSeed) {
			settings.seed++;
		}
		seeded.seed = settings.seed;

		// Ensure numItems is valid before starting
		if (settings.numItems > totalCells) {
			gameState.statusMessage = `Cannot start: Number of items (${settings.numItems}) exceeds grid size (${totalCells}).`;
			settings.numItems = totalCells; // Adjust automatically
			return;
		}

		initializeGridState(); // Reset grid state completely
		gameState.gameStatus = 'resetting';
		gameState.statusMessage = 'Generating board...';
		await delay(800); // Show an empty board for a moment
		gameState.gameStatus = 'flashing';

		generateNumberPositions();

		gameState.readyAutoStartTime = Date.now() + settings.flashTime * 1000;
		await flashNumbers();
		handleReady();
	}

	function generateNumberPositions() {
		const usedIndices = new Set<number>();
		gameState.cellsData.forEach((cell) => (cell.number = null)); // Reset all numbers

		for (let i = 1; i <= settings.numItems; i++) {
			let index = seeded.randomInt(0, totalCells);
			// Or use next open index in a circular manner
			while (usedIndices.has(index)) {
				index = (index + 1) % totalCells;
			}
			usedIndices.add(index);
			gameState.cellsData[index].number = i; // Store the actual number
		}
	}

	function delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async function flashNumbers() {
		gameState.statusMessage = 'Remember the positions...';

		// Show numbers
		gameState.cellsData.forEach((cell, index) => {
			if (cell.number !== null) {
				cell.state = 'flash';
			}
		});

		await delay(settings.flashTime * 1000); // Wait for flashTime
	}

	function handleReady() {
		if (gameState.gameStatus !== 'flashing') return; // Ignore if not in flashing state

		gameState.cellsData.forEach((cell) => {
			if (cell.state === 'flash') {
				cell.state = 'default';
			}
		});
		gameState.gameStatus = 'active';
		gameState.statusMessage = `Click cells in order: 1 to ${settings.numItems}`;
		gameState.startTime = Date.now();
	}

	function handleCellClick(row: number, col: number) {
		if (gameState.gameStatus !== 'active') return;

		const cell = getCell(row, col);

		// Ignore clicks on already correctly selected cells or cells being processed
		if (cell.selected || cell.state === 'wrong') {
			return;
		}

		if (cell.number !== null) {
			// Clicked on a cell with a number
			if (cell.number === gameState.currentExpectedNumber || settings.unordered) {
				// Correct selection
				cell.state = 'correct';
				cell.selected = true;

				if (!settings.unordered) {
					// if ordered
					gameState.currentExpectedNumber++;
					gameState.statusMessage = `Correct! Find number ${gameState.currentExpectedNumber}.`;
				} else {
					const remaining = settings.numItems - getSelectedCount();
					gameState.statusMessage = remaining > 0 ? `Correct! Find ${remaining} more numbers.` : '';
				}

				if (getSelectedCount() === settings.numItems) {
					endGame('won');
				}
			} else {
				// Wrong number selection
				handleIncorrectSelection(cell);
			}
		} else {
			// Clicked on an empty cell
			handleIncorrectSelection(cell);
		}
	}

	function handleIncorrectSelection(cell: CellState) {
		gameState.attempts++;

		// Temporarily mark as wrong
		cell.state = 'wrong';

		const attemptsLeft =
			settings.maxAttempts > 0 ? settings.maxAttempts - gameState.attempts : Infinity;
		const attemptsText =
			settings.maxAttempts > 0
				? ` (${gameState.attempts}/${settings.maxAttempts} attempts)`
				: ` (${gameState.attempts} attempts)`;

		// Check for game over immediately
		if (attemptsLeft <= 0) {
			gameState.statusMessage = `Wrong!${attemptsText}`;
			setTimeout(() => endGame('loss'), 100); // Short delay before ending
			return; // Don't proceed further
		}

		if (!settings.allOrNothing) {
			gameState.statusMessage = `Wrong! Try finding ${gameState.currentExpectedNumber}.${attemptsText}`;
		} else {
			gameState.statusMessage = `Wrong!`;
		}

		// Revert the wrong cell after a delay
		setTimeout(() => {
			// Check if the cell wasn't corrected in the meantime (unlikely but safe)
			if (cell.state === 'wrong') {
				cell.state = 'default';
			}

			// Handle all-or-nothing mode *after* the wrong cell is cleared
			if (settings.allOrNothing) {
				// All or nothing mode: Reset all correct selections
				clearSelectionsForHardMode();
				gameState.statusMessage = `Wrong! Start again from 1.${attemptsText}`;
			}
		}, 500); // Delay for showing the wrong state
	}

	function clearSelectionsForHardMode() {
		gameState.cellsData.forEach((cell) => {
			if (cell.selected) {
				cell.selected = false;
				cell.state = 'default';
			}
		});
		gameState.currentExpectedNumber = 1;
	}

	function endGame(status: 'won' | 'loss' | 'surrender') {
		shouldIncrementSeed = true; // Increment seed on the next game
		gameState.endTime = Date.now();
		gameState.gameStatus = status;

		if (status === 'won') {
			gameState.statusMessage = `Congratulations! You won! ${gameState.attempts > 0 ? `(${gameState.attempts} wrong)` : '(Perfect!)'}`;
		} else {
			gameState.statusMessage = `Game over! You used ${gameState.attempts} attempts.`;
			// Reveal all numbers on non-win
			gameState.cellsData.forEach((cell) => {
				if (cell.number !== null && cell.state !== 'correct') {
					// Optionally add a 'revealed' state for different styling
					cell.state = 'flash'; // Reuse flash style for reveal
				}
			});
		}
	}
	function onSurrender() {
		endGame('surrender');
		gameState.statusMessage = 'You surrendered! Game over.';
	}
</script>

<main>
	<div class="header">
		<img src="icon.png" alt="Memory Game Icon" />
		<h1>Memory Board Game</h1>
	</div>

	<Controls
		bind:settings
		gameStatus={gameState.gameStatus}
		onSettingsChange={handleSettingsChange}
		onStartGame={startGame}
		onForceReady={handleReady}
		readyAutoStartTime={gameState.readyAutoStartTime}
		{onSurrender}
	/>

	<Stats
		gameStatus={gameState.gameStatus}
		gameTime={getGameTime()}
		statusMessage={gameState.statusMessage}
	/>

	<Grid
		rows={settings.rows}
		cols={settings.cols}
		cellsData={gameState.cellsData}
		onCellClick={handleCellClick}
	/>
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

	.header {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.header img {
		height: 2.2em;
		width: auto;
	}

	/* Add other global styles if needed */
</style>
