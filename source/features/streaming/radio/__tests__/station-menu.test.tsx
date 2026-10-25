import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {openUrl} from '@frogpond/open-url'

import {useIsDevMode} from '../../../../lib/use-is-dev-mode'
import {StationMenu} from '../player-view/station-menu'
import {STATIONS} from '../stations'
import {useRadioStore} from '../store'

jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))
jest.mock('../../../telemetry/track', () => ({track: jest.fn()}))
// Dev mode is a Redux setting; here a test says whether it is on.
jest.mock('../../../../lib/use-is-dev-mode', () => ({useIsDevMode: jest.fn(() => false)}))

describe('StationMenu', () => {
	beforeEach(() => {
		useRadioStore.setState({
			sheetOpen: true,
			fullScheduleOpen: false,
			devSettingsOpen: false,
			viewedStationId: 'krlx',
		})
		jest.mocked(useIsDevMode).mockReturnValue(false)
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

	test('Radio Dev Settings, in dev mode, stacks over the sheet, which stays open beneath it', async () => {
		jest.mocked(useIsDevMode).mockReturnValue(true)
		await render(<StationMenu station={STATIONS.krlx} />)
		await fireEvent.press(screen.getByRole('button', {name: 'Dev Settings'}))
		expect(useRadioStore.getState().devSettingsOpen).toBe(true)
		expect(useRadioStore.getState().sheetOpen).toBe(true)
	})
})
