import * as React from 'react'
import type {ViewProps} from 'react-native'
import {requireNativeView} from 'expo'
import {radioScrub} from './index'

export type VisualizationMode = 'waveform' | 'spectrum'

type Props = ViewProps & {
	attachment: string
	active: boolean
	mode: VisualizationMode
	tint: string
}

/** Metro can keep playing through a native binary that predates visualization. */
export const visualizationAvailable = typeof radioScrub?.supportsVisualization === 'function'

const NativeVisualizer: React.ComponentType<Props> | null = visualizationAvailable
	? requireNativeView('RadioScrub', 'RadioVisualizerView')
	: null

/** Native analysis and display interpolation keep audio off the JavaScript bridge. */
export function RadioVisualizer(props: Props): React.ReactNode {
	return NativeVisualizer ? <NativeVisualizer {...props} /> : null
}
