import * as React from 'react'
import {View} from 'react-native'

import type {AirPlayButtonViewProps, VolumeSliderViewProps} from '@frogpond/audio-route'

/// The module reaches expo-modules-core's native view registry, which does
/// not exist under Jest, so each renders as a plain view that tests can find.
/// What the system draws and does with them is a device's to show.
export function VolumeSliderView(props: VolumeSliderViewProps): React.ReactNode {
	return <View testID="system-volume-slider" {...props} />
}

export function AirPlayButtonView(props: AirPlayButtonViewProps): React.ReactNode {
	return <View testID="airplay-route-picker" {...props} />
}
