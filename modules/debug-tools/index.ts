import {NativeModule, requireNativeModule} from 'expo-modules-core'

interface DebugToolsModule extends NativeModule {
	isAvailable(): boolean
	isEnabled(): boolean
	isRunning(): Promise<boolean>
	setEnabled(enabled: boolean): Promise<void>
	openDebugger(): Promise<void>
	setFloatingButtonEnabled(
		enabled: boolean,
		lightImage: string | null,
		darkImage: string | null,
	): Promise<void>
}

const DebugTools = requireNativeModule<DebugToolsModule>('DebugTools')

/** The floating button's artwork, as file URLs, for each appearance. */
export type FloatingButtonImages = {light: string; dark: string}

/**
 * Whether this build has DebugSwift: a Debug build, launched for neither a UI
 * test nor a chaos run.
 */
export const isDebugSwiftAvailable: boolean = DebugTools.isAvailable()

/** Whether the Developer screen's DebugSwift switch is on. */
export function isDebugSwiftEnabled(): boolean {
	return DebugTools.isEnabled()
}

/**
 * Whether DebugSwift has instrumented the app. It cannot undo that, so it
 * stays true after the switch is turned off, until the app restarts.
 */
export function isDebugSwiftRunning(): Promise<boolean> {
	return DebugTools.isRunning()
}

/**
 * Turn DebugSwift on, which sets it up at once and at every launch after, or
 * off, which hides its button and leaves the rest for the next launch.
 */
export function setDebugSwiftEnabled(enabled: boolean): Promise<void> {
	return DebugTools.setEnabled(enabled)
}

/** Open DebugSwift's tools over the app. Does nothing unless it is running. */
export function openDebugSwift(): Promise<void> {
	return DebugTools.openDebugger()
}

/**
 * Show or hide DebugSwift's floating button, drawn with `images` in place of
 * its own ball. Does nothing unless DebugSwift is running.
 */
export function setFloatingButtonEnabled(
	enabled: boolean,
	images?: FloatingButtonImages,
): Promise<void> {
	return DebugTools.setFloatingButtonEnabled(enabled, images?.light ?? null, images?.dark ?? null)
}
