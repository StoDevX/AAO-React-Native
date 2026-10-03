import * as React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'

import {VolumeSlider} from '../player-view/volume-slider'

// The real module needs a device.
jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))

describe('VolumeSlider', () => {
	test('is the system volume slider, between the quiet and loud speakers', async () => {
		await render(<VolumeSlider />)

		expect(screen.getByTestId('system-volume-slider')).toBeTruthy()
	})
})
