import React from 'react'
import {describe, expect, test} from '@jest/globals'

import TestRenderer, {act} from 'react-test-renderer'
import {LoadingView} from '../loading'

describe('LoadingView', () => {
	test('it displays "Loading…" when no text is supplied', async () => {
		let tree!: TestRenderer.ReactTestRenderer
		await act(() => {
			tree = TestRenderer.create(<LoadingView />)
		})
		expect(tree.toJSON()).toMatchSnapshot()
	})

	test('it displays text when text is supplied', async () => {
		let tree!: TestRenderer.ReactTestRenderer
		await act(() => {
			tree = TestRenderer.create(<LoadingView text="foo bar" />)
		})
		expect(tree.toJSON()).toMatchSnapshot()
	})
})
