import * as React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'

import {PoemView} from '../poem-view'
import type {StoryLayout} from '../types'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

type Modifier = {$type: string; [key: string]: unknown}

const LAYOUT: Extract<StoryLayout, {kind: 'poem'}> = {
	kind: 'poem',
	stanzas: [
		[
			{indent: 0, runs: [{text: 'My bitter yellow comes with me on walks.'}]},
			{indent: 2, runs: [{text: 'It hums', italic: true}, {text: ' at the gate.'}]},
		],
		[{indent: 1, runs: [{text: 'A second stanza'}]}],
	],
}

/** The leading padding a line's modifiers ask for, or 0 when they ask for none. */
function leadingPadding(text: string): unknown {
	let modifiers = screen.getByText(text).props.modifiers as Modifier[] | undefined
	let padding = modifiers?.find((modifier) => modifier.$type === 'padding')
	return padding?.leading ?? 0
}

describe('PoemView', () => {
	test('draws one line of text per poem line, in stanza order', async () => {
		await render(<PoemView layout={LAYOUT} />)

		let lines = screen.getAllByText(/./u).map((node) => node.props.children as unknown)
		expect(lines).toStrictEqual([
			'My bitter yellow comes with me on walks\\.',
			'*It hums* at the gate\\.',
			'A second stanza',
		])
	})

	test('indents a line 16 points for each level', async () => {
		await render(<PoemView layout={LAYOUT} />)

		expect(leadingPadding('My bitter yellow comes with me on walks\\.')).toBe(0)
		expect(leadingPadding('*It hums* at the gate\\.')).toBe(32)
		expect(leadingPadding('A second stanza')).toBe(16)
	})
})
