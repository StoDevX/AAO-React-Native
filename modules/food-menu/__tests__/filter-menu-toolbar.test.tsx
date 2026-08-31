import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'
import moment from 'moment'

import {FilterMenuToolbar} from '../filter-menu-toolbar'
import type {FilterIcon, FilterType, ListItemSpecType} from '@frogpond/filter'

// `@frogpond/filter`'s `FilterMenu`/`FilterSheet` render `@expo/ui/swift-ui`
// directly, which cannot mount under Jest.
jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

type Item = {label: string}

// `showIcons` puts this filter into `filterShape`'s sheet branch regardless
// of its one option -- the shape that actually draws whatever `iconFor`
// returns.
let DIETARY_FILTER: FilterType<Item> = {
	type: 'list',
	key: 'dietary',
	enabled: false,
	spec: {
		title: 'Dietary Restrictions',
		showIcons: true,
		options: [{title: 'Vegan'}],
		selected: [],
		mode: 'AND',
		displayTitle: true,
	},
	apply: {key: 'label'},
}

describe('FilterMenuToolbar', () => {
	// The meal picker is a `picker` filter, which `filterShape` only ever
	// renders as a native `Menu` -- its `label` prop is its own trigger, so
	// there is no separate button here. `FilterMenuToolbar` still hardcodes
	// `isActive={false}` for it (choosing a meal isn't "narrowing" the way an
	// enabled filter is), which shows up as the `Menu`'s own inactive
	// modifiers, since the trigger and the menu are the same thing. The style
	// entry is compared against `filter-menu.tsx`'s own exported constant
	// rather than a literal shape, so this mock's invented `Modifier`
	// representation can't stand in for it; the identifier is built with the
	// same mocked `modifiers` module the component calls, for the same reason.
	// `FilterMenuToolbar` forwards its own `iconFor` prop to the `FilterToolbar`
	// it renders for every non-picker filter -- covering that forward here,
	// with every component real except `@expo/ui` itself, is what catches a
	// mutation that drops the prop at this specific hop, independent of
	// whether `@frogpond/filter`'s own components forward it correctly.
	test('forwards iconFor to a sheet-shaped filter', async () => {
		let iconFor = (option: ListItemSpecType): FilterIcon | null =>
			option.title === 'Vegan' ? {kind: 'localFile', uri: 'file:///tmp/vegan.png'} : null

		await render(
			<FilterMenuToolbar
				date={moment('2026-08-30')}
				filters={[DIETARY_FILTER]}
				iconFor={iconFor}
				isOpen={true}
				onChange={jest.fn()}
			/>,
		)

		await fireEvent.press(screen.getByRole('button', {name: 'Dietary Restrictions'}))

		expect(screen.getByTestId('icon-file:///tmp/vegan.png')).toBeTruthy()
	})
})
