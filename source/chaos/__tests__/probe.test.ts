import {useChaosFindings} from '../findings'
import {installProbe, type ErrorHandler, type RejectionTrackerOptions} from '../probe'

function host() {
	let handler: ErrorHandler = jest.fn()
	let previous = handler
	let originalError = jest.fn()
	let tracker: RejectionTrackerOptions | null = null
	let errorUtils = {
		getGlobalHandler: () => handler,
		setGlobalHandler: (next: ErrorHandler) => {
			handler = next
		},
	}
	let consoleLike = {error: originalError}
	return {
		host: {
			errorUtils,
			console: consoleLike,
			enableRejectionTracker: (options: RejectionTrackerOptions) => {
				tracker = options
			},
		},
		previous,
		originalError,
		current: () => handler,
		consoleLike,
		tracker: () => tracker,
	}
}

beforeEach(() => {
	useChaosFindings.setState({latest: '', file: null})
})

describe('installProbe', () => {
	test('reports a fatal and keeps the app alive', () => {
		let h = host()
		installProbe(h.host)
		h.current()(new Error('boom'), true)
		expect(useChaosFindings.getState().latest).toBe('fatal: boom')
		expect(h.previous).not.toHaveBeenCalled()
	})

	test('passes a non-fatal error on to the previous handler', () => {
		let h = host()
		installProbe(h.host)
		let error = new Error('soft')
		h.current()(error, false)
		expect(h.previous).toHaveBeenCalledWith(error, false)
	})

	test('reports an unhandled rejection', () => {
		let h = host()
		installProbe(h.host)
		h.tracker()?.onUnhandled(1, new Error('nobody caught me'))
		expect(useChaosFindings.getState().latest).toBe('unhandled-rejection: nobody caught me')
	})

	test('records console.error and still prints it', () => {
		let h = host()
		installProbe(h.host)
		let error = new Error('printed')
		h.consoleLike.error('Warning:', error)
		expect(h.originalError).toHaveBeenCalledWith('Warning:', error)
		expect(useChaosFindings.getState().latest).toBe('')
	})

	test('does not throw on a console.error argument with a cycle', () => {
		let h = host()
		installProbe(h.host)
		let looped: Record<string, unknown> = {}
		looped.self = looped
		expect(() => h.consoleLike.error(looped)).not.toThrow()
	})

	test('does not throw on console.error with an object whose toString throws', () => {
		let h = host()
		installProbe(h.host)
		let evil = {
			toString() {
				throw new Error('x')
			},
		}
		expect(() => h.consoleLike.error(evil)).not.toThrow()
		expect(h.originalError).toHaveBeenCalledWith(evil)
	})
})
