import {renderHook, act} from '@testing-library/react-native'
import {NativeModules} from 'react-native'
import {useServerDiscovery} from '../use-server-discovery'

const mockUseIsDevMode = jest.fn(() => true)

jest.mock('../../../../../lib/use-is-dev-mode', () => ({
	useIsDevMode: () => mockUseIsDevMode(),
}))

type Service = {
	name: string
	host: string
	port: number
	addresses?: string[]
	txt?: Record<string, string>
}

const handlers: {
	resolved?: (...args: unknown[]) => void
	remove?: (...args: unknown[]) => void
} = {}

const mockScan = jest.fn()
const mockStop = jest.fn()
const mockRemoveDeviceListeners = jest.fn()
const mockRemoveAllListeners = jest.fn()

jest.mock('react-native-zeroconf', () =>
	jest.fn().mockImplementation(() => ({
		on: (event: 'resolved' | 'remove', callback: (...args: unknown[]) => void) => {
			if (event === 'resolved') {
				handlers.resolved = callback
				return
			}

			handlers.remove = callback
		},
		scan: mockScan,
		stop: mockStop,
		removeDeviceListeners: mockRemoveDeviceListeners,
		removeAllListeners: mockRemoveAllListeners,
	})),
)

describe('useServerDiscovery', () => {
	beforeEach(() => {
		mockUseIsDevMode.mockReturnValue(true)
		NativeModules['RNZeroconf'] = {}
		Object.keys(handlers).forEach((key) => delete handlers[key as keyof typeof handlers])
		jest.clearAllMocks()
	})

	it('builds discovered server URLs from address and default /v1/ path', async () => {
		let {result} = await renderHook(() => useServerDiscovery())

		await act(() => {
			handlers.resolved?.({
				name: 'Gecko',
				host: 'Gecko.local.',
				port: 3000,
				addresses: ['192.168.0.10'],
				txt: {path: ''},
			} satisfies Service)
		})

		expect(result.current).toEqual([{name: 'Gecko', url: 'http://192.168.0.10:3000/v1/'}])
	})

	it('removes only the matching discovered server', async () => {
		let {result} = await renderHook(() => useServerDiscovery())

		await act(() => {
			handlers.resolved?.({
				name: 'Gecko',
				host: 'Gecko.local.',
				port: 3000,
				addresses: ['192.168.0.10'],
			} satisfies Service)
			handlers.resolved?.({
				name: 'Otter',
				host: 'Otter.local.',
				port: 3000,
				addresses: ['192.168.0.11'],
			} satisfies Service)
		})

		await act(() => {
			handlers.remove?.('Gecko')
		})

		expect(result.current).toEqual([{name: 'Otter', url: 'http://192.168.0.11:3000/v1/'}])
	})

	it('cleans up listeners on unmount', async () => {
		let {unmount} = await renderHook(() => useServerDiscovery())

		await unmount()

		expect(mockRemoveAllListeners).toHaveBeenCalledWith('resolved')
		expect(mockRemoveAllListeners).toHaveBeenCalledWith('remove')
		expect(mockStop).toHaveBeenCalledTimes(1)
		expect(mockRemoveDeviceListeners).toHaveBeenCalledTimes(1)
	})
})
