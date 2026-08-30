import React from 'react'
import {StyleSheet} from 'react-native'
import {describe, expect, it} from '@jest/globals'

import {render} from '@testing-library/react-native'
import {NoticeView} from '../notice'

describe('NoticeView', () => {
	describe('when given no text to display', () => {
		it('displays "Notice!" as its text', async () => {
			expect((await render(<NoticeView />)).toJSON()).toMatchSnapshot()
		})
	})

	describe('when given text to display', () => {
		it('displays the text', async () => {
			expect((await render(<NoticeView text="foo bar" />)).toJSON()).toMatchSnapshot()
		})
	})

	describe('when given view style overrides', () => {
		it('applies view style overrides', async () => {
			const styleOverride = StyleSheet.create({
				view: {
					padding: 31,
				},
			})
			expect(
				(await render(<NoticeView style={styleOverride.view} text="foo bar" />)).toJSON(),
			).toMatchSnapshot()
		})
	})

	describe('when instructed to display a spinner', () => {
		it('displays a spinner', async () => {
			expect(
				(await render(<NoticeView spinner={true} text="foo bar" />)).toJSON(),
			).toMatchSnapshot()
		})
	})

	describe('when header text is given', () => {
		it('displays the header text', async () => {
			expect(
				(await render(<NoticeView header="blammo" text="foo bar" />)).toJSON(),
			).toMatchSnapshot()
		})
	})

	describe('when buttonText is given', () => {
		it('displays a button with the buttonText in its title', async () => {
			expect(
				(await render(<NoticeView buttonText="button text" text="foo bar" />)).toJSON(),
			).toMatchSnapshot()
		})
	})
})
