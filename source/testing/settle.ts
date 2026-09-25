/** Lets pending promises settle, such as a check made before opening a link. */
export function settle(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve))
}
