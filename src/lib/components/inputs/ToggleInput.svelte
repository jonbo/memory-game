<script lang="ts">
	let {
		checked = $bindable(false),
		label,
		disabled,
		onchange = () => {}
	} = $props<{
		checked: boolean;
		label: string;
		disabled?: boolean;
		onchange: (checked: boolean) => void;
	}>();
</script>

<div class="setting">
	<label title={label} class="toggle-label">
		<span>{label}</span>
		<div class="toggle">
			<input type="checkbox" {onchange} bind:checked {disabled} />
			<span class="slider"></span>
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

	.toggle-label {
		display: flex;
		align-items: center;
		width: 100%;
		height: 100%;
		justify-content: space-between;
	}

	.toggle-label span {
		border-right: 1px solid #ccc;
		display: inline-flex;
		height: 100%;
		align-items: center;
		padding: 10px;
		background: #f7f7f7;
	}

	.toggle {
		--toggle-width: 100px;
		--toggle-height: 26px;
		--toggle-background-on: #4caf50;
		--toggle-background-off: #ccc;
		--slider-padding: 4px;
		--slider-width-ratio: 0.6;
		--slider-border-radius-ratio: 0.23;

		position: relative;
		display: inline-block;
		width: var(--toggle-width);
		height: var(--toggle-height);

		margin: 0 10px;
	}

	.toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--toggle-background-off);
		transition: 0.4s;
		border-radius: calc(var(--toggle-height) * var(--slider-border-radius-ratio));
	}

	.slider:before {
		position: absolute;
		content: '';
		height: calc(var(--toggle-height) - 2 * var(--slider-padding));
		width: calc(var(--toggle-width) * var(--slider-width-ratio));
		left: var(--slider-padding);
		bottom: var(--slider-padding);
		background-color: white;
		transition: 0.4s;
		border-radius: calc(var(--toggle-height) * var(--slider-border-radius-ratio));
	}

	input:checked + .slider {
		background-color: var(--toggle-background-on);
	}
	input:not(:checked) + .slider {
		background-color: var(--toggle-background-off);
	}

	input:disabled + .slider {
		background-color: #e0e0e0;
		cursor: not-allowed;
	}

	input:checked + .slider:before {
		transform: translateX(
			calc(
				var(--toggle-width) - var(--toggle-width) * var(--slider-width-ratio) - 2 *
					var(--slider-padding)
			)
		);
	}
</style>
