import * as React from 'react'
import {StyleSheet, useWindowDimensions, View, type NativeSyntheticEvent} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {BottomSheet, Group, Host} from '@expo/ui/swift-ui'
import {
	background,
	interactiveDismissDisabled,
	presentationBackgroundInteraction,
	presentationDetents,
	presentationDragIndicator,
} from '@expo/ui/swift-ui/modifiers'
import {
	Camera,
	GeoJSONSource,
	Layer,
	Map,
	Marker,
	UserLocation,
	type CameraRef,
	type PressEventWithFeatures,
} from '@maplibre/maplibre-react-native'
import {useQuery} from '@tanstack/react-query'
import {Stack, useLocalSearchParams} from 'expo-router'
import * as c from '@frogpond/colors'
import {NoticeView} from '@frogpond/notice'

import {parseCampus} from '../../../source/features/building-hours/query'
import {cardVenuesOptions} from '../../../source/features/map/card-queries'
import type {Campus} from '../../../source/features/building-hours/types'
import {PlaceStackCard} from '../../../source/features/map/place-stack-card'
import {highlightedFeatureId, placeStack} from '../../../source/features/map/lib/place-stack'
import {BuildingPicker} from '../../../source/features/map/building-picker'
import {sheetHeightFor} from '../../../source/features/map/lib/sheet-height'
import {toBuildingFootprints} from '../../../source/features/map/lib/building-footprints'
import {
	nextSheetDetent,
	type SheetEvent,
	type SheetState,
} from '../../../source/features/map/lib/sheet-moves'
import {DETENT_FOR, nameOf, SHEET_DETENTS} from '../../../source/features/map/lib/sheet-detents'
import {mapDataOptions} from '../../../source/features/map/query'
import type {Coordinate, Point} from '../../../source/features/map/types'
import {mapStyleUrl} from '../../../source/features/map/urls'

/** Each campus's starting camera position. Carleton's predates this file
 * reading a campus from the route, and is kept exactly as it was. St. Olaf's
 * is the median of its 128 map features. */
const CAMPUS_CENTER: Record<Campus, Coordinate> = {
	carleton: [-93.15488752015, 44.460800862266],
	stolaf: [-93.1839, 44.4618],
}

const CAMPUS_TITLE: Record<Campus, string> = {
	carleton: 'Carleton Map',
	stolaf: 'St. Olaf Map',
}

const DEFAULT_ZOOM = 15
const SELECTION_ZOOM = 17
const CAMERA_ANIMATION_MS = 500
/// The dot itself is small enough to read as a pin rather than a blob; hitSlop
/// pads the tap area out to the 44pt minimum without growing the artwork.
const MARKER_SIZE = 20
const MIN_TOUCH_TARGET = 44
const MARKER_HIT_SLOP = (MIN_TOUCH_TARGET - MARKER_SIZE) / 2

/// The footprints are drawn by the tileset now, so this layer paints nothing.
/// It stays because it is the tap target, and now the source's only child:
/// MapLibre resolves a source press against a *rendered* layer. If a device
/// shows taps landing nowhere, a hair above zero is the fix -- zero opacity
/// should still hit-test, since it is `visibility: none` rather than opacity
/// that drops a layer from the tree.
const FOOTPRINT_OPACITY = 0

/// Under the header, clear of the sheet at every stop but `large`, which
/// covers the whole map anyway.
const ATTRIBUTION_POSITION = {top: 8, right: 8}

