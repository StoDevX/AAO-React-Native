import {act, renderHook} from '@testing-library/react-native'

// Override the global mock - timer tests need real time behavior
jest.mock('@frogpond/launch-arguments', () => ({
	isUITesting: false,
}))

import {useMomentTimer} from '../index'

const ONE_MINUTE = 60000

const advanceBy = async (ms: number) => {
	await act(() => {
		jest.advanceTimersByTime(ms)
	})
}

describe('useMomentTimer', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	it('applies the timezone to the value it starts with', async () => {
		jest.setSystemTime(new Date('2019-12-18T18:39:45Z'))

		let {result} = await renderHook(() => useMomentTimer({intervalMs: ONE_MINUTE, timezone: 'UTC'}))

		expect(result.current.now.format('h:mma')).toBe('6:39pm')
	})

	it('ticks when the minute changes, not a minute after mount', async () => {
		// 50 seconds past the minute: the next minute arrives in 10 seconds.
		jest.setSystemTime(new Date('2019-12-18T18:02:50Z'))

		let {result} = await renderHook(() => useMomentTimer({intervalMs: ONE_MINUTE, timezone: 'UTC'}))

		expect(result.current.now.format('h:mma')).toBe('6:02pm')

		await advanceBy(10000)

		expect(result.current.now.format('h:mma')).toBe('6:03pm')
	})

	it('keeps ticking on each following boundary', async () => {
		jest.setSystemTime(new Date('2019-12-18T18:02:50Z'))

		let {result} = await renderHook(() => useMomentTimer({intervalMs: ONE_MINUTE, timezone: 'UTC'}))

		await advanceBy(10000)
		expect(result.current.now.format('h:mma')).toBe('6:03pm')

		await advanceBy(ONE_MINUTE)
		expect(result.current.now.format('h:mma')).toBe('6:04pm')

		await advanceBy(ONE_MINUTE)
		expect(result.current.now.format('h:mma')).toBe('6:05pm')
	})

	it('stops ticking once unmounted', async () => {
		jest.setSystemTime(new Date('2019-12-18T18:02:50Z'))

		let {result, unmount} = await renderHook(() =>
			useMomentTimer({intervalMs: ONE_MINUTE, timezone: 'UTC'}),
		)

		await unmount()
		await advanceBy(ONE_MINUTE * 5)

		expect(result.current.now.format('h:mma')).toBe('6:02pm')
	})
})
