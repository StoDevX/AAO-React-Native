import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {openUrl} from '@frogpond/open-url'

import {StationMenu} from '../player-view/station-menu'
import {STATIONS} from '../stations'
import {useRadioStore} from '../store'

jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))
jest.mock('../../../telemetry/track', () => ({track: jest.fn()}))

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

	test.each(['ksto', 'krlx'] as const)("Open Website opens %s's home page", async (id) => {
		await render(<StationMenu station={STATIONS[id]} />)
		await fireEvent.press(screen.getByRole('button', {name: 'Open Website'}))
		expect(openUrl).toHaveBeenCalledWith(STATIONS[id].websiteUrl)
	})
})
