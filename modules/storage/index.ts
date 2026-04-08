import AsyncStorage from '@react-native-async-storage/async-storage'

// Guard against AsyncStorage being unavailable (e.g. native module bridge not
// ready after a JS reload). Operations become no-ops instead of crashing.
const storage = AsyncStorage ?? {
	getItem: () => Promise.resolve(null),
	setItem: () => Promise.resolve(),
	removeItem: () => Promise.resolve(),
	clear: () => Promise.resolve(),
}

let prefix: string

export function clearAsyncStorage(): Promise<void> {
	return storage.clear()
}

export function setStoragePrefix(str: string): void {
	prefix = str
}

/// MARK: Utilities

export function setItem(key: string, value: unknown): Promise<void> {
	return storage.setItem(`${prefix}:${key}`, JSON.stringify(value))
}
export async function getItem<T>(key: string): Promise<T | null> {
	let stored = await storage.getItem(`${prefix}:${key}`)
	if (stored === null) {
		return null
	}
	return JSON.parse(stored) as T
}
export function removeItem(key: string): Promise<void> {
	return storage.removeItem(`${prefix}:${key}`)
}

/// MARK: Typed utility functions
// These simply cast the return value of getItem; they provide no runtime
// guarantees.

export async function getItemAsString(
	key: string,
	defaultValue = '',
): Promise<string> {
	return (await getItem(key)) || defaultValue
}
export async function getItemAsBoolean(
	key: string,
	defaultValue = false,
): Promise<boolean> {
	const savedValue: boolean | null = await getItem(key)

	if (savedValue === null) {
		return defaultValue
	}

	return savedValue
}
export async function getItemAsArray<T>(
	key: string,
	defaultValue: T[] = [],
): Promise<Array<T>> {
	return (await getItem(key)) || defaultValue
}
