import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import type * as ExpoRouterMock from '../../testing/expo-router-mock'
import {LayoutMenu} from '../layout-menu'

jest.mock('expo-router', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	let mock: typeof ExpoRouterMock = require('../../testing/expo-router-mock')
	return {Stack: mock.Stack}
})

const menuItem = (name: string) => screen.getByRole('menuitem', {name})
const isChecked = (name: string) => Boolean(menuItem(name).props.accessibilityState?.checked)

describe('LayoutMenu', () => {
	it('checks the layout the screen is drawing', async () => {
		await render(<LayoutMenu layout="grid" onChange={jest.fn()} />)

		expect(isChecked('Grid')).toBe(true)
		expect(isChecked('List')).toBe(false)
	})

	it('reports the layout picked', async () => {
		let onChange = jest.fn()
		await render(<LayoutMenu layout="grid" onChange={onChange} />)

		fireEvent.press(menuItem('List'))

		expect(onChange).toHaveBeenCalledWith('list')
	})
})
