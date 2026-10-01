import * as React from 'react'
import {requireNativeView} from 'expo'
import {requireNativeModule, type NativeModule} from 'expo-modules-core'

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

interface SomethingSecretModule extends NativeModule {
	roar(): void
}

const SomethingSecret = requireNativeModule<SomethingSecretModule>('SomethingSecret')

/** Plays the roar. Silent with the mute switch on, and leaves other audio playing. */
export function roar(): void {
	SomethingSecret.roar()
}
