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
	let grid = $state<HTMLElement | undefined>();

	$effect(() => {
		cols; // dependency
		untrack(() => {
			scaleGrid();
		});
	});
	// Make the grid responsive by scaling it based on the available width
	function scaleGrid() {
		if (!grid) return;

		const availableWidth = document.body.offsetWidth - grid.offsetLeft * 2; // Account for grid margins/padding
		const zoomLevel = availableWidth / grid.offsetWidth;

		if (zoomLevel < 1) {
			grid.style.setProperty('transform', `scale(${zoomLevel})`);
			grid.style.setProperty('transform-origin', 'top left');
		} else {
			grid.style.removeProperty('transform');
			grid.style.removeProperty('transform-origin');
		}
	}
</script>

<svelte:window on:resize={scaleGrid} />
<div bind:this={grid} class="grid" style:--cols={cols}>
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
	}
</style>
