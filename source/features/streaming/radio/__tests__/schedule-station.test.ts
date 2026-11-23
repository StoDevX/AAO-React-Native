import {describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'

import type {StationId} from '../stations'
import {useScheduleStation} from '../use-shown-station'

type Props = {open: boolean; shown: StationId; on: readonly StationId[]}

function render(initial: Props, close: () => void) {
	return renderHook(
		(props: Props) =>
			useScheduleStation({
				open: props.open,
				shownStationId: props.shown,
				stationOn: (id) => props.on.includes(id),
				close,
			}),
		{initialProps: initial},
	)
}

describe('useScheduleStation', () => {
	test('keeps the station the schedule opened on while the player moves to another', async () => {
		let close = jest.fn()
		let {result, rerender} = await render({open: true, shown: 'ksto', on: ['ksto', 'krlx']}, close)

		await rerender({open: true, shown: 'krlx', on: ['ksto', 'krlx']})

		expect(result.current).toBe('ksto')
		expect(close).not.toHaveBeenCalled()
	})

	test('closes the schedule once its station is switched off', async () => {
		let close = jest.fn()
		let {result, rerender} = await render({open: true, shown: 'ksto', on: ['ksto', 'krlx']}, close)

		await rerender({open: true, shown: 'krlx', on: ['krlx']})

		expect(close).toHaveBeenCalledTimes(1)
		expect(result.current).toBe('ksto')
	})

	test('closes the schedule when the last station on is switched off', async () => {
		let close = jest.fn()
		let {rerender} = await render({open: true, shown: 'ksto', on: ['ksto']}, close)

		await rerender({open: true, shown: 'ksto', on: []})

		expect(close).toHaveBeenCalledTimes(1)
	})

	test('follows the player while the schedule is closed', async () => {
		let close = jest.fn()
		let {result, rerender} = await render({open: false, shown: 'ksto', on: ['ksto']}, close)

		await rerender({open: false, shown: 'krlx', on: []})

		expect(result.current).toBe('krlx')
		expect(close).not.toHaveBeenCalled()
	})
})
