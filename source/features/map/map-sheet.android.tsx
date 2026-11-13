import * as React from 'react'
import {Animated, PanResponder, StyleSheet, View, useWindowDimensions} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Host} from '@expo/ui/swift-ui'
import * as c from '@frogpond/colors'

import {sheetHeightFor} from './lib/sheet-height'
import type {SheetDetent} from './lib/sheet-moves'
import type {MapSheetProps} from './map-sheet'

export type {MapSheetProps}

/** The handle's strip at the sheet's top: Material's 4 dp handle, centred in a 48 dp target. */
const HANDLE_AREA = 36
/** How fast a fling has to be, in points per millisecond, to carry the sheet past the nearest stop. */
const FLING_VELOCITY = 0.5
const STOPS: readonly SheetDetent[] = ['collapsed', 'medium', 'large']
/** The search bar floating over the map's top, with its margins, which the full sheet stops under. */
const SEARCH_BAR_CLEARANCE = 72

/**
 * The map's sheet on Android: a Material *standard* bottom sheet, laid out in
 * the screen rather than presented over it, as Google Maps' is. A modal sheet
 * -- what a SwiftUI sheet becomes in Compose -- dims the map behind a scrim and
 * takes every touch, so the map could be neither seen clearly nor panned while
 * the sheet was up, and it swallowed Back. This one sits on the map: the map
 * stays bright and live above it, and Back is the screen's.
 *
 * It rests at the same three stops as iOS's, dragged between them by its
 * handle; a fling carries it on to the next stop. TalkBack moves it with the
 * handle's adjust actions.
 */
export function MapSheet({detents, current, onDragged, children}: MapSheetProps): React.ReactNode {
	let {height: windowHeight} = useWindowDimensions()
	let insets = useSafeAreaInsets()
	let available = windowHeight - insets.top
	let heights = React.useMemo(
		() => ({
			collapsed: sheetHeightFor(detents.collapsed, available) + HANDLE_AREA + insets.bottom,
			medium: sheetHeightFor(detents.medium, available),
			large: Math.min(sheetHeightFor(detents.large, available), available - SEARCH_BAR_CLEARANCE),
		}),
		[detents, available, insets.bottom],
	)

	let [height] = React.useState(() => new Animated.Value(heights[current]))
	React.useEffect(() => {
		Animated.spring(height, {
			toValue: heights[current],
			useNativeDriver: false,
			bounciness: 0,
		}).start()
	}, [height, heights, current])

	// What the responder, made once, reads when a drag happens: the stops and
	// callback as of the last render, and the height the drag began at.
	let [drag] = React.useState<DragState>(() => ({start: 0, heights, current, onDragged}))
	React.useEffect(() => {
		Object.assign(drag, {heights, current, onDragged})
	})
	let [pan] = React.useState(() => sheetResponder(height, drag))

	let step = (by: 1 | -1) => {
		let index = STOPS.indexOf(current) + by
		if (index >= 0 && index < STOPS.length) {
			onDragged(STOPS[index])
		}
	}

	return (
		<Animated.View style={[styles.sheet, {height}]}>
			<View
				{...pan.panHandlers}
				accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
				accessibilityLabel="Sheet"
				accessibilityRole="adjustable"
				accessibilityValue={{text: SPOKEN_STOP[current]}}
				onAccessibilityAction={(event) =>
					step(event.nativeEvent.actionName === 'increment' ? 1 : -1)
				}
				style={styles.handleArea}
			>
				<View style={styles.handle} />
			</View>
			<Host style={styles.content}>{children}</Host>
		</Animated.View>
	)
}

const SPOKEN_STOP: Record<SheetDetent, string> = {
	collapsed: 'Collapsed',
	medium: 'Half expanded',
	large: 'Expanded',
}

type DragState = {
	start: number
	heights: Record<SheetDetent, number>
	current: SheetDetent
	onDragged: (to: SheetDetent) => void
}

/**
 * The handle's drag: the sheet follows the finger between its lowest and
 * highest stops, and on release settles on a stop, reporting it if it moved.
 * `drag` holds the stops and callback as of the last render, and the height
 * the drag began at.
 */
function sheetResponder(
	height: Animated.Value,
	drag: DragState,
): ReturnType<typeof PanResponder.create> {
	return PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
		onPanResponderGrant: () => {
			let {heights: stops, current: at} = drag
			drag.start = stops[at]
			height.stopAnimation((value) => {
				drag.start = value
			})
		},
		onPanResponderMove: (_, gesture) => {
			let {heights: stops} = drag
			height.setValue(clamp(drag.start - gesture.dy, stops.collapsed, stops.large))
		},
		onPanResponderRelease: (_, gesture) => {
			let {heights: stops, current: at, onDragged: report} = drag
			let released = clamp(drag.start - gesture.dy, stops.collapsed, stops.large)
			let to = stopFor(released, -gesture.vy, stops)
			if (to === at) {
				Animated.spring(height, {toValue: stops[to], useNativeDriver: false, bounciness: 0}).start()
			} else {
				report(to)
			}
		},
	})
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

/**
 * The stop a drag released at `released` settles on: the nearest, or after a
 * fling (`velocity` in points per millisecond, upward positive) the next one
 * in the fling's direction.
 */
function stopFor(
	released: number,
	velocity: number,
	stops: Record<SheetDetent, number>,
): SheetDetent {
	if (Math.abs(velocity) > FLING_VELOCITY) {
		let ahead = STOPS.filter((stop) =>
			velocity > 0 ? stops[stop] > released : stops[stop] < released,
		)
		if (ahead.length > 0) {
			return (velocity > 0 ? ahead.at(0) : ahead.at(-1)) ?? ahead[0]
		}
	}
	return STOPS.reduce((nearest, stop) =>
		Math.abs(stops[stop] - released) < Math.abs(stops[nearest] - released) ? stop : nearest,
	)
}

const styles = StyleSheet.create({
	sheet: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: c.systemGroupedBackground,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		elevation: 3,
		overflow: 'hidden',
	},
	handleArea: {
		height: HANDLE_AREA,
		alignItems: 'center',
		justifyContent: 'center',
	},
	handle: {
		width: 32,
		height: 4,
		borderRadius: 2,
		backgroundColor: c.secondaryLabel,
	},
	content: {flex: 1},
})
