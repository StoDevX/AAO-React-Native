import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Sentry from '@sentry/react-native'
import {setQuickActions} from '@frogpond/quick-actions'

import {resolveQuickActions} from '../destinations'
import {useQuickActionsStore} from '../store'
import {startQuickActionSync, toQuickActions} from '../sync'
import {useCampusStore} from '../../campus/store'
import {campusById} from '../../../campuses'

const stolaf = campusById('edu.stolaf')
const STOLAF_DEFAULTS = ['Stav Menu', 'Cage Menu', 'Olaf Messenger', 'Transit']

jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

let mockSet = jest.mocked(setQuickActions)
let pushedIds = () => mockSet.mock.lastCall?.[0].map((action) => action.id)

// Each test starts as a fresh install: nothing stored, nothing pushed.
beforeEach(async () => {
	useQuickActionsStore.setState({picked: {}})
	useCampusStore.setState({campus: 'edu.stolaf'})
	await AsyncStorage.clear()
	mockSet.mockClear()
})

describe('toQuickActions', () => {
	test('maps each destination in order', () => {
		expect(toQuickActions(resolveQuickActions(['Cage Menu', 'Transit'], stolaf))).toStrictEqual([
			{
				id: 'Cage Menu',
				title: 'Cage Menu',
				systemName: 'cup.and.saucer.fill',
				href: '/menus/the-cage',
			},
			{id: 'Transit', title: 'Transit', systemName: 'bus.fill', href: '/transit'},
		])
	})

	test("names a custom symbol by its asset name, which iOS finds in the app's catalog", () => {
		let [action] = toQuickActions(resolveQuickActions(['Olaf Messenger'], stolaf))
		expect(action).toStrictEqual({
			id: 'Olaf Messenger',
			title: 'Olaf Messenger',
			assetName: 'olaf-messenger',
			href: '/messenger',
		})
	})

	// Swift's URL(string:) rejects a space.
	test('encodes the href', () => {
		let [action] = toQuickActions([
			{id: 'Spaced', title: 'Spaced', icon: 'map.fill', href: '/a route'},
		])
		expect(action.href).toBe('/a%20route')
	})

	test('keeps a query string intact', () => {
		let [action] = toQuickActions(resolveQuickActions(['Map'], stolaf))
		expect(action.href).toBe('/map?campus=edu.stolaf')
	})
})

describe('startQuickActionSync', () => {
	test('pushes the defaults once hydrated, with nothing stored', async () => {
		let stop = startQuickActionSync()
		await useQuickActionsStore.persist.rehydrate()
		expect(pushedIds()).toStrictEqual(STOLAF_DEFAULTS)
		stop()
	})

	test('pushes again when the picks change', async () => {
		let stop = startQuickActionSync()
		await useQuickActionsStore.persist.rehydrate()
		useQuickActionsStore.getState().toggleQuickAction('Transit', stolaf)
		expect(pushedIds()).toStrictEqual(['Stav Menu', 'Cage Menu', 'Olaf Messenger'])
		stop()
	})

	test('stops pushing once stopped', async () => {
		let stop = startQuickActionSync()
		await useQuickActionsStore.persist.rehydrate()
		stop()
		mockSet.mockClear()
		useQuickActionsStore.getState().toggleQuickAction('Transit', stolaf)
		expect(mockSet).not.toHaveBeenCalled()
	})

	test("pushes the campus's own picks when the campus changes", async () => {
		let stop = startQuickActionSync()
		await useQuickActionsStore.persist.rehydrate()
		useCampusStore.getState().setCampus('edu.carleton')
		expect(pushedIds()).toStrictEqual(['Menus', 'Building Hours', 'SUMO', 'Convo'])
		useCampusStore.getState().setCampus('edu.stolaf')
		expect(pushedIds()).toStrictEqual(STOLAF_DEFAULTS)
		stop()
	})

	test('pushes nothing, and does not throw, before a campus is chosen', async () => {
		useCampusStore.setState({campus: null})
		let stop = startQuickActionSync()
		await useQuickActionsStore.persist.rehydrate()
		expect(mockSet).not.toHaveBeenCalled()
		stop()
	})

	// The menu is a convenience, so a failure is reported, never thrown.
	test('reports a failed push to Sentry', async () => {
		let failure = new Error('no shortcut items')
		mockSet.mockRejectedValueOnce(failure)
		let stop = startQuickActionSync()
		await useQuickActionsStore.persist.rehydrate()
		await Promise.resolve()
		expect(Sentry.captureException).toHaveBeenCalledWith(failure)
		stop()
	})
})
