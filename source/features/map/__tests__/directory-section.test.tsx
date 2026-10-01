import React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {List} from '@expo/ui/swift-ui'

import {DirectorySection} from '../card/directory-section'
import type {BuildingDirectory} from '../directory/types'

const directory: BuildingDirectory = {
	building: 'toh',
	floors: [
		{name: 'Ground floor', entries: [{name: 'College Events', room: '021'}]},
		{name: '1st floor', entries: [{name: 'Financial Aid', room: '120'}, {name: 'Registrar'}]},
	],
}

describe('DirectorySection', () => {
	test('lists each floor, and stacks the one tapped', async () => {
		let onOpen = jest.fn()
		await render(
			<List>
				<DirectorySection directory={directory} onOpen={onOpen} />
			</List>,
		)

		expect(screen.getByText('Directory')).toBeTruthy()
		await fireEvent.press(screen.getByRole('button', {name: '1st floor, 2 places'}))
		expect(onOpen).toHaveBeenCalledWith({kind: 'floor', building: 'toh', floor: 1})
	})

	test('draws nothing for a building without a directory', async () => {
		await render(
			<List>
				<DirectorySection directory={undefined} onOpen={jest.fn()} />
			</List>,
		)
		expect(screen.queryByText('Directory')).toBeNull()
	})
})
