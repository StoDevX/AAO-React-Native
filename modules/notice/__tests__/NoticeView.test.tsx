import React from 'react'
import {StyleSheet} from 'react-native'
import {describe, expect, it} from '@jest/globals'

import TestRenderer, {act} from 'react-test-renderer'
import {NoticeView} from '../notice'

// React 19 made the test renderer fully concurrent; TestRenderer.create no
// longer commits synchronously, so the initial toJSON() returns null unless
// the render is flushed through act().

function renderToJSON(
	element: React.ReactElement,
): TestRenderer.ReactTestRendererJSON | null {
	let renderer!: TestRenderer.ReactTestRenderer
	act(() => {
		renderer = TestRenderer.create(element)
	})
	return renderer.toJSON() as TestRenderer.ReactTestRendererJSON | null
}

describe('NoticeView', () => {
	describe('when given no text to display', () => {
		it('displays "Notice!" as its text', () => {
			expect(renderToJSON(<NoticeView />)).toMatchSnapshot()
		})
	})

	describe('when given text to display', () => {
		it('displays the text', () => {
			expect(renderToJSON(<NoticeView text="foo bar" />)).toMatchSnapshot()
		})
	})

	describe('when given view style overrides', () => {
		it('applies view style overrides', () => {
			const styleOverride = StyleSheet.create({
				view: {
					padding: 31,
				},
			})
			expect(
				renderToJSON(<NoticeView style={styleOverride.view} text="foo bar" />),
			).toMatchSnapshot()
		})
	})

	describe('when instructed to display a spinner', () => {
		it('displays a spinner', () => {
			expect(
				renderToJSON(<NoticeView spinner={true} text="foo bar" />),
			).toMatchSnapshot()
		})
	})

	describe('when header text is given', () => {
		it('displays the header text', () => {
			expect(
				renderToJSON(<NoticeView header="blammo" text="foo bar" />),
			).toMatchSnapshot()
		})
	})

	describe('when buttonText is given', () => {
		it('displays a button with the buttonText in its title', () => {
			expect(
				renderToJSON(<NoticeView buttonText="button text" text="foo bar" />),
			).toMatchSnapshot()
		})
	})
})
