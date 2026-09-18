import {AppState, type AppStateStatus} from 'react-native'
import {act, renderHook} from '@testing-library/react-native'

// Override the global mock - timer tests need real time behavior
jest.mock('@frogpond/launch-arguments', () => ({
	isUITesting: false,
}))

import moment from 'moment-timezone'
import {now, useMomentTimer} from '../index'
import {useNowOverride} from '../override'

const ONE_MINUTE = 60000

const advanceBy = async (ms: number) => {
	await act(() => {
		jest.advanceTimersByTime(ms)
	})
}

describe('useMomentTimer', () => {
	// AppState events come from the native side, so the only way to drive the
	// hook's foregrounding behaviour is to keep the handlers it registers and
	// call them.
	let appStateHandlers: ((status: AppStateStatus) => void)[] = []

	const sendAppState = async (status: AppStateStatus) => {
		await act(() => {
			for (let handler of appStateHandlers) handler(status)
		})
	}

	/** Suspends the JS clock the way iOS does: time passes, timers do not fire. */
	const backgroundFor = async (ms: number) => {
		await sendAppState('background')
		jest.setSystemTime(Date.now() + ms)
		await sendAppState('active')
	}

	beforeEach(() => {
		jest.useFakeTimers()
		appStateHandlers = []
		jest.spyOn(AppState, 'addEventListener').mockImplementation((type, handler) => {
			let changeHandler = handler as (status: AppStateStatus) => void
			if (type === 'change') appStateHandlers.push(changeHandler)
			return {
				remove: () => {
					appStateHandlers = appStateHandlers.filter((each) => each !== changeHandler)
				},
			}
		})
	})

	afterEach(() => {
		jest.useRealTimers()
		jest.restoreAllMocks()
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

	it('catches up to the real time when the app returns to the foreground', async () => {
		jest.setSystemTime(new Date('2019-12-18T18:02:50Z'))

		let {result} = await renderHook(() => useMomentTimer({intervalMs: ONE_MINUTE, timezone: 'UTC'}))

		await backgroundFor(ONE_MINUTE * 20)

		expect(result.current.now.format('h:mma')).toBe('6:22pm')
	})

	it('ignores transitions that are not to the foreground', async () => {
		jest.setSystemTime(new Date('2019-12-18T18:02:50Z'))

		let {result} = await renderHook(() => useMomentTimer({intervalMs: ONE_MINUTE, timezone: 'UTC'}))

		await sendAppState('background')
		jest.setSystemTime(Date.now() + ONE_MINUTE * 20)
		await sendAppState('inactive')

		expect(result.current.now.format('h:mma')).toBe('6:02pm')
	})

	it('stops listening for the foreground once unmounted', async () => {
		// A listener left behind outlives the screen that registered it, and keeps
		// ticking a hook nobody is rendering.
		jest.setSystemTime(new Date('2019-12-18T18:02:50Z'))

		let {unmount} = await renderHook(() =>
			useMomentTimer({intervalMs: ONE_MINUTE, timezone: 'UTC'}),
		)

		await unmount()

		expect(appStateHandlers).toHaveLength(0)
	})
})

describe('a frozen clock', () => {
	afterEach(() => {
		useNowOverride.getState().clear()
	})

	it('reports the frozen moment rather than the real one', () => {
		useNowOverride.getState().freeze(moment.tz('2026-09-07 10:05', 'America/Chicago'))

		expect(now().format('YYYY-MM-DD HH:mm')).toBe('2026-09-07 10:05')
	})

	it('goes back to the real clock when cleared', () => {
		useNowOverride.getState().freeze(moment.tz('2026-09-07 10:05', 'America/Chicago'))
		useNowOverride.getState().clear()

		expect(now().format('YYYY-MM-DD HH:mm')).not.toBe('2026-09-07 10:05')
	})
})
