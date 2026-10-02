import {NativeModule, requireNativeModule} from 'expo-modules-core'

/** Where a feature with fixtures gets its data; see LaunchArgumentsModule.swift. */
export type FixtureMode = 'live' | 'serve' | 'record'

interface LaunchArgumentsModule extends NativeModule {
	isUITesting: boolean
	fixtureMode: FixtureMode
}

const LaunchArguments = requireNativeModule<LaunchArgumentsModule>('LaunchArguments')

export const isUITesting: boolean = LaunchArguments.isUITesting
export const fixtureMode: FixtureMode = LaunchArguments.fixtureMode
