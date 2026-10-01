import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Sentry from '@sentry/react-native'
import {setQuickActions} from '@frogpond/quick-actions'

import {DEFAULT_QUICK_ACTIONS, resolveQuickActions} from '../destinations'
import {useQuickActionsStore} from '../store'
import {startQuickActionSync, toQuickActions} from '../sync'

jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

let mockSet = jest.mocked(setQuickActions)
let pushedIds = () => mockSet.mock.lastCall?.[0].map((action) => action.id)

// Each test starts as a fresh install: nothing stored, nothing pushed.
beforeEach(async () => {
	useQuickActionsStore.setState({quickActions: DEFAULT_QUICK_ACTIONS})
	await AsyncStorage.clear()
	mockSet.mockClear()
})

describe('toQuickActions', () => {
	test('maps each destination in order', () => {
		expect(toQuickActions(resolveQuickActions(['Cage Menu', 'Transit']))).toStrictEqual([
			{
				id: 'Cage Menu',
				title: 'Cage Menu',
				symbol: 'cup.and.saucer.fill',
				href: '/Menus/the-cage',
			},
			{id: 'Transit', title: 'Transit', symbol: 'bus.fill', href: '/Transit'},
		])
	})

	// Swift's URL(string:) rejects a space.
	test('encodes the href', () => {
		let [action] = toQuickActions(resolveQuickActions(['Streaming Media']))
		expect(action.href).toBe('/Streaming%20Media')
	})

	test('keeps a query string intact', () => {
		let [action] = toQuickActions(resolveQuickActions(['Map']))
		expect(action.href).toBe('/Map?campus=stolaf')
	})
})

describe('startQuickActionSync', () => {
	test('pushes the defaults once hydrated, with nothing stored', async () => {
		let stop = startQuickActionSync()
		await useQuickActionsStore.persist.rehydrate()
		expect(pushedIds()).toStrictEqual(DEFAULT_QUICK_ACTIONS)
		stop()
	})

	test('pushes again when the picks change', async () => {
		let stop = startQuickActionSync()
		await useQuickActionsStore.persist.rehydrate()
		useQuickActionsStore.getState().toggleQuickAction('Transit')
		expect(pushedIds()).toStrictEqual(['Stav Menu', 'Cage Menu', 'Olaf Messenger'])
		stop()
	})

	test('stops pushing once stopped', async () => {
		let stop = startQuickActionSync()
		await useQuickActionsStore.persist.rehydrate()
		stop()
		mockSet.mockClear()
		useQuickActionsStore.getState().toggleQuickAction('Transit')
		expect(mockSet).not.toHaveBeenCalled()
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
