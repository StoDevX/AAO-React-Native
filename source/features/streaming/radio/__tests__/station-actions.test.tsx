import * as React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {openUrl} from '@frogpond/open-url'

import {StationActionRow} from '../player-view/station-actions'
import {STATIONS} from '../stations'
import {useRadioStore} from '../store'

jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))
// The real module needs a native event emitter Jest lacks.
jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))

describe('StationActionRow', () => {
	beforeEach(() => {
		jest.mocked(openUrl).mockClear()
		useRadioStore.setState({stationId: null, playState: 'stopped'})
	})

	test('opens the chat room from Chat, for a station with one', async () => {
		await render(
			<StationActionRow onSelectPanel={jest.fn()} panel="record" station={STATIONS.krlx} />,
		)

		await fireEvent.press(screen.getByLabelText(`Chat with ${STATIONS.krlx.stationName}`))

		expect(openUrl).toHaveBeenCalledWith('https://minnit.chat/KRLX')
	})

	test('shows Chat unavailable, and opens nothing, for a station without a chat room', async () => {
		await render(
			<StationActionRow onSelectPanel={jest.fn()} panel="record" station={STATIONS.ksto} />,
		)

		await fireEvent.press(screen.getByLabelText('Chat unavailable'))

		expect(openUrl).not.toHaveBeenCalled()
		expect(screen.queryByLabelText(`Chat with ${STATIONS.ksto.stationName}`)).toBeNull()
	})

	test('offers AirPlay for every station, through the system route picker', async () => {
		await render(
			<StationActionRow onSelectPanel={jest.fn()} panel="record" station={STATIONS.ksto} />,
		)

		expect(screen.getByText('AirPlay')).toBeTruthy()
		expect(screen.getByTestId('airplay-route-picker')).toBeTruthy()
	})

	test('selects the schedule panel from Schedule', async () => {
		let onSelectPanel = jest.fn()
		await render(
			<StationActionRow onSelectPanel={onSelectPanel} panel="record" station={STATIONS.krlx} />,
		)

		await fireEvent.press(screen.getByLabelText("Today's schedule"))

		expect(onSelectPanel).toHaveBeenCalledWith('schedule')
	})

	test('selects the captions panel from Captions, once the station plays', async () => {
		useRadioStore.setState({stationId: 'krlx', playState: 'playing'})
		let onSelectPanel = jest.fn()
		await render(
			<StationActionRow onSelectPanel={onSelectPanel} panel="record" station={STATIONS.krlx} />,
		)

		await fireEvent.press(screen.getByLabelText('Captions'))

		expect(onSelectPanel).toHaveBeenCalledWith('captions')
	})

	test('dims Captions, and says why, for a station that is not playing', async () => {
		let onSelectPanel = jest.fn()
		await render(
			<StationActionRow onSelectPanel={onSelectPanel} panel="record" station={STATIONS.krlx} />,
		)

		await fireEvent.press(screen.getByLabelText('Captions need the station to be playing'))

		expect(onSelectPanel).not.toHaveBeenCalled()
	})

	test('dims Captions, and says why, for a station that cannot be captioned', async () => {
		useRadioStore.setState({stationId: 'ksto', playState: 'playing'})
		let onSelectPanel = jest.fn()
		await render(
			<StationActionRow onSelectPanel={onSelectPanel} panel="record" station={STATIONS.ksto} />,
		)

		await fireEvent.press(
			screen.getByLabelText(`Captions are not available for ${STATIONS.ksto.stationName}`),
		)

		expect(onSelectPanel).not.toHaveBeenCalled()
	})

	test('keeps Captions live while its panel shows, so the viewer can leave it', async () => {
		let onSelectPanel = jest.fn()
		await render(
			<StationActionRow onSelectPanel={onSelectPanel} panel="captions" station={STATIONS.krlx} />,
		)

		await fireEvent.press(screen.getByLabelText('Captions'))

		expect(onSelectPanel).toHaveBeenCalledWith('captions')
	})
})
