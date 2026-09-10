import * as React from 'react'
import {Alert} from 'react-native'
import {fireEvent, render, screen} from '@testing-library/react-native'

import PreviewScreen from '../../../../app/(home)/Dictionary/entry/preview'
import {normalizeEntry} from '../lib/entry'
import {submitReport} from '../report/submit'
import {useDictionaryDraftStore} from '../store'
import type * as ExpoRouterMock from '../../../testing/expo-router-mock'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('../report/submit', () => ({submitReport: jest.fn()}))

jest.mock('expo-router', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	let {Stack}: typeof ExpoRouterMock = require('../../../testing/expo-router-mock')
	return {Stack}
})

const mockSubmit = jest.mocked(submitReport)
let alertSpy = jest.spyOn(Alert, 'alert').mockReturnValue(undefined)

const entry = normalizeEntry({word: 'Caf', definition: 'The dining hall.'})

beforeEach(() => {
	mockSubmit.mockReset()
	alertSpy.mockClear()
	useDictionaryDraftStore.getState().clearDraft()
})

describe('the dictionary preview screen', () => {
	it('says so when there is nothing to preview', async () => {
		await render(<PreviewScreen />)

		expect(screen.getByText(/nothing to preview/iu)).toBeTruthy()
	})

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

	// Not a claim that the sheet's own unsaved-changes guard actually stands
	// down -- that guard is native `usePreventRemove` machinery this mock
	// cannot exercise; it is covered by an XCUITest instead
	// (uitests/ModuleCampusDictionaryTests.swift). This checks only the one
	// thing decided in JavaScript: the store flips `submitted` once the send
	// has gone out.
	it('marks the draft submitted once the report is sent', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().setSenseField('1', {definition: 'The caf.'})
		await render(<PreviewScreen />)

		await fireEvent.press(screen.getByLabelText('Submit Report'))

		expect(useDictionaryDraftStore.getState().submitted).toBe(true)
	})

	// `submitReport` dumps YAML and opens a `mailto:` URL outside any try of
	// its own. A throw partway through must not leave `submitted` stuck `true`
	// -- that would stand the unsaved-changes guard down for good over a
	// report that never actually sent, so the next sheet drag-down would
	// discard the reader's draft with no prompt at all.
	//
	// Nor may the throw simply escape: this handler is called from a native
	// toolbar button with no error boundary above it, so an escaping throw is
	// a red box in debug and nothing whatsoever in release, leaving a preview
	// that looks exactly like a report that sent.
	it('tells the reader and keeps the draft when the send itself throws', async () => {
		useDictionaryDraftStore.getState().startDraft(entry)
		useDictionaryDraftStore.getState().setSenseField('1', {definition: 'The caf.'})
		mockSubmit.mockImplementationOnce(() => {
			throw new Error('mail composer unavailable')
		})
		await render(<PreviewScreen />)

		await fireEvent.press(screen.getByLabelText('Submit Report'))

		expect(alertSpy).toHaveBeenCalledWith(
			'Could not send the report',
			expect.stringMatching(/still here/iu),
		)
		expect(useDictionaryDraftStore.getState().submitted).toBe(false)
		expect(useDictionaryDraftStore.getState().draft?.senses[0].definition).toBe('The caf.')
	})
})
