import * as React from 'react'
import {StyleSheet, View, type NativeSyntheticEvent} from 'react-native'
import {useFocusEffect, useRouter} from 'expo-router'
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

import {toBuildingFootprints} from '../../../source/features/map/lib/building-footprints'
import {mapDataOptions} from '../../../source/features/map/query'
import {useMapSelection} from '../../../source/features/map/selection-context'
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

export default function MapPage(): React.ReactNode {
	let router = useRouter()
	let cameraRef = React.useRef<CameraRef>(null)
	let {selectedBuildingId, selectBuilding} = useMapSelection()
	let {data: buildings = [], error} = useQuery(mapDataOptions)

	let footprints = React.useMemo(
		() => toBuildingFootprints(buildings),
		[buildings],
	)

	// useFocusEffect, not useEffect: the picker is the map's default companion,
	// so dismissing the info card should land the user back on the picker
	// rather than on a bare map.
	useFocusEffect(
		React.useCallback(() => {
			router.push('/Map/BuildingPicker')
		}, [router]),
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
			selectBuilding(id)
			// `replace`, so a map tap doesn't strand a stale picker beneath the
			// info card: with `push`, closing the card would show the picker as
			// it was before the tap.
			router.replace({
				pathname: '/Map/BuildingInfo',
				params: {buildingId: id},
			})
		},
		[router, selectBuilding],
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
			zoom: SELECTION_ZOOM,
		})
	}, [selectedPoint])

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
