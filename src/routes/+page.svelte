<script lang="ts">
	import App from '$lib/App.svelte';
</script>

<App />

<svelte:head>
	<title>Memory Game</title>
	<meta name="description" content="A memory board game" />
</svelte:head>

<style>
	:global {
		body {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
			background-color: #f0f0f0;
		}

		*,
		*::before,
		*::after {
			box-sizing: border-box;
		}
	}
</style>
