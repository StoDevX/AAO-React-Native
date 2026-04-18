import React from 'react'
import {describe, expect, test} from '@jest/globals'

import {render} from '@testing-library/react-native'
import {LoadingView} from '../loading'

describe('LoadingView', () => {
	test('it displays "Loading…" when no text is supplied', () => {
		expect(render(<LoadingView />).toJSON()).toMatchSnapshot()
	})

	test('it displays text when text is supplied', () => {
		expect(render(<LoadingView text="foo bar" />).toJSON()).toMatchSnapshot()
	})
})
