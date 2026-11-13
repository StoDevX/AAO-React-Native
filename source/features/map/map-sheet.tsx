import * as React from 'react'
import {StyleSheet} from 'react-native'
import {BottomSheet, Group, Host} from '@expo/ui/swift-ui'
import {
	background,
	interactiveDismissDisabled,
	presentationBackgroundInteraction,
	presentationDetents,
	presentationDragIndicator,
	type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {nameOf} from './lib/sheet-detents'
import type {SheetDetent} from './lib/sheet-moves'

export type MapSheetProps = {
	/** Whether the sheet is up: the map screen shows it only while focused. */
	presented: boolean
	/** The system reported the sheet gone; the screen puts it back. */
	onPresentedChange: (presented: boolean) => void
	/** The heights the sheet rests at, by name. */
	detents: Record<SheetDetent, PresentationDetent>
	/** Where it rests now. */
	current: SheetDetent
	/** The reader dragged it to another stop. */
	onDragged: (to: SheetDetent) => void
	children: React.ReactNode
}

/**
 * The map's sheet, as Apple Maps' is: a sheet presented over the map that
 * never goes away, with the map live behind it at every stop.
 */
export function MapSheet({
	presented,
	onPresentedChange,
	detents,
	current,
	onDragged,
	children,
}: MapSheetProps): React.ReactNode {
	return (
		// Covers the map, and lets every touch through. The sheet is presented
		// rather than laid out, so the Host needs no size of its own -- but the
		// info card hosts a React Native image through RNHostView, and a
		// zero-sized Host gives that image no bounds to draw into, so the photo
		// came out blank. Full-bleed and `pointerEvents="none"` satisfies both:
		// the image gets a box, and the taps that select a building still reach
		// the map. The sheet is presented in its own window, so it stays
		// interactive.
		<Host pointerEvents="none" style={StyleSheet.absoluteFill}>
			<BottomSheet isPresented={presented} onIsPresentedChange={onPresentedChange}>
				<Group
					modifiers={[
						// The sheet's own chrome is a translucent material, and the map
						// read straight through the list. A PlatformColor rather than the
						// hex `presentationBackground` wants, so the sheet still follows
						// the system appearance.
						background(c.systemGroupedBackground),
						presentationDetents([detents.collapsed, detents.medium, detents.large], {
							selection: detents[current],
							onSelectionChange: (to) => onDragged(nameOf(to)),
						}),
						presentationDragIndicator('visible'),
						// The map behind the sheet stays live at every stop, which is the
						// whole point of a sheet rather than a pushed screen.
						presentationBackgroundInteraction('enabled'),
						// Apple Maps' sheet has no dismissed state, and neither has this
						// one: the collapsed stop is as small as it goes.
						interactiveDismissDisabled(true),
					]}
				>
					{children}
				</Group>
			</BottomSheet>
		</Host>
	)
}
