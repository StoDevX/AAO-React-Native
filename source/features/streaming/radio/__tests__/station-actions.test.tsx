import * as React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {openUrl} from '@frogpond/open-url'

import {StationActionRow} from '../player-view/station-actions'
import {STATIONS} from '../stations'

jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))
// The real module needs a native event emitter Jest lacks.
jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))

describe('StationActionRow', () => {
	beforeEach(() => {
		jest.mocked(openUrl).mockClear()
	})

	test('opens the chat room from Chat, for a station with one', async () => {
		await render(<StationActionRow onShowSchedule={jest.fn()} station={STATIONS.krlx} />)

		await fireEvent.press(screen.getByLabelText(`Chat with ${STATIONS.krlx.stationName}`))

		expect(openUrl).toHaveBeenCalledWith('https://minnit.chat/KRLX')
	})

	test('shows Chat unavailable, and opens nothing, for a station without a chat room', async () => {
		await render(<StationActionRow onShowSchedule={jest.fn()} station={STATIONS.ksto} />)

		await fireEvent.press(screen.getByLabelText('Chat unavailable'))

		expect(openUrl).not.toHaveBeenCalled()
		expect(screen.queryByLabelText(`Chat with ${STATIONS.ksto.stationName}`)).toBeNull()
	})
})
