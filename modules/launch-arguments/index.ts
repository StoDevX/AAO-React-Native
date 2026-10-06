import {NativeModule, requireNativeModule} from 'expo-modules-core'

/** Where a feature with fixtures gets its data; see LaunchArgumentsModule.swift. */
export type FixtureMode = 'live' | 'serve' | 'record'

/** Whether a chaos run records the responses it gets, or answers from a recording. */
export type ChaosMode = 'record' | 'replay'

/** Which kind of chaos run: a fuzzer, or a realistic session. */
export type ChaosProfile = 'fuzz' | 'session'

interface LaunchArgumentsModule extends NativeModule {
	isUITesting: boolean
	fixtureMode: FixtureMode
	isChaos: boolean
	chaosSeed: number
	chaosLaunch: number
	chaosMode: ChaosMode
	chaosFaultRate: number
	chaosProfile: ChaosProfile
	isSimulator: boolean
	isDebugNativeBuild: boolean
}

const LaunchArguments = requireNativeModule<LaunchArgumentsModule>('LaunchArguments')

export const isUITesting: boolean = LaunchArguments.isUITesting
export const fixtureMode: FixtureMode = LaunchArguments.fixtureMode
export const isChaos: boolean = LaunchArguments.isChaos
export const chaosSeed: number = LaunchArguments.chaosSeed
export const chaosLaunch: number = LaunchArguments.chaosLaunch
export const chaosMode: ChaosMode = LaunchArguments.chaosMode
export const chaosFaultRate: number = LaunchArguments.chaosFaultRate
export const chaosProfile: ChaosProfile = LaunchArguments.chaosProfile
/** Running on a simulator, whatever the JS bundle. */
export const isSimulator: boolean = LaunchArguments.isSimulator
/** The native code was built in the Debug configuration, as the UI tests' and `mise run device`'s are. */
export const isDebugNativeBuild: boolean = LaunchArguments.isDebugNativeBuild
