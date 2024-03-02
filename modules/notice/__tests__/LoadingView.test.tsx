import React from 'react'
import {describe, expect, test} from '@jest/globals'

import TestRenderer from 'react-test-renderer'
import {LoadingView} from '../loading'

describe('LoadingView', () => {
	test('it displays "Loading…" when no text is supplied', () => {
		const tree = TestRenderer.create(<LoadingView />).toJSON()
		expect(tree).toMatchSnapshot()
	})

	test('it displays text when text is supplied', () => {
		const tree = TestRenderer.create(<LoadingView text="foo bar" />).toJSON()
		expect(tree).toMatchSnapshot()
	})
})
