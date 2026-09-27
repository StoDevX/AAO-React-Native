import * as Sentry from '@sentry/react-native'

import {useTelemetryStore} from '../../../../../telemetry/store'
import {reportEmail, submitReport} from '../submit'

jest.mock('@sentry/react-native', () => ({
	captureFeedback: jest.fn(),
	Scope: jest.fn(function Scope(this: {addEventProcessor: jest.Mock}) {
		this.addEventProcessor = jest.fn()
	}),
}))

type MockScope = {addEventProcessor: jest.Mock}

/** The scope the last report was captured on. */
function reportScope(): MockScope {
	return jest.mocked(Sentry.captureFeedback).mock.lastCall?.[2] as unknown as MockScope
}
// The consent store persists through a native key-value store Jest lacks.
jest.mock('expo-sqlite/kv-store', () => ({
	Storage: {getItemSync: () => null, setItemSync: () => undefined, removeItemSync: () => true},
}))
jest.mock('expo-crypto', () => ({randomUUID: () => 'id-1'}))
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
	beforeEach(() => {
		useTelemetryStore.setState({enabled: true, deviceId: 'id-1'})
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('sends the message, name, email, and device tags to Sentry, with no attachments', () => {
		let result = submitReport({
			message: 'it crashed',
			name: 'Wren',
			email: 'wren@example.com',
		})

		expect(result).toBe('sent')
		expect(Sentry.captureFeedback).toHaveBeenCalledTimes(1)
		expect(Sentry.captureFeedback).toHaveBeenCalledWith(
			{
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
			},
			{attachments: []},
			expect.any(Sentry.Scope),
		)
	})

	it('sends attached images with the feedback', () => {
		let data = new Uint8Array([1, 2, 3])

		submitReport({
			message: 'the map is blank',
			attachments: [{filename: 'IMG_0001.jpg', data, contentType: 'image/jpeg'}],
		})

		expect(Sentry.captureFeedback).toHaveBeenCalledWith(
			expect.anything(),
			{attachments: [{filename: 'IMG_0001.jpg', data, contentType: 'image/jpeg'}]},
			expect.any(Sentry.Scope),
		)
	})

	// A report carries a name and email. Anything tying it to the device --
	// the device ID, the device's breadcrumbs, the device app hash, or the
	// trace a screen.view metric also carries -- would name everything that
	// device ever sent.
	it('sends the report on a scope of its own, so it gets a trace of its own', () => {
		submitReport({message: 'it crashed', name: 'Wren'})

		expect(Sentry.Scope).toHaveBeenCalledTimes(1)
		expect(reportScope()).toBe(jest.mocked(Sentry.Scope).mock.instances[0])
	})

	it('removes the device ID, breadcrumbs and device app hash from the report', () => {
		submitReport({message: 'it crashed', name: 'Wren'})

		let [[strip]] = reportScope().addEventProcessor.mock.calls as [[(event: object) => object]]
		expect(
			strip({
				message: 'it crashed',
				user: {id: 'id-1'},
				breadcrumbs: [{category: 'http', data: {url: 'https://example.test/users/jdoe'}}],
				contexts: {
					app: {device_app_hash: 'abc123', app_identifier: 'com.example'},
					feedback: {name: 'Wren'},
				},
			}),
		).toStrictEqual({
			message: 'it crashed',
			contexts: {app: {app_identifier: 'com.example'}, feedback: {name: 'Wren'}},
		})
	})

	// Sentry is closed once sharing is off, so the report would vanish.
	it('sends nothing, and asks for email, when sharing is off', () => {
		useTelemetryStore.setState({enabled: false, deviceId: null})

		let result = submitReport({message: 'it crashed'})

		expect(result).toBe('opted-out')
		expect(Sentry.captureFeedback).not.toHaveBeenCalled()
	})
})

describe('reportEmail', () => {
	it('addresses the report to support, with the contact details under the message', () => {
		expect(
			reportEmail({message: 'the map is blank', name: 'Wren', email: 'wren@example.com'}),
		).toStrictEqual({
			to: ['allaboutolaf@frogpond.tech'],
			subject: 'All About Olaf problem report',
			body: 'the map is blank\n\nName: Wren\nEmail: wren@example.com',
		})
	})

	it('leaves out contact details that were not given', () => {
		expect(reportEmail({message: 'the map is blank'}).body).toBe('the map is blank')
	})
})

describe('submitReport in non-production', () => {
	it('reports that Sentry is disabled and does not call Sentry.captureFeedback', () => {
		jest.resetModules()
		jest.doMock('@frogpond/constants', () => ({IS_PRODUCTION: false}))
		jest.doMock('@sentry/react-native', () => ({captureFeedback: jest.fn()}))
		const SentryDev =
			// oxlint-disable-next-line typescript/no-require-imports -- re-require after jest.doMock to pick up the mocked deps
			require('@sentry/react-native') as typeof import('@sentry/react-native')
		const {submitReport: submitReportDev} =
			// oxlint-disable-next-line typescript/no-require-imports -- re-require after jest.doMock to pick up the mocked deps
			require('../submit') as typeof import('../submit')

		let result = submitReportDev({message: 'it crashed'})

		expect(result).toBe('disabled')
		expect(SentryDev.captureFeedback).not.toHaveBeenCalled()
	})
})
