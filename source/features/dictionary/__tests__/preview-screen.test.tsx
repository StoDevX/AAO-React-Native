import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'

import PreviewScreen from '../../../../app/(home)/Dictionary/entry/preview'
import {normalizeEntry} from '../lib/entry'
import {submitReport} from '../report/submit'
import {useDictionaryDraftStore} from '../store'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('../report/submit', () => ({submitReport: jest.fn()}))

// Jest's mock hoisting forbids a `jest.mock()` factory from closing over an
// out-of-scope variable unless its name starts with "mock" -- the one
// exemption to the "no uninitialised mock variable" guard.
const mockPopToTop = jest.fn()

jest.mock('expo-router', () => ({
	Stack: Object.assign(({children}: {children?: React.ReactNode}) => children ?? null, {
		Title: () => null,
		Screen: () => null,
		Toolbar: Object.assign(({children}: {children?: React.ReactNode}) => children ?? null, {
			Button: (props: {accessibilityLabel: string; onPress: () => void; disabled?: boolean}) => {
				// oxlint-disable-next-line typescript/no-require-imports
				let {Pressable, Text} = require('react-native')
				return (
					<Pressable
						accessibilityLabel={props.accessibilityLabel}
						accessibilityState={{disabled: Boolean(props.disabled)}}
						onPress={props.onPress}
					>
						<Text>{props.accessibilityLabel}</Text>
					</Pressable>
				)
			},
		}),
	}),
	useNavigation: () => ({popToTop: mockPopToTop}),
}))

const mockSubmit = jest.mocked(submitReport)

const entry = normalizeEntry({word: 'Caf', definition: 'The dining hall.'})

beforeEach(() => {
	mockSubmit.mockClear()
	mockPopToTop.mockClear()
	useDictionaryDraftStore.getState().clearDraft()
})

describe('the dictionary preview screen', () => {
	it('reports both sides through the same normalisation', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().setSenseField('1', {definition: 'The caf.'})
		await render(<PreviewScreen />)

		await fireEvent.press(screen.getByLabelText('Submit Report'))

		expect(mockSubmit).toHaveBeenCalledWith(
			{word: 'Caf', definition: 'The dining hall.'},
			{word: 'Caf', definition: 'The caf.'},
		)
	})

	it('stands the unsaved-changes guard down once the report is away', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().setSenseField('1', {definition: 'The caf.'})
		await render(<PreviewScreen />)

		await fireEvent.press(screen.getByLabelText('Submit Report'))

		expect(useDictionaryDraftStore.getState().submitted).toBe(true)
	})

	it('returns to the entry once the report is away', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().setSenseField('1', {definition: 'The caf.'})
		await render(<PreviewScreen />)

		await fireEvent.press(screen.getByLabelText('Submit Report'))

		expect(mockPopToTop).toHaveBeenCalled()
	})
})
