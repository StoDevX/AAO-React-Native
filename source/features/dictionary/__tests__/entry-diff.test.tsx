import * as React from 'react'
import {render, screen} from '@testing-library/react-native'

import {EntryDiff, withoutTrailingFullStop} from '../entry-diff'
import {diffEntry} from '../lib/diff'
import type {Run} from '../lib/diff'
import {
	addExample,
	deleteExample,
	deleteSense,
	moveExample,
	moveSense,
	setExampleText,
	setSenseField,
	startDraft,
} from '../lib/draft'
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

	it('omits the pronunciation entirely when the entry never had one', async () => {
		let diff = diffEntry(twoSenses(), twoSenses())
		await render(<EntryDiff diff={diff} />)

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

	it('says where a moved sub-sense came from', async () => {
		let diff = diffEntry(withSubsenses(), moveSense(withSubsenses(), '1', 1, 0))
		await render(<EntryDiff diff={diff} />)

		expect(screen.getByText('moved from 2')).toBeTruthy()
	})

	it('draws a sense holding both an added and a removed citation', async () => {
		let before = withExamples()
		let afterAdding = addExample(deleteExample(before, '1', '2'), '1')
		let addedId = afterAdding.senses[0].examples[1].id
		let after = setExampleText(afterAdding, '1', addedId, 'third.')
		let diff = diffEntry(before, after)
		await render(<EntryDiff diff={diff} />)

		expect(screen.getByText('first.')).toBeTruthy()
		expect(screen.getByText('third.')).toBeTruthy()
	})

	it('says where a moved citation came from, when only its position changed', async () => {
		let before = withExamples()
		let diff = diffEntry(before, moveExample(before, '1', 1, 0))
		await render(<EntryDiff diff={diff} />)

		expect(screen.getByText('citation moved from 2')).toBeTruthy()
	})
})

describe('withoutTrailingFullStop', () => {
	it('leaves an added trailing full stop alone -- the edit itself added it', () => {
		let runs: Run[] = [
			{text: 'modify', mark: 'removed'},
			{text: 'modify.', mark: 'added'},
		]

		expect(withoutTrailingFullStop(runs)).toEqual(runs)
	})

	it('drops a trailing full stop that both the old and new text already carried', () => {
		let runs: Run[] = [
			{text: 'modify.', mark: 'removed'},
			{text: 'change.', mark: 'added'},
		]

		expect(withoutTrailingFullStop(runs)).toEqual([
			{text: 'modify.', mark: 'removed'},
			{text: 'change', mark: 'added'},
		])
	})
})
