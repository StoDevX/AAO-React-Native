import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'
import moment from 'moment-timezone'
import {useQuery} from '@tanstack/react-query'

import StreamingPage from '../index'
import type {StreamType} from '../../../../source/features/streaming/streams/types'

jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
jest.mock('@frogpond/filter/filter-popover', () => ({FilterPopover: () => null}))
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
	test('does not mark the Categories filter as active before the viewer chooses anything', async () => {
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

		let button = screen.getByRole('button', {name: 'Categories'})
		expect(button.props.accessibilityState).toEqual({selected: false})
	})
})
