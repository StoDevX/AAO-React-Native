import * as Sentry from '@sentry/react-native'
import {submitReport} from '../submit'

jest.mock('@sentry/react-native', () => ({captureFeedback: jest.fn()}))
jest.mock('@frogpond/constants', () => ({IS_PRODUCTION: true}))
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
		let result = submitReport({
			message: 'it crashed',
			name: 'Wren',
			email: 'wren@example.com',
		})

		expect(result).toBe(true)
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

describe('submitReport in non-production', () => {
	it('returns false and does not call Sentry.captureFeedback', () => {
		jest.resetModules()
		jest.doMock('@frogpond/constants', () => ({IS_PRODUCTION: false}))
		jest.doMock('@sentry/react-native', () => ({captureFeedback: jest.fn()}))
		const SentryDev =
			// eslint-disable-next-line @typescript-eslint/no-require-imports -- re-require after jest.doMock to pick up the mocked deps
			require('@sentry/react-native') as typeof import('@sentry/react-native')
		const {submitReport: submitReportDev} =
			// eslint-disable-next-line @typescript-eslint/no-require-imports -- re-require after jest.doMock to pick up the mocked deps
			require('../submit') as typeof import('../submit')

		let result = submitReportDev({message: 'it crashed'})

		expect(result).toBe(false)
		expect(SentryDev.captureFeedback).not.toHaveBeenCalled()
	})
})
