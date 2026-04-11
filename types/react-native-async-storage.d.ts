// The @react-native-async-storage/async-storage v3 package ships .d.ts files
// with extension-less relative imports inside an ESM-typed directory
// (lib/typescript/package.json has "type": "module"). This breaks type
// resolution under moduleResolution "nodenext", causing all imports to resolve
// as `any`. This ambient declaration re-exports the correct types so that
// TypeScript and eslint-typescript can resolve them.

declare module '@react-native-async-storage/async-storage' {
	export interface AsyncStorage {
		getItem(key: string): Promise<string | null>
		setItem(key: string, value: string): Promise<void>
		removeItem(key: string): Promise<void>
		getMany(keys: string[]): Promise<Record<string, string | null>>
		setMany(entries: Record<string, string>): Promise<void>
		removeMany(keys: string[]): Promise<void>
		getAllKeys(): Promise<string[]>
		clear(): Promise<void>
	}

	export function createAsyncStorage(databaseName: string): AsyncStorage

	export class AsyncStorageError extends Error {}

	const _default: AsyncStorage
	export default _default
}

declare module '@react-native-async-storage/async-storage/jest' {
	import type {AsyncStorage} from '@react-native-async-storage/async-storage'

	export function createAsyncStorage(databaseName: string): AsyncStorage
	export function clearAllMockStorages(): void

	const _default: AsyncStorage
	export default _default
}
