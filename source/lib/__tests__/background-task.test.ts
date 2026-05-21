import {act} from '@testing-library/react-native'
import {describe, it, expect, beforeEach, jest} from '@jest/globals'

import {BackgroundFetchResult} from 'expo-background-fetch'
import type {TaskManagerTaskExecutor} from 'expo-task-manager'

// ─── Module mocks ─────────────────────────────────────────────────────────────

let capturedTaskExecutor: TaskManagerTaskExecutor | undefined

jest.mock('expo-notifications', () => ({
	IosAuthorizationStatus: {
		NOT_DETERMINED: 0,
		DENIED: 1,
		AUTHORIZED: 2,
		PROVISIONAL: 3,
		EPHEMERAL: 4,
	},
}))

jest.mock('expo-task-manager', () => ({
	defineTask: jest.fn(
		(_taskName: string, executor: TaskManagerTaskExecutor) => {
			capturedTaskExecutor = executor
		},
	),
	isTaskRegisteredAsync: jest.fn(),
}))

jest.mock('expo-background-fetch', () => ({
	BackgroundFetchResult: {NoData: 1, NewData: 2, Failed: 3},
	registerTaskAsync: jest.fn(),
	unregisterTaskAsync: jest.fn(),
}))

jest.mock('../notification-preferences', () => ({
	useNotificationPreferences: {
		getState: jest.fn(),
	},
}))

jest.mock('@frogpond/api', () => ({
	client: {get: jest.fn()},
}))

jest.mock('../notifications', () => ({
	BACKGROUND_NOTIFICATIONS_TASK: 'com.drewvolz.stolaf.background-notifications',
	hasContentChanged: jest.fn(),
	scheduleLocalNotification: jest.fn(),
	setStoredHash: jest.fn(),
}))

// ─── Imports (after mocks are in place) ──────────────────────────────────────

import * as TaskManager from 'expo-task-manager'
import * as BackgroundFetch from 'expo-background-fetch'
import {useNotificationPreferences} from '../notification-preferences'
import {client} from '@frogpond/api'
import {
	hasContentChanged,
	scheduleLocalNotification,
	setStoredHash,
} from '../notifications'
import {
	registerBackgroundTaskAsync,
	unregisterBackgroundTaskAsync,
	checkMenusNotification,
	checkCalendarNotification,
	checkNewsNotification,
} from '../background-task'

// ─── Test helpers ─────────────────────────────────────────────────────────────

const mockGetState = useNotificationPreferences.getState as jest.MockedFunction<
	typeof useNotificationPreferences.getState
>
const mockIsRegistered =
	TaskManager.isTaskRegisteredAsync as jest.MockedFunction<
		typeof TaskManager.isTaskRegisteredAsync
	>
const mockRegister = BackgroundFetch.registerTaskAsync as jest.MockedFunction<
	typeof BackgroundFetch.registerTaskAsync
>
const mockUnregister =
	BackgroundFetch.unregisterTaskAsync as jest.MockedFunction<
		typeof BackgroundFetch.unregisterTaskAsync
	>

const mockClientGet = client.get as jest.MockedFunction<typeof client.get>
const mockHasContentChanged = hasContentChanged as jest.MockedFunction<
	typeof hasContentChanged
>
const mockScheduleLocalNotification =
	scheduleLocalNotification as jest.MockedFunction<
		typeof scheduleLocalNotification
	>
const mockSetStoredHash = setStoredHash as jest.MockedFunction<
	typeof setStoredHash
>

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('background-task: TaskManager.defineTask', () => {
	it('calls defineTask with the background notifications task name', () => {
		expect(TaskManager.defineTask).toHaveBeenCalledWith(
			'com.drewvolz.stolaf.background-notifications',
			expect.any(Function),
		)
	})
})

describe('background-task: task executor', () => {
	function runTask(): Promise<BackgroundFetchResult> {
		if (!capturedTaskExecutor) throw new Error('task executor not captured')
		return capturedTaskExecutor({
			data: undefined,
			error: null,
			executionInfo: {eventId: 'test-event', taskName: 'test'},
		}) as Promise<BackgroundFetchResult>
	}

	beforeEach(() => {
		mockClientGet.mockReturnValue({
			json: jest.fn().mockImplementation(() => Promise.resolve({})),
		} as unknown as ReturnType<typeof client.get>)
		mockHasContentChanged.mockResolvedValue({changed: false, newHash: 'abc'})
		mockScheduleLocalNotification.mockResolvedValue('notif-id')
		mockSetStoredHash.mockResolvedValue(undefined)
	})

	it('returns NoData when master toggle is off', async () => {
		mockGetState.mockReturnValue({
			enabled: false,
			features: {},
			setEnabled: jest.fn(),
			setFeatureEnabled: jest.fn(),
			enabledFeatures: () => [],
		})
		const result = await runTask()
		expect(result).toBe(BackgroundFetchResult.NoData)
	})

	it('returns NoData when enabled but no features are opted in', async () => {
		mockGetState.mockReturnValue({
			enabled: true,
			features: {},
			setEnabled: jest.fn(),
			setFeatureEnabled: jest.fn(),
			enabledFeatures: () => [],
		})
		const result = await runTask()
		expect(result).toBe(BackgroundFetchResult.NoData)
	})

	it('returns NewData when at least one feature handler returns true', async () => {
		mockGetState.mockReturnValue({
			enabled: true,
			features: {menus: true},
			setEnabled: jest.fn(),
			setFeatureEnabled: jest.fn(),
			enabledFeatures: () => ['menus'],
		})
		mockHasContentChanged.mockResolvedValue({changed: true, newHash: 'new123'})
		const result = await runTask()
		expect(result).toBe(BackgroundFetchResult.NewData)
	})

	it('returns NoData when all feature handlers return false', async () => {
		mockGetState.mockReturnValue({
			enabled: true,
			features: {menus: true},
			setEnabled: jest.fn(),
			setFeatureEnabled: jest.fn(),
			enabledFeatures: () => ['menus'],
		})
		mockHasContentChanged.mockResolvedValue({changed: false, newHash: 'same'})
		const result = await runTask()
		expect(result).toBe(BackgroundFetchResult.NoData)
	})

	it('returns Failed when the executor throws', async () => {
		mockGetState.mockImplementation(() => {
			throw new Error('storage error')
		})
		const result = await runTask()
		expect(result).toBe(BackgroundFetchResult.Failed)
	})
})

