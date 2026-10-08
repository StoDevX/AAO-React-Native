/**
 * Probe for #8655's CI-only failure: writes to the simulator log, category
 * "javascript", which a release bundle's stripped `console` cannot reach.
 */
export function probe(message: string): void {
	let hook = (globalThis as {nativeLoggingHook?: (message: string, level: number) => void})
		.nativeLoggingHook
	hook?.(`[probe] ${Date.now()} ${message}`, 1)
}
