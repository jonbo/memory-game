import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd())
	const pollInterval = parsePollInterval(env.VITE_POLL);
	const enablePolling = pollInterval > 0;

	if (enablePolling) console.log("Polling every", pollInterval, "ms");

	return {
		plugins: [sveltekit()],
		server: {
			watch: {
				usePolling: enablePolling,
				interval: pollInterval,
			}
		}
	}
})
// Parse the poll interval from the environment variable
function parsePollInterval(pollInterval: string | undefined): number {
	if (!pollInterval) {
		return 0;
	}
	const parsed = parseFloat(pollInterval)
	if (isNaN(parsed)) {
		return 0
	}
	// Shortcut for values less than 10 to be in seconds
	if (parsed < 10) {
		return parsed * 1000;
	}
	return parsed
}