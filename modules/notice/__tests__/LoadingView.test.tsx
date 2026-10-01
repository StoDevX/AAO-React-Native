import React from 'react'
import {describe, expect, test} from '@jest/globals'

import {render, screen} from '@testing-library/react-native'
import {LoadingView} from '../loading'

describe('LoadingView', () => {
	test('it says "Loading…" when given no text', async () => {
		await render(<LoadingView />)

		expect(screen.getByText('Loading…')).toBeTruthy()
	})

	test('it shows the text it is given instead', async () => {
		await render(<LoadingView text="Loading the menu…" />)

		expect(screen.getByText('Loading the menu…')).toBeTruthy()
		expect(screen.queryByText('Loading…')).toBeNull()
	})
})
