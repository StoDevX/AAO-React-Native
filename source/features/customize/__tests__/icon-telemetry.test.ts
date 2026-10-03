import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import * as Sentry from '@sentry/react-native'
import {reportIconAtLaunch, reportIconChange} from '../icon-telemetry'

let mockSystemIconName = 'Default'

jest.mock('@sentry/react-native', () => ({
	metrics: {count: jest.fn()},
	logger: {warn: jest.fn(), info: jest.fn()},
	setTag: jest.fn(),
	Scope: jest.fn(),
}))

jest.mock('react-native-change-icon', () => ({
	getIcon: () => Promise.resolve(mockSystemIconName),
}))

beforeEach(() => {
	jest.clearAllMocks()
	mockSystemIconName = 'Default'
})

describe('reportIconAtLaunch', () => {
	it('tags the scope and counts a launch with the icon iOS has set', async () => {
		mockSystemIconName = 'windmill-fog'
		await reportIconAtLaunch()

		expect(Sentry.setTag).toHaveBeenCalledWith('app_icon', 'windmill-fog')
		expect(Sentry.metrics.count).toHaveBeenCalledWith('app.launch', 1, {
			attributes: {icon: 'windmill-fog'},
		})
	})

	it('reports the primary icon by its name, not "Default"', async () => {
		await reportIconAtLaunch()

		expect(Sentry.setTag).toHaveBeenCalledWith('app_icon', 'windmill')
	})

	it('reports a name this build does not ship as the primary', async () => {
		mockSystemIconName = 'icon_type_old_main'
		await reportIconAtLaunch()

		expect(Sentry.setTag).toHaveBeenCalledWith('app_icon', 'windmill')
	})
})

describe('reportIconChange', () => {
	it('retags the scope and counts the change', () => {
		reportIconChange('old-main-retro')

		expect(Sentry.setTag).toHaveBeenCalledWith('app_icon', 'old-main-retro')
		expect(Sentry.metrics.count).toHaveBeenCalledWith('app_icon.change', 1, {
			attributes: {icon: 'old-main-retro'},
		})
	})
})
