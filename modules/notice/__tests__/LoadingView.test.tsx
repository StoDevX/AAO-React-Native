import React from 'react'
import {describe, expect, test} from '@jest/globals'

import TestRenderer, {act} from 'react-test-renderer'
import {LoadingView} from '../loading'

// React 19 made the test renderer fully concurrent; TestRenderer.create no
// longer commits synchronously, so the initial toJSON() returns null unless
// the render is flushed through act().

describe('LoadingView', () => {
	test('it displays "Loading…" when no text is supplied', () => {
		let renderer!: TestRenderer.ReactTestRenderer
		act(() => {
			renderer = TestRenderer.create(<LoadingView />)
		})
		expect(renderer.toJSON()).toMatchSnapshot()
	})

	test('it displays text when text is supplied', () => {
		let renderer!: TestRenderer.ReactTestRenderer
		act(() => {
			renderer = TestRenderer.create(<LoadingView text="foo bar" />)
		})
		expect(renderer.toJSON()).toMatchSnapshot()
	})
})
