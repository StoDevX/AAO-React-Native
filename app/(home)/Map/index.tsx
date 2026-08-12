import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {useFocusEffect, useRouter} from 'expo-router'
import MapboxGL from '@rnmapbox/maps'
import {useQuery} from '@tanstack/react-query'
import {Host, Label} from '@expo/ui/swift-ui'
import {
	background,
	font,
	foregroundColor,
	padding,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {lookupBuildingByCoordinates} from '../../../source/features/map/lib/lookup-building'
import {mapDataOptions} from '../../../source/features/map/query'
import {useMapSelection} from '../../../source/features/map/selection-context'
import type {Coordinate, Point} from '../../../source/features/map/types'
import {MAPBOX_CARLETON_STYLE} from '../../../source/features/map/urls'

const ORIGINAL_CENTER: Coordinate = [-93.15488752015, 44.460800862266]
const DEFAULT_ZOOM = 15
const SELECTION_ZOOM = 17
const CAMERA_ANIMATION_MS = 500
/// The dot itself is small enough to read as a pin rather than a blob; hitSlop
/// pads the tap area out to the 44pt minimum without growing the artwork.
const MARKER_SIZE = 20
const MIN_TOUCH_TARGET = 44
const MARKER_HIT_SLOP = (MIN_TOUCH_TARGET - MARKER_SIZE) / 2
const BANNER_PADDING = 10
const BANNER_RADIUS = 10

const bannerShape = shapes.roundedRectangle({
	cornerRadius: BANNER_RADIUS,
	roundedCornerStyle: 'circular',
})

export default function MapPage(): React.ReactNode {
	let router = useRouter()
	let cameraRef = React.useRef<MapboxGL.Camera>(null)
	let {selectedBuildingId, selectBuilding} = useMapSelection()
	let {data: buildings = [], error} = useQuery(mapDataOptions)

	// useFocusEffect, not useEffect: the picker is the map's default companion,
	// so dismissing the info card should land the user back on the picker
	// rather than on a bare map.
	useFocusEffect(
		React.useCallback(() => {
			router.push('/Map/BuildingPicker')
		}, [router]),
	)

	let handlePress = React.useCallback(
		(feature: GeoJSON.Feature<GeoJSON.Point>) => {
			let coords = feature.geometry.coordinates as Coordinate
			let hit = lookupBuildingByCoordinates(coords, buildings)
			if (!hit) {
				return
			}
			selectBuilding(hit.id)
			// `replace`, so a map tap doesn't strand a stale picker beneath the
			// info card: with `push`, closing the card would show the picker as
			// it was before the tap.
			router.replace({
				pathname: '/Map/BuildingInfo',
				params: {buildingId: hit.id},
			})
		},
		[buildings, router, selectBuilding],
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
		cameraRef.current?.setCamera({
			animationDuration: CAMERA_ANIMATION_MS,
			centerCoordinate: selectedPoint.point.coordinates,
			zoomLevel: SELECTION_ZOOM,
		})
	}, [selectedPoint])

	return (
		<View style={StyleSheet.absoluteFill}>
			<MapboxGL.MapView
				logoEnabled={false}
				onPress={handlePress}
				style={StyleSheet.absoluteFill}
				styleURL={MAPBOX_CARLETON_STYLE}
			>
				<MapboxGL.Camera
					ref={cameraRef}
					defaultSettings={{
						centerCoordinate: ORIGINAL_CENTER,
						zoomLevel: DEFAULT_ZOOM,
					}}
				/>
				<MapboxGL.UserLocation visible={true} />
				{selectedPoint ? (
					<MapboxGL.PointAnnotation
						key={selectedPoint.id}
						coordinate={selectedPoint.point.coordinates}
						id={selectedPoint.id}
					>
						<View
							accessibilityLabel={`${selectedPoint.name} marker`}
							accessibilityRole="image"
							hitSlop={MARKER_HIT_SLOP}
							style={styles.markerOuter}
						>
							<View style={styles.markerInner} />
						</View>
					</MapboxGL.PointAnnotation>
				) : null}
			</MapboxGL.MapView>
			{error ? (
				<Host matchContents={true} style={styles.banner}>
					<Label
						modifiers={[
							font({textStyle: 'footnote'}),
							foregroundColor(c.label),
							padding({all: BANNER_PADDING}),
							background(c.secondarySystemBackground, bannerShape),
						]}
						systemImage="exclamationmark.triangle.fill"
						title="Couldn't load building data. Some features won't work."
					/>
				</Host>
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
		top: BANNER_PADDING,
		left: BANNER_PADDING,
		right: BANNER_PADDING,
	},
})
