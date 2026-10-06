import * as React from 'react'
import {describe, expect, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {loadBeforeTests} from '../../testing/load-before-tests'
import {ViewerCaption} from '../viewer-caption'

loadBeforeTests('ScrollView', 'Text')

/**
 * Sends the lines a text broke into, as the device does after laying it out; the test
 * environment has no layout pass to send them itself.
 */
async function lay(text: string, lineCount: number): Promise<void> {
	await fireEvent(screen.getByText(text), 'textLayout', {
		nativeEvent: {lines: Array.from({length: lineCount}, () => ({text: '', height: 20}))},
	})
}

const POEM = 'Roses are red\nViolets are blue\nThe Mess prints it all\nAnd so should you'

describe('ViewerCaption', () => {
	test('draws nothing for a caption with no words', async () => {
		await render(<ViewerCaption text="  " />)
		expect(screen.queryByTestId('viewer-caption')).toBeNull()
	})

	test('draws a short caption in full, with nothing to expand', async () => {
		await render(<ViewerCaption text="Week 3" />)
		await lay('Week 3', 1)
		expect(screen.getByText('Week 3')).toBeTruthy()
		expect(screen.queryByRole('button')).toBeNull()
	})

	test('caps a long caption at three lines and offers to show the rest', async () => {
		await render(<ViewerCaption text={POEM} />)
		await lay(POEM, 4)
		expect(screen.getByText(POEM).props.numberOfLines).toBe(3)
		expect(screen.getByRole('button', {name: 'Show more'})).toBeTruthy()
	})

	test('expands to the whole caption in a scroll view, and collapses again', async () => {
		await render(<ViewerCaption text={POEM} />)
		await lay(POEM, 4)

		await fireEvent.press(screen.getByRole('button', {name: 'Show more'}))
		expect(screen.getByText(POEM).props.numberOfLines).toBeUndefined()
		expect(screen.getByTestId('viewer-caption-scroll')).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Show less'})).toBeTruthy()

		await fireEvent.press(screen.getByRole('button', {name: 'Show less'}))
		expect(screen.getByText(POEM).props.numberOfLines).toBe(3)
		expect(screen.queryByTestId('viewer-caption-scroll')).toBeNull()
	})

	test('goes back to the cap when the caption changes', async () => {
		let {rerender} = await render(<ViewerCaption text={POEM} />)
		await lay(POEM, 4)
		await fireEvent.press(screen.getByRole('button', {name: 'Show more'}))

		await rerender(<ViewerCaption text="Next picture" />)
		expect(screen.getByText('Next picture').props.numberOfLines).toBe(3)
		expect(screen.queryByRole('button')).toBeNull()
	})
})
