import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import * as Notifications from 'expo-notifications'
import {Platform} from 'react-native'

import {useRadioStore} from '../../store'
import {useFollowToggle} from '../use-follow-toggle'

const HOZ = {stationId: 'krlx', title: 'HOZ'} as const
const LATE_LIFT = {stationId: 'ksto', title: 'Late Lift'} as const

/** What iOS reports, in the shape expo-notifications returns it. */
function answer(status: 'undetermined' | 'denied' | 'granted') {
	return {
		granted: status === 'granted',
		canAskAgain: status === 'undetermined',
		expires: 'never' as const,
		status: status as Notifications.PermissionStatus,
	}
}

async function followHoz() {
	let hook = await renderHook(() => useFollowToggle('player'))
	await act(() => hook.result.current.toggle(HOZ))
	await waitFor(() => expect(hook.result.current.prompt).not.toBeNull())
	return hook
}

describe('useFollowToggle', () => {
	beforeEach(() => {
		useRadioStore.setState({followedShows: [], reminderPermission: null, onTimeAsked: false})
	})

	test('Not Now takes the follow back, leaving no follow the bell does not show', async () => {
		let {result} = await followHoz()
		await act(() => result.current.dismissPrompt())
		expect(useRadioStore.getState().followedShows).toStrictEqual([])
	})

	test('Not Now takes back every follow made while the sheet was asking', async () => {
		let {result} = await followHoz()
		await act(() => result.current.toggle(LATE_LIFT))
		await act(() => result.current.dismissPrompt())
		expect(useRadioStore.getState().followedShows).toStrictEqual([])
	})

	test('a follow iOS is then refused is taken back', async () => {
		jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValueOnce(answer('denied'))
		let {result} = await followHoz()
		await act(() => result.current.confirmPrompt())
		await waitFor(() => expect(useRadioStore.getState().followedShows).toStrictEqual([]))
	})

	test('a follow iOS then allows is kept', async () => {
		jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValueOnce(answer('granted'))
		let {result} = await followHoz()
		await act(async () => {
			result.current.confirmPrompt()
			await new Promise((resolve) => setTimeout(resolve, 0))
		})
		expect(useRadioStore.getState().followedShows).toStrictEqual([HOZ])
	})

	test('a follow sent to Settings is kept, to remind once notifications are on', async () => {
		jest.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce(answer('denied'))
		let {result} = await followHoz()
		expect(result.current.prompt).toBe('settings')
		await act(() => result.current.confirmPrompt())
		expect(useRadioStore.getState().followedShows).toStrictEqual([HOZ])
	})
})

describe('useFollowToggle on Android, with notifications on but exact alarms off', () => {
	beforeEach(() => {
		useRadioStore.setState({followedShows: [], reminderPermission: null, onTimeAsked: false})
		jest.replaceProperty(Platform, 'OS', 'android')
		jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue(answer('granted'))
		jest
			.mocked(Notifications.getExactAlarmPermissionsAsync)
			.mockResolvedValue({...answer('denied'), canAskAgain: true})
	})

	afterEach(() => {
		jest.mocked(Notifications.getPermissionsAsync).mockReset()
		jest.mocked(Notifications.getExactAlarmPermissionsAsync).mockReset()
		jest.mocked(Notifications.requestExactAlarmPermissionsAsync).mockClear()
	})

	test('a follow offers on-time reminders', async () => {
		let {result} = await followHoz()
		expect(result.current.prompt).toBe('onTime')
	})

	test('Not now keeps the follow, whose reminder still arrives, and is not asked again', async () => {
		let {result} = await followHoz()
		await act(() => result.current.dismissPrompt())
		expect(useRadioStore.getState()).toMatchObject({followedShows: [HOZ], onTimeAsked: true})

		await act(() => result.current.toggle(LATE_LIFT))
		await waitFor(() =>
			expect(useRadioStore.getState().followedShows).toStrictEqual([HOZ, LATE_LIFT]),
		)
		await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
		expect(result.current.prompt).toBeNull()
	})

	test('Open settings opens Alarms & reminders, keeps the follow and is not asked again', async () => {
		let {result} = await followHoz()
		await act(async () => {
			result.current.confirmPrompt()
			await new Promise((resolve) => setTimeout(resolve, 0))
		})
		expect(Notifications.requestExactAlarmPermissionsAsync).toHaveBeenCalledTimes(1)
		expect(useRadioStore.getState()).toMatchObject({followedShows: [HOZ], onTimeAsked: true})
	})

	test('nothing is offered once exact alarms are allowed', async () => {
		jest.mocked(Notifications.getExactAlarmPermissionsAsync).mockResolvedValue(answer('granted'))
		let hook = await renderHook(() => useFollowToggle('player'))
		await act(() => hook.result.current.toggle(HOZ))
		await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
		expect(hook.result.current.prompt).toBeNull()
		expect(useRadioStore.getState().followedShows).toStrictEqual([HOZ])
	})
})
