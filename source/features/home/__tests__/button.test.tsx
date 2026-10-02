import * as React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'
import * as c from '@frogpond/colors'

import {HomeScreenButton} from '../button'
import type {ViewType} from '../../views'

const common = {title: 'Tile', icon: 'star.fill', gradient: c.blueGradient} as const

describe('HomeScreenButton', () => {
	test('tells VoiceOver a web link opens in a browser', async () => {
		let view: ViewType = {...common, type: 'url', url: 'https://example.com'}
		await render(<HomeScreenButton onPress={jest.fn()} view={view} />)
		expect(screen.getByRole('button', {name: 'Tile'}).props.accessibilityHint).toBe(
			'Opens in a browser',
		)
	})

	test('gives a native screen no hint', async () => {
		let view: ViewType = {...common, type: 'view', view: '/menus'}
		await render(<HomeScreenButton onPress={jest.fn()} view={view} />)
		expect(screen.getByRole('button', {name: 'Tile'}).props.accessibilityHint).toBeUndefined()
	})
})
