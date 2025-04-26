<script lang="ts">
	import Cell from './Cell.svelte';
	import type { CellState } from '$lib/types'; // Assuming types are defined elsewhere

	let { rows, cols, cellsData, onCellClick } = $props<{
		rows: number;
		cols: number;
		cellsData: CellState[];
		onCellClick: (row: number, col: number) => void;
	}>();

	const gridStyle = $derived(`grid-template-columns: repeat(${cols}, 1fr);`);
</script>

<div class="grid" style={gridStyle}>
	{#each cellsData as cell, index (index)}
		{@const row = Math.floor(index / cols)}
		{@const col = index % cols}
		<Cell
			number={cell.number}
			displayNumber={cell.displayNumber}
			state={cell.state}
			onclick={() => onCellClick(row, col)}
		/>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		gap: 5px;
		margin-top: 20px;
		margin-bottom: 20px; /* Added margin */
		max-width: calc(var(--cols, 8) * (60px + 5px)); /* Dynamic max-width */
		margin-left: auto; /* Center grid */
		margin-right: auto; /* Center grid */
	}
</style>
