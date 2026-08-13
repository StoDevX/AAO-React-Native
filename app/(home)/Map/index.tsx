import * as React from 'react'
import {
	StyleSheet,
	useWindowDimensions,
	View,
	type NativeSyntheticEvent,
} from 'react-native'
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

/// Enough to read as "these are the campus buildings" over whatever the
/// basemap draws, without burying it.
const FOOTPRINT_OPACITY = 0.15
const FOOTPRINT_SELECTED_OPACITY = 0.45
const FOOTPRINT_LINE_WIDTH = 1

/// Apple Maps' three stops, and the sheet never dismisses: the search field
/// alone, half the screen, and `large`.
/// Leaves 34pt above the search field and 20pt below it. Not symmetric, and
/// not freely tunable: the gap below only grows by moving the sheet up, and by
/// the time it matches the 34pt above, the category tabs below have risen into
/// view. Symmetry here needs the tabs section'"'"'s margins moved too.
const SHEET_COLLAPSED_HEIGHT = 100
const COLLAPSED_DETENT: PresentationDetent = {height: SHEET_COLLAPSED_HEIGHT}
const SHEET_DETENTS: PresentationDetent[] = [
	COLLAPSED_DETENT,
	'medium',
	'large',
]

export default function MapPage(): React.ReactNode {
	let cameraRef = React.useRef<CameraRef>(null)
	// The sheet is the map's, not a route's, so its selection is the map's too.
	let [selectedBuildingId, setSelectedBuildingId] = React.useState<
		string | null
	>(null)
	let {data: buildings = [], error} = useQuery(mapDataOptions)
	let {height: windowHeight} = useWindowDimensions()
	let [sheetPresented, setSheetPresented] = React.useState(true)
	// Which stop the sheet rests at. Driven by selecting a building, and by the
	// user dragging it, which is why it is state rather than derived.
	let [detent, setDetent] = React.useState<PresentationDetent>(COLLAPSED_DETENT)

	// The sheet has no dismissed state. `interactiveDismissDisabled` should keep
	// it up, but if the system ever reports otherwise, present it again rather
	// than leaving the user on a bare map with no way to search.
	React.useEffect(() => {
		if (!sheetPresented) {
			setSheetPresented(true)
		}
	}, [sheetPresented])

	let footprints = React.useMemo(
		() => toBuildingFootprints(buildings),
		[buildings],
	)

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
		},
		[],
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
		let point = match.geometry.geometries.find(
			(geo): geo is Point => geo.type === 'Point',
		)
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
			// building put the thing just selected underneath it. A selection
			// settles at `medium`, which is half the screen.
			padding: {bottom: windowHeight / 2},
			zoom: SELECTION_ZOOM,
		})
	}, [selectedPoint, windowHeight])

	return (
		<View style={StyleSheet.absoluteFill}>
			<Map
				logo={false}
				mapStyle={MAP_STYLE_URL}
				style={StyleSheet.absoluteFill}
			>
				<Camera
					ref={cameraRef}
					initialViewState={{center: ORIGINAL_CENTER, zoom: DEFAULT_ZOOM}}
				/>
				<UserLocation />

				<GeoJSONSource
					data={footprints}
					id="campus-buildings"
					onPress={handleBuildingPress}
				>
					<Layer
						id="campus-buildings-fill"
						style={{fillColor: c.gold, fillOpacity: FOOTPRINT_OPACITY}}
						type="fill"
					/>
					<Layer
						id="campus-buildings-outline"
						style={{lineColor: c.gold, lineWidth: FOOTPRINT_LINE_WIDTH}}
						type="line"
					/>
					{/* A second fill rather than a data-driven expression on the first:
					    the filter is one comparison against one id, and reading it as
					    "the selected building is painted like this" beats decoding a
					    nested case expression. */}
					<Layer
						filter={['==', ['get', 'buildingId'], selectedBuildingId ?? '']}
						id="campus-buildings-selected"
						style={{
							fillColor: c.goldenrod,
							fillOpacity: FOOTPRINT_SELECTED_OPACITY,
						}}
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
			{/* Zero-sized on purpose. The sheet is presented rather than laid out,
			    so the Host only has to exist -- and a Host stretched over the map
			    swallows the taps that select a building. */}
			<Host style={styles.sheetHost}>
				<BottomSheet
					isPresented={sheetPresented}
					onIsPresentedChange={setSheetPresented}
				>
					<Group
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
									setDetent(COLLAPSED_DETENT)
								}}
							/>
						) : (
							<BuildingPicker
								onSelect={(id) => {
									setSelectedBuildingId(id)
									setDetent('medium')
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
	sheetHost: {width: 0, height: 0},
	banner: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
	},
})
