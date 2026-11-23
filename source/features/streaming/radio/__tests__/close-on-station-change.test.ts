import {describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'

import type {StationId} from '../stations'
import {useClosesOnStationChange} from '../use-shown-station'

type Props = {open: boolean; stationId: StationId}

function render(initial: Props, close: () => void) {
	return renderHook(
		(props: Props) => useClosesOnStationChange(props.open, props.stationId, close),
		{
			initialProps: initial,
		},
	)
}

describe('useClosesOnStationChange', () => {
	test('closes an open schedule whose station is switched off for another', async () => {
		let close = jest.fn()
		let {rerender} = await render({open: true, stationId: 'ksto'}, close)

		await rerender({open: true, stationId: 'krlx'})

		expect(close).toHaveBeenCalledTimes(1)
	})

	test('leaves an open schedule alone while its station stays', async () => {
		let close = jest.fn()
		let {rerender} = await render({open: true, stationId: 'ksto'}, close)

		await rerender({open: true, stationId: 'ksto'})

		expect(close).not.toHaveBeenCalled()
	})

	test('does nothing while the schedule is closed', async () => {
		let close = jest.fn()
		let {rerender} = await render({open: false, stationId: 'ksto'}, close)

		await rerender({open: false, stationId: 'krlx'})
		await rerender({open: true, stationId: 'krlx'})

		expect(close).not.toHaveBeenCalled()
	})
})
