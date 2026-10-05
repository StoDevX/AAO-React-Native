import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {SportsMenu} from '../sports-menu'
import type {SportSection} from '../types'

// Wiring only: that the menu lists the sports it is given and hands a choice
// back. Which sports go in which section is `sportFilterSections`', asserted
// in utils.test.ts.

const SECTIONS: SportSection[] = [
	{title: "Women's Sports", data: ["Women's Soccer"]},
	{title: 'Other Sports', data: ['Volleyball']},
]

function menu(overrides = {}): React.ReactElement {
	return (
		<SportsMenu
			onReset={jest.fn()}
			onToggleSport={jest.fn()}
			sections={SECTIONS}
			selectedSports={[]}
			{...overrides}
		/>
	)
}

test('names a sport without the division prefix its section already states', async () => {
	await render(menu())
	expect(screen.getByText('Soccer')).toBeTruthy()
})

test('toggling a sport hands back its full name', async () => {
	let onToggleSport = jest.fn()
	await render(menu({onToggleSport}))

	fireEvent.press(screen.getByText('Soccer'))

	expect(onToggleSport).toHaveBeenCalledWith("Women's Soccer")
})

test('Reset Filters is absent while every sport shows', async () => {
	await render(menu())
	expect(screen.queryByText('Reset Filters')).toBeNull()
})

test('Reset Filters is offered once a sport is chosen, and resets', async () => {
	let onReset = jest.fn()
	await render(menu({onReset, selectedSports: ['Volleyball']}))

	fireEvent.press(screen.getByText('Reset Filters'))

	expect(onReset).toHaveBeenCalled()
})
