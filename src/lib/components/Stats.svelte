<script lang="ts">
	let { gameTime, statusMessage } = $props<{
		gameTime: number;
		statusMessage: string;
	}>();

	const formattedTime = $derived.by(() => {
		const minutes = Math.floor(gameTime / 60);
		const seconds = gameTime % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	});
</script>

<div class="stats">
	<div class="timer">Time: {formattedTime}</div>
	<div class="status">{statusMessage}</div>
</div>

<style>
	.stats {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 20px;
		gap: 10px;
		min-height: 60px; /* Ensure space even when status is short */
	}

	.timer {
		font-size: 18px;
		font-weight: bold;
	}

	.status {
		font-size: 16px; /* Slightly smaller */
		font-weight: bold;
		min-height: 24px; /* Prevent layout shifts */
		text-align: center;
		color: #333;
	}
</style>
