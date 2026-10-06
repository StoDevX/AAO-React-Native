import {corruptBody, faultStatus, pickFault, pickSessionFault} from '../faults'
import {seededRandom} from '../random'

describe('pickFault', () => {
	test('never faults at rate 0', () => {
		let random = seededRandom(1)
		for (let i = 0; i < 1000; i++) {
			expect(pickFault(random, 0)).toEqual({kind: 'none'})
		}
	})

	test('always faults at rate 1, and uses every kind', () => {
		let random = seededRandom(1)
		let kinds = new Set<string>()
		for (let i = 0; i < 2000; i++) {
			let fault = pickFault(random, 1)
			expect(fault.kind).not.toBe('none')
			kinds.add(fault.kind === 'status' ? `status-${fault.status}` : fault.kind)
		}
		expect([...kinds].sort()).toEqual(
			[
				'empty',
				'latency',
				'malformed',
				'mutated',
				'network',
				'status-404',
				'status-500',
				'truncated',
			].sort(),
		)
	})

	test('makes half of all faults mutations', () => {
		let random = seededRandom(11)
		let mutated = 0
		for (let i = 0; i < 10_000; i++) {
			if (pickFault(random, 1).kind === 'mutated') mutated++
		}
		expect(mutated / 10_000).toBeCloseTo(0.5, 1)
	})

	test('faults about as often as the rate says', () => {
		let random = seededRandom(9)
		let faults = 0
		for (let i = 0; i < 10_000; i++) {
			if (pickFault(random, 0.25).kind !== 'none') faults++
		}
		expect(faults / 10_000).toBeCloseTo(0.25, 1)
	})

	test('keeps latency between half a second and eight', () => {
		let random = seededRandom(3)
		for (let i = 0; i < 2000; i++) {
			let fault = pickFault(random, 1)
			if (fault.kind === 'latency') {
				expect(fault.delayMs).toBeGreaterThanOrEqual(500)
				expect(fault.delayMs).toBeLessThan(8000)
			}
		}
	})

	test('is the same for the same seed', () => {
		let a = seededRandom(5)
		let b = seededRandom(5)
		for (let i = 0; i < 100; i++) {
			expect(pickFault(a, 0.5)).toEqual(pickFault(b, 0.5))
		}
	})
})

describe('corruptBody', () => {
	let body = '{"items":[1,2,3]}'

	test('empties', () => {
		expect(corruptBody({kind: 'empty'}, body)).toBe('')
	})

	test('makes JSON unparseable', () => {
		expect(() => JSON.parse(corruptBody({kind: 'malformed'}, body))).toThrow()
	})

	test('truncates to half', () => {
		expect(corruptBody({kind: 'truncated'}, body)).toBe(body.slice(0, 8))
	})

	test('leaves other faults alone', () => {
		expect(corruptBody({kind: 'none'}, body)).toBe(body)
		expect(corruptBody({kind: 'latency', delayMs: 600}, body)).toBe(body)
	})
})

describe('faultStatus', () => {
	test('replaces the status for a status fault', () => {
		expect(faultStatus({kind: 'status', status: 500}, 200)).toBe(500)
	})

	test('keeps the real status otherwise', () => {
		expect(faultStatus({kind: 'empty'}, 200)).toBe(200)
	})
})

describe('pickSessionFault', () => {
	test('fails every request inside an offline window, and keeps its end', () => {
		let random = seededRandom(1)
		for (let i = 0; i < 100; i++) {
			expect(pickSessionFault(random, 1000, 5000)).toEqual({
				fault: {kind: 'network'},
				offline: true,
				offlineUntil: 5000,
			})
		}
	})

	test('starts a window of 5 to 30 seconds about 3% of the time', () => {
		let random = seededRandom(2)
		let started = 0
		for (let i = 0; i < 20_000; i++) {
			let picked = pickSessionFault(random, 1000, 0)
			if (picked.offline) {
				started++
				expect(picked.offlineUntil - 1000).toBeGreaterThanOrEqual(5000)
				expect(picked.offlineUntil - 1000).toBeLessThan(30_000)
			}
		}
		expect(started / 20_000).toBeCloseTo(0.03, 2)
	})

	test('faults about 5% of other requests: slow, a 500, or a mutation', () => {
		let random = seededRandom(3)
		let kinds = new Map<string, number>()
		let online = 0
		for (let i = 0; i < 50_000; i++) {
			let picked = pickSessionFault(random, 1000, 0)
			if (picked.offline) continue
			online++
			kinds.set(picked.fault.kind, (kinds.get(picked.fault.kind) ?? 0) + 1)
		}
		let faulted = online - (kinds.get('none') ?? 0)
		expect(faulted / online).toBeCloseTo(0.05, 2)
		expect([...kinds.keys()].sort()).toEqual(['latency', 'mutated', 'none', 'status'])
		expect((kinds.get('latency') ?? 0) / faulted).toBeCloseTo(0.4, 1)
		expect((kinds.get('status') ?? 0) / faulted).toBeCloseTo(0.3, 1)
	})

	test('draws seven times for every request, whatever it gets', () => {
		let draws = 0
		let counting = () => {
			draws++
			return 0.99
		}
		pickSessionFault(counting, 1000, 5000)
		expect(draws).toBe(7)
		draws = 0
		pickSessionFault(counting, 1000, 0)
		expect(draws).toBe(7)
	})
})
