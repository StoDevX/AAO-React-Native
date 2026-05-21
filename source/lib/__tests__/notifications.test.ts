import {
	hashContent,
	hasContentChanged,
	getStoredHash,
	setStoredHash,
} from '../notifications'

jest.mock('expo-notifications', () => ({
	getPermissionsAsync: jest.fn(),
	requestPermissionsAsync: jest.fn(),
	scheduleNotificationAsync: jest.fn(),
	cancelScheduledNotificationAsync: jest.fn(),
	IosAuthorizationStatus: {
		NOT_DETERMINED: 0,
		DENIED: 1,
		AUTHORIZED: 2,
		PROVISIONAL: 3,
		EPHEMERAL: 4,
	},
}))

jest.mock('@frogpond/storage', () => {
	const store: Record<string, unknown> = {}
	return {
		getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
		setItem: jest.fn((key: string, value: unknown) => {
			store[key] = value
			return Promise.resolve()
		}),
	}
})

describe('hashContent', () => {
	it('returns the same hash for identical objects regardless of key order', () => {
		const a = {z: 1, a: 2}
		const b = {a: 2, z: 1}
		expect(hashContent(a)).toBe(hashContent(b))
	})

	it('returns a different hash when content changes', () => {
		expect(hashContent({menu: 'pizza'})).not.toBe(hashContent({menu: 'tacos'}))
	})

	it('handles primitives', () => {
		expect(hashContent(42)).toBe(hashContent(42))
		expect(hashContent('hello')).not.toBe(hashContent('world'))
	})

	it('handles arrays', () => {
		expect(hashContent([1, 2, 3])).toBe(hashContent([1, 2, 3]))
		expect(hashContent([1, 2, 3])).not.toBe(hashContent([3, 2, 1]))
	})

	it('handles null', () => {
		expect(hashContent(null)).toBe(hashContent(null))
	})
})

describe('hasContentChanged', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const storage = require('@frogpond/storage') as {
			getItem: jest.Mock
			setItem: jest.Mock
		}
		const store: Record<string, unknown> = {}
		storage.getItem.mockImplementation((key: string) =>
			Promise.resolve(store[key] ?? null),
		)
		storage.setItem.mockImplementation((key: string, value: unknown) => {
			store[key] = value
			return Promise.resolve()
		})
	})

	it('reports changed when there is no stored hash', async () => {
		const {changed, newHash} = await hasContentChanged('test-feature', {
			data: 'hello',
		})
		expect(changed).toBe(true)
		expect(newHash).toBeTruthy()
	})

	it('reports unchanged when content is the same', async () => {
		const data = {menu: 'pizza'}
		const hash = hashContent(data)
		await setStoredHash('test-feature', hash)

		const {changed} = await hasContentChanged('test-feature', data)
		expect(changed).toBe(false)
	})

	it('reports changed when content differs', async () => {
		await setStoredHash('test-feature', hashContent({menu: 'pizza'}))

		const {changed, newHash} = await hasContentChanged('test-feature', {
			menu: 'tacos',
		})
		expect(changed).toBe(true)
		expect(newHash).not.toBe(hashContent({menu: 'pizza'}))
	})
})

describe('getStoredHash / setStoredHash', () => {
	it('round-trips a hash value', async () => {
		await setStoredHash('my-feature', 'abc123')
		const stored = await getStoredHash('my-feature')
		expect(stored).toBe('abc123')
	})
})
