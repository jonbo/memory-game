export type CellDisplayState = 'default' | 'flash' | 'correct' | 'wrong' | 'selected';

export type GameStatus = 'initial' | 'flashing' | 'active' | 'won' | 'loss' | 'surrender';

export interface CellState {
	number: number | null; // The actual number identity
	displayNumber: number | null; // The number currently shown on the cell
	state: CellDisplayState;
	selected: boolean; // Track if this cell has been correctly selected
}

export type PresetSettings = Omit<GameSettings, 'selectedPreset' | 'seed'>;

export interface GameSettings {
	rows: number;
	cols: number;
	numItems: number;
	flashTime: number;
	maxAttempts: number;
	allOrNothing: boolean;
	unordered: boolean;
	selectedPreset: string;
	seed: number;
}

// Add other shared types as needed
