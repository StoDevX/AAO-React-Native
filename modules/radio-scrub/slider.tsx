import * as React from 'react'
import type {NativeSyntheticEvent, ViewProps} from 'react-native'
import {requireNativeView} from 'expo'
import {radioScrub} from './index'

type Props = ViewProps & {
	value: number
	minimum: number
	maximum: number
	disabled: boolean
	label: string
	unit?: 'percent' | 'milliseconds'
	signed?: boolean
	tint: string
	onValueChange: (event: NativeSyntheticEvent<{value: number}>) => void
}

const NativeSlider: React.ComponentType<Props> | null = radioScrub?.setPitch
	? requireNativeView('RadioScrub', 'ScrubSliderView')
	: null

/** A continuous native slider with percentage announcements. */
export function ScrubSlider(props: Props): React.ReactNode {
	return NativeSlider ? <NativeSlider {...props} /> : null
}
