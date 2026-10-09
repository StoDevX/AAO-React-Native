import {NativeModule, requireNativeModule} from 'expo-modules-core'

/** Where a feature with fixtures gets its data; see LaunchArgumentsModule.swift. */
export type FixtureMode = 'live' | 'serve' | 'record'

/** Whether a chaos run records the responses it gets, or answers from a recording. */
export type ChaosMode = 'record' | 'replay'

/** Which kind of chaos run: a fuzzer, or a realistic session. */
export type ChaosProfile = 'fuzz' | 'session'

/** The UI test runner's request to reset the app and open `url`. */
export interface ResetRequest {
	id: string
	url: string
}

type LaunchArgumentsEvents = {
	onResetRequested: (request: ResetRequest) => void
}

declare class LaunchArgumentsModule extends NativeModule<LaunchArgumentsEvents> {
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
	finishReset(id: string, url: string): Promise<void>
	takePendingResetURL(): string | null
	uiTestCampus(): string | null
	reportMissingFixture(campus: string, key: string): void
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

/**
 * The campus, by id (`edu.carleton`), a UI test named with `--campus`: the
 * launch's, or the last in-place reset's. Null outside UI tests and for a test
 * naming none. Read once per JavaScript load; a reset reloads it.
 */
export const uiTestCampus: string | null = LaunchArguments.uiTestCampus()

/**
 * Calls `listener` whenever the UI test runner asks to reset the app in place;
 * see UITestResetChannel.swift. Never calls it outside the UI tests.
 */
export function addResetListener(listener: (request: ResetRequest) => void): () => void {
	let subscription = LaunchArguments.addListener('onResetRequested', listener)
	return () => subscription.remove()
}

/** Clears what JavaScript cannot reach, and tells the runner the app is reloading. */
export function finishReset(request: ResetRequest): Promise<void> {
	return LaunchArguments.finishReset(request.id, request.url)
}

/** The deep link the last reset asked for, once; null when there was none. */
export function takePendingResetURL(): string | null {
	return LaunchArguments.takePendingResetURL()
}

/**
 * Tells the UI test runner a request had no fixture, so the test fails naming
 * it (uitests/UITestCase.swift). Does nothing outside UI tests or while
 * recording, when every request is answered.
 */
export function reportMissingFixture(campus: string, key: string): void {
	if (isUITesting && fixtureMode !== 'record') {
		LaunchArguments.reportMissingFixture(campus, key)
	}
}
