import * as React from 'react'
import {render, screen} from '@testing-library/react-native'

import {EntryDiff} from '../entry-diff'
import {diffEntry} from '../lib/diff'
import {deleteSense, moveSense, setSenseField, startDraft} from '../lib/draft'
import {normalizeEntry} from '../lib/entry'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

const twoSenses = () =>
	startDraft(normalizeEntry({word: 'ACM', senses: [{definition: 'One.'}, {definition: 'Two.'}]}))

describe('EntryDiff', () => {
	it('numbers the senses a reader keeps', async () => {
		await render(<EntryDiff diff={diffEntry(twoSenses(), twoSenses())} />)

		expect(screen.getByText('1')).toBeTruthy()
		expect(screen.getByText('2')).toBeTruthy()
	})

	it('draws a removed sense against no number', async () => {
		let diff = diffEntry(twoSenses(), deleteSense(twoSenses(), '1'))
		await render(<EntryDiff diff={diff} />)

		expect(screen.getByText('One.')).toBeTruthy()
		expect(screen.queryByText('2')).toBeNull()
	})

	it('says where a moved sense came from', async () => {
		let diff = diffEntry(twoSenses(), moveSense(twoSenses(), null, 1, 0))
		await render(<EntryDiff diff={diff} />)

		expect(screen.getByText('moved from 2')).toBeTruthy()
	})

	it('draws each changed word as its own run', async () => {
		let diff = diffEntry(twoSenses(), setSenseField(twoSenses(), '2', {definition: 'Three.'}))
		await render(<EntryDiff diff={diff} />)

		expect(screen.getByText('Two.')).toBeTruthy()
		expect(screen.getByText('Three.')).toBeTruthy()
	})
})
