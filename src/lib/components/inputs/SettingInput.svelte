<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		children: Snippet;
		changed: boolean;
		tooltip?: string;
	}

	let { label, children, changed = false, tooltip = '' }: Props = $props();
</script>

<div class="setting" class:changed>
	<label title={tooltip}>
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
		box-shadow: 1px 1px 10px #ccc;
		display: inline-flex;
		height: 100%;
		flex: 1;
		margin-right: 10px;

		align-items: center;
		padding: 10px;
		background: #f7f7f7;
	}

	.input-container {
		display: flex;
		align-items: center;
		width: 115px;
	}

	.changed {
		background-color: #fffce3 !important;
	}
</style>
