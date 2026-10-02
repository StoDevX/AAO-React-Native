import * as React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {openUrl} from '@frogpond/open-url'

import * as logos from '../../../../../images/streaming'
import {RadioControllerView} from '../controller'
import {tintedTheme} from '../theme'

jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))
// The real module needs a native event emitter Jest lacks.
jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
// The logo animates through Reanimated, whose worklets need a native runtime.
jest.mock('../scratchable-logo', () => ({ScratchableLogo: 'ScratchableLogo'}))
jest.mock('expo-router', () => ({
	useNavigation: () => ({getParent: () => undefined}),
	useRouter: () => ({navigate: jest.fn()}),
}))

const STATION_NAME = '88.1 KRLX-FM'

function renderStation(chatUrl?: string): Promise<unknown> {
	return render(
		<RadioControllerView
			chatUrl={chatUrl}
			logos={[
				{
					name: 'krlx 88.1',
					image: logos.krlx,
					theme: tintedTheme('#8a529e'),
					labelColor: '#f6f1e4',
				},
			]}
			playerUrl="https://live.krlx.org"
			scheduleHref="/krlx-schedule"
			source={{
				useEmbeddedPlayer: false,
				embeddedPlayerUrl: 'https://live.krlx.org',
				streamSourceUrl: 'http://stream.krlx.org:8000/_a',
			}}
			stationName={STATION_NAME}
			stationNumber="+15072224127"
			title="Carleton College Radio"
		/>,
	)
}

describe('RadioControllerView', () => {
	beforeEach(() => {
		jest.mocked(openUrl).mockClear()
	})

	test('opens the chat room from the chat link, for a station with one', async () => {
		await renderStation('https://minnit.chat/KRLX')

		await fireEvent.press(screen.getByRole('link', {name: `${STATION_NAME} chat`}))

		expect(openUrl).toHaveBeenCalledWith('https://minnit.chat/KRLX')
	})

	test('shows no chat link for a station without a chat room', async () => {
		await renderStation()

		expect(screen.queryByRole('link', {name: `${STATION_NAME} chat`})).toBeNull()
		expect(screen.getByRole('button', {name: `${STATION_NAME} schedule`})).toBeTruthy()
	})
})
