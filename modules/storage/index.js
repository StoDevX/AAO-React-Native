// @flow
import AsyncStorage from '@react-native-community/async-storage'

let prefix: string

export function clearAsyncStorage() {
	return AsyncStorage.clear()
}

export function setStoragePrefix(str: string) {
	prefix = str
}

/// MARK: Utilities

export function setItem(key: string, value: mixed) {
	return AsyncStorage.setItem(`${prefix}:${key}`, JSON.stringify(value))
}
export function getItem(key: string): Promise<?any> {
	return AsyncStorage.getItem(`${prefix}:${key}`).then(stored =>
		JSON.parse(stored),
	)
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
