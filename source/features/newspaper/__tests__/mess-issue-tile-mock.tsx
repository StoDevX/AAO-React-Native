import * as React from 'react'
import {Pressable, Text} from 'react-native'
import type {MessIssueTileProps} from '@frogpond/mess-issue-tile'

/**
 * The module reaches expo-modules-core's native view registry, which does not exist under Jest,
 * so the Mess tests render this instead: a button carrying the tile's label and test id, and the
 * props a test may ask about -- the layout, the stain count and kind, and how many paragraphs it
 * was handed -- as its accessibility value. Nothing here draws paper, photos or stains, so a Jest
 * test is never evidence of how a tile looks.
 */
export function MessIssueTile(props: MessIssueTileProps): React.ReactNode {
	tileEvents.renders.push(props.accessibilityLabel)
	// A state initializer runs once per mount: the label a tile had when it was built.
	React.useState(() => tileEvents.mounts.push(props.accessibilityLabel))
	let value = `${props.layout}, ${props.stains.length} ${props.stainKind}, ${props.paragraphs.length} paragraphs`
	return (
		<Pressable
			accessibilityHint={props.photoTone}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole="button"
			accessibilityValue={{text: value}}
			onPress={props.onPress}
			testID={props.testID}
		>
			<Text>{props.title}</Text>
		</Pressable>
	)
}

/**
 * Each tile's label as it rendered and as it mounted, in order. A tile mounted again is a native
 * view built again, and a tile rendered again sends its props across to native again.
 */
export const tileEvents: {renders: string[]; mounts: string[]} = {renders: [], mounts: []}
