import React from 'react'
import {describe, expect, it, jest} from '@jest/globals'

import {fireEvent, render, screen} from '@testing-library/react-native'
import {NoticeView} from '../notice'

function spinners() {
	return screen.container.queryAll((node) => node.type === 'ActivityIndicator')
}

describe('NoticeView', () => {
	it('says "Notice!" when given no text', async () => {
		await render(<NoticeView />)

		expect(screen.getByText('Notice!')).toBeTruthy()
	})

	it('shows the text it is given instead', async () => {
		await render(<NoticeView text="The menu is not available." />)

		expect(screen.getByText('The menu is not available.')).toBeTruthy()
		expect(screen.queryByText('Notice!')).toBeNull()
	})

	it('shows a header only when given one', async () => {
		await render(<NoticeView header="Offline" text="body" />)
		expect(screen.getByText('Offline')).toBeTruthy()

		await render(<NoticeView text="body" />)
		expect(screen.queryByText('Offline')).toBeNull()
	})

	it('shows a spinner only when asked for one', async () => {
		await render(<NoticeView spinner={true} text="body" />)
		expect(spinners()).toHaveLength(1)

		await render(<NoticeView text="body" />)
		expect(spinners()).toHaveLength(0)
	})

	it('offers a button only when given its title, and reports a press', async () => {
		let onPress = jest.fn()
		await render(<NoticeView buttonText="Try Again" onPress={onPress} text="body" />)

		fireEvent.press(screen.getByRole('button', {name: 'Try Again'}))
		expect(onPress).toHaveBeenCalledTimes(1)

		// Button has a title of its own to fall back on, so look for any button.
		await render(<NoticeView text="body" />)
		expect(screen.queryAllByRole('button')).toHaveLength(0)
	})
})
