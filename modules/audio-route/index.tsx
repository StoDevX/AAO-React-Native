import * as React from 'react'
import type {ViewProps} from 'react-native'
import {requireNativeView} from 'expo'

export type VolumeSliderViewProps = ViewProps & {
	/** The colour of the slider's filled part. */
	tint?: string
	/** The colour of the slider's empty part. */
	trackTint?: string
}

export type AirPlayButtonViewProps = ViewProps & {
	/** The colour of the button's icon, in use or not. */
	tint?: string
}

const VolumeSliderNativeView: React.ComponentType<VolumeSliderViewProps> = requireNativeView(
	'AudioRoute',
	'VolumeSliderView',
)

const AirPlayButtonNativeView: React.ComponentType<AirPlayButtonViewProps> = requireNativeView(
	'AudioRoute',
	'AirPlayButtonView',
)

/**
 * The system's volume slider (`MPVolumeView`). It sets the device's volume, and moves with
 * the hardware buttons. The simulator draws no slider, so it shows only on a device.
 */
export function VolumeSliderView(props: VolumeSliderViewProps): React.ReactNode {
	return <VolumeSliderNativeView {...props} />
}

/**
 * The system's AirPlay button (`AVRoutePickerView`): it opens the list of places the audio can
 * play, and the system draws which is in use.
 */
export function AirPlayButtonView(props: AirPlayButtonViewProps): React.ReactNode {
	return <AirPlayButtonNativeView {...props} />
}
