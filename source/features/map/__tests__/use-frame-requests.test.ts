import {describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'

import {makeBuilding} from './fixtures'
import type {MapPins} from '../lib/map-pins'
import {useFrameRequests} from '../use-frame-requests'

const place = makeBuilding({id: 'a', name: 'Alpha Hall'})
const pinsAt = (frameKey: number): MapPins => ({places: [place], color: 'rgb(0, 0, 0)', frameKey})

async function renderRequests(initial: MapPins | null) {
	let frame = jest.fn<(pins: MapPins) => void>()
	let hook = await renderHook(
		({pins, placeOpen}: {pins: MapPins | null; placeOpen: boolean}) =>
			useFrameRequests(pins, placeOpen, frame),
		{initialProps: {pins: initial, placeOpen: false}},
	)
	return {
		frame,
		rerender: (pins: MapPins | null, placeOpen = false) => hook.rerender({pins, placeOpen}),
	}
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

	// Tapping a row while the search is still being edited opens its card,
	// which ends the editing -- and a search that ends with text asks for its
	// results to be framed. The place the row opened is what the camera goes to.
	test('does not frame a request made while a place is open', async () => {
		let {frame, rerender} = await renderRequests(null)
		await rerender(pinsAt(1), true)
		expect(frame).not.toHaveBeenCalled()
	})

	test('does not frame that request once the place closes', async () => {
		let {frame, rerender} = await renderRequests(null)
		await rerender(pinsAt(1), true)
		await rerender(pinsAt(1), false)
		expect(frame).not.toHaveBeenCalled()
	})
})
