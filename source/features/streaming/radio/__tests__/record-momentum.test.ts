import {describe, expect, test} from '@jest/globals'

import {recordMomentum} from '../record-momentum'

describe('recordMomentum', () => {
	test.each([
		{release: -500, target: 200},
		{release: 500, target: 200},
		{release: -500, target: 0},
		{release: 500, target: 0},
	])('leaves the finger at $release degrees/s and settles toward $target', ({release, target}) => {
		let momentum = recordMomentum(release, target)
		expect(momentum).not.toBeNull()
		if (!momentum) throw new Error('Expected a coast')

		let seconds = momentum.duration / 1000
		let angle = (time: number) =>
			target * time + momentum.rotation * momentum.easing(time / seconds)
		let step = 0.00001
		expect(angle(0)).toBe(0)
		expect((angle(step) - angle(0)) / step).toBeCloseTo(release, 1)
		let finalVelocity = (angle(seconds) - angle(seconds - step)) / step
		expect(Math.abs(finalVelocity - target)).toBeCloseTo(1, 2)
		expect(momentum.duration).toBeGreaterThan(1500)
		expect(momentum.duration).toBeLessThan(2200)
	})

	test('a backspin slows, reverses, and resumes clockwise playback', () => {
		let momentum = recordMomentum(-500, 200)
		if (!momentum) throw new Error('Expected a coast')
		let angle = (time: number) =>
			200 * time + momentum.rotation * momentum.easing((time * 1000) / momentum.duration)

		expect(angle(0.05)).toBeLessThan(angle(0))
		expect(angle(0.3)).toBeLessThan(angle(0.29))
		expect(angle(0.6)).toBeGreaterThan(angle(0.59))
	})

	test.each([-500, 500])('a stopped record coasts in its flick direction (%s)', (release) => {
		let momentum = recordMomentum(release, 0)
		if (!momentum) throw new Error('Expected a coast')
		let early = momentum.rotation * momentum.easing(0.1)
		let late = momentum.rotation * momentum.easing(0.9)
		expect(Math.sign(early)).toBe(Math.sign(release))
		expect(Math.abs(late)).toBeGreaterThan(Math.abs(early))
		expect(momentum.rotation * momentum.easing(1)).toBeCloseTo(momentum.rotation)
	})

	test('gentler flicks settle sooner', () => {
		let gentle = recordMomentum(-100, 0)
		let firm = recordMomentum(-500, 0)
		expect(gentle?.duration).toBeLessThan(firm?.duration ?? 0)
	})

	test.each([
		{release: 200, target: 200},
		{release: 200.5, target: 200},
		{release: 199, target: 200},
		{release: 0, target: 0},
	])('needs no coast when $release is already near $target', ({release, target}) => {
		expect(recordMomentum(release, target)).toBeNull()
	})
})
