import AsyncStorage from '@react-native-async-storage/async-storage'

let prefix: string

export function clearAsyncStorage(): Promise<void> {
	return AsyncStorage.clear()
}

export function setStoragePrefix(str: string): void {
	prefix = str
}

/// MARK: Utilities

export function setItem(key: string, value: unknown): Promise<void> {
	return AsyncStorage.setItem(`${prefix}:${key}`, JSON.stringify(value))
}
export async function getItem<T>(key: string): Promise<T | null> {
	let stored = await AsyncStorage.getItem(`${prefix}:${key}`)
	if (stored === null) {
		return null
	}
	return JSON.parse(stored)
}
export function removeItem(key: string): Promise<void> {
	return AsyncStorage.removeItem(`${prefix}:${key}`)
}

/// MARK: Typed utility functions
// These simply cast the return value of getItem; they provide no runtime
// guarantees.

export async function getItemAsBoolean(key: string): Promise<boolean> {
	return (await getItem(key)) || false
}
export async function getItemAsArray<T>(key: string): Promise<Array<T>> {
	return (await getItem(key)) || []
}
