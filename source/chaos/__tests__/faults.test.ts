import {corruptBody, faultStatus, pickFault} from '../faults'
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
