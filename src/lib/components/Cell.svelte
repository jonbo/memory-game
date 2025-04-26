<script lang="ts">
	import type { CellDisplayState } from '$lib/types'; // Assuming types are defined elsewhere

	let {
		number,
		displayNumber,
		state = 'default',
		onclick
	} = $props<{
		number: number | null; // The actual number in the cell (null if empty)
		displayNumber: number | null; // The number to show (can differ from actual number during flash/reveal)
		state?: CellDisplayState;
		onclick: () => void;
	}>();

	const cellClass = $derived(`cell ${state !== 'default' ? state : ''}`);
</script>

<div class={cellClass} {onclick}>
	{#if displayNumber !== null}
		{displayNumber}
	{/if}
</div>

<style>
	.cell {
		width: 60px;
		height: 60px;
		background-color: #ddd;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 24px;
		font-weight: bold;
		cursor: pointer;
		user-select: none;
		border-radius: 5px;
		transition:
			background-color 0.2s,
			color 0.2s;
		color: #333; /* Default text color */
	}

	.cell:hover:not(.correct):not(.wrong):not(.flash) {
		background-color: #ccc;
	}

	/* States */
	.cell.selected {
		/* Maybe rename 'selected' state if not used, or use for temporary highlight */
		/* background-color: #4caf50; */
		/* color: white; */
	}

	.cell.wrong {
		background-color: #f44336;
		color: white;
		cursor: not-allowed;
	}

	.cell.correct {
		background-color: #2196f3;
		color: white;
		cursor: default; /* No pointer needed for already correct cells */
	}

	.cell.flash {
		background-color: #ffc107;
		color: #333;
	}
</style>
