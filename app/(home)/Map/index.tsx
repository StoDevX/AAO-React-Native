import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {useFocusEffect, useRouter} from 'expo-router'
import MapboxGL from '@rnmapbox/maps'
import {useQuery} from '@tanstack/react-query'
import * as c from '@frogpond/colors'
import {NoticeView} from '@frogpond/notice'

import {lookupBuildingByCoordinates} from '../../../source/features/map/lib/lookup-building'
import {mapDataOptions} from '../../../source/features/map/query'
import {useMapSelection} from '../../../source/features/map/selection-context'
import type {Coordinate, Point} from '../../../source/features/map/types'
import {MAPBOX_CARLETON_STYLE} from '../../../source/features/map/urls'

const ORIGINAL_CENTER: Coordinate = [-93.15488752015, 44.460800862266]
const DEFAULT_ZOOM = 15
const SELECTION_ZOOM = 17
const CAMERA_ANIMATION_MS = 500

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
							style={styles.markerOuter}
						>
							<View style={styles.markerInner} />
						</View>
					</MapboxGL.PointAnnotation>
				) : null}
			</MapboxGL.MapView>
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
		width: 20,
		height: 20,
		borderRadius: 10,
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
