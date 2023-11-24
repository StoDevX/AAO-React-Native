import React from 'react'
import {StyleSheet} from 'react-native'
import {describe, expect, it} from '@jest/globals'

import TestRenderer from 'react-test-renderer'
import {NoticeView} from '../notice'

describe('NoticeView', () => {
	describe('when given no text to display', () => {
		it('displays "Notice!" as its text', () => {
			const tree = TestRenderer.create(<NoticeView />).toJSON()
			expect(tree).toMatchSnapshot()
		})
	})

	describe('when given text to display', () => {
		it('displays the text', () => {
			const tree = TestRenderer.create(<NoticeView text="foo bar" />).toJSON()
			expect(tree).toMatchSnapshot()
		})
	})

	describe('when given view style overrides', () => {
		it('applies view style overrides', () => {
			const styleOverride = StyleSheet.create({
				view: {
					padding: 31,
				},
			})
			const tree = TestRenderer.create(
				<NoticeView style={styleOverride.view} text="foo bar" />,
			).toJSON()
			expect(tree).toMatchSnapshot()
		})
	})

	describe('when instructed to display a spinner', () => {
		it('displays a spinner', () => {
			const tree = TestRenderer.create(
				<NoticeView spinner={true} text="foo bar" />,
			).toJSON()
			expect(tree).toMatchSnapshot()
		})
	})

	describe('when header text is given', () => {
		it('displays the header text', () => {
			const tree = TestRenderer.create(
				<NoticeView header="blammo" text="foo bar" />,
			).toJSON()
			expect(tree).toMatchSnapshot()
		})
	})

	describe('when buttonText is given', () => {
		it('displays a button with the buttonText in its title', () => {
			const tree = TestRenderer.create(
				<NoticeView buttonText="button text" text="foo bar" />,
			).toJSON()
			expect(tree).toMatchSnapshot()
		})
	})
})
