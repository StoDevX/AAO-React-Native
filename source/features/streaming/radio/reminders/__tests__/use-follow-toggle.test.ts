import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import * as Notifications from 'expo-notifications'

import {useRadioStore} from '../../store'
import {useFollowToggle} from '../use-follow-toggle'

const HOZ = {stationId: 'krlx', title: 'HOZ'} as const

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
		useRadioStore.setState({followedShows: [], reminderPermission: null})
	})

	test('Not Now takes the follow back, leaving no follow the bell does not show', async () => {
		let {result} = await followHoz()
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
