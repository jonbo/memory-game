<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		children: Snippet;
		changed: boolean;
	}

	let { label, children, changed = false }: Props = $props();
</script>

<div class="setting" class:changed>
	<label>
		<span>{label}</span>
		<div class="input-container">
			{@render children()}
		</div>
	</label>
</div>

<style>
	.setting {
		width: 100%;
		color: #333;
		background-color: #fff;
		border: 1px solid #ccc;
		border-radius: 5px;
		padding-right: 5px;
		overflow: hidden;
	}

	.setting label {
		display: flex;
		align-items: center;
		width: 100%;
		height: 100%;
		justify-content: space-between;
	}

	.setting span {
		border-right: 1px solid #ccc;
		display: inline-flex;
		height: 100%;
		align-items: center;
		padding: 10px;
		background: #f7f7f7;
	}

	.input-container {
		display: flex;
		align-items: center;
	}

	.changed {
		background-color: #fffce3 !important;
	}
</style>
