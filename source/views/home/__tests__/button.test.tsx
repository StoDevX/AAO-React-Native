import React from 'react'
import {describe, it, expect} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'

jest.mock('@react-native-vector-icons/entypo', () => ({
	Entypo: 'Icon',
}))

import {HomeScreenButton} from '../button'
import type {ViewType} from '../../views'

const baseView: ViewType = {
	id: 'menus',
	type: 'view',
	view: 'Menus',
	title: 'Menus',
	icon: 'bowl',
	foreground: 'light',
	tint: '#3478F6',
}

describe('HomeScreenButton', () => {
	it('renders the title text at size 1x2 (default)', () => {
		render(<HomeScreenButton view={baseView} size="1x2" onPress={() => {}} />)
		expect(screen.getByText('Menus')).toBeTruthy()
	})

	it('renders the title text at size 2x2', () => {
		render(<HomeScreenButton view={baseView} size="2x2" onPress={() => {}} />)
		expect(screen.getByText('Menus')).toBeTruthy()
	})

	it('renders the title text at size 2x4', () => {
		render(<HomeScreenButton view={baseView} size="2x4" onPress={() => {}} />)
		expect(screen.getByText('Menus')).toBeTruthy()
	})

	it('hides the title text at size 1x1 (icon-only)', () => {
		render(<HomeScreenButton view={baseView} size="1x1" onPress={() => {}} />)
		expect(screen.queryByText('Menus')).toBeNull()
	})

	it('always exposes the title via accessibilityLabel, including at 1x1', () => {
		render(<HomeScreenButton view={baseView} size="1x1" onPress={() => {}} />)
		expect(screen.getByLabelText('Menus')).toBeTruthy()
	})
})
