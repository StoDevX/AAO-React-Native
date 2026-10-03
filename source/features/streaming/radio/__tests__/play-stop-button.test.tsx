import * as React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {PlayStopButton} from '../player-view/play-stop-button'
import {STATIONS} from '../stations'
import {useRadioStore} from '../store'

// The real module needs a native event emitter Jest lacks.
jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))

const ERROR = {code: 4, message: 'The stream could not be played.'}

describe('PlayStopButton', () => {
	beforeEach(() => {
		useRadioStore.setState({stationId: null, playState: 'stopped', error: null, playerKey: 0})
	})

	test('offers Play for a station that is not loaded', async () => {
		await render(<PlayStopButton station={STATIONS.ksto} />)

		expect(screen.getByRole('button', {name: 'Play ' + STATIONS.ksto.stationName})).toBeTruthy()
	})

	test('offers Stop after the station fails, and Stop unloads it', async () => {
		useRadioStore.getState().play('ksto')
		useRadioStore.getState().reportError(1, ERROR)
		await render(<PlayStopButton station={STATIONS.ksto} />)

		await fireEvent.press(screen.getByRole('button', {name: 'Stop ' + STATIONS.ksto.stationName}))

		expect(useRadioStore.getState()).toMatchObject({stationId: null, error: null})
	})
})
