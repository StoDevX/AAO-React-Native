import {beforeEach, describe, expect, test} from '@jest/globals'
import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {StationMenu} from '../player-view/station-menu'
import {STATIONS} from '../stations'
import {useRadioStore} from '../store'

describe('StationMenu', () => {
	beforeEach(() => {
		useRadioStore.setState({sheetOpen: true, fullScheduleOpen: false, viewedStationId: 'krlx'})
	})

	test('Full Schedule stacks over the sheet, which stays open beneath it', async () => {
		await render(<StationMenu station={STATIONS.krlx} />)
		await fireEvent.press(screen.getByRole('button', {name: 'Full Schedule'}))
		expect(useRadioStore.getState().fullScheduleOpen).toBe(true)
		expect(useRadioStore.getState().sheetOpen).toBe(true)
	})
})
