import React from 'react'
import {describe, expect, it, jest} from '@jest/globals'

import {fireEvent, render, screen} from '@testing-library/react-native'
import {LoadErrorView, NoticeView, describeError} from '../notice'

describe('NoticeView', () => {
	it('shows its title, and its description when it has one', async () => {
		await render(<NoticeView description="Try again after lunch." title="No Menu" />)
		expect(screen.getByText('No Menu')).toBeTruthy()
		expect(screen.getByText('Try again after lunch.')).toBeTruthy()

		await render(<NoticeView title="No Menu" />)
		expect(screen.queryByText('Try again after lunch.')).toBeNull()
	})

	it('offers an action only when given one, and reports a press', async () => {
		let onPress = jest.fn()
		await render(<NoticeView action={{label: 'Try Again', onPress}} title="Offline" />)

		await fireEvent.press(screen.getByText('Try Again'))
		expect(onPress).toHaveBeenCalledTimes(1)

		await render(<NoticeView title="Offline" />)
		expect(screen.queryByText('Try Again')).toBeNull()
	})
})

describe('LoadErrorView', () => {
	it('describes the error and retries when asked', async () => {
		let onRetry = jest.fn()
		await render(<LoadErrorView error={new Error('Network request failed')} onRetry={onRetry} />)

		expect(screen.getByText('Network request failed')).toBeTruthy()
		await fireEvent.press(screen.getByText('Try Again'))
		expect(onRetry).toHaveBeenCalledTimes(1)
	})
})

describe('describeError', () => {
	it("uses an Error's message", () => {
		expect(describeError(new TypeError('Bad JSON'))).toBe('Bad JSON')
	})

	it('uses a string as it is', () => {
		expect(describeError('Timed out')).toBe('Timed out')
	})

	it('falls back for anything else, or an empty message', () => {
		expect(describeError(undefined)).toBe('Something went wrong.')
		expect(describeError({status: 500})).toBe('Something went wrong.')
		expect(describeError(Object.assign(new Error('placeholder'), {message: ''}))).toBe(
			'Something went wrong.',
		)
	})
})
