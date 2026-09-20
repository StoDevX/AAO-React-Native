import React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {render} from '@testing-library/react-native'

import {TimetableRow} from '../timetable-row'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../../testing/expo-ui-mock') as typeof import('../../../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../../testing/expo-ui-mock') as typeof import('../../../../../testing/expo-ui-mock')
})

function renderRow(props: {busProgress?: number; busAtStop?: boolean; rowHeight: number | null}) {
	return render(
		<TimetableRow
			accessibilityLabel="Carleton, 1:05 PM"
			barColor="#ff0000"
			currentStopColor="#aa0000"
			detail="1:05 PM"
			isFirstRow={false}
			isLastRow={false}
			stopStatus="before"
			title="Carleton"
			{...props}
		/>,
	)
}

describe('TimetableRow', () => {
	test('holds a bus in transit until a row height has been measured', async () => {
		let {queryAllByTestId} = await renderRow({busProgress: 0.5, rowHeight: null})

		expect(queryAllByTestId('symbol-bus.fill')).toHaveLength(0)
	})

	test('draws a bus in transit once the row height is known', async () => {
		let {getAllByTestId} = await renderRow({busProgress: 0.5, rowHeight: 60})

		expect(getAllByTestId('symbol-bus.fill')).toHaveLength(1)
	})

	test('draws a bus at the stop whether or not the height is known', async () => {
		let {getAllByTestId} = await renderRow({busAtStop: true, rowHeight: null})

		expect(getAllByTestId('symbol-bus.fill')).toHaveLength(1)
	})
})
