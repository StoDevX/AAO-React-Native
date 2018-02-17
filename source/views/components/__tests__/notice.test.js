/* eslint-env jest */
// @flow

import 'react-native'
import * as React from 'react'
import ReactTestRenderer from 'react-test-renderer'

import {NoticeView} from '../notice'

test('renders the given text', () => {
	const tree = ReactTestRenderer.create(<NoticeView text="A Label I Am" />)
	expect(tree).toMatchSnapshot()
})

test('renders a button, if given', () => {
	const tree = ReactTestRenderer.create(
		<NoticeView buttonText="Button" text="Label" />,
	)
	expect(tree).toMatchSnapshot()
})

test('shows an ActivityIndicator if given [spinner]', () => {
	const tree = ReactTestRenderer.create(
		<NoticeView spinner={true} text="Label" />,
	)
	expect(tree).toMatchSnapshot()
})
