import {useChaosFindings} from '../findings'
import {memoryLineFile} from '../line-file'
import {STALL_THRESHOLD_MS, STALL_TICK_MS, watchForStalls} from '../stall'
import {parseLines} from '../tape'

/** A clock and timer the test moves by hand. */
function host() {
	let time = 0
	let tick: () => void = () => undefined
	let appStateListener: () => void = () => undefined
	return {
		host: {
			setInterval: (next: () => void) => {
				tick = next
			},
			now: () => time,
			onAppStateChange: (listener: () => void) => {
				appStateListener = listener
			},
		},
		/** Fires the next tick `late` milliseconds after it was due. */
		tick: (late = 0) => {
			time += STALL_TICK_MS + late
			tick()
		},
		appStateChanged: () => appStateListener(),
	}
}

let findings = memoryLineFile()

function stalls() {
	return parseLines<{kind: string; message: string}>(findings.readLines()).filter(
		(finding) => finding.kind === 'stall',
	)
}

beforeEach(() => {
	findings = memoryLineFile()
	useChaosFindings.setState({latest: '', file: findings})
})

describe('watchForStalls', () => {
	test('ignores the first tick, which waits on the bundle and first render', () => {
		let clock = host()
		watchForStalls(clock.host)
		clock.tick(1400)
		clock.tick()
		clock.tick()
		expect(stalls()).toEqual([])
	})

	test('reports a tick more than a second late, a tick after it', () => {
		let clock = host()
		watchForStalls(clock.host)
		clock.tick()
		clock.tick(STALL_THRESHOLD_MS + 200)
		clock.tick()
		expect(stalls()).toEqual([expect.objectContaining({message: 'JS stalled 1200ms'})])
	})

	test('ignores a tick only a little late', () => {
		let clock = host()
		watchForStalls(clock.host)
		clock.tick(STALL_THRESHOLD_MS - 1)
		clock.tick()
		expect(stalls()).toEqual([])
	})

	test('ignores a late tick when the app state changed before it, as on return from the background', () => {
		let clock = host()
		watchForStalls(clock.host)
		clock.tick()
		clock.appStateChanged()
		clock.tick(5000)
		clock.tick()
		expect(stalls()).toEqual([])
	})

	test('ignores a late tick when the app state change arrives just after it', () => {
		let clock = host()
		watchForStalls(clock.host)
		clock.tick()
		clock.tick(5000)
		clock.appStateChanged()
		clock.tick()
		expect(stalls()).toEqual([])
	})

	test('never stops the run', () => {
		let clock = host()
		watchForStalls(clock.host)
		clock.tick()
		clock.tick(3000)
		clock.tick()
		expect(stalls()).toHaveLength(1)
		expect(useChaosFindings.getState().latest).toBe('')
	})
})
