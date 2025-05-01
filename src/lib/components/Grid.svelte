<script lang="ts">
	import Cell from './Cell.svelte';
	import type { CellState } from '$lib/types'; // Assuming types are defined elsewhere
	import { untrack } from 'svelte';

	let { rows, cols, cellsData, onCellClick } = $props<{
		rows: number;
		cols: number;
		cellsData: CellState[];
		onCellClick: (row: number, col: number) => void;
	}>();
	let gridEl = $state<HTMLElement | undefined>();
	let zoomLevel: number = $state(1);

	$effect(() => {
		cols; // dependency
		untrack(() => {
			scaleGrid();
		});
	});
	// Make the grid responsive by scaling it based on the available width
	function scaleGrid() {
		if (!gridEl) return;

		const availableWidth = document.body.offsetWidth - gridEl.offsetLeft * 2; // Account for grid margins/padding
		zoomLevel = availableWidth / gridEl.offsetWidth;
	}
</script>

<svelte:window on:resize={scaleGrid} />
<div bind:this={gridEl} class="grid" style:--cols={cols} style:--zoomLevel={zoomLevel}>
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

		grid-template-columns: repeat(var(--cols, 8), 1fr);

		transform: scale(var(--zoomLevel, 1));
		transform-origin: top left;
	}
</style>