export default function MapPage(): React.ReactNode {
	// `/Map` has served Carleton alone since before it read the route, so a
	// missing param keeps that default rather than falling through to
	// parseCampus' own St. Olaf default, which belongs to `/Hours`. A param
	// that is present but unrecognised still falls back through parseCampus
	// rather than crashing.
	let {campus: campusParam} = useLocalSearchParams<{campus?: string}>()
	// Wrapped in useMemo, rather than a plain `let`, so the React Compiler
	// treats it as one reactive value with a clear dependency -- otherwise it
	// loses track of `dispatchStack`'s stability below and refuses to
	// preserve handleBuildingPress's manual memoization.
	let campus = React.useMemo(
		() => (campusParam === undefined ? 'carleton' : parseCampus(campusParam)),
		[campusParam],
	)

	let cameraRef = React.useRef<CameraRef>(null)
	// The sheet is the map's, not a route's, so its selection is the map's too.
	// The places open on the map, bottom to top: the sheet's card, then each
	// stacked over it.
	let [stack, dispatchStack] = React.useReducer(placeStack, [])
	let {data: buildings = [], error} = useQuery(mapDataOptions(campus))
	// For which feature a venue on top of the stack highlights.
	let {data: venues = []} = useQuery(cardVenuesOptions(campus))
	let {height: windowHeight} = useWindowDimensions()
	let insets = useSafeAreaInsets()
	let [sheetPresented, setSheetPresented] = React.useState(true)
	// Where the sheet rests, and where a search focus lifted it from. Every
	// move goes through `nextSheetDetent`, including the user's own drags.
	let [sheet, setSheet] = React.useState<SheetState>({current: 'collapsed', previous: null})
	let dispatchSheet = React.useCallback((event: SheetEvent) => {
		setSheet((state) => nextSheetDetent(event, state))
	}, [])

	// The sheet has no dismissed state. `interactiveDismissDisabled` should keep
	// it up, but if the system ever reports otherwise, present it again rather
	// than leaving the user on a bare map with no way to search.
	//
	// Storing the dismissal and undoing it here is the mechanism, not an
	// oversight: `isPresented` has to actually change for the native view to
	// hear about it, so re-presenting takes a render at `false` first. This is
	// the external-system case the rule carves out.
	React.useEffect(() => {
		if (!sheetPresented) {
			// oxlint-disable-next-line react/set-state-in-effect
			setSheetPresented(true)
		}
	}, [sheetPresented])

	// How much of the map the sheet is covering right now, which is what the
	// camera has to keep clear.
	// A fraction is measured against the window less the top inset, so the
	// camera is padded against the same thing rather than the whole window.
	let sheetHeight = sheetHeightFor(DETENT_FOR[sheet.current], windowHeight - insets.top)

	let footprints = React.useMemo(() => toBuildingFootprints(buildings), [buildings])

	// The source hands back whichever footprint was under the touch, so the
	// tap resolves against exactly the geometry the user can see. MapLibre also
	// applies a 44pt hitbox to it by default.
	let handleBuildingPress = React.useCallback(
		(event: NativeSyntheticEvent<PressEventWithFeatures>) => {
			// GeoJSON properties are typed as `any` by the spec's types, so this
			// is the boundary where that gets narrowed back to something real.
			let id: unknown = event.nativeEvent.features[0]?.properties?.buildingId
			if (typeof id !== 'string') {
				return
			}
			// One sheet, whose contents swap. Tapping a second building while
			// cards are up starts afresh from it, as Maps does.
			dispatchStack({type: 'start', id})
			dispatchSheet({type: 'footprint-tapped'})
		},
		[dispatchSheet],
	)

	// The map follows the top of the stack.
	let highlightedId = highlightedFeatureId(stack, venues)
	let selectedPoint = React.useMemo(() => {
		if (!highlightedId) {
			return null
		}
		let match = buildings.find((b) => b.id === highlightedId)
		if (!match) {
			return null
		}
		let point = match.geometry.geometries.find((geo): geo is Point => geo.type === 'Point')
		return point ? {id: match.id, name: match.properties.name, point} : null
	}, [highlightedId, buildings])

	// Reads the sheet's height at the moment of selection without depending on
	// it: Apple Maps leaves the map where it is when its sheet changes stop, so
	// only a new selection moves the camera.
	let easeToSelection = React.useEffectEvent((point: Point) => {
		cameraRef.current?.easeTo({
			center: point.coordinates,
			duration: CAMERA_ANIMATION_MS,
			// The sheet sits over the bottom of the map, so centring on the
			// building put the thing just selected underneath it. Pad by where
			// the sheet actually is: a hardcoded half-screen lifted the building
			// far too high whenever the sheet was resting collapsed.
			padding: {bottom: sheetHeight},
			zoom: SELECTION_ZOOM,
		})
	})

	React.useEffect(() => {
		if (selectedPoint) {
			easeToSelection(selectedPoint.point)
		}
	}, [selectedPoint])

	return (
		<View style={StyleSheet.absoluteFill}>
			<Stack.Title>{CAMPUS_TITLE[campus]}</Stack.Title>
			{/* The attribution button carries the OpenStreetMap credit the tiles'
			    licence requires, so it stays; it moves to the top corner because
			    the sheet's floating collapsed stop sat on top of it at the bottom. */}
			<Map
				attributionPosition={ATTRIBUTION_POSITION}
				logo={false}
				mapStyle={mapStyleUrl(campus)}
				style={StyleSheet.absoluteFill}
			>
				<Camera
					ref={cameraRef}
					initialViewState={{center: CAMPUS_CENTER[campus], zoom: DEFAULT_ZOOM}}
				/>
				<UserLocation />

				{/* carls-app/map-tiles serves the footprints and their labels as
				    `campus_buildings`, so this source no longer draws them -- a
				    second copy on top would double every outline. What it still
				    owns is the tap target. Keeping both here also keeps three tile-query
				    quirks out of the tap path: features repeat across tile
				    boundaries, the 28 places with no polygon are absent, and the
				    layer floors out at z14. A GeoJSON source has none of those. */}
				<GeoJSONSource data={footprints} id="campus-buildings" onPress={handleBuildingPress}>
					<Layer
						id="campus-buildings-hit"
						paint={{'fill-color': c.gold, 'fill-opacity': FOOTPRINT_OPACITY}}
						type="fill"
					/>
				</GeoJSONSource>

				{selectedPoint ? (
					<Marker
						key={selectedPoint.id}
						id={selectedPoint.id}
						lngLat={selectedPoint.point.coordinates}
					>
						<View
							accessibilityLabel={`${selectedPoint.name} marker`}
							accessibilityRole="image"
							hitSlop={MARKER_HIT_SLOP}
							style={styles.markerOuter}
						>
							<View style={styles.markerInner} />
						</View>
					</Marker>
				) : null}
			</Map>
			{/* Covers the map, and lets every touch through. The sheet is
			    presented rather than laid out, so the Host needs no size of its
			    own -- but the info card hosts a React Native image through
			    RNHostView, and a zero-sized Host gives that image no bounds to
			    draw into, so the photo came out blank. Full-bleed and
			    `pointerEvents="none"` satisfies both: the image gets a box, and
			    the taps that select a building still reach the map. The sheet is
			    presented in its own window, so it stays interactive. */}
			<Host pointerEvents="none" style={StyleSheet.absoluteFill}>
				<BottomSheet isPresented={sheetPresented} onIsPresentedChange={setSheetPresented}>
					<Group
						modifiers={[
							// The sheet's own chrome is a translucent material, and the
							// map read straight through the list. A PlatformColor rather
							// than the hex `presentationBackground` wants, so the sheet
							// still follows the system appearance.
							background(c.systemGroupedBackground),
							presentationDetents(SHEET_DETENTS, {
								selection: DETENT_FOR[sheet.current],
								onSelectionChange: (to) => dispatchSheet({type: 'dragged', to: nameOf(to)}),
							}),
							presentationDragIndicator('visible'),
							// The map behind the sheet stays live at every stop, which is
							// the whole point of a sheet rather than a pushed screen.
							presentationBackgroundInteraction('enabled'),
							// Apple Maps' sheet has no dismissed state, and neither has
							// this one: the collapsed stop is as small as it goes.
							interactiveDismissDisabled(true),
						]}
					>
						{stack.length > 0 ? (
							<PlaceStackCard
								campus={campus}
								depth={0}
								dispatch={dispatchStack}
								stack={stack}
								stop={sheet.current}
							/>
						) : (
							<BuildingPicker
								campus={campus}
								compact={sheet.current === 'collapsed'}
								onSearchCancel={() => dispatchSheet({type: 'search-cancelled'})}
								onSearchFocusChange={(focused, hasText) =>
									dispatchSheet(
										focused ? {type: 'search-focused'} : {type: 'search-blurred', hasText},
									)
								}
								onSelect={(id) => {
									dispatchStack({type: 'start', id})
									dispatchSheet({type: 'row-tapped'})
								}}
							/>
						)}
					</Group>
				</BottomSheet>
			</Host>

			{error ? (
				<View style={styles.banner}>
					<NoticeView text="Couldn't load building data. Pan around the map; some features won't work." />
				</View>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	markerOuter: {
		width: MARKER_SIZE,
		height: MARKER_SIZE,
		borderRadius: MARKER_SIZE / 2,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: c.white,
		shadowOffset: {width: 0, height: 1},
		shadowColor: c.black,
		shadowOpacity: 0.2,
	},
	markerInner: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: c.gold,
	},
	banner: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
	},
})
