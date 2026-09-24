import * as React from 'react'
import {act, fireEvent, render, screen} from '@testing-library/react-native'

import ReportProblemPage from '../../../../../../../app/(settings)/ReportProblem'
import type {ImageAttachments} from '../../../../../../components/use-image-attachments'
import {useImageAttachments} from '../../../../../../components/use-image-attachments'
import type * as ExpoRouterMock from '../../../../../../testing/expo-router-mock'
import {readAttachment} from '../attachments'
import {submitReport} from '../submit'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports -- jest.mock factories cannot use import
	return require('../../../../../../testing/expo-ui-mock') as typeof import('../../../../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports -- jest.mock factories cannot use import
	return require('../../../../../../testing/expo-ui-mock') as typeof import('../../../../../../testing/expo-ui-mock')
})

const mockGoBack = jest.fn()
jest.mock('expo-router', () => {
	// oxlint-disable-next-line typescript/no-require-imports -- jest.mock factories cannot use import
	let {Stack} = require('../../../../../../testing/expo-router-mock') as typeof ExpoRouterMock
	return {Stack, useNavigation: () => ({goBack: mockGoBack})}
})
jest.mock('../../../../../../components/use-image-attachments', () => ({
	MAX_ATTACHMENTS: 3,
	useImageAttachments: jest.fn(),
}))
jest.mock('../attachments', () => ({readAttachment: jest.fn()}))
jest.mock('../submit', () => ({submitReport: jest.fn(() => true)}))

const mockAttachments = useImageAttachments as jest.MockedFunction<typeof useImageAttachments>
const mockRead = readAttachment as jest.MockedFunction<typeof readAttachment>
const mockSubmit = submitReport as jest.MockedFunction<typeof submitReport>

function attachments(overrides: Partial<ImageAttachments> = {}): ImageAttachments {
	return {
		images: [{uri: 'file:///a.jpg'}],
		picking: false,
		addImages: jest.fn(() => Promise.resolve()),
		removeImage: jest.fn(),
		...overrides,
	}
}

async function renderWithMessage() {
	let view = await render(<ReportProblemPage />)
	await fireEvent.changeText(
		screen.getByLabelText("What's the problem? What did you expect?"),
		'the map is blank',
	)
	return view
}

beforeEach(() => {
	jest.clearAllMocks()
	mockRead.mockResolvedValue({filename: 'image-1.jpg', data: new Uint8Array([1])})
})

describe('the Report a Problem screen', () => {
	it('holds Submit while picked images are still loading', async () => {
		mockAttachments.mockReturnValue(attachments({picking: true}))
		await renderWithMessage()

		expect(screen.getByLabelText('Submit')).toBeDisabled()
	})

	it('sends one report for two quick taps on Submit', async () => {
		mockAttachments.mockReturnValue(attachments())
		await renderWithMessage()

		await fireEvent.press(screen.getByLabelText('Submit'))
		await fireEvent.press(screen.getByLabelText('Submit'))

		expect(mockSubmit).toHaveBeenCalledTimes(1)
	})

	it('sends nothing when the screen closes while images are being read', async () => {
		mockAttachments.mockReturnValue(attachments())
		let finishReading: () => void = () => undefined
		mockRead.mockReturnValue(
			new Promise((resolve) => {
				finishReading = () => resolve({filename: 'image-1.jpg', data: new Uint8Array([1])})
			}),
		)
		let view = await renderWithMessage()

		await fireEvent.press(screen.getByLabelText('Submit'))
		await view.unmount()
		await act(() => {
			finishReading()
		})

		expect(mockSubmit).not.toHaveBeenCalled()
	})
})
