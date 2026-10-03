import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {StationMenu} from '../player-view/station-menu'
import {STATIONS} from '../stations'
import {useRadioStore} from '../store'

let mockNavigate = jest.fn()

jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	...(require('../../../../testing/expo-router-mock') as object),
	useRouter: () => ({navigate: mockNavigate}),
}))

describe('StationMenu', () => {
	beforeEach(() => {
		mockNavigate.mockClear()
		useRadioStore.setState({sheetOpen: true, viewedStationId: 'krlx'})
	})

	test('Full Schedule closes the sheet, so the schedule is not opened beneath it', async () => {
		await render(<StationMenu station={STATIONS.krlx} />)
		await fireEvent.press(screen.getByRole('button', {name: 'Full Schedule'}))
		expect(useRadioStore.getState().sheetOpen).toBe(false)
	})
})
