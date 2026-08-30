import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'
import moment from 'moment-timezone'
import {useQuery} from '@tanstack/react-query'

import StreamingPage from '../index'
import type {StreamType} from '../../../../source/features/streaming/streams/types'
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
jest.mock('@tanstack/react-query', () => ({
	...(jest.requireActual('@tanstack/react-query') as object),
	useQuery: jest.fn(),
}))

function makeStream(overrides: Partial<StreamType> = {}): StreamType {
	return {
		category: 'Music',
		eid: '1',
		iframesrc: '',
		lastmod: '',
		player: '',
		poster: '',
		starttime: '2026-08-30T12:00:00Z',
		status: 'upcoming',
		thumb: '',
		title: 'Test stream',
		date: moment('2026-08-30T12:00:00Z'),
		...overrides,
	}
}

describe('StreamingPage', () => {
	// This feed's Categories filter never reaches `filterShape`'s sheet
	// threshold, so it always renders as a native `Menu` -- its `label` prop
	// is its own trigger, with no separate button here. `enabled` still
	// reaches the trigger's own modifiers, though: this asserts it stays
	// inactive here, since selecting every option in OR mode narrows
	// nothing. Compared by identity against `filter-menu.tsx`'s own exported
	// constant, not a literal shape, so this mock's invented `Modifier`
	// representation can't leak into the assertion.
	test('renders the Categories filter as an inactive-styled menu, with no separate button', async () => {
		let streams = [
			makeStream({eid: '1', category: 'Music'}),
			makeStream({eid: '2', category: 'Sports'}),
		]

		;(useQuery as unknown as jest.Mock).mockReturnValue({
			data: streams,
			error: null,
			isLoading: false,
			isError: false,
			isRefetching: false,
			refetch: jest.fn(),
		})

		await render(<StreamingPage />)

		expect(screen.queryByRole('button', {name: 'Categories'})).toBeNull()
		expect(screen.getByTestId('menu:Categories').props.modifiers).toEqual([
			...INACTIVE_TRIGGER_MODIFIERS,
			accessibilityIdentifier(`${FILTER_TRIGGER_PREFIX}category`),
		])
	})
})
