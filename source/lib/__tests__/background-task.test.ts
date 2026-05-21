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

// ─── Imports (after mocks are in place) ──────────────────────────────────────

import * as TaskManager from 'expo-task-manager'
import * as BackgroundFetch from 'expo-background-fetch'
import {useNotificationPreferences} from '../notification-preferences'
import {
	registerBackgroundTaskAsync,
	unregisterBackgroundTaskAsync,
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

	it('returns NewData when enabled and at least one feature is opted in', async () => {
		mockGetState.mockReturnValue({
			enabled: true,
			features: {menus: true},
			setEnabled: jest.fn(),
			setFeatureEnabled: jest.fn(),
			enabledFeatures: () => ['menus'],
		})
		const result = await runTask()
		expect(result).toBe(BackgroundFetchResult.NewData)
	})

	it('returns Failed when the executor throws', async () => {
		mockGetState.mockImplementation(() => {
			throw new Error('storage error')
		})
		const result = await runTask()
		expect(result).toBe(BackgroundFetchResult.Failed)
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
