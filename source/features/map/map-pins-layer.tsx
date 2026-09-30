import * as React from 'react'
import type {NativeSyntheticEvent} from 'react-native'
import {
	GeoJSONSource,
	Layer,
	type GeoJSONSourceRef,
	type PressEventWithFeatures,
} from '@maplibre/maplibre-react-native'
import * as c from '@frogpond/colors'

import {pinCollection, pinIds, pressedPin, type MapPins} from './lib/map-pins'

/// More than any cluster on either campus holds, so one call returns them all.
const CLUSTER_LEAF_LIMIT = 1000

const PIN_RADIUS = 8
const CLUSTER_RADIUS = 14
const PIN_STROKE = 2
/// Both campuses' styles serve Noto Sans and nothing else. Left unset, a text
/// layer asks for MapLibre's default font stack, whose glyphs 404 -- and the
/// source's tiles then never finish, so the circles vanish with the labels.
const PIN_FONT = ['Noto Sans Regular']

type Props = {
	pins: MapPins | null
	onSelect: (id: string) => void
	/// A cluster was tapped: the places it holds, for the screen to frame.
	/// The camera, and the sheet it has to stay clear of, are the screen's.
	onCluster: (ids: string[]) => void
}

/// The places the sheet is listing, as pins; close ones merge into a numbered
/// cluster, as in Maps. A pin opens its place; a cluster is framed until it
/// splits.
export function MapPinsLayer({pins, onSelect, onCluster}: Props): React.ReactNode {
	let sourceRef = React.useRef<GeoJSONSourceRef>(null)
	let data = React.useMemo(() => pinCollection(pins?.places ?? []), [pins])

	let handlePress = React.useCallback(
		async (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
			let {features, lngLat} = event.nativeEvent
			let press = pressedPin(features, [lngLat[0], lngLat[1]])
			if (press?.kind === 'pin') {
				onSelect(press.buildingId)
			} else if (press?.kind === 'cluster') {
				let leaves = await sourceRef.current?.getClusterLeaves(
					press.clusterId,
					CLUSTER_LEAF_LIMIT,
					0,
				)
				if (leaves) {
					onCluster(pinIds(leaves))
				}
			}
		},
		[onSelect, onCluster],
	)

	if (!pins) {
		return null
	}

	return (
		<GeoJSONSource
			cluster={true}
			data={data}
			id="map-pins"
			onPress={(event) => void handlePress(event)}
			ref={sourceRef}
		>
			<Layer
				filter={['has', 'point_count']}
				id="map-pins-clusters"
				paint={{
					'circle-color': pins.color,
					'circle-radius': CLUSTER_RADIUS,
					'circle-stroke-color': c.white,
					'circle-stroke-width': PIN_STROKE,
				}}
				type="circle"
			/>
			<Layer
				filter={['has', 'point_count']}
				id="map-pins-cluster-counts"
				layout={{
					'text-field': ['get', 'point_count_abbreviated'],
					'text-font': PIN_FONT,
					'text-size': 13,
				}}
				paint={{'text-color': c.white}}
				type="symbol"
			/>
			<Layer
				filter={['!', ['has', 'point_count']]}
				id="map-pins-points"
				paint={{
					'circle-color': pins.color,
					'circle-radius': PIN_RADIUS,
					'circle-stroke-color': c.white,
					'circle-stroke-width': PIN_STROKE,
				}}
				type="circle"
			/>
			<Layer
				filter={['!', ['has', 'point_count']]}
				id="map-pins-names"
				layout={{
					'text-field': ['get', 'name'],
					'text-font': PIN_FONT,
					'text-size': 12,
					'text-offset': [0, 1.2],
					'text-anchor': 'top',
					'text-optional': true,
				}}
				paint={{'text-color': pins.color, 'text-halo-color': c.white, 'text-halo-width': 1}}
				type="symbol"
			/>
		</GeoJSONSource>
	)
}
