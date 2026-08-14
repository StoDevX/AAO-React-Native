import * as React from 'react'
import {StyleSheet, useWindowDimensions, View, type NativeSyntheticEvent} from 'react-native'
import {BottomSheet, Group, Host} from '@expo/ui/swift-ui'
import {
	background,
	interactiveDismissDisabled,
	presentationBackgroundInteraction,
	presentationDetents,
	presentationDragIndicator,
	type PresentationDetent,
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
import * as c from '@frogpond/colors'
import {NoticeView} from '@frogpond/notice'

import {BuildingInfo} from '../../../source/features/map/building-info'
import {BuildingPicker} from '../../../source/features/map/building-picker'
import {toBuildingFootprints} from '../../../source/features/map/lib/building-footprints'
import {mapDataOptions} from '../../../source/features/map/query'
import type {Coordinate, Point} from '../../../source/features/map/types'
import {MAP_STYLE_URL} from '../../../source/features/map/urls'

const ORIGINAL_CENTER: Coordinate = [-93.15488752015, 44.460800862266]
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

/// Apple Maps' three stops, and the sheet never dismisses: the search field
/// alone, half the screen, and `large`.
/// Leaves 34pt above the search field and 20pt below it. Not symmetric, and
/// not freely tunable: the gap below only grows by moving the sheet up, and by
/// the time it matches the 34pt above, the category tabs below have risen into
/// view. Symmetry here needs the tabs section's margins moved too.
const SHEET_COLLAPSED_HEIGHT = 100
const COLLAPSED_DETENT: PresentationDetent = {height: SHEET_COLLAPSED_HEIGHT}
const SHEET_DETENTS: PresentationDetent[] = [COLLAPSED_DETENT, 'medium', 'large']

export default function MapPage(): React.ReactNode {
	let cameraRef = React.useRef<CameraRef>(null)
	// The sheet is the map's, not a route's, so its selection is the map's too.
	let [selectedBuildingId, setSelectedBuildingId] = React.useState<string | null>(null)
	let {data: buildings = [], error} = useQuery(mapDataOptions)
	let {height: windowHeight} = useWindowDimensions()
	let [sheetPresented, setSheetPresented] = React.useState(true)
	// Which stop the sheet rests at. Driven by selecting a building, and by the
	// user dragging it, which is why it is state rather than derived.
	let [detent, setDetent] = React.useState<PresentationDetent>(COLLAPSED_DETENT)
	// Bumped only when we move the sheet ourselves, and used to key the Group.
	// See `moveSheet`.
	let [sheetNonce, setSheetNonce] = React.useState(0)

	/// Moves the sheet, which takes more than setting the detent.
	///
	/// `presentationDetents`' `selection` is honoured when the SwiftUI view is
	/// first built -- it seeds an `@State` -- but not when it changes after:
	/// the new value never reaches the modifier instance, so its `onChange`
	/// never fires. Remounting the Group rebuilds the modifier and the seed
	/// path runs again with the value we want.
	///
	/// Keyed on a nonce rather than on the detent itself, because the detent
	/// also changes when the user drags the sheet, and remounting then would
	/// throw away their search text and scroll position mid-gesture.
	let moveSheet = React.useCallback((to: PresentationDetent) => {
		setDetent(to)
		setSheetNonce((n) => n + 1)
	}, [])

	// The sheet has no dismissed state. `interactiveDismissDisabled` should keep
	// it up, but if the system ever reports otherwise, present it again rather
	// than leaving the user on a bare map with no way to search.
	React.useEffect(() => {
		if (!sheetPresented) {
			setSheetPresented(true)
		}
	}, [sheetPresented])

	// How much of the map the sheet is covering right now, which is what the
	// camera has to keep clear.
	let sheetHeight =
		detent === 'medium'
			? windowHeight / 2
			: detent === 'large'
				? windowHeight
				: SHEET_COLLAPSED_HEIGHT

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
			// One sheet, whose contents swap. Tapping a second building while the
			// card is up is a state change, not a presentation.
			setSelectedBuildingId(id)
			// Apple Maps raises its sheet to half height when you pick a place,
			// which is also the stop the camera pads for.
			moveSheet('medium')
		},
		[moveSheet],
	)

	let selectedBuilding = React.useMemo(
		() => buildings.find((b) => b.id === selectedBuildingId),
		[buildings, selectedBuildingId],
	)

	let selectedPoint = React.useMemo(() => {
		if (!selectedBuildingId) {
			return null
		}
		let match = buildings.find((b) => b.id === selectedBuildingId)
		if (!match) {
			return null
		}
		let point = match.geometry.geometries.find((geo): geo is Point => geo.type === 'Point')
		return point ? {id: match.id, name: match.properties.name, point} : null
	}, [selectedBuildingId, buildings])

	React.useEffect(() => {
		if (!selectedPoint) {
			return
		}
		cameraRef.current?.easeTo({
			center: selectedPoint.point.coordinates,
			duration: CAMERA_ANIMATION_MS,
			// The sheet sits over the bottom of the map, so centring on the
			// building put the thing just selected underneath it. Pad by where
			// the sheet actually is: a hardcoded half-screen lifted the building
			// far too high whenever the sheet was resting collapsed.
			padding: {bottom: sheetHeight},
			zoom: SELECTION_ZOOM,
		})
	}, [selectedPoint, sheetHeight])

	return (
		<View style={StyleSheet.absoluteFill}>
			<Map logo={false} mapStyle={MAP_STYLE_URL} style={StyleSheet.absoluteFill}>
				<Camera ref={cameraRef} initialViewState={{center: ORIGINAL_CENTER, zoom: DEFAULT_ZOOM}} />
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
						style={{fillColor: c.gold, fillOpacity: FOOTPRINT_OPACITY}}
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
						key={sheetNonce}
						modifiers={[
							// The sheet's own chrome is a translucent material, and the
							// map read straight through the list. A PlatformColor rather
							// than the hex `presentationBackground` wants, so the sheet
							// still follows the system appearance.
							background(c.systemGroupedBackground),
							presentationDetents(SHEET_DETENTS, {
								selection: detent,
								onSelectionChange: setDetent,
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
						{selectedBuildingId ? (
							<BuildingInfo
								building={selectedBuilding}
								onClose={() => {
									setSelectedBuildingId(null)
									moveSheet(COLLAPSED_DETENT)
								}}
							/>
						) : (
							<BuildingPicker
								onSelect={(id) => {
									setSelectedBuildingId(id)
									moveSheet('medium')
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
