import React from 'react'
import {StyleSheet} from 'react-native'
import {describe, expect, it} from '@jest/globals'

import TestRenderer, {act} from 'react-test-renderer'
import {NoticeView} from '../notice'

describe('NoticeView', () => {
	describe('when given no text to display', () => {
		it('displays "Notice!" as its text', async () => {
			let tree!: TestRenderer.ReactTestRenderer
			await act(() => {
				tree = TestRenderer.create(<NoticeView />)
			})
			expect(tree.toJSON()).toMatchSnapshot()
		})
	})

	describe('when given text to display', () => {
		it('displays the text', async () => {
			let tree!: TestRenderer.ReactTestRenderer
			await act(() => {
				tree = TestRenderer.create(<NoticeView text="foo bar" />)
			})
			expect(tree.toJSON()).toMatchSnapshot()
		})
	})

	describe('when given view style overrides', () => {
		it('applies view style overrides', async () => {
			const styleOverride = StyleSheet.create({
				view: {
					padding: 31,
				},
			})
			let tree!: TestRenderer.ReactTestRenderer
			await act(() => {
				tree = TestRenderer.create(
					<NoticeView style={styleOverride.view} text="foo bar" />,
				)
			})
			expect(tree.toJSON()).toMatchSnapshot()
		})
	})

	describe('when instructed to display a spinner', () => {
		it('displays a spinner', async () => {
			let tree!: TestRenderer.ReactTestRenderer
			await act(() => {
				tree = TestRenderer.create(<NoticeView spinner={true} text="foo bar" />)
			})
			expect(tree.toJSON()).toMatchSnapshot()
		})
	})

	describe('when header text is given', () => {
		it('displays the header text', async () => {
			let tree!: TestRenderer.ReactTestRenderer
			await act(() => {
				tree = TestRenderer.create(
					<NoticeView header="blammo" text="foo bar" />,
				)
			})
			expect(tree.toJSON()).toMatchSnapshot()
		})
	})

	describe('when buttonText is given', () => {
		it('displays a button with the buttonText in its title', async () => {
			let tree!: TestRenderer.ReactTestRenderer
			await act(() => {
				tree = TestRenderer.create(
					<NoticeView buttonText="button text" text="foo bar" />,
				)
			})
			expect(tree.toJSON()).toMatchSnapshot()
		})
	})
})