// ─── Per-feature handler tests ────────────────────────────────────────────────

describe.each([
	{
		name: 'checkMenusNotification',
		fn: () => checkMenusNotification(),
		featureId: 'menus',
		expectedPath: 'food/named/menu/ccc',
		expectedTitle: "Today's Menu Updated",
	},
	{
		name: 'checkCalendarNotification',
		fn: () => checkCalendarNotification(),
		featureId: 'calendar',
		expectedPath: 'calendar/named/stolaf',
		expectedTitle: 'Calendar Updated',
	},
	{
		name: 'checkNewsNotification',
		fn: () => checkNewsNotification(),
		featureId: 'news',
		expectedPath: 'news/named/stolaf',
		expectedTitle: 'News Updated',
	},
])('$name', ({fn, featureId, expectedPath, expectedTitle}) => {
	const fakeData = {item: 'value'}

	beforeEach(() => {
		mockClientGet.mockReturnValue({
			json: jest.fn().mockImplementation(() => Promise.resolve(fakeData)),
		} as unknown as ReturnType<typeof client.get>)
		mockScheduleLocalNotification.mockClear()
		mockScheduleLocalNotification.mockResolvedValue('notif-id')
		mockSetStoredHash.mockClear()
		mockSetStoredHash.mockResolvedValue(undefined)
	})

	it('fetches from the correct path', async () => {
		mockHasContentChanged.mockResolvedValue({changed: false, newHash: 'h'})
		await fn()
		expect(mockClientGet).toHaveBeenCalledWith(expectedPath)
	})

	it('sends notification and stores hash when content changed, returns true', async () => {
		mockHasContentChanged.mockResolvedValue({
			changed: true,
			newHash: 'newHash123',
		})
		const result = await fn()
		expect(mockScheduleLocalNotification).toHaveBeenCalledWith(
			expect.objectContaining({title: expectedTitle, identifier: featureId}),
		)
		expect(mockSetStoredHash).toHaveBeenCalledWith(featureId, 'newHash123')
		expect(result).toBe(true)
	})

	it('does not send notification or store hash when content unchanged, returns false', async () => {
		mockHasContentChanged.mockResolvedValue({changed: false, newHash: 'same'})
		const result = await fn()
		expect(mockScheduleLocalNotification).not.toHaveBeenCalled()
		expect(mockSetStoredHash).not.toHaveBeenCalled()
		expect(result).toBe(false)
	})
})

describe('registerBackgroundTaskAsync', () => {
	beforeEach(() => {
		mockRegister.mockClear()
		mockRegister.mockResolvedValue(undefined)
	})

	it('registers the task when not already registered', async () => {
		mockIsRegistered.mockResolvedValue(false)
		await act(async () => {
			await registerBackgroundTaskAsync()
		})
		expect(mockRegister).toHaveBeenCalledWith(
			'com.drewvolz.stolaf.background-notifications',
			expect.objectContaining({minimumInterval: 15 * 60}),
		)
	})

	it('does not register again when already registered', async () => {
		mockIsRegistered.mockResolvedValue(true)
		await act(async () => {
			await registerBackgroundTaskAsync()
		})
		expect(mockRegister).not.toHaveBeenCalled()
	})
})

describe('unregisterBackgroundTaskAsync', () => {
	beforeEach(() => {
		mockUnregister.mockClear()
		mockUnregister.mockResolvedValue(undefined)
	})

	it('unregisters the task when registered', async () => {
		mockIsRegistered.mockResolvedValue(true)
		await act(async () => {
			await unregisterBackgroundTaskAsync()
		})
		expect(mockUnregister).toHaveBeenCalledWith(
			'com.drewvolz.stolaf.background-notifications',
		)
	})

	it('does not call unregister when not registered', async () => {
		mockIsRegistered.mockResolvedValue(false)
		await act(async () => {
			await unregisterBackgroundTaskAsync()
		})
		expect(mockUnregister).not.toHaveBeenCalled()
	})
})
