import {describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'

import {makeBuilding} from './fixtures'
import type {MapPins} from '../lib/map-pins'
import {useFrameRequests} from '../use-frame-requests'

const place = makeBuilding({id: 'a', name: 'Alpha Hall'})
const pinsAt = (frameKey: number): MapPins => ({places: [place], color: 'rgb(0, 0, 0)', frameKey})

async function renderRequests(initial: MapPins | null) {
	let frame = jest.fn<(pins: MapPins) => void>()
	let hook = await renderHook(({pins}: {pins: MapPins | null}) => useFrameRequests(pins, frame), {
		initialProps: {pins: initial},
	})
	return {frame, rerender: (pins: MapPins | null) => hook.rerender({pins})}
}

describe('useFrameRequests', () => {
	test('frames a new request', async () => {
		let {frame, rerender} = await renderRequests(null)
		await rerender(pinsAt(1))
		expect(frame).toHaveBeenCalledTimes(1)
	})

	test('never frames pins no one asked to frame', async () => {
		let {frame} = await renderRequests(pinsAt(0))
		expect(frame).not.toHaveBeenCalled()
	})

	// The key rides on pins that come and go: a search after Cancel, or typing
	// after Back, brings pins back carrying a key already framed.
	test('does not frame again when pins return with a key already framed', async () => {
		let {frame, rerender} = await renderRequests(null)
		await rerender(pinsAt(1))
		await rerender(null)
		await rerender(pinsAt(1))
		expect(frame).toHaveBeenCalledTimes(1)
	})

	test('does not frame when only the places change', async () => {
		let {frame, rerender} = await renderRequests(null)
		await rerender(pinsAt(1))
		await rerender({...pinsAt(1), places: []})
		expect(frame).toHaveBeenCalledTimes(1)
	})

	test('frames each later request', async () => {
		let {frame, rerender} = await renderRequests(null)
		await rerender(pinsAt(1))
		await rerender(null)
		await rerender(pinsAt(2))
		expect(frame).toHaveBeenCalledTimes(2)
	})
})
