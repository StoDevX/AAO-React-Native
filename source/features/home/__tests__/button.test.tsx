import * as React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'
import * as c from '@frogpond/colors'

import {HomeScreenButton} from '../button'
import type {ViewType} from '../../views'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

const common = {title: 'Tile', icon: 'star.fill', gradient: c.blueGradient} as const

describe('HomeScreenButton', () => {
	test('marks a web link with a globe', async () => {
		let view: ViewType = {...common, type: 'url', url: 'https://example.com'}
		await render(<HomeScreenButton onPress={jest.fn()} view={view} />)
		expect(screen.getByTestId('symbol-globe')).toBeTruthy()
	})

	test('leaves a native screen unmarked', async () => {
		let view: ViewType = {...common, type: 'view', view: '/Menus'}
		await render(<HomeScreenButton onPress={jest.fn()} view={view} />)
		expect(screen.queryByTestId('symbol-globe')).toBeNull()
	})
})
