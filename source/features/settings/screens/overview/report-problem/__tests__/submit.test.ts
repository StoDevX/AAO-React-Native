import * as Sentry from '@sentry/react-native'
import {submitReport} from '../submit'

jest.mock('@sentry/react-native', () => ({captureFeedback: jest.fn()}))
jest.mock('expo-device', () => ({
	brand: 'Apple',
	modelName: 'iPhone 14 Pro',
	modelId: 'iPhone15,2',
	osName: 'iOS',
	osVersion: '18.6',
}))
jest.mock('expo-application', () => ({
	nativeApplicationVersion: '2.8.0',
	nativeBuildVersion: '17',
}))

describe('submitReport', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	it('sends the message, name, email, and device tags to Sentry', () => {
		submitReport({
			message: 'it crashed',
			name: 'Wren',
			email: 'wren@example.com',
		})

		expect(Sentry.captureFeedback).toHaveBeenCalledTimes(1)
		expect(Sentry.captureFeedback).toHaveBeenCalledWith({
			message: 'it crashed',
			name: 'Wren',
			email: 'wren@example.com',
			tags: {
				deviceBrand: 'Apple',
				deviceModel: 'iPhone 14 Pro',
				deviceModelId: 'iPhone15,2',
				osName: 'iOS',
				osVersion: '18.6',
				appVersion: '2.8.0',
				buildNumber: '17',
			},
		})
	})

	it('omits name and email when not provided', () => {
		submitReport({message: 'it crashed'})

		expect(Sentry.captureFeedback).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'it crashed',
				name: undefined,
				email: undefined,
			}),
		)
	})
})
