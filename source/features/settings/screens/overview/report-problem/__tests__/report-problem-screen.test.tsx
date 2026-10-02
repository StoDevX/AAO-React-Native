import * as React from 'react'
import {Alert, type AlertButton} from 'react-native'
import {act, fireEvent, render, screen} from '@testing-library/react-native'

import ReportProblemPage from '../../../../../../../app/settings/report-problem'
import type {ImageAttachments} from '../../../../../../components/use-image-attachments'
import {useImageAttachments} from '../../../../../../components/use-image-attachments'
import type * as ExpoRouterMock from '../../../../../../testing/expo-router-mock'
import {readAttachment} from '../attachments'
import {composeEmail} from '../../../../../../components/send-email'
import {submitReport} from '../submit'
import {useTelemetryStore} from '../../../../../telemetry/store'
import {loadBeforeTests} from '../../../../../../testing/load-before-tests'

loadBeforeTests('Image', 'TextInput')

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
// The consent store persists through a native key-value store Jest lacks.
jest.mock('expo-sqlite/kv-store', () => ({
	Storage: {getItemSync: () => null, setItemSync: () => undefined, removeItemSync: () => true},
}))
jest.mock('expo-crypto', () => ({randomUUID: () => 'id-1'}))
jest.mock('../submit', () => ({
	submitReport: jest.fn(() => 'sent'),
	reportEmail: jest.fn(() => ({
		to: ['support@example.test'],
		subject: 'Report',
		body: 'the map is blank',
	})),
}))
jest.mock('../../../../../../components/send-email', () => ({
	composeEmail: jest.fn(() => Promise.resolve(true)),
}))

const mockAttachments = useImageAttachments as jest.MockedFunction<typeof useImageAttachments>
const mockRead = readAttachment as jest.MockedFunction<typeof readAttachment>
const mockSubmit = submitReport as jest.MockedFunction<typeof submitReport>
const mockCompose = composeEmail as jest.MockedFunction<typeof composeEmail>
let alertSpy = jest.spyOn(Alert, 'alert').mockReturnValue(undefined)

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
	useTelemetryStore.setState({enabled: true, deviceId: 'id-1'})
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

	it('closes once the report is sent', async () => {
		mockAttachments.mockReturnValue(attachments())
		await renderWithMessage()

		await fireEvent.press(screen.getByLabelText('Submit'))

		expect(mockGoBack).toHaveBeenCalledTimes(1)
	})

	it('says so, and stays open, in a build that sends nothing', async () => {
		mockAttachments.mockReturnValue(attachments())
		mockSubmit.mockReturnValueOnce('disabled')
		await renderWithMessage()

		await fireEvent.press(screen.getByLabelText('Submit'))

		expect(alertSpy).toHaveBeenCalledWith('Sentry is disabled', expect.any(String))
		expect(mockGoBack).not.toHaveBeenCalled()
	})

	// Sharing off means Sentry is closed; the report would vanish while the
	// screen said it was sent.
	it('offers email, with the images, when sharing is off', async () => {
		mockAttachments.mockReturnValue(attachments())
		mockSubmit.mockReturnValueOnce('opted-out')
		await renderWithMessage()

		await fireEvent.press(screen.getByLabelText('Submit'))

		expect(mockGoBack).not.toHaveBeenCalled()
		let buttons = alertSpy.mock.lastCall?.[2] as AlertButton[]
		let sendByEmail = buttons.find((button) => button.text === 'Send by Email')
		// act() lets the email hand-off settle before the assertions.
		await act(() => {
			sendByEmail?.onPress?.()
		})

		expect(mockCompose).toHaveBeenCalledWith({
			to: ['support@example.test'],
			subject: 'Report',
			body: 'the map is blank',
			attachments: ['file:///a.jpg'],
		})
		expect(mockGoBack).toHaveBeenCalledTimes(1)
	})

	it('stays open when the email is abandoned', async () => {
		mockAttachments.mockReturnValue(attachments())
		mockSubmit.mockReturnValueOnce('opted-out')
		mockCompose.mockResolvedValueOnce(false)
		await renderWithMessage()

		await fireEvent.press(screen.getByLabelText('Submit'))
		let buttons = alertSpy.mock.lastCall?.[2] as AlertButton[]
		await act(() => {
			buttons.find((button) => button.text === 'Send by Email')?.onPress?.()
		})

		expect(mockGoBack).not.toHaveBeenCalled()
		expect(screen.getByLabelText('Submit')).not.toBeDisabled()
	})

	// Opting out closes Sentry's native side, and reading an image needs it;
	// the email route needs only the image's address.
	it('offers email without reading the images when sharing is off', async () => {
		mockAttachments.mockReturnValue(attachments())
		useTelemetryStore.setState({enabled: false, deviceId: null})
		mockRead.mockRejectedValue(new Error('native SDK is closed'))
		await renderWithMessage()

		await fireEvent.press(screen.getByLabelText('Submit'))

		expect(mockRead).not.toHaveBeenCalled()
		expect(mockSubmit).not.toHaveBeenCalled()
		expect(alertSpy).toHaveBeenLastCalledWith(
			'Sharing is off',
			expect.any(String),
			expect.any(Array),
		)
	})
})
