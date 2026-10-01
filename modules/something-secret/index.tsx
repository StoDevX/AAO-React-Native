import * as React from 'react'
import {requireNativeView} from 'expo'
import {NativeModule, requireNativeModule} from 'expo-modules-core'

/** Where the slab is, from buried to split open; see stageFor in the something-secret feature. */
export type SlabStage = 'blank' | 'tremor' | 'edge' | 'risen' | 'cracking' | 'open'

export type SlabViewProps = {
	stage: SlabStage
	/** How far through `stage`, from 0 to 1 */
	fraction: number
	/** Goes up by one on each tap, and only on a tap, to set off the tap's shake and debris */
	tapCount: number
	inscription: string
	buttonLabel: string
	/** What VoiceOver calls the space */
	label: string
	hint: string
	testID?: string
	buttonTestID?: string
	onSlabTap: () => void
	onButtonPress?: () => void
}

const SlabNativeView: React.ComponentType<SlabViewProps> = requireNativeView(
	'SomethingSecret',
	'SlabView',
)

/**
 * The blank space under the home screen's notice, and the slab that tapping it raises. Renders
 * only inside a `Host`: it is a SwiftUI view, not a React Native one.
 */
export function SlabView({onSlabTap, onButtonPress, ...rest}: SlabViewProps): React.ReactNode {
	return (
		<SlabNativeView
			{...rest}
			onButtonPress={() => onButtonPress?.()}
			onSlabTap={() => onSlabTap()}
		/>
	)
}

type SomethingSecretEvents = {
	onShakeEscape: () => void
}

declare class SomethingSecretModule extends NativeModule<SomethingSecretEvents> {
	roar(): void
	melt(): Promise<void>
	startShakeWatch(): void
	stopShakeWatch(): void
}

const SomethingSecret = requireNativeModule<SomethingSecretModule>('SomethingSecret')

/** Plays the roar. Silent with the mute switch on, and leaves other audio playing. */
export function roar(): void {
	SomethingSecret.roar()
}

/** Melts the whole app away to black, resolving once the melt has gone. */
export function melt(): Promise<void> {
	return SomethingSecret.melt()
}

/** Starts watching for a hard shake; the accelerometer runs only between start and stop. */
export function startShakeWatch(): void {
	SomethingSecret.startShakeWatch()
}

export function stopShakeWatch(): void {
	SomethingSecret.stopShakeWatch()
}

/** Calls `listener` once about three seconds of hard shaking have been felt. */
export function addShakeEscapeListener(listener: () => void): {remove: () => void} {
	return SomethingSecret.addListener('onShakeEscape', listener)
}
