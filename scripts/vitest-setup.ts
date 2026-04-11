import {vi} from 'vitest'
import {setTimezone} from '@frogpond/constants'

// React Native globals
declare const globalThis: Record<string, unknown>
globalThis.__DEV__ = true

setTimezone('America/Chicago')
vi.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
vi.mock('@react-native-clipboard/clipboard', () => ({
	getString: vi.fn(() => Promise.resolve('')),
	setString: vi.fn(),
	hasString: vi.fn(() => Promise.resolve(false)),
	__esModule: true,
	default: {
		getString: vi.fn(() => Promise.resolve('')),
		setString: vi.fn(),
		hasString: vi.fn(() => Promise.resolve(false)),
	},
}))
vi.mock('@react-native-async-storage/async-storage', () => {
	const store = new Map<string, string>()
	return {
		__esModule: true,
		default: {
			getItem: vi.fn((key: string) =>
				Promise.resolve(store.get(key) ?? null),
			),
			setItem: vi.fn((key: string, value: string) => {
				store.set(key, value)
				return Promise.resolve()
			}),
			removeItem: vi.fn((key: string) => {
				store.delete(key)
				return Promise.resolve()
			}),
			clear: vi.fn(() => {
				store.clear()
				return Promise.resolve()
			}),
			getAllKeys: vi.fn(() => Promise.resolve([...store.keys()])),
			multiGet: vi.fn((keys: string[]) =>
				Promise.resolve(
					keys.map((key) => [key, store.get(key) ?? null] as const),
				),
			),
			multiSet: vi.fn((entries: [string, string][]) => {
				entries.forEach(([key, value]) => store.set(key, value))
				return Promise.resolve()
			}),
			multiRemove: vi.fn((keys: string[]) => {
				keys.forEach((key) => store.delete(key))
				return Promise.resolve()
			}),
		},
	}
})
