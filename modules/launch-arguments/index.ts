import {NativeModule, requireNativeModule} from 'expo-modules-core'

/** Where a feature with fixtures gets its data; see LaunchArgumentsModule.swift. */
export type FixtureMode = 'live' | 'serve' | 'record'

/** Whether a chaos run records the responses it gets, or answers from a recording. */
export type ChaosMode = 'record' | 'replay'

interface LaunchArgumentsModule extends NativeModule {
	isUITesting: boolean
	fixtureMode: FixtureMode
	isChaos: boolean
	chaosSeed: number
	chaosLaunch: number
	chaosMode: ChaosMode
	chaosFaultRate: number
}

const LaunchArguments = requireNativeModule<LaunchArgumentsModule>('LaunchArguments')

export const isUITesting: boolean = LaunchArguments.isUITesting
export const fixtureMode: FixtureMode = LaunchArguments.fixtureMode
export const isChaos: boolean = LaunchArguments.isChaos
export const chaosSeed: number = LaunchArguments.chaosSeed
export const chaosLaunch: number = LaunchArguments.chaosLaunch
export const chaosMode: ChaosMode = LaunchArguments.chaosMode
export const chaosFaultRate: number = LaunchArguments.chaosFaultRate
