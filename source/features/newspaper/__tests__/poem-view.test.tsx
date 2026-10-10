import * as React from 'react'
import {describe, expect, jest, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'

import {PoemView} from '../poem-view'
import type {StoryLayout} from '../types'

// The body's figures open the zoom viewer through the router, which cannot load under Jest.
jest.mock(
	'expo-router',
	() =>
		// oxlint-disable-next-line typescript/no-require-imports
		require('../../../testing/expo-router-mock') as object,
)

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
})
