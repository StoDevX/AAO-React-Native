export function getAtKeyPath(state: unknown, keyPath: string[]): unknown {
	let current = state

	for (let key of keyPath) {
		if (current === null || current === undefined) {
			return undefined
		}

		if (Array.isArray(current)) {
			let index = Number(key)
			current = Number.isNaN(index) ? undefined : current[index]
		} else if (typeof current === 'object') {
			current = (current as Record<string, unknown>)[key]
		} else {
			return undefined
		}
	}

	return current
}
