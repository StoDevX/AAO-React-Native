import React from 'react'
import {Linking} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {openUrl} from '@frogpond/open-url'

import {BuildingInfo} from '../building-info'
import {makeBuilding} from './fixtures'

jest.mock('@expo/ui/swift-ui', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))

const mockOpenUrl = jest.mocked(openUrl)

let mockOpenURL: jest.SpyInstance<Promise<unknown>, [url: string]>

beforeEach(() => {
	mockOpenURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
})

afterEach(() => {
	jest.restoreAllMocks()
	mockOpenUrl.mockClear()
})

describe('BuildingInfo', () => {
	it('hands the address to Maps over https', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({
					id: 'a',
					name: 'Alpha Hall',
					address: '1520 St Olaf Ave',
				})}
				onClose={jest.fn()}
			/>,
		)

		await fireEvent.press(screen.getByText('1520 St Olaf Ave'))

		expect(mockOpenURL).toHaveBeenCalledWith(
			'https://maps.apple.com/?q=1520%20St%20Olaf%20Ave',
		)
	})

	it('opens a parsed department link', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({
					id: 'a',
					name: 'Alpha Hall',
					departments: ['Registrar <https://wp.stolaf.edu/registrar>'],
				})}
				onClose={jest.fn()}
			/>,
		)

		await fireEvent.press(screen.getByText('Registrar'))

		expect(mockOpenUrl).toHaveBeenCalledWith('https://wp.stolaf.edu/registrar')
	})

	it('resolves a photo filename against the photo host', async () => {
		await render(
			<BuildingInfo
				building={makeBuilding({
					id: 'a',
					name: 'Leighton Hall',
					photos: ['leighton.jpg'],
				})}
				onClose={jest.fn()}
			/>,
		)

		// ccc-server stores a bare filename, not a URL; the images live in
		// carls-app/map-data.
		expect(
			screen.getByLabelText('Photo of Leighton Hall').props.source,
		).toEqual({
			uri: 'https://carls-app.github.io/map-data/cache/img/leighton.jpg',
		})
	})

	it('offers a way out when the building is missing', async () => {
		let onClose = jest.fn()
		await render(<BuildingInfo building={undefined} onClose={onClose} />)

		expect(screen.getByText(/not found/iu)).toBeTruthy()
		await fireEvent.press(screen.getByLabelText('Close'))
		expect(onClose).toHaveBeenCalled()
	})
})
