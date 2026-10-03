import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Sentry from '@sentry/react-native'
import * as storage from '../../../lib/storage'
import {useRadioStore} from '../../streaming/radio/store'
import {
	reportIconChange,
	reportLaunch,
	reportLinkTargetChange,
	reportRadioPlayerChange,
} from '../telemetry'

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
	useRadioStore.setState({showOnHome: true, hydrated: true})
})

afterEach(async () => {
	await AsyncStorage.clear()
})

/** The attributes `app.launch` was counted with. */
function launchAttributes(): unknown {
	let call = jest.mocked(Sentry.metrics.count).mock.calls.find(([name]) => name === 'app.launch')
	return call?.[2]?.attributes
}

describe('reportLaunch', () => {
	it('counts a launch with the icon, the link choice, and the radio setting', async () => {
		mockSystemIconName = 'windmill-fog'
		await storage.setLinkPreference(false)
		useRadioStore.setState({showOnHome: false})
		await reportLaunch()

		expect(launchAttributes()).toEqual({icon: 'windmill-fog', links: 'safari', radio: 'off'})
	})

	it('reads a fresh install as the primary icon, in-app links, and the radio shown', async () => {
		await reportLaunch()

		expect(launchAttributes()).toEqual({icon: 'windmill', links: 'app', radio: 'on'})
	})

	it('tags the scope with the icon', async () => {
		mockSystemIconName = 'windmill-fog'
		await reportLaunch()

		expect(Sentry.setTag).toHaveBeenCalledWith('app_icon', 'windmill-fog')
	})

	it('reports a name this build does not ship as the primary', async () => {
		mockSystemIconName = 'icon_type_old_main'
		await reportLaunch()

		expect(Sentry.setTag).toHaveBeenCalledWith('app_icon', 'windmill')
	})

	it('waits for the radio setting to load before counting', async () => {
		useRadioStore.setState({showOnHome: true, hydrated: false})
		let launched = reportLaunch()
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(launchAttributes()).toBeUndefined()

		useRadioStore.setState({showOnHome: false, hydrated: true})
		await launched
		expect(launchAttributes()).toMatchObject({radio: 'off'})
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

describe('reportLinkTargetChange', () => {
	it('counts the new choice', () => {
		reportLinkTargetChange('safari')

		expect(Sentry.metrics.count).toHaveBeenCalledWith('open_links.change', 1, {
			attributes: {links: 'safari'},
		})
	})
})

describe('reportRadioPlayerChange', () => {
	it('counts turning the radio player off', () => {
		reportRadioPlayerChange(false)

		expect(Sentry.metrics.count).toHaveBeenCalledWith('radio_player.change', 1, {
			attributes: {radio: 'off'},
		})
	})
})
