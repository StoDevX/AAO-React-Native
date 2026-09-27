import * as React from 'react'
import {requireNativeView} from 'expo'

/** Where one stain sits on a tile, as shares of the tile's width and height; see stainMarks in the Mess feature. */
export type StainMark = {
	/** The ring's centre */
	x: number
	y: number
	/** The ring's radius, as a share of the tile's width */
	radius: number
	/** Turns the ring's wobble, in degrees */
	rotation: number
	/** Where the ring's drawn edge starts, and how much of the circle it runs, as shares of a turn */
	arcStart: number
	arcLength: number
}

/** What an issue's tile shows for the stories read: coffee rings, tea rings, or nothing. */
export type StainKind = 'coffee' | 'tea' | 'none'

/** A grid tile, or the top tile laid out for a tall or a wide window. */
export type TileLayout = 'grid' | 'topPortrait' | 'topLandscape'

export type MessIssueTileProps = {
	title: string
	/** The issue's date as words, "April 29, 2026"; the tile sets it in capitals */
	date: string
	special: boolean
	photoUrl: string | null
	stains: StainMark[]
	stainKind: StainKind
	layout: TileLayout
	/** The lead story's words, for the top tile's columns; none draws blank paper there */
	paragraphs: string[]
	/** The tile is one button; this is all VoiceOver reads of it */
	accessibilityLabel: string
	testID?: string
	onPress: () => void
}

type NativeProps = Omit<MessIssueTileProps, 'onPress' | 'accessibilityLabel' | 'photoUrl'> & {
	label: string
	photoUrl?: string
	onTilePress: () => void
}

const MessIssueTileNativeView: React.ComponentType<NativeProps> = requireNativeView(
	'MessIssueTile',
	'MessIssueTileView',
)

/**
 * One Messenger issue as a small folded broadsheet. Renders only inside a `Host`: it is a SwiftUI
 * view, not a React Native one.
 */
export function MessIssueTile({
	accessibilityLabel,
	onPress,
	photoUrl,
	...rest
}: MessIssueTileProps): React.ReactNode {
	return (
		<MessIssueTileNativeView
			{...rest}
			label={accessibilityLabel}
			onTilePress={onPress}
			photoUrl={photoUrl ?? undefined}
		/>
	)
}
