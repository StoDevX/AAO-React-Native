import {createNavigationGuard} from '../navigation-guard'

const SETTLE_MS = 400
const TIMEOUT_MS = 2000

describe('createNavigationGuard', () => {
	beforeEach(() => {
		jest.useFakeTimers()
	})

	afterEach(() => {
		jest.useRealTimers()
	})

	test('passes the first navigation through with its arguments', () => {
		let guard = createNavigationGuard({settleMs: SETTLE_MS, timeoutMs: TIMEOUT_MS})
		let navigate = jest.fn()

		guard.wrap(navigate)('/hours', {a: 1})

		expect(navigate).toHaveBeenCalledWith('/hours', {a: 1})
	})

	test('drops a second navigation while the first is still pending', () => {
		let guard = createNavigationGuard({settleMs: SETTLE_MS, timeoutMs: TIMEOUT_MS})
		let navigate = jest.fn()
		let wrapped = guard.wrap(navigate)

		wrapped('/calendar')
		wrapped('/hours')

		expect(navigate).toHaveBeenCalledTimes(1)
		expect(navigate).toHaveBeenCalledWith('/calendar')
	})

	test('shares one pending navigation across every wrapped function', () => {
		let guard = createNavigationGuard({settleMs: SETTLE_MS, timeoutMs: TIMEOUT_MS})
		let navigate = jest.fn()
		let push = jest.fn()

		guard.wrap(navigate)('/calendar')
		guard.wrap(push)('/hours')

		expect(push).not.toHaveBeenCalled()
	})

	test('holds the lock until the stack has settled after a state change', () => {
		let guard = createNavigationGuard({settleMs: SETTLE_MS, timeoutMs: TIMEOUT_MS})
		let navigate = jest.fn()
		let wrapped = guard.wrap(navigate)

		wrapped('/calendar')
		guard.stateChanged()
		jest.advanceTimersByTime(SETTLE_MS - 1)
		wrapped('/hours')
		expect(navigate).toHaveBeenCalledTimes(1)

		jest.advanceTimersByTime(1)
		wrapped('/hours')
		expect(navigate).toHaveBeenCalledTimes(2)
	})

	test('ignores a state change nobody was waiting for', () => {
		let guard = createNavigationGuard({settleMs: SETTLE_MS, timeoutMs: TIMEOUT_MS})
		let navigate = jest.fn()
		let wrapped = guard.wrap(navigate)

		guard.stateChanged()
		wrapped('/calendar')
		jest.advanceTimersByTime(SETTLE_MS)
		wrapped('/hours')

		expect(navigate).toHaveBeenCalledTimes(1)
	})

	test('lets go after the timeout when the stack never changes', () => {
		let guard = createNavigationGuard({settleMs: SETTLE_MS, timeoutMs: TIMEOUT_MS})
		let navigate = jest.fn()
		let wrapped = guard.wrap(navigate)

		// navigating to the screen already on top changes no state
		wrapped('/calendar')
		jest.advanceTimersByTime(TIMEOUT_MS)
		wrapped('/calendar')

		expect(navigate).toHaveBeenCalledTimes(2)
	})

	test('does not extend the lock when it drops a navigation', () => {
		let guard = createNavigationGuard({settleMs: SETTLE_MS, timeoutMs: TIMEOUT_MS})
		let navigate = jest.fn()
		let wrapped = guard.wrap(navigate)

		wrapped('/calendar')
		jest.advanceTimersByTime(TIMEOUT_MS - 1)
		wrapped('/hours')
		jest.advanceTimersByTime(1)
		wrapped('/hours')

		expect(navigate).toHaveBeenCalledTimes(2)
	})
})
