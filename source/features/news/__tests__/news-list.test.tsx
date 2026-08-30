import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'
import type {UseQueryResult} from '@tanstack/react-query'

import {NewsList} from '../news-list'
import type {StoryType} from '../types'
import {INACTIVE_TRIGGER_MODIFIERS} from '@frogpond/filter/filter-menu'
import {FILTER_TRIGGER_PREFIX} from '@frogpond/filter/lib/trigger-modifiers'
import {accessibilityIdentifier} from './expo-ui-mock'

jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('./expo-ui-mock') as typeof import('./expo-ui-mock')
})

function makeStory(overrides: Partial<StoryType> = {}): StoryType {
	return {
		authors: [],
		categories: ['Campus & Community'],
		content: '<p>Content</p>',
		excerpt: 'An excerpt',
		title: 'Test story',
		...overrides,
	}
}

function makeQuery(
	overrides: Partial<UseQueryResult<StoryType[]>> = {},
): UseQueryResult<StoryType[]> {
	return {
		data: [],
		error: null,
		isLoading: false,
		isError: false,
		isRefetching: false,
		refetch: jest.fn(),
		...overrides,
	} as unknown as UseQueryResult<StoryType[]>
}

describe('NewsList', () => {
	// This feed's Categories filter never reaches `filterShape`'s sheet
	// threshold, so it always renders as a native `Menu` -- its `label` prop
	// is its own trigger, with no separate button here. `enabled` still
	// reaches the trigger's own modifiers, though: this asserts it stays
	// inactive here, since selecting every option in OR mode narrows
	// nothing. Compared by identity against `filter-menu.tsx`'s own exported
	// constant, not a literal shape, so this mock's invented `Modifier`
	// representation can't leak into the assertion.
	test('renders the Categories filter as an inactive-styled menu, with no separate button', async () => {
		let stories = [
			makeStory({title: 'Campus story', categories: ['Campus & Community']}),
			makeStory({title: 'Sports story', categories: ['Sports']}),
		]

		await render(<NewsList query={makeQuery({data: stories})} thumbnail={false} />)

		expect(screen.queryByRole('button', {name: 'Categories'})).toBeNull()
		expect(screen.getByTestId('menu:Categories').props.modifiers).toEqual([
			...INACTIVE_TRIGGER_MODIFIERS,
			accessibilityIdentifier(`${FILTER_TRIGGER_PREFIX}category`),
		])
	})
})
