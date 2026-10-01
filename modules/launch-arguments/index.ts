import {NativeModule, requireNativeModule} from 'expo-modules-core'

/** Where a feature with fixtures gets its data; see LaunchArgumentsModule.swift. */
export type FixtureMode = 'live' | 'serve' | 'record'

interface LaunchArgumentsModule extends NativeModule {
	isUITesting: boolean
	fixtureMode: FixtureMode
	secretProgress: number
	secretLockoutEnded: boolean
}

const LaunchArguments = requireNativeModule<LaunchArgumentsModule>('LaunchArguments')

export const isUITesting: boolean = LaunchArguments.isUITesting
export const fixtureMode: FixtureMode = LaunchArguments.fixtureMode
/** Where the home screen's secret slab starts, from --secret-progress=N; 0 otherwise. */
export const secretProgress: number = LaunchArguments.secretProgress
/** Whether to start with a red-button lockout that has already run out, from --secret-lockout-ended. */
export const secretLockoutEnded: boolean = LaunchArguments.secretLockoutEnded
