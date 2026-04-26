import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import MapboxGL from '@rnmapbox/maps'
import * as c from '@frogpond/colors'
import {NoticeView} from '@frogpond/notice'

import {lookupBuildingByCoordinates} from './lib/lookup-building'
import {useMapData} from './query'
import {useMapSelection} from './selection-context'
import {MAPBOX_CARLETON_STYLE} from './urls'
import type {Coordinate, Point} from './types'

const ORIGINAL_CENTER: Coordinate = [-93.15488752015, 44.460800862266]
const DEFAULT_ZOOM = 15
const SELECTION_ZOOM = 17

export const NavigationKey = 'Map' as const

export function MapScreen(): React.ReactNode {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	let navigation = useNavigation<any>()
	let cameraRef = React.useRef<MapboxGL.Camera>(null)
	let {selectedBuildingId, selectBuilding} = useMapSelection()
	let {data: buildings = [], error} = useMapData()

	useFocusEffect(
		React.useCallback(() => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
			navigation.navigate('MapBuildingPicker')
		}, [navigation]),
	)

	let handlePress = React.useCallback(
		(feature: GeoJSON.Feature<GeoJSON.Point>) => {
			let coords = feature.geometry.coordinates as Coordinate
			let hit = lookupBuildingByCoordinates(coords, buildings)
			if (hit) {
				selectBuilding(hit.id)
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
				navigation.navigate('MapBuildingInfo', {buildingId: hit.id})
			}
		},
		[buildings, selectBuilding, navigation],
	)

	React.useEffect(() => {
		if (!selectedBuildingId) return
		let match = buildings.find((b) => b.id === selectedBuildingId)
		if (!match) return
		let point = match.geometry.geometries.find(
			(geo): geo is Point => geo.type === 'Point',
		)
		if (!point) return
		cameraRef.current?.setCamera({
			animationDuration: 500,
			centerCoordinate: point.coordinates,
			zoomLevel: SELECTION_ZOOM,
		})
	}, [selectedBuildingId, buildings])

	let marker = React.useMemo(() => {
		if (!selectedBuildingId) return null
		let match = buildings.find((b) => b.id === selectedBuildingId)
		if (!match) return null
		let point = match.geometry.geometries.find(
			(geo): geo is Point => geo.type === 'Point',
		)
		if (!point) return null
		return (
			<MapboxGL.PointAnnotation
				key={match.id}
				coordinate={point.coordinates}
				id={match.id}
			>
				<View
					accessibilityLabel={`${match.properties.name} marker`}
					accessibilityRole="button"
					style={styles.markerOuter}
				>
					<View style={styles.markerInner} />
				</View>
			</MapboxGL.PointAnnotation>
		)
	}, [selectedBuildingId, buildings])

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
				{marker}
			</MapboxGL.MapView>
			{error ? (
				<View style={styles.banner}>
					<NoticeView text="Couldn't load building data. Pan around the map; some features won't work." />
				</View>
			) : null}
		</View>
	)
}

export const NavigationOptions = {
	title: 'Carleton Map',
	headerBackTitle: 'Map',
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
		backgroundColor: c.yellowToGoldDark[0],
	},
	banner: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
	},
})
