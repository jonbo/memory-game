import type { GameSettings, PresetSettings } from './types';

export function shareSettings(settings: GameSettings) {
	const params = new URLSearchParams();
	const keysToShare: (keyof PresetSettings | 'seed')[] = [
		'rows',
		'cols',
		'numItems',
		'flashTime',
		'maxAttempts',
		'allOrNothing',
		'unordered',
		'seed'
	];
	keysToShare.forEach((key) => {
		params.set(key, settings[key].toString());
	});

	const shareUrl = `${window.location.origin}${window.location.pathname}#?${params.toString()}`;

	window.history.replaceState(null, '', `#?${params.toString()}`);
	navigator.clipboard.writeText(shareUrl);
}

export function parseSettingsFromUrl() {
	if (!window.location.hash.startsWith('#?')) {
		return null;
	}
	let preset: Partial<PresetSettings> = {};
	const params = new URLSearchParams(window.location.hash.substring(2)); // Remove '#?'

	setPreset(preset, params, 'rows', 4, parsingInt);
	setPreset(preset, params, 'cols', 4, parsingInt);
	setPreset(preset, params, 'numItems', 5, parsingInt);
	setPreset(preset, params, 'flashTime', 2, parsingFloat);
	setPreset(preset, params, 'maxAttempts', 0, parsingInt);
	setPreset(preset, params, 'allOrNothing', false, parsingBoolean);
	setPreset(preset, params, 'unordered', false, parsingBoolean);
	setPreset(preset, params, 'seed', 1, parsingInt);
	return preset;
}

function parsingInt(value: string, defaultValue: number) {
	let num = parseInt(value, 10);
	return isNaN(num) ? defaultValue : num;
}
function parsingFloat(value: string, defaultValue: number) {
	let num = parseFloat(value);
	return isNaN(num) ? defaultValue : num;
}
function parsingBoolean(value: string, defaultValue: boolean) {
	let bool = value === 'true' ? true : value === 'false' ? false : defaultValue;
	return bool;
}
function setPreset(
	preset: Partial<PresetSettings>,
	params: URLSearchParams,
	key: keyof PresetSettings | 'seed',
	defaultValue: number | boolean | string,
	parseFn: (value: string, defaultValue: any) => any
) {
	if (!params.has(key)) {
		return;
	}
	const value = params.get(key);
	// @ts-ignore
	preset[key] = parseFn(value || '', defaultValue);
}

export function clearSettingsFromUrl() {
	// Clear the hash from the URL without reloading
	window.history.replaceState(null, '', window.location.pathname + window.location.search);
}
