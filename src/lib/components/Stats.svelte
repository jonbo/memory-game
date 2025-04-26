<script lang="ts">
	import type { GameStatus } from '$lib/types';

	let {
		gameTime = 0,
		statusMessage = '',
		gameStatus = 'initial'
	} = $props<{
		gameTime: number;
		statusMessage: string;
		gameStatus?: GameStatus;
	}>();

	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	const displayTime = $derived(formatTime(gameTime));
	const shouldShowTimer = $derived(gameStatus !== 'initial');
</script>

{#if shouldShowTimer}
	<div class="stats">
		<div class="timer">Time: {displayTime}</div>
		<div class="status">{statusMessage}</div>
	</div>
{:else}
	<div class="status">{statusMessage}</div>
{/if}

<style>
	.stats {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 20px;
		gap: 10px;
	}

	.timer {
		font-size: 18px;
		font-weight: bold;
	}

	.status {
		font-size: 18px;
		font-weight: bold;
		height: 24px;
		text-align: center;
	}
</style>
