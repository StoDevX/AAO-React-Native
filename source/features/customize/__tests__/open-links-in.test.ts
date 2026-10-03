import {afterEach, describe, expect, it, jest} from '@jest/globals'
import {act, renderHook, waitFor} from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as storage from '../../../lib/storage'
import {useOpenLinksIn} from '../open-links-in'
import {reportLinkTargetChange} from '../telemetry'

jest.mock('../telemetry', () => ({reportLinkTargetChange: jest.fn()}))

afterEach(async () => {
	await AsyncStorage.clear()
	jest.clearAllMocks()
})

describe('useOpenLinksIn', () => {
	it('reads In App when nothing is saved', async () => {
		let {result} = await renderHook(() => useOpenLinksIn())
		await waitFor(() => expect(result.current[0]).toBe('app'))
	})

	it('reads Safari when the saved preference is off', async () => {
		await storage.setLinkPreference(false)
		let {result} = await renderHook(() => useOpenLinksIn())
		await waitFor(() => expect(result.current[0]).toBe('safari'))
	})

	it('saves Safari as the existing boolean, false', async () => {
		let {result} = await renderHook(() => useOpenLinksIn())
		await act(() => result.current[1]('safari'))
		expect(result.current[0]).toBe('safari')
		expect(await storage.getInAppLinkPreference()).toBe(false)
		expect(reportLinkTargetChange).toHaveBeenCalledWith('safari')
	})

	it('reports nothing until someone chooses', async () => {
		let {result} = await renderHook(() => useOpenLinksIn())
		await waitFor(() => expect(result.current[0]).toBe('app'))
		expect(reportLinkTargetChange).not.toHaveBeenCalled()
	})

	it('saves In App as true', async () => {
		await storage.setLinkPreference(false)
		let {result} = await renderHook(() => useOpenLinksIn())
		await act(() => result.current[1]('app'))
		expect(await storage.getInAppLinkPreference()).toBe(true)
	})
})
