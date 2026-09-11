import * as React from 'react'
import {render, screen} from '@testing-library/react-native'

import {EntryDiff} from '../entry-diff'
import {diffEntry} from '../lib/diff'
import {deleteSense, moveExample, moveSense, startDraft} from '../lib/draft'
import {normalizeEntry} from '../lib/entry'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

const SUBSENSE_MARKER = '•'

const twoSenses = () =>
	startDraft(normalizeEntry({word: 'ACM', senses: [{definition: 'One.'}, {definition: 'Two.'}]}))

const withSubsenses = () =>
	startDraft(
		normalizeEntry({
			word: 'change',
			senses: [
				{
					definition: 'alter.',
					subsenses: [{definition: 'become different.'}, {definition: 'switch places.'}],
				},
			],
		}),
	)

const withExamples = () =>
	startDraft(
		normalizeEntry({
			word: 'ACM',
			senses: [{definition: 'One.', examples: ['first.', 'second.']}],
		}),
	)

describe('EntryDiff', () => {
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

	it('omits the pronunciation entirely when the entry never had one', async () => {
		let diff = diffEntry(twoSenses(), twoSenses())
		await render(<EntryDiff diff={diff} />)

		// The senses first, so an absent bracket means the line was withheld
		// rather than that nothing drew at all.
		expect(screen.getByText('One.')).toBeTruthy()
		expect(screen.queryByText(/\|/u)).toBeNull()
	})

	it('draws a cleared pronunciation as removed, not as never having had one', async () => {
		let before = startDraft(
			normalizeEntry({word: 'Caf', pronunciation: 'kaf', definition: 'The dining hall.'}),
		)
		let after = {...before, pronunciation: ''}
		let diff = diffEntry(before, after)
		await render(<EntryDiff diff={diff} />)

		expect(screen.getByText('kaf')).toBeTruthy()
	})

	it('draws a removed sub-sense against its bullet, not a number', async () => {
		let diff = diffEntry(withSubsenses(), deleteSense(withSubsenses(), '2'))
		await render(<EntryDiff diff={diff} />)

		expect(screen.getByText('become different.')).toBeTruthy()
		// One bullet for the sub-sense that stayed, one for the one that was
		// removed -- a bullet carries no position, so unlike a number it is not
		// withheld from a removed row.
		expect(screen.getAllByText(SUBSENSE_MARKER)).toHaveLength(2)
	})

	// `full-stop.test.ts` covers `withoutTrailingFullStop` itself. This covers
	// that the row calls it: the same thing `EntryDefinition` does for a plain
	// sense, so the preview and the entry read alike where a citation runs on.
	it('drops the definition’s full stop before a citation runs on from it', async () => {
		let diff = diffEntry(withExamples(), withExamples())
		await render(<EntryDiff diff={diff} />)

		expect(screen.getByText('One')).toBeTruthy()
		expect(screen.queryByText('One.')).toBeNull()
	})

	it('says where a moved citation came from, when only its position changed', async () => {
		let before = withExamples()
		let diff = diffEntry(before, moveExample(before, '1', 1, 0))
		await render(<EntryDiff diff={diff} />)

		expect(screen.getByText('citation moved from 2')).toBeTruthy()
	})
})
