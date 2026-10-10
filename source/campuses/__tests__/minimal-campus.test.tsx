import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {render, screen, waitFor} from '@testing-library/react-native'
import {Provider as ReduxProvider} from 'react-redux'
import {configureStore} from '@reduxjs/toolkit'
import * as api from '@frogpond/api'

import type * as ExpoRouterMock from '../../testing/expo-router-mock'
import {reducer as settings} from '../../redux/parts/settings'
import {reducer as buildings} from '../../redux/parts/buildings'
import {reducer as courses} from '../../redux/parts/courses'

import type {CampusDefinition} from '../definition'
import type {CampusId} from '../ids'

const example: CampusDefinition = {
	id: 'edu.example' as CampusId,
	name: 'Example College',
	branding: {
		appName: 'All About Example',
		supportEmail: 'example@frogpond.tech',
		college: 'Example College',
		intro: 'An example campus.',
		notices: ['Not affiliated with Example College.'],
	},
	api: {
		defaultUrl: 'https://example.frogpond.tech/api/v1/',
		storageKey: 'settings:server-address:edu.example',
	},
	home: {tiles: []},
}

jest.mock('../ids', () => ({CAMPUS_IDS: ['edu.stolaf', 'edu.carleton', 'edu.example']}))
jest.mock('../index', () => {
	let actual = jest.requireActual<typeof import('../index')>('../index')
	let campuses = [...actual.CAMPUSES, example]
	return {
		...actual,
		CAMPUSES: campuses,
		isCampusId: (value: unknown) => campuses.some((campus) => campus.id === value),
		campusById: (id: string) => campuses.find((campus) => campus.id === id),
	}
})

import {useCampusStore} from '../../features/campus/store'
import {quickActionDestinations} from '../../features/quick-actions/destinations'
import {iconsByGroup} from '../../features/customize/icons'
import {faqsOptionsFor} from '../../features/faqs/query'
import {remoteSourcesFor} from '@frogpond/ccc-calendar'
import HomePage from '../../../app/index'
import SupportPage from '../../../app/support/index'
import CustomizePage from '../../../app/customize/index'
import AboutPage from '../../../app/about/index'

jest.mock('expo-router', () => {
	// oxlint-disable-next-line typescript/no-require-imports -- jest.mock factories cannot use import
	let {Stack} = require('../../testing/expo-router-mock') as typeof ExpoRouterMock
	return {
		Stack,
		Link: () => null,
		useRouter: () => ({push: jest.fn(), navigate: jest.fn()}),
		useFocusEffect: () => undefined,
		useNavigation: () => ({goBack: jest.fn(), addListener: () => () => undefined}),
		useLocalSearchParams: () => ({}),
	}
})
jest.mock('react-native-restart-newarch', () => ({Restart: jest.fn()}))
jest.mock(
	'react-native-safe-area-context',
	() =>
		// oxlint-disable-next-line typescript/no-require-imports -- jest.mock factories cannot use import
		require('react-native-safe-area-context/jest/mock').default,
)
jest.mock('expo-symbols', () => ({SymbolView: 'SymbolView'}))
// The app's own native views each come from `requireNativeView`; here each is
// a plain host component.
jest.mock('expo', () => ({requireNativeView: (name: string) => name}))
// The live servers, not the UI tests' bundled fixtures, so each screen asks
// a server for what it needs.
jest.mock('@frogpond/launch-arguments', () => ({
	isUITesting: false,
	uiTestCampus: null,
}))
jest.mock('react-native-change-icon', () => ({
	getIcon: () => Promise.resolve('Default'),
	changeIcon: jest.fn(),
}))
// The telemetry consent store persists through a native key-value store Jest lacks.
jest.mock('expo-sqlite/kv-store', () => ({
	Storage: {getItemSync: () => null, setItemSync: () => undefined, removeItemSync: () => true},
}))
jest.mock('expo-crypto', () => ({randomUUID: () => 'id-1'}))
// Home's radio bar plays through native audio; nothing here starts a station.
jest.mock('../../features/streaming/radio', () => ({
	NOW_PLAYING_BAR_CLEARANCE: 0,
	RadioNowPlayingBar: () => null,
	useRadioBarVisible: () => false,
	useRadioStore: jest.requireActual<typeof import('../../features/streaming/radio/store')>(
		'../../features/streaming/radio/store',
	).useRadioStore,
}))

describe('a campus with only the required sections', () => {
	test('becomes the active campus', () => {
		useCampusStore.getState().setCampus('edu.example' as never)
		expect(useCampusStore.getState().campus).toBe('edu.example')
	})

	test("offers no quick actions of St. Olaf's or Carleton's", () => {
		expect(quickActionDestinations(example)).toEqual([])
	})

	test('offers no app icon groups', () => {
		expect(iconsByGroup(example.appIcons)).toEqual([])
	})

	test("fetches no FAQs, rather than St. Olaf's", () => {
		let options = faqsOptionsFor(example)
		expect(options.enabled).toBe(false)
		expect(options.queryKey).toEqual(['edu.example', 'faqs'])
	})

	test("has no calendar sources, rather than St. Olaf's", () => {
		expect(remoteSourcesFor(example.calendar?.sources ?? [])).toEqual([])
	})
})

describe('a campus with only the required sections, on each screen it can reach', () => {
	let client: QueryClient
	let clientFor: jest.SpiedFunction<typeof api.clientFor>

	beforeEach(() => {
		client = new QueryClient({defaultOptions: {queries: {retry: false}}})
		// Every server is offline; what matters is which one a screen asks.
		clientFor = jest.spyOn(api, 'clientFor').mockImplementation(
			() =>
				({
					get: () => ({json: () => Promise.reject(new Error('offline'))}),
				}) as never,
		)
		useCampusStore.getState().setCampus('edu.example' as never)
	})

	afterEach(() => {
		client.clear()
		clientFor.mockRestore()
	})

	function renderScreen(Screen: () => React.ReactNode) {
		return render(
			<ReduxProvider store={configureStore({reducer: {settings, buildings, courses}})}>
				<QueryClientProvider client={client}>
					<Screen />
				</QueryClientProvider>
			</ReduxProvider>,
		)
	}

	test("Support offers no FAQs, which the campus doesn't have", async () => {
		await renderScreen(SupportPage)

		expect(screen.queryByText('FAQs')).toBeNull()
		expect(screen.getByText('Send Feedback')).toBeTruthy()
	})

	test.each([
		['Home', HomePage],
		['Support', SupportPage],
		['Customize', CustomizePage],
		['About', AboutPage],
	])("%s draws without asking St. Olaf's server for anything", async (_name, Screen) => {
		await renderScreen(Screen)
		// Each query's fetch starts after the render; let them all run.
		await waitFor(() => expect(client.isFetching()).toBe(0))

		expect(screen.toJSON()).not.toBeNull()
		expect(clientFor).not.toHaveBeenCalledWith('edu.stolaf')
	})
})
