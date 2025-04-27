export type CellDisplayState = 'default' | 'flash' | 'correct' | 'wrong' | 'selected';

export type GameStatus = 'initial' | 'flashing' | 'active' | 'won' | 'loss' | 'surrender';

export interface CellState {
	number: number | null; // The actual number identity
	displayNumber: number | null; // The number currently shown on the cell
	state: CellDisplayState;
}

export interface PresetSettings {
	rows: number;
	cols: number;
	numItems: number;
	flashTime: number;
	// maxAttempts?: number; // Optional if presets don't define them
	// easyMode?: boolean;
}

export interface GameSettings {
    rows: number;
    cols: number;
    numItems: number;
    flashTime: number;
    maxAttempts: number;
    allOrNothing: boolean;
    selectedPreset: string;
}

// Add other shared types as needed
