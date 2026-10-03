import * as React from 'react'
import {describe, expect, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'

import {CreditsMenu} from '../player-view/credits-menu'
import {STATIONS} from '../stations'

describe('CreditsMenu', () => {
	test('lists a credit for each station', async () => {
		await render(<CreditsMenu />)

		expect(screen.getByRole('button', {name: STATIONS.ksto.stationName})).toBeTruthy()
		expect(screen.getByRole('button', {name: STATIONS.krlx.stationName})).toBeTruthy()
	})
})
